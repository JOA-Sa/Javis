const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sistema.controller');

// Telemetria e Captura de Tela
router.get('/stats',      ctrl.getStats);
router.get('/screenshot', ctrl.getScreenshot);

// Segurança e Manutenção
router.get('/bloquear',   ctrl.bloquear);
router.get('/limpar',     ctrl.limpar);

// Controle de Mídia (playpause, play, pause, next, prev)
router.get('/midia/:acao', ctrl.midia);

// Fechar Aplicativo
router.get('/fechar/:app', ctrl.fechar);

module.exports = router;
