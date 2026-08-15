// Audit: every data-i18n* key used in web/index.html must exist in the
// English catalog of web/i18n.js.
const fs = require('fs');
const i18n = require('../web/i18n.js');
const html = fs.readFileSync(__dirname + '/../web/index.html', 'utf8');
const keys = new Set();
const re = /data-i18n(?:-placeholder|-title|-html|-alt)?="([^"]+)"/g;
let m;
while ((m = re.exec(html))) keys.add(m[1]);
const en = i18n.CATALOG.en;
const missing = [...keys].filter(k => en[k] === undefined);
console.log('data-i18n keys used:', keys.size);
console.log('missing from catalog:', JSON.stringify(missing));
if (missing.length) process.exit(1);
