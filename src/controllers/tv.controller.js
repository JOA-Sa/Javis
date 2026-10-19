const st = require('../services/smartthings.service');

/**
 * Wrapper genérico para handlers Express que chamam o SmartThings service.
 */
const stHandler = (serviceFn) => async (req, res) => {
    if (!st.isConfigured()) {
        return res.status(503).json({
            erro: 'SmartThings não configurado.',
            instrucao: 'Adicione SMARTTHINGS_TOKEN e SMARTTHINGS_TV_DEVICE_ID no .env',
        });
    }
    try {
        const resultado = await serviceFn(req);
        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        console.error(`[❌] SmartThings erro: ${error.message}`);
        res.status(500).json({ erro: 'Falha ao comunicar com SmartThings', detalhes: error.message });
    }
};

const ligarTV    = stHandler(() => st.ligarTV());
const desligarTV = stHandler(() => st.desligarTV());
const muteTV     = stHandler(() => st.muteTV());
const unmuteTV   = stHandler(() => st.unmuteTV());
const statusTV   = stHandler(() => st.statusTV());

const setVolumeTV = stHandler(async (req) => {
    const nivel = parseInt(req.params.nivel);
    if (isNaN(nivel) || nivel < 0 || nivel > 100) {
        throw new Error('Volume deve ser um número entre 0 e 100.');
    }
    return st.setVolumeTV(nivel);
});

const setInputTV = stHandler(async (req) => {
    const input = req.params.input?.toUpperCase();
    if (!input) throw new Error('Informe a entrada: HDMI1, HDMI2, HDMI3.');
    return st.setInputTV(input);
});

const abrirAppTV = stHandler(async (req) => {
    const app = req.params.app?.toLowerCase();
    return st.abrirAppTV(app);
});

const enviarTeclaTV = stHandler(async (req) => {
    const tecla = req.params.tecla?.toLowerCase();
    return st.enviarTeclaTV(tecla);
});

module.exports = {
    ligarTV,
    desligarTV,
    muteTV,
    unmuteTV,
    statusTV,
    setVolumeTV,
    setInputTV,
    abrirAppTV,
    enviarTeclaTV,
};

