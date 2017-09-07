// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const { FeeRegistrar } = require('../abis');
const Contract = require('../api/contract');

class Fee extends Contract {
  /**
   * Abstraction over the fee registrar contract
   *
   * @param {Object} connector  A ParityConnector
   * @param {String} address    `0x` prefixed
   */
  constructor (connector, address) {
    super(connector, address, FeeRegistrar);
  }

  /**
   * Check if account is certified
   *
   * @param {String}  address `0x` prefixed
   *
   * @return {Promise<Boolean>}
   */
  async hasPaid (address) {
    const [ certified ] = await this.methods.paid(address).get();

    return certified;
  }
}

module.exports = Fee;
