const fs = require('fs');
const path = require('path');

function useRoutes(app) {
  const routerDir = __dirname;
  fs.readdirSync(routerDir).forEach((file) => {
    if (file === 'index.js') return;
    if (!file.endsWith('.router.js')) return;
    const router = require(path.join(routerDir, file));
    app.use(router.routes());
    app.use(router.allowedMethods());
  });
}

module.exports = useRoutes;
