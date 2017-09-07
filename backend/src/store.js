// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const chunk = require('lodash.chunk');
const redis = require('./redis');
const { big2hex, hex2big } = require('./utils');

const ONFIDO_CHECKS = 'onfido-checks';
const ONFIDO_CHECKS_CHANNEL = 'onfido-checks-channel';

class FeeQueue {
  constructor (prefix) {
    this._pendingKey = `${prefix}:pending`;
    this._paidKey = `${prefix}:paid`;
  }

  async setPending (feeAddress, key) {
    return redis.hset(this._pendingKey, feeAddress, key);
  }

  async isPending (feeAddress) {
    const key = await redis.hget(this._pendingKey, feeAddress);

    if (key) {
      return true;
    }

    return false;
  }

  async setPaid (feeAddress, paidAddress) {
    await redis.multi();
    const deleted = await redis.hdel(this._pendingKey, feeAddress);

    if (deleted !== '1') {
      return redis.discard();
    }

    await redis.sadd(this._paidKey, `${feeAddress}:${paidAddress}`);
    await redis.exec();
  }

  /**
   * Find an address from which fee was sent, if any.
   *
   * @param {String} feeAddress `0x` prefixed
   *
   * @return {String|null} paidAddress `0x` prefixed
   */
  async findPaidAddress (feeAddress) {
    let paidAddress = null;

    await this.scanPaid(`${feeAddress}:*`, (record) => {
      feeAddress = record.split(':')[1];
    });

    return paidAddress;
  }

  /**
   * Find an address to which fee was sent, if any.
   *
   * @param {String} paidAddress `0x` prefixed
   *
   * @return {String|null} feeAddress `0x` prefixed
   */
  async findFeeAddress (paidAddress) {
    let feeAddress = null;

    await this.scanPaid(`*:${paidAddress}`, (record) => {
      feeAddress = record.split(':')[0];
    });

    return feeAddress;
  }

  /**
   * Iterate over all accounts in the pending queue. This will perform
   * any asynchronous callbacks to avoid overloading the Parity node
   * with requests.
   *
   * Note: callbacks can be called out of order and in parallel
   *
   * @param  {Function} callback takes 2 arguments:
   *                             - feeAddress (`String`)
   *                             - key (`String`)
   *                             will `await` for any returned `Promise`.
   *
   * @return {Promise} resolves after all transactions have been processed
   */
  async scanPending (callback) {
    let next = 0;

    do {
      // Get a batch of responses
      const [cursor, entries] = await redis.hscan(this._key, next);

      next = Number(cursor);

      // `entries` is an array of `[key, value, key, value, ...]`
      await Promise.all(
        chunk(entries, 2)
        .map(([feeAddress, key]) => callback(feeAddress, key))
      );

    // `next` will be `0` at the end of iteration, explained here:
    // https://redis.io/commands/scan
    } while (next !== 0);
  }

  async scanPaid (pattern, callback) {
    let next = 0;

    do {
      // Get a batch of responses
      const [cursor, entries] = await redis.sscan(this._paidKey, next, 'MATCH', pattern);

      next = Number(cursor);

      await Promise.all(entries.map((entry) => {
        const [feeAddress, paidAddress] = entry.split(':');

        return callback(feeAddress, paidAddress);
      }));

    // `next` will be `0` at the end of iteration, explained here:
    // https://redis.io/commands/scan
    } while (next !== 0);
  }
}

class TransactionQueue {
  constructor (prefix) {
    this._key = `${prefix}:queue`;
    this._donePrefix = `${prefix}:done`;
  }

  /**
   * Add transaction to the queue
   *
   * @param  {String}    address     `0x` prefixed
   * @param  {String}    hash        `0x` prefixed transaction hash
   * @param  {String}    tx          `0x` prefixed signed transaction
   * @param  {BigNumber} requiredEth Required ETH calculated from value + gas
   *
   * @return {Promise<String>} resolves to 'OK' on success
   */
  async set (address, tx, hash, requiredEth) {
    return redis.hset(this._key, address, JSON.stringify({
      tx,
      hash,
      required: big2hex(requiredEth)
    }));
  }

  /**
   * Get a transaction from the queue
   *
   * @param  {String} address           `0x` prefixed
   *
   * @return {Promise<null|Object>}     `null` if no entry for this address,
   *                                    or the transaction Object
   */
  async get (address) {
    return redis.hget(this._key, address)
      .then((result) => {
        return result
          ? JSON.parse(result)
          : null;
      });
  }

