const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the test user
  const user = await prisma.user.findUnique({
    where: { email: 'usera_test@test.com' }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  // Create a complete project for testing clip regeneration
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: 'CLIP_REGEN_TEST_37',
      durationSeconds: 30,
      genre: 'Action',
      setting: 'Modern city',
      plot: 'A test project for clip regeneration',
      status: 'COMPLETE'
    }
  });

  console.log('Created project:', project.id);

  // Create 5 scenes with COMPLETE status (simulating generated clips)
  for (let i = 1; i <= 5; i++) {
    const scene = await prisma.scene.create({
      data: {
        projectId: project.id,
        sequenceNumber: i,
        dialogue: 'Scene ' + i + ' test dialogue for clip regeneration testing',
        cameraAngle: i % 3 === 0 ? 'wide' : (i % 2 === 0 ? 'close-up' : 'medium'),
        emotions: 'determined',
        actions: 'walking',
        status: 'COMPLETE',
        startImageUrl: '/placeholder-start-' + i + '.png',
        endImageUrl: '/placeholder-end-' + i + '.png',
        videoUrl: '/placeholder-video-' + i + '.mp4',
        audioUrl: '/placeholder-audio-' + i + '.mp3'
      }
    });
    console.log('Created scene:', scene.id, 'Sequence:', i);
  }

  console.log('Test project created successfully!');
  console.log('Project ID:', project.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
