const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'usera_test@test.com' }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: 'GENERATION_TEST_68_v2',
      durationSeconds: 18,
      genre: 'Sci-Fi',
      setting: 'Space station',
      plot: 'Test for WebSocket progress',
      status: 'DRAFT'
    }
  });

  console.log('Created project:', project.id);

  for (let i = 1; i <= 3; i++) {
    await prisma.scene.create({
      data: {
        projectId: project.id,
        sequenceNumber: i,
        dialogue: 'Scene ' + i + ' dialogue',
        cameraAngle: 'medium',
        emotions: 'neutral',
        actions: 'standing',
        status: 'PENDING'
      }
    });
  }

  console.log('Project ID:', project.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
