const Database = require('better-sqlite3');
const db = new Database('./features.db');

const feature = db.prepare('SELECT * FROM features WHERE id = 94').get();
console.log('=== Feature #' + feature.id + ': ' + feature.name + ' ===');
console.log('Priority:', feature.priority);
console.log('Category:', feature.category);
console.log('Description:', feature.description);
console.log('Steps:', JSON.parse(feature.steps));

db.close();
