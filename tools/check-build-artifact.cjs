const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'dist');
const files=[];
function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);assert(!entry.isSymbolicLink(),'Release symlink');if(entry.isDirectory())visit(full);else files.push({file:path.relative(output,full).replaceAll('\\','/'),bytes:fs.statSync(full).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')});}}
visit(output);
for(const item of files){
 assert(!/(^|\/)(db_env\.php|mail\.local\.php|backups|tests|qa)(\/|$)/i.test(item.file),'Private artifact: '+item.file);
 assert(!/\.(env|log|bak)$/i.test(item.file),'Private config/log: '+item.file);
 assert(!item.file.endsWith('.sql')||item.file.startsWith('migrations/'),'Database dump packaged: '+item.file);
 assert(!/^api\/(test|debug|check|fix_|schema_dump|show_tables|migrate|db_|add_status_col|assets_migrate|profile_debug|resolve_map)/i.test(item.file),'Diagnostic API: '+item.file);
 if(/^(uploads|storage)\//.test(item.file))assert(item.file.endsWith('/.htaccess'),'Personal file packaged: '+item.file);
 if(/\.(js|php|html|json)$/.test(item.file))assert(!/sk-or-v1-[a-z0-9]{32,}|gsk_[a-zA-Z0-9]{32,}|AIza[a-zA-Z0-9_-]{30,}/.test(fs.readFileSync(path.join(output,item.file),'utf8')),'Provider secret found: '+item.file);
}
for(const required of ['index.html','login.html','.htaccess','api/login.php','api/session.php','api/face_clock.php','config/.htaccess','services/.htaccess','storage/.htaccess','sw.js','robots.txt','sitemap.xml','manifest.webmanifest'])assert(files.some(item=>item.file===required),'Required file missing: '+required);
const html=fs.readFileSync(path.join(output,'login.html'),'utf8');
assert(html.includes('id="email"')&&html.includes('id="password"'),'Login HTML missing');
for(const m of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)){if(m[1].startsWith('/assets/')||m[1].startsWith('/icons/'))assert(fs.existsSync(path.join(output,m[1].slice(1))),'Missing public asset: '+m[1]);}
assert(!/rel="modulepreload"/.test(html),'Full app preloads leaked into public login');
JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const summary={verified_at:new Date().toISOString(),files:files.length,total_bytes:files.reduce((sum,item)=>sum+item.bytes,0),private_files_excluded:true,diagnostic_apis_excluded:true,required_files_present:true,public_login_assets_resolve:true,provider_secret_pattern_scan_passed:true,entries:files};
fs.writeFileSync(path.join(root,'docs/audit/production-build-manifest.json'),JSON.stringify(summary,null,2));
console.log(`PASS: ${files.length} production files checked and hashed; private data/config excluded, public assets resolve.`);
