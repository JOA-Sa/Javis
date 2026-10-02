const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/modos.controller');

// Modos de exibição
router.get('/gaming',   ctrl.modoGaming);
router.get('/pirata',   ctrl.modoPirata);
router.get('/trabalho', ctrl.modoTrabalho);
router.get('/espelho',  ctrl.modoEspelho);

// Controle de volume  (ex: /api/volume/75)
router.get('/volume/:nivel', ctrl.setVolume);

// Energia (ex: /api/desligar?delay=60)
router.get('/desligar',              ctrl.desligar);
router.get('/reiniciar',             ctrl.reiniciar);
router.get('/cancelar-desligamento', ctrl.cancelarDesligamento);

// Apps
router.get('/spotify', ctrl.abrirSpotify);

module.exports = router;