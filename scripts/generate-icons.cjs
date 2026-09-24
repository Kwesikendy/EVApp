const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ChargeLink GH — Official Brand Icon & Splash Screen Generator
// Uses official public/chargelink-logo.jpeg as the definitive source of truth.
// Run: node scripts/generate-icons.cjs

const SOURCE_JPEG = path.join(__dirname, '..', 'public', 'chargelink-logo.jpeg');

async function run() {
  if (!fs.existsSync(SOURCE_JPEG)) {
    throw new Error(`Master logo not found at: ${SOURCE_JPEG}`);
  }

  console.log('⚡ Generating ChargeLink GH authentic icons from chargelink-logo.jpeg...\n');

  const masterMetadata = await sharp(SOURCE_JPEG).metadata();
  console.log(`Source image: ${SOURCE_JPEG} (${masterMetadata.width}x${masterMetadata.height})`);

  // Target paths
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const expoAssetsDir = path.join(__dirname, '..', 'expo-mobile', 'assets');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
  if (!fs.existsSync(expoAssetsDir)) fs.mkdirSync(expoAssetsDir, { recursive: true });

  // 1. Standard square app icons (resized directly with bicubic lanczos3 filter)
  const standardTargets = [
    { file: path.join(iconsDir, 'icon-512.png'), size: 512 },
    { file: path.join(iconsDir, 'icon-192.png'), size: 192 },
    { file: path.join(iconsDir, 'apple-touch-icon.png'), size: 180 },
    { file: path.join(expoAssetsDir, 'icon.png'), size: 1024 },
  ];

  for (const t of standardTargets) {
    await sharp(SOURCE_JPEG)
      .resize(t.size, t.size, { fit: 'cover' })
      .png({ quality: 100 })
      .toFile(t.file);
    console.log(`✓ Rendered standard icon: ${path.relative(path.join(__dirname, '..'), t.file)} (${t.size}x${t.size})`);
  }

  // 2. Android Maskable Icon (512x512 with 80% safe zone padding)
  // Ensures circular/squircle Android launchers never clip any logo details
  const maskableInnerSize = 410;
  const maskableOffset = Math.round((512 - maskableInnerSize) / 2);
  const maskableInner = await sharp(SOURCE_JPEG)
    .resize(maskableInnerSize, maskableInnerSize, { fit: 'contain' })
    .toBuffer();

  const maskableFile = path.join(iconsDir, 'icon-maskable-512.png');
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 14, b: 20, alpha: 1 }, // #0a0e14 obsidian
    },
  })
    .composite([{ input: maskableInner, top: maskableOffset, left: maskableOffset }])
    .png({ quality: 100 })
    .toFile(maskableFile);
  console.log(`✓ Rendered maskable icon: ${path.relative(path.join(__dirname, '..'), maskableFile)} (512x512, safe-padded)`);

  // 3. Android Adaptive Icon (1024x1024 with 80% safe zone padding)
  const adaptiveInnerSize = 820;
  const adaptiveOffset = Math.round((1024 - adaptiveInnerSize) / 2);
  const adaptiveInner = await sharp(SOURCE_JPEG)
    .resize(adaptiveInnerSize, adaptiveInnerSize, { fit: 'contain' })
    .toBuffer();

  const adaptiveFile = path.join(expoAssetsDir, 'adaptive-icon.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 10, g: 14, b: 20, alpha: 1 },
    },
  })
    .composite([{ input: adaptiveInner, top: adaptiveOffset, left: adaptiveOffset }])
    .png({ quality: 100 })
    .toFile(adaptiveFile);
  console.log(`✓ Rendered adaptive icon: ${path.relative(path.join(__dirname, '..'), adaptiveFile)} (1024x1024, safe-padded)`);

  // 4. Portrait Splash / Launch Screens (1284x2778)
  // Used by iOS PWA (apple-touch-startup-image) and Expo Mobile (assets/splash.png)
  const splashWidth = 1284;
  const splashHeight = 2778;
  const splashLogoSize = 860;
  const splashLogoLeft = Math.round((splashWidth - splashLogoSize) / 2);
  // Center logo slightly above midpoint (automotive launch standard)
  const splashLogoTop = Math.round((splashHeight - splashLogoSize) / 2) - 100;

  const splashLogoBuf = await sharp(SOURCE_JPEG)
    .resize(splashLogoSize, splashLogoSize, { fit: 'contain' })
    .toBuffer();

  const splashTargets = [
    path.join(iconsDir, 'apple-splash.png'),
    path.join(expoAssetsDir, 'splash.png'),
  ];

  for (const sFile of splashTargets) {
    await sharp({
      create: {
        width: splashWidth,
        height: splashHeight,
        channels: 4,
        background: { r: 10, g: 14, b: 20, alpha: 1 }, // #0a0e14
      },
    })
      .composite([{ input: splashLogoBuf, top: splashLogoTop, left: splashLogoLeft }])
      .png({ quality: 95 })
      .toFile(sFile);
    console.log(`✓ Rendered splash/launch screen: ${path.relative(path.join(__dirname, '..'), sFile)} (${splashWidth}x${splashHeight})`);
  }

  // 5. Favicon PNG (48x48)
  const faviconFile = path.join(__dirname, '..', 'public', 'favicon.png');
  await sharp(SOURCE_JPEG)
    .resize(48, 48, { fit: 'cover' })
    .png()
    .toFile(faviconFile);
  console.log(`✓ Rendered favicon: public/favicon.png (48x48)`);

  console.log('\n🎉 All ChargeLink GH icons & launch screens generated successfully!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
