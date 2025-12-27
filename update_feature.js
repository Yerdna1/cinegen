const Database = require('better-sqlite3');
const db = new Database('./features.db');

// Get feature ID from command line
const featureId = parseInt(process.argv[2]);
if (!featureId) {
  console.log('Usage: node update_feature.js <feature_id>');
  process.exit(1);
}

// Mark feature as passed
db.prepare('UPDATE features SET passes = ? WHERE id = ?').run(1, featureId);
console.log('✅ Feature #' + featureId + ' marked as PASSED');

// Get updated status
const passed = db.prepare('SELECT COUNT(*) as count FROM features WHERE passes = 1').get();
const failed = db.prepare('SELECT COUNT(*) as count FROM features WHERE passes = 0 OR passes IS NULL').get();
const total = passed.count + failed.count;
console.log('\nProgress:', passed.count + '/' + total, '(' + Math.round(passed.count/total*100) + '%)');

const remaining = db.prepare('SELECT id, name FROM features WHERE passes = 0 OR passes IS NULL ORDER BY id').all();
console.log('\nRemaining features:', remaining.length);
remaining.forEach(f => console.log('  #' + f.id + ': ' + f.name));

db.close();
