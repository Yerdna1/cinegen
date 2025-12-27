const Database = require('better-sqlite3');
const db = new Database('./features.db');

// Mark feature 93 as passed
db.prepare('UPDATE features SET passes = ? WHERE id = ?').run(1, 93);

// Get updated status
const passed = db.prepare('SELECT COUNT(*) as count FROM features WHERE passes = 1').get();
const failed = db.prepare('SELECT COUNT(*) as count FROM features WHERE passes = 0 OR passes IS NULL').get();
console.log('Passed:', passed.count, '/ Failed or pending:', failed.count);

const remaining = db.prepare('SELECT id, name FROM features WHERE passes = 0 OR passes IS NULL ORDER BY id').all();
console.log('Remaining features:', remaining.length);
remaining.forEach(f => console.log('  #' + f.id + ': ' + f.name));

db.close();
