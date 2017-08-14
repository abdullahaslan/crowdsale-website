// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const config = require('config');
const EthereumTx = require('ethereumjs-tx');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const etag = require('koa-etag');
const Router = require('koa-router');
const cors = require('kcors');

const Certifier = require('./contracts/certifier');
const Onfido = require('./onfido');
const ParityConnector = require('./parity');
const Recaptcha = require('./recaptcha');
const Sale = require('./contracts/sale');

const store = require('./store');
const { buf2hex, buf2big, big2hex, int2date } = require('./utils');

const app = new Koa();
const router = new Router();

const connector = new ParityConnector(config.get('nodeWs'));

main();

async function main () {
  const sale = new Sale(connector, config.get('saleContract'));

  await sale.update();

  const certifier = new Certifier(connector, sale.values.certifier);

  connector.on('block', () => {
    sale.update();
  });

  router.post('/check-status', async (ctx, next) => {
    const { applicantId, checkId } = ctx.request.body;

    try {
      const { pending, valid } = await Onfido.checkStatus(applicantId, checkId);

      if (pending || !valid) {
        ctx.body = { pending, valid };
        return;
      }

      const { tags } = await Onfido.getCheck(applicantId, checkId);
      const addressTag = tags.find((tag) => /address/.test(tag));

      if (!addressTag) {
        throw new Error(`Could not find an address for this applicant check (${applicantId}/${checkId})`);
      }

      const address = addressTag.replace(/^address:/, '');
      const tx = await certifier.certify(address);

      ctx.body = { valid, tx };
    } catch (error) {
      ctx.status = 400;
      ctx.body = error.message;
      ctx.app.emit('error', error, ctx);
    }
  });

  router.post('/check-applicant', async (ctx, next) => {
    const { applicantId, address } = ctx.request.body;

    try {
      const result = await Onfido.checkApplicant(applicantId, address);

      ctx.body = result;
    } catch (error) {
      ctx.status = 400;
      ctx.body = error.message;
      ctx.app.emit('error', error, ctx);
    }
  });

  router.post('/create-applicant', async (ctx, next) => {
    const { firstName, lastName, stoken } = ctx.request.body;

    try {
      await Recaptcha.validate(stoken);
      const { applicantId, sdkToken } = await Onfido.createApplicant({ firstName, lastName });

      ctx.body = { applicantId, sdkToken };
    } catch (error) {
      ctx.status = 400;
      ctx.body = error.message;
      ctx.app.emit('error', error, ctx);
    }
  });

  router.get('/chart-data', async (ctx, next) => {
    const data = await sale.getChartData();

    ctx.body = data;
  });

  router.get('/address/:address', async (ctx, next) => {
    const { address } = ctx.params;
    const [ eth, [ buyin ], [ deposit ], countryCode ] = await Promise.all([
      connector.balance(address),
      sale.methods.buyins(address).get(),
      sale.methods.deposits(address).get(),
      certifier.getCountryCode(address)
    ]);

    ctx.body = {
      countryCode,
      eth: '0x' + eth.toString(16),
      buyin: '0x' + buyin.toString(16),
      deposit: '0x' + deposit.toString(16)
    };
  });

  router.get('/:address/nonce', async (ctx, next) => {
    const { address } = ctx.params;

    const nonce = await connector.nextNonce(address);

    ctx.body = { nonce };
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
      ctx.status = 400;
      ctx.body = 'Invalid transaction';
      return;
    }

    const from = buf2hex(txObj.from);
    const value = buf2big(txObj.value);
    const gasPrice = buf2big(txObj.gasPrice);
    const gasLimit = buf2big(txObj.gasLimit);

    const [ certified ] = await certifier.methods.certified(from).get();

    if (!certified) {
      ctx.status = 400;
      ctx.body = `${from} is not certified`;
      return;
    }

    const requiredEth = value.add(gasPrice.mul(gasLimit));
    const balance = await connector.balance(from);

    if (balance.cmp(requiredEth) < 0) {
      const hash = buf2hex(txObj.hash(true));

      await store.addToQueue(from, tx, requiredEth);

      ctx.body = { hash, requiredEth: big2hex(requiredEth.sub(balance)) };
      return;
    }

    try {
      const hash = await connector.sendTx(tx);

      ctx.body = { hash };
    } catch (error) {
      ctx.status = 400;
      ctx.body = error.message;
      ctx.app.emit('error', error, ctx);
    }
  });

  router.get('/block-hash', (ctx) => {
    ctx.body = { hash: connector.block.hash };
  });

  router.get('/sale', (ctx) => {
    const {
      BONUS_DURATION,
      BONUS_SIZE,
      DIVISOR,
      STATEMENT_HASH,
      beginTime,
      tokenCap
    } = sale.values;

    ctx.body = {
      BONUS_DURATION,
      BONUS_SIZE,
      DIVISOR,
      STATEMENT_HASH,
      beginTime: int2date(beginTime),
      tokenCap
    };
  });

  router.get('/', (ctx) => {
    const extras = {
      block: connector.block,
      connected: connector.status,
      contractAddress: sale.address
    };

    const {
      currentPrice,
      endTime,
      tokensAvailable,
      totalAccounted,
      totalReceived
    } = sale.values;

    ctx.body = Object.assign({}, extras, {
      currentPrice,
      endTime: int2date(endTime),
      tokensAvailable,
      totalAccounted,
      totalReceived
    });
  });

  const { port, hostname } = config.get('http');

  app
    .use(bodyParser())
    .use(cors())
    .use(etag())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(port, hostname);
}
