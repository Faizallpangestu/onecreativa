const fs = require('node:fs');
const sharp = require('sharp');
async function main() {
  fs.mkdirSync('public/icons', { recursive: true });
  const logo = fs.readFileSync('public/erplogo.png');
  await sharp(logo).resize(32,32,{fit:'contain',background:'#ffffff'}).png({palette:true,quality:90}).toFile('public/icons/favicon-32.png');
  for (const size of [192, 512]) await sharp(logo).resize(size, size, {fit:'contain',background:'#ffffff'}).png({palette:true,quality:90}).toFile(`public/icons/icon-${size}.png`);
  await sharp(logo).resize(380,380,{fit:'contain',background:'#ffffff'}).extend({top:66,bottom:66,left:66,right:66,background:'#ffffff'}).png({palette:true,quality:90}).toFile('public/icons/icon-maskable-512.png');
  await sharp(logo).resize(180,180,{fit:'contain',background:'#ffffff'}).png({palette:true,quality:90}).toFile('public/icons/apple-touch-icon.png');
  const compressed = await sharp(logo).resize(512,512,{fit:'inside',withoutEnlargement:true}).png({palette:true,quality:90}).toBuffer();
  fs.writeFileSync('public/erplogo.png',compressed);
  await sharp('src/assets/logo.webp').resize(96,92,{fit:'inside'}).webp({quality:82}).toFile('src/assets/login-logo.webp');
  await sharp('src/assets/login-illustration.jpg').resize(640,640).webp({quality:76}).toFile('src/assets/login-illustration.webp');
  console.log(`Shell logo: ${logo.length} -> ${compressed.length} bytes; login images and correctly sized PWA icons generated.`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
