/**
 * Generation Routes Index
 *
 * Combines all generation-related route modules.
 */

const express = require('express');
const router = express.Router();

const providersRouter = require('./providers');
const contentRouter = require('./content');
const imagesRouter = require('./images');
const voicesRouter = require('./voices');
const audioRouter = require('./audio');
const videoRouter = require('./video');

// Mount provider routes
router.use('/providers', providersRouter);

// Mount voice routes
router.use('/voices', voicesRouter);

// Mount content generation routes (includes project-scoped routes)
router.use('/', contentRouter);

// Mount image generation routes
router.use('/', imagesRouter);

// Mount audio generation routes
router.use('/', audioRouter);

// Mount video generation routes
router.use('/', videoRouter);

// Mount character voice assignment (from voices router)
router.use('/', voicesRouter);

module.exports = router;
