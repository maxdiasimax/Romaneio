const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware.verifyToken, dashboardController.getStats);
router.get('/report/bois-fazenda', authMiddleware.verifyToken, dashboardController.getReportBoisFazenda);
router.get('/report/bois-pasto', authMiddleware.verifyToken, dashboardController.getReportBoisPasto);
router.get('/financial', authMiddleware.verifyToken, dashboardController.getFinancial);
router.get('/weight-stats', authMiddleware.verifyToken, dashboardController.getWeightStats);
router.get('/baixas-stats', authMiddleware.verifyToken, dashboardController.getBaixasStats);

module.exports = router;
