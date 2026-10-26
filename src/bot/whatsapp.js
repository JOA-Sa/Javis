require('dotenv').config();
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const service = require('../services/modos.service');
const st = require('../services/smartthings.service');
const dell = require('../services/dell.service');
const sistema = require('../services/sistema.service');
const ia = require('../services/ia.service');
const tts = require('../services/tts.service');
const monitor = require('../services/monitor.service');
const downloader = require('../services/downloader.service');
const tunnel = require('../services/tunnel.service');

// ─────────────────────────────────────────────────
//  CLIENTE WHATSAPP COM AUTO-RECONEXÃO
// ─────────────────────────────────────────────────

const DELAY_RECONEXAO_MS = 5000;
const TIMEOUT_CONEXAO_MS = 60_000;
let client;
let timerReconexao = null;
let timerConexao = null;
const CHROME_PATHS = [
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];
const getChromePath = () => CHROME_PATHS.find(p => p && fs.existsSync(p));

const criarCliente = () => {
    const chromePath = getChromePath();
    const clientAtual = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            ...(chromePath ? { executablePath: chromePath } : {}),
        },
    });
    client = clientAtual;

    clientAtual.on('qr', (qr) => {
        if (clientAtual !== client) return;
        if (timerConexao) clearTimeout(timerConexao);
        timerConexao = null;
        console.log('[📱] Escaneie o QR Code abaixo com seu WhatsApp:');
        qrcode.generate(qr, { small: true });
    });

    clientAtual.on('ready', () => {
        if (clientAtual !== client) return;
        if (timerConexao) clearTimeout(timerConexao);
        if (timerReconexao) clearTimeout(timerReconexao);
        timerConexao = null;
        timerReconexao = null;
        console.log('[📱] Bot Jarvis conectado! Pronto para comandos de texto, áudio e voz.');
        console.log('[📋] Digite !ajuda no WhatsApp para ver os comandos.\n');

        // Inicia o monitoramento proativo de bateria e temperatura do Dell G15
        monitor.iniciarMonitor(clientAtual);

        // Notificação automática do link remoto para o próprio WhatsApp do usuário
        let linkEnviado = false;
        const enviarLinkRemoto = async (url) => {
            if (linkEnviado || !url) return;
            try {
                if (clientAtual && clientAtual.info && clientAtual.info.wid) {
                    linkEnviado = true;
                    const keyParam = process.env.API_KEY ? '?key=' + process.env.API_KEY : '';
                    const linkCompleto = url + keyParam;
                    const meJid = clientAtual.info.wid._serialized;
                    await clientAtual.sendMessage(
                        meJid,
                        '🚀 *Jarvis Online & Acesso Remoto Ativo!*\n\n📱 *Painel no Celular (Galaxy S23):*\n' + linkCompleto + '\n\nAbra o link acima de qualquer lugar do mundo (4G/5G) para acessar a central de comando.'
                    );
                    console.log('[📱] Link de acesso remoto enviado para seu WhatsApp!');
                }
            } catch (err) {
                console.error('[⚠️] Não foi possível enviar o link remoto via WhatsApp:', err.message);
            }
        };

        const urlAtual = tunnel.obterUrl();
        if (urlAtual) {
            enviarLinkRemoto(urlAtual);
        } else {
            tunnel.onTunnelUrl(enviarLinkRemoto);
        }
    });

    clientAtual.on('disconnected', (reason) => {
        if (clientAtual !== client) return;
        console.log(`[⚠️] Bot desconectado: ${reason}`);
        monitor.pararMonitor();
        tentarReconectar(clientAtual);
    });

    clientAtual.on('auth_failure', (msg) => {
        if (clientAtual !== client) return;
        console.error('[❌] Falha de autenticação:', msg);
        tentarReconectar(clientAtual);
    });

    clientAtual.on('message_create', (msg) => {
        if (clientAtual === client) handleMensagem(msg);
    });

    timerConexao = setTimeout(() => {
        if (clientAtual !== client) return;
        console.warn('[⚠️] O cliente WhatsApp não ficou pronto dentro do prazo.');
        tentarReconectar(clientAtual);
    }, TIMEOUT_CONEXAO_MS);

    Promise.resolve()
        .then(() => clientAtual.initialize())
        .catch((error) => {
            if (clientAtual !== client) return;
            console.error('[❌] Falha ao inicializar o cliente WhatsApp:', error.message);
            tentarReconectar(clientAtual);
        });

    return clientAtual;
};

