const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { TRANSLATIONS } = require('./seed-missing-translations.cjs');

console.log('Seeding', Object.keys(TRANSLATIONS).length, 'translations to Polyglot Hub on server...');

const remoteScript = `
const fs = require('fs');
const storePath = '/app/data/polyglot-store.json';
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const projectId = 'proj_352f0dea'; // wabridge
const newTranslations = ${JSON.stringify(TRANSLATIONS)};

let added = 0;
let updated = 0;

for (const [key, trans] of Object.entries(newTranslations)) {
  const namespace = key.split('.')[0] || 'general';
  let item = store.translations.find(t => t.projectId === projectId && t.key === key);
  if (item) {
    item.translations = { ...item.translations, ...trans };
    item.updatedAt = new Date().toISOString();
    updated++;
  } else {
    store.translations.push({
      id: 't_' + Math.random().toString(36).slice(2, 10),
      projectId,
      key,
      namespace,
      translations: trans,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    added++;
  }
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('Successfully injected into Polyglot Store:', { added, updated, total: store.translations.filter(t => t.projectId === projectId).length });
`;

fs.writeFileSync(path.join(__dirname, 'remote-polyglot-seed.js'), remoteScript, 'utf8');

console.log('Copying seed script to server...');
execSync('scp "' + path.join(__dirname, 'remote-polyglot-seed.js') + '" ubuntu@192.168.100.184:/tmp/remote-polyglot-seed.js', { stdio: 'inherit' });

console.log('Executing inside Polyglot Hub container...');
execSync('ssh ubuntu@192.168.100.184 "docker cp /tmp/remote-polyglot-seed.js vps-035f2226-polyglot-hub:/app/seed-wabridge.js && docker exec vps-035f2226-polyglot-hub node /app/seed-wabridge.js && docker exec vps-035f2226-polyglot-hub rm -f /app/seed-wabridge.js"', { stdio: 'inherit' });

console.log('Done!');
