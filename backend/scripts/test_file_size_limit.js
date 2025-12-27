const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

async function testFileSizeLimit() {
  const token = process.argv[2];
  const characterId = process.argv[3];

  if (!token || !characterId) {
    console.log('Usage: node test_file_size_limit.js <token> <characterId>');
    process.exit(1);
  }

  // Create a large file (11MB - exceeds 10MB limit)
  const tempDir = path.join(__dirname, '..', 'uploads');
  const largeFilePath = path.join(tempDir, 'test-large-file.bin');

  console.log('Creating 11MB test file...');
  const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'x'); // 11MB of 'x'
  fs.writeFileSync(largeFilePath, largeBuffer);
  console.log('Test file created:', largeFilePath);

  // Try to upload the large file
  console.log('\\nAttempting to upload oversized file...');

  const form = new FormData();
  form.append('image', fs.createReadStream(largeFilePath), {
    filename: 'large-test.jpg',
    contentType: 'image/jpeg'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/characters/${characterId}/upload-image`,
    method: 'POST',
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response body:', data);

        // Cleanup
        fs.unlinkSync(largeFilePath);
        console.log('\\nTest file cleaned up');

        if (res.statusCode === 413) {
          console.log('\\n✅ File size limit is enforced correctly!');
          resolve(true);
        } else {
          console.log('\\n❌ Expected 413 status code for oversized file');
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      // Check if it's a connection reset (which happens when multer rejects)
      if (e.code === 'ECONNRESET') {
        console.log('\\n✅ File size limit is enforced (connection reset)');
        fs.unlinkSync(largeFilePath);
        resolve(true);
      } else {
        reject(e);
      }
    });

    form.pipe(req);
  });
}

testFileSizeLimit().catch(console.error);
