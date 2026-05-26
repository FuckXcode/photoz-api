require('dotenv').config();

const app = require('./app');
const { APP_HOST, APP_PORT } = require('./app/config');

app.listen(APP_PORT, APP_HOST, () => {
  console.log(`photoz-api 服务运行在 http://${APP_HOST}:${APP_PORT}`);
});
