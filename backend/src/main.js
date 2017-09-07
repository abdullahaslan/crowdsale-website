// Copyright Parity Technologies (UK) Ltd., 2017.
// Released under the Apache 2/MIT licenses.

'use strict';

const config = require('config');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const etag = require('koa-etag');
const cors = require('kcors');

const Certifier = require('./contracts/certifier');
const ParityConnector = require('./api/parity');
const Routes = require('./routes');
const Sale = require('./contracts/sale');
const Fee = require('./contracts/fee');

const app = new Koa();
const { port, hostname } = config.get('http');

main();

async function main () {
  const connector = new ParityConnector(config.get('nodeWs'));
  const sale = new Sale(connector, config.get('saleContract'));
  const feeRegistrar = new Fee(connector, config.get('feeContract'));

  connector.on('block', () => {
    sale.update();
  });

  await sale.update();

  const certifier = new Certifier(connector, sale.values.certifier);

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = err.message;
      ctx.app.emit('error', err, ctx);
    }
  });

  app
    .use(bodyParser())
    .use(cors())
    .use(etag());

  Routes(app, { sale, connector, certifier, feeRegistrar });

  app.listen(port, hostname);
}
