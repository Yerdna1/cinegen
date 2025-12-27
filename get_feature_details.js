const Database = require('better-sqlite3');
const db = new Database('./features.db');

const features = db.prepare('SELECT * FROM features WHERE id IN (33, 34, 35, 50, 94) ORDER BY priority, id').all();
features.forEach(f => {
  console.log('\n=== Feature #' + f.id + ': ' + f.name + ' ===');
  console.log('Priority:', f.priority);
  console.log('Category:', f.category);
  console.log('Description:', f.description);
  console.log('Steps:', JSON.parse(f.steps));
});

db.close();
