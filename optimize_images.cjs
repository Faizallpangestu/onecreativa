const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'assets');

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  } 
  
  files.forEach((file) => {
    if (file.endsWith('_3d_bg.png')) {
      const inputPath = path.join(directoryPath, file);
      const outputPath = path.join(directoryPath, file.replace('.png', '.webp'));
      
      sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath)
        .then(() => {
          console.log(`Converted ${file} to WebP`);
          // Remove the original PNG
          fs.unlinkSync(inputPath);
        })
        .catch(err => {
          console.error(`Error converting ${file}:`, err);
        });
    }
  });
});
