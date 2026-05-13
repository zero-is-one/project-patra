const fs = require("fs");
const path = require("path");

const lettersDir = path.join(__dirname, "..", "assets", "letters");
const outputFile = path.join(__dirname, "..", "assets", "letters.json");

const result = {};

const files = fs.readdirSync(lettersDir).filter((f) => f.endsWith(".svg"));

for (const file of files) {
  const key = path.basename(file, ".svg");
  const content = fs.readFileSync(path.join(lettersDir, file), "utf8");

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

  result[key] = paths;
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), "utf8");
console.log(
  `Written ${Object.keys(result).length} letter(s) to assets/letters.json`,
);
