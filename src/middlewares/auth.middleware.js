/**
 * Middleware de autenticação por API Key.
 * A API só responde quando uma API_KEY estiver configurada e for enviada no header.
 */
const autenticar = (req, res, next) => {
    const apiKey = process.env.API_KEY?.trim();

    if (!apiKey) {
        return res.status(503).json({ erro: 'API_KEY não configurada no servidor.' });
    }

    const chaveEnviada = req.headers['x-api-key'];

    if (chaveEnviada !== apiKey) {
        return res.status(401).json({ erro: 'Não autorizado. Chave de API inválida.' });
    }

    next();
};

module.exports = { autenticar };
