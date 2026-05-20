const fs = require("fs");
const path = require("path");

const lettersDir = path.join(__dirname, "..", "assets", "letters");
const outputFile = path.join(__dirname, "..", "assets", "letters.json");

const result = {};

function parseViewport(content) {
  const viewBoxMatch = content.match(/\bviewBox\s*=\s*"([^"]+)"/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1]
      .trim()
      .split(/[,\s]+/)
      .map((value) => Number(value));

    if (
      parts.length === 4 &&
      Number.isFinite(parts[2]) &&
      Number.isFinite(parts[3])
    ) {
      return { width: parts[2], height: parts[3] };
    }
  }

  const widthMatch = content.match(/\bwidth\s*=\s*"([^"]+)"/i);
  const heightMatch = content.match(/\bheight\s*=\s*"([^"]+)"/i);
  const width = widthMatch ? Number.parseFloat(widthMatch[1]) : NaN;
  const height = heightMatch ? Number.parseFloat(heightMatch[1]) : NaN;

  if (Number.isFinite(width) && Number.isFinite(height)) {
    return { width, height };
  }

  return { width: 35, height: 30 };
}

const files = fs.readdirSync(lettersDir).filter((f) => f.endsWith(".svg"));

for (const file of files) {
  const key = path.basename(file, ".svg");
  const content = fs.readFileSync(path.join(lettersDir, file), "utf8");
  const viewport = parseViewport(content);

  const paths = [];
  const pathTagRegex = /<path[^>]+>/g;
  const dAttrRegex = /\bd="([^"]*)"/;

  let match;
  while ((match = pathTagRegex.exec(content)) !== null) {
    const dMatch = dAttrRegex.exec(match[0]);
    if (dMatch) {
      paths.push(dMatch[1]);
    }
  }

  result[key] = {
    height: viewport.height,
    paths,
    width: viewport.width,
  };
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), "utf8");
console.log(
  `Written ${Object.keys(result).length} letter(s) to assets/letters.json`,
);
