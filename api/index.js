require('dotenv').config();

const app = require('../src/app');

/// Vercel 函数入口，把 Koa app 导出为 callback() 形式，供 Vercel Serverless Functions 调用
/*
核心问题：Vercel 不是传统服务器

普通部署（VPS/云服务器）：

 Node 进程一直运行 → app.listen(3001) → 等待请求

Vercel Serverless：

 没有请求 → 没有进程
 有请求来了 → 临时启动一个函数 → 处理完 → 销毁
*/

module.exports = app.callback();
