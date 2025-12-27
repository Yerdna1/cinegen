const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: 'GENERATION_PROGRESS_TEST_68' },
    include: { scenes: true }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('Project Status:', project.status);
  console.log('Scenes:');
  for (const scene of project.scenes) {
    console.log('  Scene', scene.sequenceNumber, ':', scene.status);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
