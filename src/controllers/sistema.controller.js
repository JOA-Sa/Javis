const fs = require('fs');
const sistema = require('../services/sistema.service');

const getStats = async (req, res) => {
    try {
        const stats = await sistema.pcStats();
        res.json({ status: 'Sucesso', stats });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao obter status do sistema', detalhes: error.message });
    }
};

const getScreenshot = async (req, res) => {
    try {
        const caminhoImg = await sistema.screenshot();
        res.sendFile(caminhoImg, () => {
            fs.unlink(caminhoImg, () => {}); // Remove após envio
        });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao capturar tela', detalhes: error.message });
    }
};

const bloquear = async (req, res) => {
    try {
        const resultado = await sistema.bloquearTela();
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao bloquear tela', detalhes: error.message });
    }
};

const limpar = async (req, res) => {
    try {
        const resultado = await sistema.limparSistema();
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha na rotina de limpeza', detalhes: error.message });
    }
};

const midia = async (req, res) => {
    try {
        const acao = req.params.acao;
        const resultado = await sistema.controlarMidia(acao);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao enviar comando de mídia', detalhes: error.message });
    }
};

const fechar = async (req, res) => {
    try {
        const app = req.params.app;
        const resultado = await sistema.fecharApp(app);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao fechar aplicativo', detalhes: error.message });
    }
};

module.exports = {
    getStats,
    getScreenshot,
    bloquear,
    limpar,
    midia,
    fechar,
};
