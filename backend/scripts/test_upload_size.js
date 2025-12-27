const fs = require('fs');
const http = require('http');
const path = require('path');

async function testUpload() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiM2VmNDIwLTlmZDAtNDBjOC1iNmM2LTAzYjU3ZjA5MjMxMSIsImVtYWlsIjoidXNlcmFfdGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY2ODE3MDM0LCJleHAiOjE3Njc0MjE4MzR9.vd9P1RJ1JTQCZJt8vkxe9E43xuecqCSpanD2Njv2yZY';
  const characterId = '3c0a56c0-b4cf-4b2f-844d-f41056177e5a';

  // Create large file if not exists
  const largeFilePath = '/tmp/large-test-file.bin';
  if (!fs.existsSync(largeFilePath)) {
    console.log('Creating 12MB test file...');
    const buffer = Buffer.alloc(12 * 1024 * 1024);
    buffer[0] = 0xFF; buffer[1] = 0xD8; buffer[2] = 0xFF; // JPEG magic
    fs.writeFileSync(largeFilePath, buffer);
  }

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const fileContent = fs.readFileSync(largeFilePath);

  const bodyParts = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="image"; filename="large-test.jpg"\r\n`,
    `Content-Type: image/jpeg\r\n\r\n`,
  ];

  const bodyStart = Buffer.from(bodyParts.join(''));
  const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([bodyStart, fileContent, bodyEnd]);

  console.log('Uploading', (body.length / 1024 / 1024).toFixed(2), 'MB file...');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/characters/${characterId}/upload-image`,
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
      'Authorization': `Bearer ${token}`
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode);
        console.log('Response Body:', data);

        if (res.statusCode === 413) {
          console.log('\n✅ SUCCESS: File size limit is enforced correctly!');
        } else {
          console.log('\n⚠️  Status was', res.statusCode, '(expected 413)');
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log('\nRequest Error:', e.code, e.message);
      if (e.code === 'ECONNRESET') {
        console.log('✅ SUCCESS: File size limit enforced (connection reset by server)');
      }
      resolve();
    });

    req.write(body);
    req.end();
  });
}

testUpload().catch(console.error);
