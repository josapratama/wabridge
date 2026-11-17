const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

function getAllFiles(dir, exts = ['.tsx']) {
  let res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      res = res.concat(getAllFiles(full, exts));
    } else if (exts.includes(path.extname(ent.name))) {
      res.push(full);
    }
  }
  return res;
}

const files = getAllFiles(path.join(srcDir, 'pages/dashboard'));
const files2 = getAllFiles(path.join(srcDir, 'features'));
const files3 = getAllFiles(path.join(srcDir, 'components'));
const all = [...files, ...files2, ...files3];

const results = [];

// Look for JSX text: >Text< or placeholder="..." or title="..." that does not contain {t(
for (const file of all) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check raw button/h1/h2/h3/p/span text e.g. >Some Word<
    const jsxTextMatches = line.match(/>\s*([A-Za-z0-9][A-Za-z0-9\s.,?!'’"()–—:;/-]{3,})\s*</g);
    if (jsxTextMatches) {
      for (const m of jsxTextMatches) {
        const text = m.slice(1, -1).trim();
        // Skip common technical symbols, code, numbers
        if (!text.includes('{') && !text.includes('}') && isNaN(Number(text)) && text.length > 2) {
          // ignore purely css or svgs
          if (!line.includes('className') || line.indexOf('>') < line.lastIndexOf('<')) {
            results.push({ file: path.relative(srcDir, file), line: idx + 1, text });
          }
        }
      }
    }
  });
}

console.log('Potential hardcoded texts found:', results.length);
fs.writeFileSync(path.resolve(__dirname, 'hardcoded-report.json'), JSON.stringify(results.slice(0, 50), null, 2));
console.log(JSON.stringify(results.slice(0, 30), null, 2));
