const Database = require('better-sqlite3');
const db = new Database('./features.db');

// Check table structure
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

// Get schema for features table
const schema = db.prepare("PRAGMA table_info(features)").all();
console.log('Features schema:', schema);

// Get a sample row
const sample = db.prepare("SELECT * FROM features LIMIT 1").get();
console.log('Sample row:', sample);

db.close();