  /**
   * Iterate over all transactions in the queue. This will perform
   * any asynchronous callbacks to avoid overloading the Parity node
   * with requests.
   *
   * Note: callbacks can be called out of order and in parallel
   *
   * @param  {Function} callback takes 3 arguments:
   *                             - address (`String`)
   *                             - tx (`String`)
   *                             - requiredEth (`BigNumber`),
   *                             will `await` for any returned `Promise`.
   *
   * @return {Promise} resolves after all transactions have been processed
   */
  async scan (callback) {
    let next = 0;

    do {
      // Get a batch of responses
      const [cursor, entries] = await redis.hscan(this._key, next);

      next = Number(cursor);

      // `entries` is an array of `[key, value, key, value, ...]`
      await Promise.all(
        chunk(entries, 2)
        .map(([address, json]) => {
          const { tx, required } = JSON.parse(json);

          return callback(address, tx, hex2big(required));
        })
      );

    // `next` will be `0` at the end of iteration, explained here:
    // https://redis.io/commands/scan
    } while (next !== 0);
  }

  /**
   * Store a confirmation of the transaction
   *
   * @param  {String} address `0x` prefixed
   * @param  {String} nonce   `0x` prefixed hex encoded int
   * @param  {String} hash    `0x` prefixed hash
   * @param  {String} value   `0x` prefixed integer value contributed (refunds subtracted)
   *
   * @return {Promise<String>} resolves to 'OK' on success
   */
  async confirm (address, nonce, hash, value) {
    await redis.hdel(this._key, address);

    return redis.set(`${this._donePrefix}:${address}:${nonce}`, JSON.stringify({
      hash,
      value
    }));
  }

  /**
   * Store a rejection of the transaction
   *
   * @param  {String} address `0x` prefixed
   * @param  {String} nonce   `0x` prefixed hex encoded int
   * @param  {String} reason  text description
   *
   * @return {Promise<String>} resolves to 'OK' on success
   */
  async reject (address, nonce, reason) {
    await redis.hdel(this._key, address);

    return redis.set(`${this._donePrefix}:${address}:${nonce}`, JSON.stringify({
      error: reason
    }));
  }
}

class Onfido {
  /**
   * Get the data for the given address.
   *
   * @param  {String} address `0x` prefixed address
   *
   * @return {Promise<Object|null>}
   */
  static async get (address) {
    const data = await redis.hget(ONFIDO_CHECKS, address.toLowerCase());

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(`could not parse JSON data: ${data}`);
      return null;
    }
  }

  /**
   * Set the given data for the given address.
   *
   * @param  {String} address `0x` prefixed address
   * @param  {Object} data    Javascript Object to set
   *
   * @return {Promise}
   */
  static async set (address, data) {
    return redis.hset(ONFIDO_CHECKS, address.toLowerCase(), JSON.stringify(data));
  }

  /**
   * Iterate over all the Onfido href in the check-queue.
   *
   * @param  {Function} callback takes 1 argument:
   *                             - href (`String`)
   *                             will `await` for any returned `Promise`.
   *
   * @return {Promise} resolves after all hrefs have been processed
   */
  static async scan (callback) {
    let next = 0;

    do {
      // Get a batch of responses
      const [cursor, hrefs] = await redis.sscan(ONFIDO_CHECKS_CHANNEL, next);

      next = Number(cursor);

      for (const href of hrefs) {
        await callback(href);
      }

    // `next` will be `0` at the end of iteration, explained here:
    // https://redis.io/commands/scan
    } while (next !== 0);
  }

  /**
   * Subscribe to the Onfido check completions
   *
   * @param  {Function} cb   Callback function called on new
   *                         check completion
   */
  static async subscribe (cb) {
    const client = redis.client.duplicate();

    // Call the callback to check all set first
    await cb();

    client.on('message', (channel, message) => {
      if (channel !== ONFIDO_CHECKS_CHANNEL) {
        return;
      }

      cb();
    });

    client.subscribe(ONFIDO_CHECKS_CHANNEL);
  }

  /**
   * Push a href to onfido check API to redis and trigger a publish event,
   * so that the certifier server can process the check and trigger the
   * transaction to the certifier contract.
   *
   * @param {String} href in format: https://api.onfido.com/v2/applicants/<applicant-id>/checks/<check-id>
   */
  static async push (href) {
    await redis.sadd(ONFIDO_CHECKS_CHANNEL, href);
    await redis.publish(ONFIDO_CHECKS_CHANNEL, 'new');
  }

  /**
   * Removes  a href from the Redis Onfido Check Set.
   *
   * @param {String} href
   */
  static async remove (href) {
    await redis.srem(ONFIDO_CHECKS_CHANNEL, href);
  }
}

module.exports = {
  Onfido,
  buyins: new TransactionQueue('buy'),
  fees: new TransactionQueue('fee')
};
