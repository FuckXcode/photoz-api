const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const errorHandler = require('./app/error-handle');
const useRoutes = require('./router');

const app = new Koa();

app.use(errorHandler);
app.use(bodyParser());
useRoutes(app);

app.on('error', (err, ctx) => {
  if (err.status && err.status < 500) return; // ignore expected client errors
  console.error(`[error] ${ctx?.method} ${ctx?.url}`, err);
});

module.exports = app;
