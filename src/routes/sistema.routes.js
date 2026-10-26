const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sistema.controller');
const tunnel = require('../services/tunnel.service');

// Telemetria, Captura de Tela e Streaming SSE em tempo real
router.get('/stats',      ctrl.getStats);
router.get('/stream',     ctrl.streamStats);
router.get('/screenshot', ctrl.getScreenshot);

// Status do Túnel Remoto
router.get('/tunnel',     (req, res) => res.json({ url: tunnel.obterUrl() }));

// Segurança e Manutenção
router.get('/bloquear',   ctrl.bloquear);
router.get('/suspender',  ctrl.suspender);
router.get('/limpar',     ctrl.limpar);
router.get('/brilho/:nivel', ctrl.brilho);

// Controle de Áudio do Windows
router.get('/audio/dispositivos',  ctrl.getAudioDispositivos);
router.get('/audio/definir/:nome', ctrl.setAudioDispositivo);

// Foco / Não Perturbe
router.get('/foco/:acao', ctrl.foco);

// Gerenciador de Processos
router.get('/processos',     ctrl.getProcessos);
router.get('/matar/:pid',    ctrl.matarProcesso);

// Clima e Briefing Matinal
router.get('/tempo',    ctrl.getTempo);
router.get('/briefing', ctrl.getBriefing);

// Controle de Mídia (playpause, play, pause, next, prev)
router.get('/midia/:acao', ctrl.midia);

// Fechar Aplicativo
router.get('/fechar/:app', ctrl.fechar);

module.exports = router;
