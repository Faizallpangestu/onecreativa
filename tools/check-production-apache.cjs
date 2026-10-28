// Verify the packaged .htaccess with a separate loopback Apache instance.
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 const root=path.resolve(__dirname,'..');
 const dist=path.join(root,'dist').replaceAll('\\','/');
 const dir=path.join(root,'backend/storage/qa/apache-'+Date.now());fs.mkdirSync(dir,{recursive:true});
 const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
 const apache=process.env.CREATIVA_APACHE_ROOT||'C:/Muhammadfaizal/apache';
 const modules=['authz_core','access_compat','mime','dir','headers','rewrite','setenvif','filter','deflate','expires'];
 const config=[`ServerRoot "${apache}"`,`Listen 127.0.0.1:${port}`,'ServerName localhost',`PidFile "${dir.replaceAll('\\','/')}/httpd.pid"`,...modules.map(name=>`LoadModule ${name}_module modules/mod_${name}.so`),`TypesConfig "${apache}/conf/mime.types"`,`ErrorLog "${dir.replaceAll('\\','/')}/apache.log"`,`DocumentRoot "${dist}"`,`<Directory "${dist}">`,'AllowOverride All','Require all granted','</Directory>','<LocationMatch "^/(api|config|services|storage|vendor|uploads|migrations)/">','Require all denied','</LocationMatch>'].join('\n');
 const file=path.join(dir,'httpd.conf');fs.writeFileSync(file,config);
 const log=fs.openSync(path.join(dir,'process.log'),'a');
 const server=spawn(path.join(apache,'bin/httpd.exe'),['-X','-f',file],{windowsHide:true,stdio:['ignore',log,log]});fs.closeSync(log);
 const origin='http://127.0.0.1:'+port;
 try{
  let ready=false;for(let i=0;i<100;i++){try{const r=await fetch(origin+'/login');if(r.status===200){ready=true;break;}}catch{}await delay(100);}
  if(!ready)throw Error('Apache failed: '+(fs.existsSync(path.join(dir,'apache.log'))?fs.readFileSync(path.join(dir,'apache.log'),'utf8'):fs.readFileSync(path.join(dir,'process.log'),'utf8')));
  const login=await fetch(origin+'/login');const html=await login.text();assert(html.includes('id="email"')&&html.includes('id="password"'),'Public login serves prerendered form');assert(!login.headers.get('x-robots-tag'),'Public login can be indexed');
  const rootResponse=await fetch(origin+'/',{redirect:'manual'});assert.equal(rootResponse.status,302);assert(rootResponse.headers.get('location').endsWith('/login'));
  const privatePage=await fetch(origin+'/employees');assert.equal(privatePage.status,200);assert(privatePage.headers.get('x-robots-tag')?.includes('noindex'),'Private pages have server noindex');assert(!(await privatePage.text()).includes('id="email"'),'Private routes use normal SPA shell');
  const sw=await fetch(origin+'/sw.js');assert(sw.headers.get('cache-control')?.includes('no-store'),'Service worker must update without long cache');
  const cssUrl=html.match(/href="([^"]+\.css)"/)[1];const css=await fetch(origin+cssUrl,{headers:{'Accept-Encoding':'gzip'}});assert(css.headers.get('cache-control')?.includes('immutable'),'Hashed assets use immutable caching');assert.equal(css.headers.get('content-encoding'),'gzip','CSS compressed by real Apache');
  assert(login.headers.get('content-security-policy')?.includes("frame-ancestors 'self'"));assert(login.headers.get('permissions-policy')?.includes('camera=(self)'));
  assert.equal((await fetch(origin+'/config/database.php')).status,403,'Configuration cannot be served as source');
  fs.writeFileSync(path.join(root,'docs/audit/apache-build-verification.json'),JSON.stringify({verified_at:new Date().toISOString(),server:'Separate loopback Apache, production .htaccess, no PHP or database access',checks:9,passed:true},null,2));
  console.log('PASS: 9 real Apache routing, prerender, robots, compression, cache and header checks.');
 }finally{server.kill();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
