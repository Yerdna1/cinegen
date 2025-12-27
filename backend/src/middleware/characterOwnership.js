/**
 * Middleware to verify character ownership
 */
async function checkCharacterOwnership(req, res, next) {
  try {
    const prisma = req.app.get('prisma');
    const character = await prisma.character.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Attach character to request for use in route handler
    req.character = character;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { checkCharacterOwnership };