const tentarReconectar = (clientComFalha = client) => {
    if (timerReconexao) return;
    if (timerConexao) clearTimeout(timerConexao);
    timerConexao = null;
    monitor.pararMonitor();
    console.log(`[🔄] Tentando reconectar em ${DELAY_RECONEXAO_MS / 1000}s...`);

    timerReconexao = setTimeout(async () => {
        timerReconexao = null;
        if (clientComFalha !== client) return;

        client = null;
        if (clientComFalha && typeof clientComFalha.destroy === 'function') {
            let timerDestruicao;
            const destruicao = Promise.resolve()
                .then(() => clientComFalha.destroy())
                .then(() => true)
                .catch((error) => {
                    console.warn('[⚠️] Não foi possível encerrar o cliente anterior:', error.message);
                    return true;
                });
            const limiteDestruicao = new Promise((resolve) => {
                timerDestruicao = setTimeout(() => resolve(false), 10_000);
            });
            const destruido = await Promise.race([destruicao, limiteDestruicao]);
            clearTimeout(timerDestruicao);
            if (!destruido) {
                console.warn('[⚠️] O cliente anterior demorou para encerrar; continuando a reconexão.');
            }
        }

        console.log('[🔄] Reinicializando cliente WhatsApp...');
        criarCliente();
    }, DELAY_RECONEXAO_MS);
};

// ─────────────────────────────────────────────────
//  RATE LIMIT — evita spam de comandos
// ─────────────────────────────────────────────────

const ultimoComando = new Map();
const COOLDOWN_MS = 2500;

const emCooldown = (chave) => {
    const ultimo = ultimoComando.get(chave) || 0;
    const agora  = Date.now();
    if (agora - ultimo < COOLDOWN_MS) return true;
    ultimoComando.set(chave, agora);
    return false;
};

// ─────────────────────────────────────────────────
//  MAPAS DE COMANDOS
// ─────────────────────────────────────────────────

const CENAS = {
    '!gaming':    { desc: '🎮 TV no HDMI + G15 performance + Steam',       fn: () => service.modoGaming() },
    '!pirata':    { desc: '🍿 TV no HDMI + navegador em tela cheia',        fn: () => service.modoPirata() },
    '!trabalho':  { desc: '💻 TV desligada + notebook + G15 balanceado',    fn: () => service.modoTrabalho() },
    '!espelho':   { desc: '🖥️ Espelha o notebook na Samsung Crystal 55"',   fn: () => service.modoEspelho() },
    '!noturno':   { desc: '🌙 Volume baixo, G15 silencioso, TV no mínimo',  fn: () => service.modoNoturno() },
    '!silencio':  { desc: '🔇 Mute total (PC + TV)',                        fn: () => service.silencio() },
    '!spotify':   { desc: '🎵 Abre o Spotify no PC',                        fn: () => service.abrirSpotify() },
    '!desligar':  { desc: '💤 Desliga o PC em 30s',                         fn: () => service.desligar(30) },
    '!reiniciar': { desc: '🔄 Reinicia o PC em 30s',                        fn: () => service.reiniciar(30) },
    '!cancelar':  { desc: '🛑 Cancela desligamento agendado',                fn: () => service.cancelarDesligamento() },
};

