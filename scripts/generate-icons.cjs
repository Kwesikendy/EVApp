const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ChargeLink GH — Official PWA Icon Generator
// Produces ChargeLink Green "C + plug + leaf" glyph on deep obsidian background
// Run: node scripts/generate-icons.cjs
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ade80" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>
    <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
    <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#22c55e" stop-opacity="0.20" />
      <stop offset="60%" stop-color="#22c55e" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#10141a" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Deep Obsidian Background -->
  <rect width="1024" height="1024" rx="180" fill="#10141a" />
  
  <!-- Ambient green backlight -->
  <circle cx="512" cy="512" r="440" fill="url(#greenGlow)" />

  <!-- C-shaped arc (large, centered) -->
  <g transform="translate(512,512) scale(9) translate(-60,-60)">
    <path
      d="M 68 14 A 46 46 0 1 0 68 106 L 68 90 A 30 30 0 1 1 68 30 Z"
      fill="url(#cGrad)"
    />
    <!-- EV plug body -->
    <rect x="62" y="48" width="32" height="22" rx="6" fill="url(#leafGrad)" />
    <rect x="94" y="53" width="12" height="4" rx="2" fill="url(#leafGrad)" />
    <rect x="94" y="62" width="12" height="4" rx="2" fill="url(#leafGrad)" />
    <!-- Lightning bolt -->
    <path d="M75 52 L71 61 L76 61 L72 70 L81 60 L76 60 Z" fill="#ffffff" />
    <!-- Leaf swoosh -->
    <path d="M 36 84 Q 56 72 84 78 Q 62 90 42 94 Z" fill="url(#leafGrad)" opacity="0.9"/>
  </g>
</svg>`;

async function run() {
  const buf = Buffer.from(svgContent, 'utf-8');
  
  // Write the master SVG
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'icons', 'xcharge-mark.svg'), svgContent);
  console.log('Written: public/icons/xcharge-mark.svg (ChargeLink GH glyph)');

  const targets = [
    { file: path.join(__dirname, '..', 'public', 'icons', 'icon-512.png'), size: 512 },
    { file: path.join(__dirname, '..', 'public', 'icons', 'icon-192.png'), size: 192 },
    { file: path.join(__dirname, '..', 'public', 'icons', 'icon-maskable-512.png'), size: 512 },
    { file: path.join(__dirname, '..', 'public', 'icons', 'apple-touch-icon.png'), size: 180 },
    { file: path.join(__dirname, '..', 'expo-mobile', 'assets', 'icon.png'), size: 1024 },
    { file: path.join(__dirname, '..', 'expo-mobile', 'assets', 'adaptive-icon.png'), size: 1024 },
  ];

  for (const t of targets) {
    await sharp(buf)
      .resize(t.size, t.size)
      .png()
      .toFile(t.file);
    console.log(`Rendered: ${t.file} (${t.size}x${t.size})`);
  }

  console.log('\n✅ ChargeLink GH icons generated successfully!');
}

run().catch(console.error);
