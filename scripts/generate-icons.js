const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.5}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R", size / 2, size / 2);

  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  console.log(`Generated ${outputPath}`);
}

generateIcon(192, path.join(iconsDir, "icon-192.png"));
generateIcon(512, path.join(iconsDir, "icon-512.png"));
