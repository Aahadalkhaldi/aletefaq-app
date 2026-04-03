import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputIcon = 'app-icon-original.png';
const assetsDir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';

// iOS requires 1024x1024 icon
async function generateIcon() {
  // Resize to 1024x1024
  const iconPath = path.join(assetsDir, 'AppIcon-512@2x.png');
  await sharp(inputIcon)
    .resize(1024, 1024, { fit: 'cover', background: { r: 18, g: 62, b: 124, alpha: 1 } })
    .png()
    .toFile(iconPath);
  
  console.log(`✅ Generated ${iconPath} (1024x1024)`);
  
  // Update Contents.json
  const contentsJson = {
    "images": [
      {
        "filename": "AppIcon-512@2x.png",
        "idiom": "universal",
        "platform": "ios",
        "size": "1024x1024"
      }
    ],
    "info": {
      "author": "xcode",
      "version": 1
    }
  };
  
  fs.writeFileSync(
    path.join(assetsDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log('✅ Updated Contents.json');
}

generateIcon().catch(console.error);
