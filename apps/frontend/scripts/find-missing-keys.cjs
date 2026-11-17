const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');
const idJson = JSON.parse(fs.readFileSync(path.join(srcDir, 'locales/id.json'), 'utf8'));
const enJson = JSON.parse(fs.readFileSync(path.join(srcDir, 'locales/en.json'), 'utf8'));
const jaJson = JSON.parse(fs.readFileSync(path.join(srcDir, 'locales/ja.json'), 'utf8'));

function getNested(obj, keyPath) {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[p];
  }
  return curr;
}

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
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

const files = getAllFiles(srcDir);
const tRegex = /\bt\(\s*["']([^"']+)["'](?:\s*,\s*["']([^"']*)["'])?/g;

const missingMap = new Map();
const allUsedKeys = new Set();

for (const f of files) {
  if (f.includes('locales') || f.includes('scripts')) continue;
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    const fallback = match[2];
    allUsedKeys.add(key);
    const inId = getNested(idJson, key);
    if (inId === undefined) {
      if (!missingMap.has(key)) {
        missingMap.set(key, { files: [path.relative(srcDir, f)], fallback });
      } else {
        missingMap.get(key).files.push(path.relative(srcDir, f));
      }
    }
  }
}

console.log('Total unique keys used with t():', allUsedKeys.size);
console.log('Total missing in id.json:', missingMap.size);

const missingList = [];
for (const [key, val] of missingMap.entries()) {
  missingList.push({ key, fallback: val.fallback, files: val.files });
}
fs.writeFileSync(path.resolve(__dirname, 'missing-keys-report.json'), JSON.stringify(missingList, null, 2));
console.log(JSON.stringify(missingList, null, 2));