const TV_CMDS = {
    'ligar':    () => st.ligarTV(),
    'desligar': () => st.desligarTV(),
    'mute':     () => st.muteTV(),
    'unmute':   () => st.unmuteTV(),
    'hdmi1':    () => st.setInputTV('HDMI1'),
    'hdmi2':    () => st.setInputTV('HDMI2'),
    'hdmi3':    () => st.setInputTV('HDMI3'),
    'netflix':  () => st.abrirAppTV('netflix'),
    'youtube':  () => st.abrirAppTV('youtube'),
    'prime':    () => st.abrirAppTV('prime'),
    'disney':   () => st.abrirAppTV('disney'),
    'spotify':  () => st.abrirAppTV('spotify'),
    'cima':     () => st.enviarTeclaTV('cima'),
    'baixo':    () => st.enviarTeclaTV('baixo'),
    'esquerda': () => st.enviarTeclaTV('esquerda'),
    'direita':  () => st.enviarTeclaTV('direita'),
    'ok':       () => st.enviarTeclaTV('ok'),
    'enter':    () => st.enviarTeclaTV('ok'),
    'voltar':   () => st.enviarTeclaTV('voltar'),
    'home':     () => st.enviarTeclaTV('home'),
    'menu':     () => st.enviarTeclaTV('menu'),
};


const MODO_CMDS = {
    'performance': () => dell.modoPerformance(),
    'gaming':      () => dell.modoPerformance(),
    'balanceado':  () => dell.modoBalanceado(),
    'normal':      () => dell.modoBalanceado(),
    'silencioso':  () => dell.modoSilencioso(),
    'quiet':       () => dell.modoSilencioso(),
};

// ─────────────────────────────────────────────────
//  MENSAGEM DE AJUDA
// ─────────────────────────────────────────────────

const mensagemAjuda = () => [
    '*🤖 Jarvis — Central de Comandos Completa:*\n',

    '*🎬 Cenários Rápidos:*',
    ...Object.entries(CENAS).map(([cmd, i]) => `• *${cmd}* — ${i.desc}`),

    '\n*💻 Dell G15 5525 & Windows:*',
    '• *!pc* — CPU, RAM, bateria, GPU NVIDIA',
    '• *!screenshot* — Recebe foto da tela agora',
    '• *!brilho [0-100]* — Ajusta brilho do monitor',
    '• *!bloquear* — Bloqueia o Windows (Win+L)',
    '• *!suspender* — Coloca o notebook em Sleep',
    '• *!limpar* — Limpeza de RAM e lixeira',
    '• *!fechar <app>* — Ex: !fechar chrome',
    '• *!volume [0-100]* — Volume do sistema',
    '• *!modo performance | balanceado | silencioso*',

    '\n*⏯️ Controle de Mídia:*',
    '• *!play* / *!pause* — Play/Pause global',
    '• *!proxima* / *!anterior* — Passar faixa',
    '• *!baixar <link>* — Baixa vídeo ou magnet de torrent',
    '• *!falar <texto>* — Jarvis responde com nota de voz',
    '• *!link* ou *!painel* — Link de acesso remoto no Galaxy S23 (4G/5G)',

    '\n*📺 Samsung Crystal 55" (SmartThings):*',
    '• *!tv ligar / desligar / mute*',
    '• *!tv volume [0-100]*',
    '• *!tv hdmi1 / hdmi2 / hdmi3*',
    '• *!tv netflix / youtube / prime / disney*',

    '\n*🎙️ Interação por Voz:*',
    'Envie áudios de voz ou frases naturais (ex: _"Jarvis, vou jogar"_, _"pausa o filme"_). Ele responderá em texto e áudio!',

    '\n_Envie o comando e aguarde a confirmação!_',
].join('\n');

// ─────────────────────────────────────────────────
//  HELPER DE RESPOSTA ÚNICA E ANTI-LOOP
// ─────────────────────────────────────────────────

const botMsgIds = new Set();

const reagir = async (msg, emoji) => {
    try {
        if (msg && typeof msg.react === 'function') {
            await msg.react(emoji);
        }
    } catch (e) {
        // Reação opcional se a versão do WhatsApp não suportar
    }
};

