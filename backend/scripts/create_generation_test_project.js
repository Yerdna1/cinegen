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

  // Create a draft project for testing generation progress
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: 'GENERATION_PROGRESS_TEST_68',
      durationSeconds: 24,
      genre: 'Action',
      setting: 'Modern city',
      plot: 'A test project for generation progress testing',
      status: 'DRAFT'
    }
  });

  console.log('Created project:', project.id);

  // Create 4 scenes with PENDING status
  for (let i = 1; i <= 4; i++) {
    const scene = await prisma.scene.create({
      data: {
        projectId: project.id,
        sequenceNumber: i,
        dialogue: 'Scene ' + i + ' test dialogue for generation progress testing',
        cameraAngle: i % 2 === 0 ? 'close-up' : 'medium',
        emotions: 'determined',
        actions: 'walking',
        status: 'PENDING'
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
