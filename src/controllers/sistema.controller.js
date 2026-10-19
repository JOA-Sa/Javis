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

const getScreenshot = async (req, res, next) => {
    try {
        const caminhoImg = await sistema.screenshot();
        res.sendFile(caminhoImg, (error) => {
            fs.unlink(caminhoImg, () => {}); // Remove após envio
            if (!error) return;

            console.error('[❌] Erro ao enviar screenshot:', error.message);
            if (res.headersSent) return next(error);
            return res.status(500).json({ erro: 'Falha ao enviar a captura de tela.' });
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

const brilho = async (req, res) => {
    try {
        const nivel = req.params.nivel;
        const resultado = await sistema.ajustarBrilho(nivel);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao ajustar brilho', detalhes: error.message });
    }
};

const suspender = async (req, res) => {
    try {
        const resultado = await sistema.suspenderPC();
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao suspender PC', detalhes: error.message });
    }
};

const streamStats = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const enviar = async () => {
        try {
            const stats = await sistema.pcStats();
            res.write(`data: ${JSON.stringify(stats)}\n\n`);
        } catch (_) {}
    };

    enviar();
    const interval = setInterval(enviar, 3000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
};

const getAudioDispositivos = async (req, res) => {
    try {
        const dispositivos = await sistema.listarDispositivosAudio();
        res.json({ status: 'Sucesso', dispositivos });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao listar dispositivos de áudio', detalhes: error.message });
    }
};

const setAudioDispositivo = async (req, res) => {
    try {
        const nome = req.params.nome;
        const resultado = await sistema.definirDispositivoAudio(nome);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao comutar dispositivo de áudio', detalhes: error.message });
    }
};

const foco = async (req, res) => {
    try {
        const acao = req.params.acao || 'status';
        const resultado = await sistema.controleFoco(acao);
        res.json({ status: 'Sucesso', resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha no controle de foco', detalhes: error.message });
    }
};

const getProcessos = async (req, res) => {
    try {
        const processos = await sistema.listarProcessos();
        res.json({ status: 'Sucesso', processos });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao listar processos', detalhes: error.message });
    }
};

const matarProcesso = async (req, res) => {
    try {
        const pid = req.params.pid;
        const resultado = await sistema.matarProcesso(pid);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao finalizar processo', detalhes: error.message });
    }
};

const getTempo = async (req, res) => {
    try {
        const cidade = req.query.cidade || 'Sao_Paulo';
        const previsao = await sistema.obterPrevisaoTempo(cidade);
        res.json({ status: 'Sucesso', cidade, previsao });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao obter previsão do tempo', detalhes: error.message });
    }
};

const getBriefing = async (req, res) => {
    try {
        const cidade = req.query.cidade || 'Sao_Paulo';
        const briefing = await sistema.gerarBriefingMatinal(cidade);
        res.json({ status: 'Sucesso', briefing });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao gerar briefing matinal', detalhes: error.message });
    }
};

module.exports = {
    getStats,
    getScreenshot,
    bloquear,
    suspender,
    brilho,
    limpar,
    midia,
    fechar,
    streamStats,
    getAudioDispositivos,
    setAudioDispositivo,
    foco,
    getProcessos,
    matarProcesso,
    getTempo,
    getBriefing,
};

