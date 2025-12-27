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

async function testSceneEditingAndManagement() {
  console.log('=== Feature #34 & #35: Scene Editing and Add/Delete Test ===\n');

  // Step 1: Create a new project
  console.log('Step 1: Create new project...');
  const createResp = await makeRequest('POST', '/projects', {
    name: 'SCENE_EDIT_TEST_34_35',
    durationSeconds: 30
  });

  if (createResp.status !== 201) {
    console.log('❌ Failed to create project:', createResp.body);
    return;
  }

  const projectId = createResp.body.project.id;
  console.log('✅ Project created with ID:', projectId);

  // Step 2: Update project with required fields
  console.log('\nStep 2: Update project with required fields...');
  await makeRequest('PUT', `/projects/${projectId}`, {
    name: 'SCENE_EDIT_TEST_34_35',
    durationSeconds: 30,
    genre: 'Action',
    setting: 'Modern city',
    plot: 'A test project for scene editing'
  });
  console.log('✅ Project updated');

  // Step 3: Generate initial scenes
  console.log('\nStep 3: Generate initial scenes...');
  const genScenesResp = await makeRequest('POST', `/projects/${projectId}/generate-scenes`);
  if (genScenesResp.status !== 200) {
    console.log('❌ Failed to generate scenes:', genScenesResp.body);
    return;
  }
  const initialSceneCount = genScenesResp.body.scenes.length;
  const firstScene = genScenesResp.body.scenes[0];
  console.log('✅ Generated', initialSceneCount, 'scenes');
  console.log('   First scene ID:', firstScene.id);
  console.log('   First scene dialogue:', firstScene.dialogue);

  // =================================================
  // Feature #34: Scene Editing in Wizard Review Step
  // =================================================
  console.log('\n--- Feature #34: Scene Editing ---');

  // Step 4: Edit a scene's dialogue
  console.log('\nStep 4: Edit scene dialogue...');
  const editedDialogue = 'EDITED_DIALOGUE_FOR_FEATURE_34_TEST';
  const editResp = await makeRequest('PUT', `/projects/${projectId}/scenes/${firstScene.id}`, {
    dialogue: editedDialogue,
    cameraAngle: 'close-up',
    emotions: 'happy',
    actions: 'running'
  });

  if (editResp.status !== 200) {
    console.log('❌ Failed to edit scene:', editResp.body);
    return;
  }
  console.log('✅ Scene updated');

  // Step 5: Verify changes reflected
  console.log('\nStep 5: Verify scene changes...');
  const projectResp = await makeRequest('GET', `/projects/${projectId}`);
  const updatedScene = projectResp.body.project.scenes.find(s => s.id === firstScene.id);

  if (updatedScene.dialogue === editedDialogue) {
    console.log('✅ Dialogue updated correctly:', updatedScene.dialogue);
  } else {
    console.log('❌ Dialogue not updated. Expected:', editedDialogue, 'Got:', updatedScene.dialogue);
    return;
  }

  if (updatedScene.cameraAngle === 'close-up') {
    console.log('✅ Camera angle updated correctly:', updatedScene.cameraAngle);
  } else {
    console.log('❌ Camera angle not updated');
    return;
  }

  console.log('\n✅ FEATURE #34 PASSED: Scene editing in wizard works!\n');

  // =================================================
  // Feature #35: Scene Add and Delete in Wizard
  // =================================================
  console.log('--- Feature #35: Scene Add and Delete ---');

  // Step 6: Count initial scenes
  console.log('\nStep 6: Count initial scenes...');
  const beforeAddCount = projectResp.body.project.scenes.length;
  console.log('   Initial scene count:', beforeAddCount);

  // Step 7: Add a new scene
  console.log('\nStep 7: Add a new scene...');
  const addResp = await makeRequest('POST', `/projects/${projectId}/scenes`, {
    sequenceNumber: beforeAddCount + 1,
    dialogue: 'NEW_SCENE_ADDED_FOR_TEST_35',
    cameraAngle: 'wide',
    emotions: 'excited',
    actions: 'jumping'
  });

  if (addResp.status !== 201) {
    console.log('❌ Failed to add scene:', addResp.body);
    return;
  }

  const newSceneId = addResp.body.scene.id;
  console.log('✅ Scene added with ID:', newSceneId);

  // Step 8: Verify scene count increased
  console.log('\nStep 8: Verify scene count increased...');
  const afterAddResp = await makeRequest('GET', `/projects/${projectId}`);
  const afterAddCount = afterAddResp.body.project.scenes.length;
  console.log('   Scene count after add:', afterAddCount);

  if (afterAddCount === beforeAddCount + 1) {
    console.log('✅ Scene count increased correctly');
  } else {
    console.log('❌ Scene count did not increase. Expected:', beforeAddCount + 1, 'Got:', afterAddCount);
    return;
  }

  // Step 9: Delete the new scene
  console.log('\nStep 9: Delete the new scene...');
  const deleteResp = await makeRequest('DELETE', `/projects/${projectId}/scenes/${newSceneId}`);

  if (deleteResp.status !== 200) {
    console.log('❌ Failed to delete scene:', deleteResp.body);
    return;
  }
  console.log('✅ Scene deleted');

  // Step 10: Verify scene count decreased
  console.log('\nStep 10: Verify scene count decreased...');
  const afterDeleteResp = await makeRequest('GET', `/projects/${projectId}`);
  const afterDeleteCount = afterDeleteResp.body.project.scenes.length;
  console.log('   Scene count after delete:', afterDeleteCount);

  if (afterDeleteCount === beforeAddCount) {
    console.log('✅ Scene count decreased correctly');
  } else {
    console.log('❌ Scene count did not decrease. Expected:', beforeAddCount, 'Got:', afterDeleteCount);
    return;
  }

  console.log('\n✅ FEATURE #35 PASSED: Scene add and delete works!\n');

  console.log('========================================');
  console.log('✅ ALL SCENE MANAGEMENT TESTS PASSED!');
  console.log('========================================');
  console.log('\nFeature #34: Scene editing - PASSED');
  console.log('Feature #35: Scene add/delete - PASSED');
}

testSceneEditingAndManagement().catch(console.error);
