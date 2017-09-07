// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const EthereumTx = require('ethereumjs-tx');
const Router = require('koa-router');

const { buyins } = require('../store');
const { buf2hex, buf2big, big2hex } = require('../utils');
const { error } = require('./utils');

function get ({ sale, connector, certifier, feeRegistrar }) {
  const router = new Router();

  router.get('/block/hash', (ctx) => {
    if (!connector.block) {
      throw new Error('Could not fetch latest block');
    }

    ctx.body = { hash: connector.block.hash };
  });

  router.get('/tx/:hash', async (ctx, next) => {
    const { hash } = ctx.params;

    const transaction = await connector.getTx(hash);

    ctx.body = { transaction };
  });

  router.post('/tx', async (ctx, next) => {
    const { tx } = ctx.request.body;

    const txBuf = Buffer.from(tx.substring(2), 'hex');
    const txObj = new EthereumTx(txBuf);

    if (!txObj.verifySignature()) {
      return error(ctx, 400, 'Invalid transaction');
    }

    const from = buf2hex(txObj.from);
    const certified = await certifier.isCertified(from);

    const value = buf2big(txObj.value);
    const gasPrice = buf2big(txObj.gasPrice);
    const gasLimit = buf2big(txObj.gasLimit);

    const requiredEth = value.add(gasPrice.mul(gasLimit));
    const balance = await connector.balance(from);

    if (!certified || balance.cmp(requiredEth) < 0) {
      const hash = buf2hex(txObj.hash(true));

      await buyins.set(from, tx, hash, requiredEth);

      ctx.body = { hash, requiredEth: big2hex(requiredEth.sub(balance)) };
      return;
    }

    const hash = await connector.sendTx(tx);

    ctx.body = { hash };
  });

  router.post('/fee-tx', async (ctx, next) => {
    const { tx } = ctx.request.body;

    const txBuf = Buffer.from(tx.substring(2), 'hex');
    const txObj = new EthereumTx(txBuf);

    const from = buf2hex(txObj.from);
    const to = buf2hex(txObj.to);

    if (to.toLowerCase() !== feeRegistrar.address) {
      return error(ctx, 400, 'Invalid `to` field');
    }

    const value = buf2big(txObj.value);
    const gasPrice = buf2big(txObj.gasPrice);
    const gasLimit = buf2big(txObj.gasLimit);

    const requiredEth = value.add(gasPrice.mul(gasLimit));
    const balance = await connector.balance(from);

    if (balance.cmp(requiredEth) < 0) {
      return error(ctx, 400, 'Insufficient funds');
    }

    const hash = await connector.sendTx(tx);

    ctx.body = { hash };
  });

  return router;
}

module.exports = get;
