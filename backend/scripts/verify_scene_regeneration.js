const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the test project
  const project = await prisma.project.findFirst({
    where: { name: 'CLIP_REGEN_TEST_37' },
    include: { scenes: { orderBy: { sequenceNumber: 'asc' } } }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('Project:', project.name, 'Status:', project.status);
  console.log('\nScenes:');
  for (const scene of project.scenes) {
    console.log(`  Scene ${scene.sequenceNumber}:`);
    console.log(`    Status: ${scene.status}`);
    console.log(`    Video URL: ${scene.videoUrl}`);
    console.log(`    Start Image: ${scene.startImageUrl}`);
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