const responder = async (msg, conteudo, opcoes) => {
    try {
        const resp = await msg.reply(conteudo, undefined, opcoes);
        if (resp && resp.id && resp.id.id) {
            botMsgIds.add(resp.id.id);
            if (botMsgIds.size > 1000) {
                const primeiro = botMsgIds.values().next().value;
                botMsgIds.delete(primeiro);
            }
        }
        await reagir(msg, '✅');
        return resp;
    } catch (err) {
        console.error('[❌] Erro ao enviar resposta:', err.message);
        await reagir(msg, '❌');
    }
};

async function responderComVoz(msg, texto) {
    try {
        const audioPath = await tts.falar(texto);
        if (fs.existsSync(audioPath)) {
            const media = MessageMedia.fromFilePath(audioPath);
            const resp = await msg.reply(media, undefined, { sendAudioAsVoice: true });
            if (resp && resp.id && resp.id.id) botMsgIds.add(resp.id.id);
            fs.unlink(audioPath, () => {});
            await reagir(msg, '🎙️');
        }
    } catch (e) {
        console.warn('[⚠️] Falha ao sintetizar/enviar voz TTS:', e.message);
    }
}

// ─────────────────────────────────────────────────
//  EXECUÇÃO DE INTENÇÕES (IA / NLP)
// ─────────────────────────────────────────────────

async function executarIntencao(intencao, msg, eraAudio = false) {
    if (!intencao || !intencao.comando) return;

    const { comando, parametro, resposta } = intencao;

    // Se for áudio, responde com a nota de voz
    if (eraAudio && resposta) {
        await responderComVoz(msg, resposta);
    }

    // Se for intenção puramente de conversa sem comando no PC
    if (comando === 'conversa') {
        if (!eraAudio && resposta) {
            return responder(msg, `🤖 ${resposta}`);
        }
        return;
    }

    // Executa e responde UMA ÚNICA VEZ com o resultado da ação
    switch (comando) {
        case 'gaming':    return responder(msg, `✅ ${await service.modoGaming()}`);
        case 'pirata':    return responder(msg, `✅ ${await service.modoPirata()}`);
        case 'trabalho':  return responder(msg, `✅ ${await service.modoTrabalho()}`);
        case 'espelho':   return responder(msg, `✅ ${await service.modoEspelho()}`);
        case 'noturno':   return responder(msg, `✅ ${await service.modoNoturno()}`);
        case 'silencio':  return responder(msg, `✅ ${await service.silencio()}`);
        case 'spotify':   return responder(msg, `✅ ${await service.abrirSpotify()}`);
        case 'desligar': {
            if (!Number.isSafeInteger(parametro) || parametro < 0 || parametro > 86400) {
                return responder(msg, '❌ Não consegui validar o tempo para desligar o PC.');
            }
            return responder(msg, `✅ ${await service.desligar(parametro)}`);
        }
        case 'reiniciar': {
            const delay = Number.isSafeInteger(parametro) && parametro >= 0 && parametro <= 86400 ? parametro : 30;
            return responder(msg, `✅ ${await service.reiniciar(delay)}`);
        }
        case 'cancelar': return responder(msg, `✅ ${await service.cancelarDesligamento()}`);
        case 'suspender': return responder(msg, `✅ ${await sistema.suspenderPC()}`);

        case 'bloquear':  return responder(msg, `✅ ${await sistema.bloquearTela()}`);
        case 'limpar':    return responder(msg, `✅ ${await sistema.limparSistema()}`);
        case 'brilho': {
            if (!Number.isInteger(parametro) || parametro < 0 || parametro > 100) {
                return responder(msg, '❌ Não consegui validar o brilho. Informe um valor entre 0 e 100.');
            }
            return responder(msg, `✅ ${await sistema.ajustarBrilho(parametro)}`);
        }
        case 'midia': {
            if (!['playpause', 'play', 'pause', 'next', 'prev', 'stop'].includes(parametro)) {
                return responder(msg, '❌ Não consegui validar o comando de mídia.');
            }
            return responder(msg, `✅ ${await sistema.controlarMidia(parametro)}`);
        }
        case 'pc': {
            const stats = await sistema.pcStats();
            return responder(msg, sistema.formatarStats(stats));
        }
        case 'tempo': {
            const previsao = await sistema.obterPrevisaoTempo('Sao_Paulo');
            return responder(msg, `🌤️ *Previsão do Tempo:* ${previsao}`);
        }
        case 'processos': {
            const procs = await sistema.listarProcessos();
            const linhas = procs.slice(0, 6).map(p => `• *${p.nome}* (PID ${p.pid}) — ${p.ram} MB | CPU: ${p.cpu}%`);
            return responder(msg, `📊 *Top Processos Ativos:*\n${linhas.join('\n')}`);
        }
        case 'briefing': {
            const briefing = await sistema.gerarBriefingMatinal();
            return responder(msg, briefing);
        }
        case 'foco': {
            const status = await sistema.controleFoco('status');
            const nova = status.nao_perturbe ? 'desativar' : 'ativar';
            const res = await sistema.controleFoco(nova);
            return responder(msg, `🔕 ${res}`);
        }
        case 'screenshot': {

            const filePath = await sistema.screenshot();
            if (fs.existsSync(filePath)) {
                const media = MessageMedia.fromFilePath(filePath);
                await responder(msg, media, { caption: '🖥️ Captura de tela' });
                fs.unlink(filePath, () => {});
            }
            return;
        }
        case 'volume': {
            if (!Number.isInteger(parametro) || parametro < 0 || parametro > 100) {
                return responder(msg, '❌ Não consegui validar o volume. Informe um valor entre 0 e 100.');
            }
            return responder(msg, `✅ ${await service.setVolume(parametro)}`);
        }
        case 'tv': {
            const acaoTVValida = typeof parametro === 'string'
                && Object.prototype.hasOwnProperty.call(TV_CMDS, parametro);
            if (!st.isConfigured()) {
                return responder(msg, '❌ SmartThings não configurado.');
            }
            if (acaoTVValida) {
                return responder(msg, `✅ ${await TV_CMDS[parametro]()}`);
            }
            return responder(msg, '❌ Não consegui validar a ação solicitada para a TV.');
        }
    }
}

