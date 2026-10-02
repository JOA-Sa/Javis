const service = require('../services/modos.service');

/**
 * Wrapper genérico para transformar funções do serviço em handlers do Express.
 */
const handler = (serviceFn) => async (req, res) => {
    try {
        const resultado = await serviceFn();
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        console.error(`[❌] Erro: ${error.message}`);
        res.status(500).json({ erro: 'Falha ao executar', detalhes: error.message });
    }
};

const modoGaming    = handler(service.modoGaming);
const modoPirata    = handler(service.modoPirata);
const modoTrabalho  = handler(service.modoTrabalho);
const modoEspelho   = handler(service.modoEspelho);
const abrirSpotify  = handler(service.abrirSpotify);
const cancelarDesligamento = handler(service.cancelarDesligamento);

const setVolume = async (req, res) => {
    const nivel = parseInt(req.params.nivel);
    if (isNaN(nivel) || nivel < 0 || nivel > 100) {
        return res.status(400).json({ erro: 'Volume deve ser um número entre 0 e 100.' });
    }
    try {
        const resultado = await service.setVolume(nivel);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha ao ajustar volume', detalhes: error.message });
    }
};

const desligar = async (req, res) => {
    const delay = parseInt(req.query.delay) || 30;
    try {
        const resultado = await service.desligar(delay);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha', detalhes: error.message });
    }
};

const reiniciar = async (req, res) => {
    const delay = parseInt(req.query.delay) || 30;
    try {
        const resultado = await service.reiniciar(delay);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        res.status(500).json({ erro: 'Falha', detalhes: error.message });
    }
};

module.exports = {
    modoGaming,
    modoPirata,
    modoTrabalho,
    modoEspelho,
    setVolume,
    desligar,
    reiniciar,
    cancelarDesligamento,
    abrirSpotify,
};