// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Router = require('koa-router');

const { buyins } = require('../store');
const { error, verifySignature } = require('./utils');
const { hex2big, big2hex } = require('../utils');

function get ({ sale, connector, certifier }) {
  const router = new Router({
    prefix: '/accounts'
  });

  router.get('/:address', async (ctx, next) => {
    const { address } = ctx.params;
    const [ eth, [ value ], certified ] = await Promise.all([
      connector.balance(address),
      sale.methods.participants(address).get(),
      certifier.isCertified(address)
    ]);

    ctx.body = {
      certified,
      eth: '0x' + eth.toString(16),
      accounted: '0x' + value.toString(16)
    };
  });

  router.get('/:address/fee', async (ctx, next) => {
    const { address } = ctx.params;
    const balance = await connector.balance(address);

    // const from = hex2big(connector.block.number).sub(50000);
    const fromAddresses = new Set();
    const trace = await connector.trace({ fromBlock: 'earliest', toAddress: [address] }); // big2hex(from)

    for (const { action } of trace) {
      fromAddresses.add(action.from);
    }

    // console.log('trace', JSON.stringify(trace, null, '  '));

    ctx.body = {
      incomingTxAddr: Array.from(fromAddresses),
      balance: '0x' + balance.toString(16),
      paid: false // TODO: use fee contract
    };
  });

  router.get('/:address/nonce', async (ctx, next) => {
    const { address } = ctx.params;

    const nonce = await connector.nextNonce(address);

    ctx.body = { nonce };
  });

  router.get('/:address/pending', async (ctx, next) => {
    const address = ctx.params.address.toLowerCase();
    const pending = await buyins.get(address);

    ctx.body = { pending };
  });

  // Signature should be the signature of the hash of the following
  // message : `delete_tx_:txHash`, eg. `delete_tx_0x123...789`
  router.del('/:address/pending/:signature', async (ctx, next) => {
    const { address, signature } = ctx.params;

    try {
      const pending = await buyins.get(address);

      if (!pending || !pending.hash) {
        throw new Error('No pending transaction to delete');
      }

      verifySignature(address, `delete_tx_${pending.hash}`, signature);
    } catch (err) {
      return error(ctx, 400, err.message);
    }

    await buyins.reject(address, '-1', 'cancelled by user');
    ctx.body = { result: 'ok' };
  });

  return router;
}

module.exports = get;
