/**
 * Middleware de autenticação por API Key.
 * Configure a variável API_KEY no .env para ativar a proteção.
 * Se API_KEY não estiver definida, a API fica aberta (útil em dev).
 */
const autenticar = (req, res, next) => {
    const apiKey = process.env.API_KEY;

    // Se nenhuma chave foi configurada, libera o acesso (modo dev)
    if (!apiKey) return next();

    const chaveEnviada = req.headers['x-api-key'] || req.query.key;

    if (chaveEnviada !== apiKey) {
        return res.status(401).json({ erro: 'Não autorizado. Chave de API inválida.' });
    }

    next();
};

module.exports = { autenticar };
