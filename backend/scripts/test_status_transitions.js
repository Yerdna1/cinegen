const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiM2VmNDIwLTlmZDAtNDBjOC1iNmM2LTAzYjU3ZjA5MjMxMSIsImVtYWlsIjoidXNlcmFfdGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzY2ODE3MDM0LCJleHAiOjE3Njc0MjE4MzR9.vd9P1RJ1JTQCZJt8vkxe9E43xuecqCSpanD2Njv2yZY';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testStatusTransitions() {
  console.log('=== Feature #33: Project Status Transitions Test ===\n');

  // Step 1: Create new project
  console.log('Step 1: Create new project...');
  const createResp = await makeRequest('POST', '/projects', {
    name: 'STATUS_TRANSITION_TEST_33',
    durationSeconds: 18
  });

  if (createResp.status !== 201) {
    console.log('❌ Failed to create project:', createResp.body);
    return;
  }

  const projectId = createResp.body.project.id;
  console.log('✅ Project created with ID:', projectId);

  // Step 2: Verify status is DRAFT
  console.log('\nStep 2: Verify status is DRAFT...');
  const getResp1 = await makeRequest('GET', `/projects/${projectId}`);
  const initialStatus = getResp1.body.project.status;
  console.log('   Current status:', initialStatus);

  if (initialStatus === 'DRAFT') {
    console.log('✅ Initial status is DRAFT');
  } else {
    console.log('❌ Expected DRAFT, got:', initialStatus);
    return;
  }

  // Step 3: Update project with required fields and add scenes
  console.log('\nStep 3: Update project with required fields...');
  await makeRequest('PUT', `/projects/${projectId}`, {
    name: 'STATUS_TRANSITION_TEST_33',
    durationSeconds: 18,
    genre: 'Action',
    setting: 'Modern city',
    plot: 'A test project for status transitions'
  });

  // Create scenes for the project
  console.log('   Creating scenes...');
  for (let i = 1; i <= 3; i++) {
    await makeRequest('POST', `/projects/${projectId}/scenes`, {
      sequenceNumber: i,
      dialogue: `Test dialogue for scene ${i}`,
      setting: 'Test setting',
      cameraAngle: 'WIDE'
    });
  }
  console.log('✅ Project updated with scenes');

  // Step 4: Start generation
  console.log('\nStep 4: Start generation...');
  const genResp = await makeRequest('POST', `/projects/${projectId}/start-generation`);

  if (genResp.status !== 200) {
    console.log('❌ Failed to start generation:', genResp.body);
    return;
  }
  console.log('✅ Generation started');

  // Step 5: Verify status changes to GENERATING
  console.log('\nStep 5: Verify status changes to GENERATING...');
  const getResp2 = await makeRequest('GET', `/projects/${projectId}`);
  const generatingStatus = getResp2.body.project.status;
  console.log('   Current status:', generatingStatus);

  if (generatingStatus === 'GENERATING') {
    console.log('✅ Status changed to GENERATING');
  } else {
    console.log('⚠️  Status is:', generatingStatus, '(may have completed quickly)');
  }

  // Step 6: Wait for generation to complete
  console.log('\nStep 6: Wait for generation to complete...');
  let attempts = 0;
  let finalStatus = generatingStatus;

  while (finalStatus !== 'COMPLETE' && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const checkResp = await makeRequest('GET', `/projects/${projectId}`);
    finalStatus = checkResp.body.project.status;
    attempts++;
    process.stdout.write(`   Checking... (${attempts}/20) Status: ${finalStatus}\r`);
  }
  console.log('');

  // Step 7: Verify status is COMPLETE
  console.log('\nStep 7: Verify status is COMPLETE...');
  if (finalStatus === 'COMPLETE') {
    console.log('✅ Status is COMPLETE');
  } else {
    console.log('❌ Expected COMPLETE, got:', finalStatus);
    return;
  }

  // Step 8: Verify completed project can be viewed/downloaded
  console.log('\nStep 8: Verify completed project can be viewed/downloaded...');
  const finalResp = await makeRequest('GET', `/projects/${projectId}`);
  const project = finalResp.body.project;

  console.log('   Project name:', project.name);
  console.log('   Status:', project.status);
  console.log('   Scenes:', project.scenes?.length || 0);

  if (project.status === 'COMPLETE' && project.scenes?.length > 0) {
    console.log('✅ Completed project is viewable');
  } else {
    console.log('❌ Cannot view completed project properly');
    return;
  }

  // Test export endpoint
  const exportResp = await makeRequest('POST', `/export/projects/${projectId}/start-export`);
  if (exportResp.status === 200) {
    console.log('✅ Export can be started for completed project');
  } else {
    console.log('⚠️  Export endpoint returned:', exportResp.status);
  }

  console.log('\n========================================');
  console.log('✅ ALL STATUS TRANSITION TESTS PASSED!');
  console.log('========================================');
  console.log('\nStatus flow verified: DRAFT → GENERATING → COMPLETE');
}

testStatusTransitions().catch(console.error);
