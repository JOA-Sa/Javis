const dell = require('../services/dell.service');

const MODOS_VALIDOS = ['performance', 'balanceado', 'silencioso'];

const setModo = async (req, res) => {
    const modo = req.params.modo?.toLowerCase();
    if (!MODOS_VALIDOS.includes(modo)) {
        return res.status(400).json({
            erro: `Modo inválido: "${modo}".`,
            disponiveis: MODOS_VALIDOS,
        });
    }
    try {
        let resultado;
        if (modo === 'performance') resultado = await dell.modoPerformance();
        else if (modo === 'balanceado') resultado = await dell.modoBalanceado();
        else resultado = await dell.modoSilencioso();

        res.json({ status: 'Sucesso', acao: resultado });
    } catch (error) {
        console.error(`[❌] Dell erro: ${error.message}`);
        res.status(500).json({ erro: 'Falha ao alterar plano de energia', detalhes: error.message });
    }
};

module.exports = { setModo };
