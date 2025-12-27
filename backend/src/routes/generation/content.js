/**
 * Content Generation Routes
 *
 * API endpoints for AI-powered scene content generation (dialogue, prompts).
 */

const express = require('express');
const router = express.Router();
const { getLLMProvider } = require('../../services/llm-factory');
const { createUsageService } = require('../../services/usage');
const pricingService = require('../../services/pricing');

/**
 * POST /api/generation/projects/:id/scenes/:sceneId/generate-content
 * Generate AI content (dialogue + image prompts) for a single scene
 */
router.post('/projects/:id/scenes/:sceneId/generate-content', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { llmProvider: overrideProvider } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        projectCharacters: { include: { character: true } },
        scenes: { orderBy: { sequenceNumber: 'asc' } }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scene = project.scenes.find(s => s.id === req.params.sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Get LLM provider
    const providerName = overrideProvider || project.llmProvider || 'anthropic';
    const llmService = getLLMProvider(providerName);

    // Build context for LLM
    const projectContext = {
      genre: project.genre,
      setting: project.setting,
      plot: project.plot,
      characters: project.projectCharacters.map(pc => ({
        name: pc.character.name,
        description: pc.character.description,
        imageUrl: pc.character.imageUrl
      })),
      totalScenes: project.scenes.length,
      previousScenes: project.scenes
        .filter(s => s.sequenceNumber < scene.sequenceNumber)
        .map(s => ({
          dialogue: s.dialogue,
          actions: s.actions,
          startImagePrompt: s.startImagePrompt,
          endImagePrompt: s.endImagePrompt
        }))
    };

    const sceneContext = {
      sequenceNumber: scene.sequenceNumber,
      cameraAngle: scene.cameraAngle,
      emotions: scene.emotions,
      actions: scene.actions
    };

    // Get user's API key for the LLM provider
    const apiKey = await llmService.getUserApiKey(prisma, req.user.id);
    if (!apiKey) {
      return res.status(400).json({
        error: `Missing API key for ${providerName}. Please add your API key in Settings.`
      });
    }

    // Generate content
    const generatedContent = await llmService.generateSceneContent(apiKey, sceneContext, projectContext);

    // Update scene with generated content
    const updatedScene = await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: {
        dialogue: generatedContent.dialogue || scene.dialogue,
        startImagePrompt: generatedContent.startImagePrompt,
        endImagePrompt: generatedContent.endImagePrompt,
        emotions: generatedContent.emotions || scene.emotions,
        actions: generatedContent.actions || scene.actions
      }
    });

    // Record LLM usage with cost
    const usageService = createUsageService(prisma);
    const llmCost = pricingService.calculateLLMCost(
      providerName,
      generatedContent.model || 'default',
      generatedContent.inputTokens || 0,
      generatedContent.outputTokens || 0
    );
    await usageService.recordLLMUsage(req.user.id, {
      provider: providerName,
      model: generatedContent.model || 'default',
      operation: 'generate-scene-content',
      inputTokens: generatedContent.inputTokens,
      outputTokens: generatedContent.outputTokens,
      cost: llmCost,
      metadata: { projectId: req.params.id, sceneId: req.params.sceneId }
    });

    res.json({
      success: true,
      scene: updatedScene,
      provider: providerName
    });
  } catch (error) {
    console.error('Scene content generation error:', error);
    next(error);
  }
});

/**
 * POST /api/generation/projects/:id/generate-all-content
 * Generate content for all scenes in a project
 */
router.post('/projects/:id/generate-all-content', async (req, res, next) => {
  try {
    const prisma = req.app.get('prisma');
    const { llmProvider: overrideProvider } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        projectCharacters: { include: { character: true } },
        scenes: { orderBy: { sequenceNumber: 'asc' } }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes to generate content for' });
    }

    // Get LLM provider
    const providerName = overrideProvider || project.llmProvider || 'anthropic';
    const llmService = getLLMProvider(providerName);

    const results = [];
    let generatedScenes = [];

    // Generate content for each scene sequentially (to maintain context)
    for (const scene of project.scenes) {
      const projectContext = {
        genre: project.genre,
        setting: project.setting,
        plot: project.plot,
        characters: project.projectCharacters.map(pc => ({
          name: pc.character.name,
          description: pc.character.description,
          imageUrl: pc.character.imageUrl
        })),
        totalScenes: project.scenes.length,
        previousScenes: generatedScenes
      };

      const sceneContext = {
        sequenceNumber: scene.sequenceNumber,
        cameraAngle: scene.cameraAngle,
        emotions: scene.emotions,
        actions: scene.actions
      };

      try {
        const generatedContent = await llmService.generateSceneContent(sceneContext, projectContext);

        const updatedScene = await prisma.scene.update({
          where: { id: scene.id },
          data: {
            dialogue: generatedContent.dialogue || scene.dialogue,
            startImagePrompt: generatedContent.startImagePrompt,
            endImagePrompt: generatedContent.endImagePrompt,
            emotions: generatedContent.emotions || scene.emotions,
            actions: generatedContent.actions || scene.actions
          }
        });

        generatedScenes.push({
          dialogue: updatedScene.dialogue,
          actions: updatedScene.actions,
          startImagePrompt: updatedScene.startImagePrompt,
          endImagePrompt: updatedScene.endImagePrompt
        });

        results.push({
          sceneId: scene.id,
          sequenceNumber: scene.sequenceNumber,
          success: true
        });
      } catch (error) {
        console.error(`Failed to generate content for scene ${scene.sequenceNumber}:`, error);
        results.push({
          sceneId: scene.id,
          sequenceNumber: scene.sequenceNumber,
          success: false,
          error: error.message
        });

        // Still add to context for next scene
        generatedScenes.push({
          dialogue: scene.dialogue,
          actions: scene.actions,
          startImagePrompt: scene.startImagePrompt,
          endImagePrompt: scene.endImagePrompt
        });
      }
    }

    // Fetch updated scenes
    const updatedScenes = await prisma.scene.findMany({
      where: { projectId: req.params.id },
      orderBy: { sequenceNumber: 'asc' }
    });

    res.json({
      success: true,
      provider: providerName,
      results,
      scenes: updatedScenes
    });
  } catch (error) {
    console.error('Generate all content error:', error);
    next(error);
  }
});

module.exports = router;
