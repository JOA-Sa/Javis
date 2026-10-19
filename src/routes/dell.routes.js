const express = require('express');
const router = express.Router();
const dell = require('../controllers/dell.controller');

// Plano de energia do Dell G15 5525
// ex: /api/dell/modo/performance | balanceado | silencioso ou /api/dell/performance
router.get('/modo/:modo', dell.setModo);
router.get('/:modo', dell.setModo);


module.exports = router;
