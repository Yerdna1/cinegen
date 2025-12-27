const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiM2VmNDIwLTlmZDAtNDBjOC1iNmM2LTAzYjU3ZjA5MjMxMSIsImVtYWlsIjoidXNlcmFfdGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY2ODE3MDM0LCJleHAiOjE3Njc0MjE4MzR9.vd9P1RJ1JTQCZJt8vkxe9E43xuecqCSpanD2Njv2yZY';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/projects',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    const statusCounts = {};
    result.projects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });
    console.log('Project status counts:', statusCounts);

    // Find COMPLETE projects
    const complete = result.projects.filter(p => p.status === 'COMPLETE');
    console.log('\nCOMPLETE projects:');
    complete.forEach(p => console.log('  -', p.name, '(id:', p.id, ')'));
  });
});

req.on('error', console.error);
req.end();
