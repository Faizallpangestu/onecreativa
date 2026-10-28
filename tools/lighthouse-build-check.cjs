// Audit the real production files with gzip and cache/security headers on loopback.
// No application API, database, authenticated cookie, or remote deployment is used.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const zlib = require('node:zlib');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

async function main() {
  const root = path.resolve(__dirname,'..');
  const output = path.join(root,'dist');
  if (!fs.existsSync(path.join(output,'index.html'))) throw Error('Run npm run build first.');
  const cache = path.join(process.env.LOCALAPPDATA || '', 'npm-cache','_npx');
  const candidate = process.env.CREATIVA_LIGHTHOUSE_PATH || fs.readdirSync(cache).map(dir=>path.join(cache,dir,'node_modules','lighthouse')).find(dir=>fs.existsSync(path.join(dir,'core','index.js')));
  if (!candidate) throw Error('Lighthouse is not installed; provide CREATIVA_LIGHTHOUSE_PATH.');
  const { default:lighthouse } = await import(pathToFileURL(path.join(candidate,'core','index.js')));
  const { default:desktopConfig } = await import(pathToFileURL(path.join(candidate,'core','config','desktop-config.js')));
  const chromeModule = path.join(candidate,'..','chrome-launcher','dist','index.js');
  const launcher = await import(pathToFileURL(chromeModule));
  const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.xml':'application/xml','.txt':'text/plain','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
  const server = http.createServer((req,res)=>{
    const url = new URL(req.url,'http://localhost');
    const publicPage = ['/', '/login', '/index.html'].includes(url.pathname);
    const resource = path.resolve(output,'.'+decodeURIComponent(url.pathname));
    if (!resource.startsWith(output+path.sep) && resource!==output) {res.writeHead(403);res.end();return;}
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','SAMEORIGIN');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy','camera=(self), microphone=(), geolocation=(self)');
    res.setHeader('Content-Security-Policy',"object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
    if (/^\/(api|config|services|storage|vendor|uploads|migrations)(\/|$)/.test(url.pathname)) {res.writeHead(401,{'Content-Type':'application/json'});res.end('{"status":"error","message":"Authentication required"}');return;}
    let file = publicPage ? path.join(output,fs.existsSync(path.join(output,'login.html'))?'login.html':'index.html') : resource;
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      if (path.extname(file)) {res.writeHead(404);res.end();return;}
      file=path.join(output,'index.html');res.setHeader('X-Robots-Tag','noindex, nofollow');
    }
    const ext=path.extname(file);
    if (!mime[ext]) {res.writeHead(403);res.end();return;}
    res.setHeader('Content-Type',mime[ext]);
    res.setHeader('Cache-Control',ext==='.html'||/\/(sw|registerSW)\.js$/.test(file)?'no-cache, no-store, must-revalidate':file.startsWith(path.join(output,'assets')+path.sep)?'public, max-age=31536000, immutable':'public, max-age=86400');
    let body=fs.readFileSync(file);
    if (/\b(text|javascript|json|xml|svg)\b/.test(mime[ext]) && /gzip/.test(req.headers['accept-encoding']||'')) {body=zlib.gzipSync(body);res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding');}
    res.setHeader('Content-Length',body.length);res.writeHead(200);res.end(req.method==='HEAD'?undefined:body);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let chrome;
  const results=[];
  try {
    for (const [device, config] of [['mobile',undefined],['desktop',desktopConfig]]) {
      // Separate profiles prevent service-worker/IndexedDB state crossing audits.
      const profile = fs.mkdtempSync(path.join(os.tmpdir(),'creativa-lighthouse-'));
      chrome=await launcher.launch({userDataDir:profile,chromePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless=new','--disable-gpu','--disable-extensions','--disable-component-extensions-with-background-pages','--no-first-run','--no-default-browser-check'],logLevel:'error'});
      console.log('Running Lighthouse '+device+' on production /login...');
      const run=await lighthouse(origin+'/login',{port:chrome.port,onlyCategories:['performance','accessibility','best-practices','seo'],output:['json','html'],logLevel:'error'},config);
      if(run.lhr.runtimeError)throw Error(JSON.stringify(run.lhr.runtimeError));
      const scores=Object.fromEntries(Object.entries(run.lhr.categories).map(([key,value])=>[key,Math.round(value.score*100)]));
      const summary={device,scores,warnings:run.lhr.runWarnings,metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(id=>[id,run.lhr.audits[id].displayValue])),failed:Object.values(run.lhr.audits).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,score:a.score,value:a.displayValue}))};
      results.push(summary);
      const prefix=path.join(root,'docs','audit','lighthouse-'+device);
      fs.writeFileSync(prefix+'.json',run.report[0]);fs.writeFileSync(prefix+'.html',run.report[1]);
      const traceDir=path.join(root,'backend','storage','qa','lighthouse-traces');
      fs.mkdirSync(traceDir,{recursive:true});
      fs.writeFileSync(path.join(traceDir,device+'.json'),JSON.stringify(run.artifacts.Trace));
      console.log(JSON.stringify(summary,null,2));
      await chrome.kill(); chrome=null;
    }
    fs.writeFileSync(path.join(root,'docs','audit','lighthouse-summary.json'),JSON.stringify({verified_at:new Date().toISOString(),scope:'Public login; local production build, gzip/static headers; standard Lighthouse mobile and desktop throttling; unauthenticated. Hosting and internal pages require separate verification.',lighthouseVersion:results.length?JSON.parse(fs.readFileSync(path.join(candidate,'package.json'),'utf8')).version:null,results},null,2));
    if (results.some(r=>Object.values(r.scores).some(score=>score<100))) process.exitCode=1;
  } finally {
    if(chrome) await chrome.kill();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error.stack||error.message);process.exitCode=1;});
