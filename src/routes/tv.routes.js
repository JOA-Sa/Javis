const express = require('express');
const router = express.Router();
const tv = require('../controllers/tv.controller');

// Status
router.get('/status',          tv.statusTV);

// Ligar / desligar
router.get('/ligar',           tv.ligarTV);
router.get('/desligar',        tv.desligarTV);

// Volume e mute
router.get('/volume/:nivel',   tv.setVolumeTV);
router.get('/mute',            tv.muteTV);
router.get('/unmute',          tv.unmuteTV);

// Entradas HDMI  (ex: /api/tv/input/HDMI1)
router.get('/input/:input',    tv.setInputTV);

// Apps de streaming  (ex: /api/tv/app/netflix)
router.get('/app/:app',        tv.abrirAppTV);

// Teclas remotas virtuais (cima, baixo, esquerda, direita, ok, voltar, home)
router.get('/tecla/:tecla',    tv.enviarTeclaTV);


module.exports = router;
