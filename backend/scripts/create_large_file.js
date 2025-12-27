const fs = require('fs');
const path = require('path');

// Create a 12MB file (exceeds 10MB limit)
const filePath = '/tmp/large-test-file.bin';
const size = 12 * 1024 * 1024; // 12MB

console.log('Creating 12MB test file...');
const buffer = Buffer.alloc(size);
// Add JPEG magic bytes to make it look like an image
buffer[0] = 0xFF;
buffer[1] = 0xD8;
buffer[2] = 0xFF;

fs.writeFileSync(filePath, buffer);
console.log('Created:', filePath);
console.log('Size:', (fs.statSync(filePath).size / 1024 / 1024).toFixed(2), 'MB');
