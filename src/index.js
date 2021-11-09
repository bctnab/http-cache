const Koa = require('koa');
const mime = require('mime');
const Router = require('koa-router');
const { join } = require('path');
const md5 = require('md5');
const { readFileSync, statSync } = require('fs');

const app = new Koa();
const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.type = mime.getType('html');

  const content = readFileSync(join(__dirname, './pages/index.html'), 'UTF-8');
  ctx.body = content;
  await next();
});

router.get(/\.(css)$/, async (ctx, next) => {
  const { path } = ctx;
  ctx.type = mime.getType('css');

  const content = readFileSync(join(__dirname, './assets', path), 'UTF-8');
  ctx.body = content;

  await next();
});

router.get(/\.(png)$/, async (ctx) => {
  const { path } = ctx;
  ctx.type = mime.getType('png');
  // 关闭强缓存
  ctx.set('pragma', 'no-cache');
  ctx.set('Cache-Control', 'no-cache');

  const imagePath = join(__dirname, './assets', path);
  const imageBuffer = readFileSync(imagePath);

  // ETag/If-None-Match
  const eTag = md5(imageBuffer);
  const ifNoneMatch = ctx.request.headers['if-none-match'];

  // Last-Modified/If-Modified-Since
  const imageStatus = statSync(imagePath);
  const ifModifiedSince = ctx.request.headers['if-modified-since'];

  if (!!ifNoneMatch && !!eTag && ifNoneMatch === eTag) {
    ctx.status = 304;
  } else if (!!imageStatus && !!ifModifiedSince && imageStatus.mtime.toGMTString() === ifModifiedSince) {
    ctx.status = 304;
  } else {
    console.log(eTag)
    ctx.set('ETag', eTag);
    ctx.set('Last-Modified', imageStatus.mtime.toGMTString());
    ctx.body = imageBuffer;
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen("8888", "localhost", function () {
  console.log('localhost app started at port 8888...');
})
  .on("error", function (error) {
    console.error(error)
  });