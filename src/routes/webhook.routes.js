const express = require('express');
const router = express.Router();
const service = require('../services/modos.service');
const sistema = require('../services/sistema.service');
const st = require('../services/smartthings.service');

// Evento: Chegando em casa (acionado por geofence / Wi-Fi do S23)
router.all('/cheguei', async (req, res) => {
    try {
        console.log('[📍] Webhook: Usuário chegou em casa!');
        if (st.isConfigured()) {
            await st.ligarTV().catch(() => {});
        }
        await service.abrirSpotify().catch(() => {});
        res.json({ status: 'Sucesso', evento: 'Boas-vindas ativado!' });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

// Evento: Saindo de casa
router.all('/sair', async (req, res) => {
    try {
        console.log('[📍] Webhook: Usuário saiu de casa!');
        if (st.isConfigured()) {
            await st.desligarTV().catch(() => {});
        }
        await sistema.bloquearTela().catch(() => {});
        res.json({ status: 'Sucesso', evento: 'TV desligada e PC bloqueado!' });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

// Evento: Hora de dormir (acionado ao conectar no carregador de madrugada)
router.all('/dormir', async (req, res) => {
    try {
        console.log('[🌙] Webhook: Modo Dormir ativado!');
        const resultado = await service.modoNoturno();
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

// Evento: Acordando / Dia
router.all('/acordar', async (req, res) => {
    try {
        console.log('[☀️] Webhook: Bom dia ativado!');
        const resultado = await service.modoTrabalho();
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

module.exports = router;
