require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { autenticar } = require('./middlewares/auth.middleware');
const rotasModos   = require('./routes/modos.routes');
const rotasTV      = require('./routes/tv.routes');
const rotasDell    = require('./routes/dell.routes');
const rotasSistema = require('./routes/sistema.routes');
const rotasWebhook = require('./routes/webhook.routes');
const { iniciarBot } = require('./bot/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dashboard Web estático para o Galaxy S23 e outros navegadores da rede local
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de autenticação apenas para a API REST
app.use('/api', autenticar);

// Rotas da API
app.use('/api',         rotasModos);   // Modos de cena (gaming, pirata, trabalho...)
app.use('/api/tv',      rotasTV);      // Samsung Crystal 55" via SmartThings
app.use('/api/dell',    rotasDell);    // Dell G15 5525 — planos de energia
app.use('/api/sistema', rotasSistema); // Telemetria, Mídia, Bloqueio, Limpeza
app.use('/api/webhook', rotasWebhook); // Automações do Galaxy S23 (chegar, sair, dormir)

app.listen(PORT, () => {
    console.log(`[🚀] Jarvis Local rodando na porta ${PORT}`);
    console.log(`[📱] Painel Web disponível em: http://localhost:${PORT}`);
    iniciarBot();
});