// ─────────────────────────────────────────────────
//  HANDLER PRINCIPAL DE MENSAGENS
// ─────────────────────────────────────────────────

async function handleMensagem(msg) {
    if (!msg.fromMe) return;

    // 1. Ignora mensagens enviadas pelo próprio bot (anti-loop)
    if (msg.id && botMsgIds.has(msg.id.id)) return;

    // 2. Proteção de assinatura: ignora mensagens que comecem com emojis do bot
    const textoBruto = (msg.body || '').trim();
    if (/^(🤖|✅|❌|⏳|⚠️|🔥|📸|🧹|🎙️|🔊|🕐|• \*!|\*💻 Dell G15)/.test(textoBruto)) {
        return;
    }

    // ── 1. Tratamento de Áudios de Voz (PTT e Mídia) ────────
    if (msg.hasMedia && (msg.type === 'audio' || msg.type === 'ptt')) {
        console.log('[🎙️] Mensagem de áudio recebida');
        try {
            const media = await msg.downloadMedia();
            if (media && media.data) {
                // Se for um áudio encaminhado, o usuário quer saber o que foi dito nele
                if (msg.isForwarded) {
                    reagir(msg, '📝');
                    console.log('[📝] Áudio encaminhado recebido — transcrevendo com IA...');
                    const transcricao = await ia.transcreverESumarizarAudio(media.data, media.mimetype);
                    return responder(msg, transcricao);
                }

                // Áudio de comando para o Jarvis
                const intencao = await ia.interpretarAudio(media.data, media.mimetype);
                await executarIntencao(intencao, msg, true);
            }
        } catch (err) {
            console.error('[❌] Erro ao processar áudio:', err.message);
        }
        return;
    }


    if (!textoBruto) return;

    // Rate limit
    if (emCooldown(textoBruto.toLowerCase().slice(0, 15))) {
        return;
    }

    // ── 2. Mensagens sem prefixo "!" (Linguagem Natural) ──
    if (!textoBruto.startsWith('!')) {
        const textoMin = textoBruto.toLowerCase();
        // Só interpreta se mencionar explicitamente "jarvis" ou comandos diretos de cena
        const mencionaJarvis = textoMin.includes('jarvis') || textoMin.includes('g15');
        const acaoClara = /^(modo|jogar|gaming|pirata|cinema|trabalho|pc|status|print|screenshot|mutar|silencio|bloquear|limpar|desligar)/i.test(textoMin);

        if (!mencionaJarvis && !acaoClara) {
            return; // Deixa notas e conversas comuns do usuário intactas
        }

        try {
            const intencao = await ia.interpretarTexto(textoBruto);
            if (intencao && intencao.comando) {
                console.log(`[🧠] Intenção detectada para "${textoBruto}":`, intencao.comando);
                await executarIntencao(intencao, msg, false);
            }
        } catch (e) {
            console.error('[⚠️] Erro na interpretação natural:', e.message);
        }
        return;
    }

    // ── 3. Comandos com prefixo "!" ─────────────────
    const partes  = textoBruto.split(/\s+/);
    const comando = partes[0].toLowerCase();

    console.log(`[💬] Comando: ${textoBruto}`);

    try {
        // Indicador de digitação e reação de processamento
        reagir(msg, '⏳');
        try {
            const chat = await msg.getChat();
            if (chat) chat.sendStateTyping();
        } catch (_) {}

        // Ajuda e Utilidades
        if (comando === '!link' || comando === '!painel') {
            const url = tunnel.obterUrl();
            if (url) {
                const keyParam = process.env.API_KEY ? '?key=' + process.env.API_KEY : '';
                return responder(msg, '🌐 *Painel Remoto do Jarvis:*\n' + url + keyParam + '\n\nAcesso seguro de qualquer distância (4G/5G).');
            } else {
                return responder(msg, '⚠️ O túnel remoto ainda está iniciando. Tente novamente em alguns segundos.');
            }
        }
        if (comando === '!ajuda') return responder(msg, mensagemAjuda());
        if (comando === '!hora')  return responder(msg, `🕐 ${sistema.hora()}`);

        // Voz do Jarvis sob demanda
        if (comando === '!falar') {
            const falaTexto = partes.slice(1).join(' ');
            if (!falaTexto) return responder(msg, '❌ Uso: *!falar <texto a ser dito>*');
            return responderComVoz(msg, falaTexto);
        }

        // Downloader de Vídeos e Torrents
        if (comando === '!baixar') {
            const link = partes[1];
            if (!link) return responder(msg, '❌ Uso: *!baixar <link do youtube, video ou magnet>*');
            const res = await downloader.baixarMidia(link);
            return responder(msg, `✅ ${res}`);
        }

        // Telemetria e Captura de Tela
        if (comando === '!pc') {
            const stats = await sistema.pcStats();
            return responder(msg, sistema.formatarStats(stats));
        }

        if (comando === '!screenshot') {
            const filePath = await sistema.screenshot();
            if (!fs.existsSync(filePath)) return responder(msg, '❌ Falha ao gerar o screenshot.');
            const media = MessageMedia.fromFilePath(filePath);
            await responder(msg, media, { caption: '🖥️ Print da tela agora' });
            fs.unlink(filePath, () => {});
            return;
        }

        // Bloqueio, Suspensão e Limpeza do PC
        if (comando === '!bloquear') {
            return responder(msg, `✅ ${await sistema.bloquearTela()}`);
        }

        if (comando === '!suspender') {
            return responder(msg, `✅ ${await sistema.suspenderPC()}`);
        }

        if (comando === '!limpar') {
            return responder(msg, `✅ ${await sistema.limparSistema()}`);
        }

        // Brilho do Notebook Dell G15
        if (comando === '!brilho') {
            const nivel = parseInt(partes[1]);
            if (isNaN(nivel) || nivel < 0 || nivel > 100) {
                return responder(msg, '❌ Uso: *!brilho [0-100]*\nEx: !brilho 80');
            }
            return responder(msg, `✅ ${await sistema.ajustarBrilho(nivel)}`);
        }

        // Fechar Aplicativo
        if (comando === '!fechar') {
            const appAlvo = partes[1];
            if (!appAlvo) return responder(msg, '❌ Uso: *!fechar <nome_do_app>*\nEx: !fechar chrome');
            return responder(msg, `✅ ${await sistema.fecharApp(appAlvo)}`);
        }

        // Controles de Mídia
        if (['!play', '!pause', '!playpause'].includes(comando)) {
            const acaoMidia = comando === '!playpause' ? 'playpause' : comando.slice(1);
            return responder(msg, `✅ ${await sistema.controlarMidia(acaoMidia)}`);
        }
        if (['!proxima', '!next'].includes(comando)) {
            return responder(msg, `✅ ${await sistema.controlarMidia('next')}`);
        }
        if (['!anterior', '!prev'].includes(comando)) {
            return responder(msg, `✅ ${await sistema.controlarMidia('prev')}`);
        }

        // Volume do PC
        if (comando === '!volume') {
            const nivel = parseInt(partes[1]);
            if (isNaN(nivel) || nivel < 0 || nivel > 100) {
                return responder(msg, '❌ Uso: *!volume [0-100]*\nEx: !volume 50');
            }
            return responder(msg, `✅ ${await service.setVolume(nivel)}`);
        }

        if (comando === '!mutar') {
            return responder(msg, `✅ ${await service.setVolume(0)}`);
        }

        // Samsung Crystal 55"
        if (comando === '!tv') {
            if (!st.isConfigured()) {
                return responder(msg, '❌ SmartThings não configurado.\nAdicione SMARTTHINGS_TOKEN e SMARTTHINGS_TV_DEVICE_ID no .env');
            }
            const sub = partes[1]?.toLowerCase();
            if (!sub) return responder(msg, '❌ Uso: !tv ligar | desligar | volume 50 | mute | hdmi1 | netflix | youtube | prime');

            if (sub === 'volume') {
                const nivel = parseInt(partes[2]);
                if (isNaN(nivel) || nivel < 0 || nivel > 100) return responder(msg, '❌ Uso: *!tv volume [0-100]*');
                return responder(msg, `✅ ${await st.setVolumeTV(nivel)}`);
            }

            const tvFn = sub && Object.prototype.hasOwnProperty.call(TV_CMDS, sub)
                ? TV_CMDS[sub]
                : null;
            if (!tvFn) return responder(msg, `❌ Subcomando TV desconhecido: "${sub}". Digite *!ajuda*.`);
            return responder(msg, `✅ ${await tvFn()}`);
        }

        // Plano de Energia Dell G15
        if (comando === '!modo') {
            const sub = partes[1]?.toLowerCase();
            const modoFn = sub && Object.prototype.hasOwnProperty.call(MODO_CMDS, sub)
                ? MODO_CMDS[sub]
                : null;
            if (!modoFn) return responder(msg, '❌ Uso: *!modo performance | balanceado | silencioso*');
            return responder(msg, `✅ ${await modoFn()}`);
        }

        // Modos de Cena Principais
        const cena = Object.prototype.hasOwnProperty.call(CENAS, comando) ? CENAS[comando] : null;
        if (!cena) return;

        return responder(msg, `✅ ${await cena.fn()}`);

    } catch (error) {
        console.error('[❌] Erro ao executar comando:', error.message);
        responder(msg, '❌ Falha ao executar o comando. Verifique o terminal do Jarvis.');
    }
}

// ─────────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────────

const iniciarBot = () => criarCliente();

module.exports = { iniciarBot };
