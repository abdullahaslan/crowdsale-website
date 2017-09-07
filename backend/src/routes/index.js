// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const Accounts = require('./accounts');
const Auction = require('./auction');
const Chain = require('./chain');
const Onfido = require('./onfido');

module.exports = function set (app, { sale, connector, certifier, feeRegistrar }) {
  [
    Accounts,
    Auction,
    Chain,
    Onfido
  ].forEach((Route) => {
    const instance = Route({ sale, connector, certifier, feeRegistrar });

    app.use(instance.routes(), instance.allowedMethods());
  });
};
