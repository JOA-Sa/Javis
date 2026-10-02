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

// ─────────────────────────────────────────────────
//  CLIENTE WHATSAPP COM AUTO-RECONEXÃO
// ─────────────────────────────────────────────────

let client;
let reconectando = false;
const DELAY_RECONEXAO_MS = 10_000;

const criarCliente = () => {
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    });

    client.on('qr', (qr) => {
        console.log('[📱] Escaneie o QR Code abaixo com seu WhatsApp:');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        reconectando = false;
        console.log('[📱] Bot Jarvis conectado! Pronto para comandos de texto, áudio e voz.');
        console.log('[📋] Digite !ajuda no WhatsApp para ver os comandos.\n');

        // Inicia o monitoramento proativo de bateria e temperatura do Dell G15
        monitor.iniciarMonitor(client);
    });

    client.on('disconnected', (reason) => {
        console.log(`[⚠️] Bot desconectado: ${reason}`);
        monitor.pararMonitor();
        if (!reconectando) tentarReconectar();
    });

    client.on('auth_failure', (msg) => {
        console.error('[❌] Falha de autenticação:', msg);
        if (!reconectando) tentarReconectar();
    });

    client.on('message_create', handleMensagem);

    client.initialize();
    return client;
};

const tentarReconectar = () => {
    if (reconectando) return;
    reconectando = true;
    console.log(`[🔄] Tentando reconectar em ${DELAY_RECONEXAO_MS / 1000}s...`);
    setTimeout(() => {
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
    '• *!bloquear* — Bloqueia o Windows (Win+L)',
    '• *!limpar* — Limpeza de RAM e lixeira',
    '• *!fechar <app>* — Ex: !fechar chrome',
    '• *!volume [0-100]* — Volume do sistema',
    '• *!modo performance | balanceado | silencioso*',

    '\n*⏯️ Controle de Mídia:*',
    '• *!play* / *!pause* — Play/Pause global',
    '• *!proxima* / *!anterior* — Passar faixa',
    '• *!baixar <link>* — Baixa vídeo ou magnet de torrent',
    '• *!falar <texto>* — Jarvis responde com nota de voz',

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
//  HELPER DE RESPOSTA EM ÁUDIO
// ─────────────────────────────────────────────────

async function responderComVoz(msg, texto) {
    try {
        const audioPath = await tts.falar(texto);
        if (fs.existsSync(audioPath)) {
            const media = MessageMedia.fromFilePath(audioPath);
            await msg.reply(media, undefined, { sendAudioAsVoice: true });
            fs.unlink(audioPath, () => {});
        }
    } catch (e) {
        // Falha no áudio não impede o fluxo
    }
}

// ─────────────────────────────────────────────────
//  EXECUÇÃO DE INTENÇÕES (IA / NLP)
// ─────────────────────────────────────────────────

async function executarIntencao(intencao, msg, eraAudio = false) {
    if (!intencao || !intencao.comando) return;

    if (intencao.resposta) {
        await msg.reply(`🤖 ${intencao.resposta}`);
        if (eraAudio) {
            await responderComVoz(msg, intencao.resposta);
        }
    }

    const { comando, parametro } = intencao;

    switch (comando) {
        case 'gaming':    return msg.reply(`✅ ${await service.modoGaming()}`);
        case 'pirata':    return msg.reply(`✅ ${await service.modoPirata()}`);
        case 'trabalho':  return msg.reply(`✅ ${await service.modoTrabalho()}`);
        case 'espelho':   return msg.reply(`✅ ${await service.modoEspelho()}`);
        case 'noturno':   return msg.reply(`✅ ${await service.modoNoturno()}`);
        case 'silencio':  return msg.reply(`✅ ${await service.silencio()}`);
        case 'spotify':   return msg.reply(`✅ ${await service.abrirSpotify()}`);
        case 'desligar':  return msg.reply(`✅ ${await service.desligar(parametro || 30)}`);
        case 'bloquear':  return msg.reply(`✅ ${await sistema.bloquearTela()}`);
        case 'limpar':    return msg.reply(`✅ ${await sistema.limparSistema()}`);
        case 'midia':     return msg.reply(`✅ ${await sistema.controlarMidia(parametro || 'playpause')}`);
        case 'pc': {
            const stats = await sistema.pcStats();
            return msg.reply(sistema.formatarStats(stats));
        }
        case 'screenshot': {
            const filePath = await sistema.screenshot();
            if (fs.existsSync(filePath)) {
                const media = MessageMedia.fromFilePath(filePath);
                await msg.reply(media, undefined, { caption: '🖥️ Captura de tela' });
                fs.unlink(filePath, () => {});
            }
            return;
        }
        case 'volume': {
            if (parametro !== undefined) {
                return msg.reply(`✅ ${await service.setVolume(parametro)}`);
            }
            break;
        }
        case 'tv': {
            if (st.isConfigured() && TV_CMDS[parametro]) {
                return msg.reply(`✅ ${await TV_CMDS[parametro]()}`);
            }
            break;
        }
    }
}

// ─────────────────────────────────────────────────
//  HANDLER PRINCIPAL DE MENSAGENS
// ─────────────────────────────────────────────────

async function handleMensagem(msg) {
    if (!msg.fromMe) return;

    // ── 1. Tratamento de Áudios de Voz (PTT) ────────
    if (msg.hasMedia && (msg.type === 'audio' || msg.type === 'ptt')) {
        console.log('[🎙️] Mensagem de áudio recebida');
        try {
            msg.reply('🎙️ Ouvindo e processando áudio...');
            const media = await msg.downloadMedia();
            if (media && media.data) {
                const intencao = await ia.interpretarAudio(media.data, media.mimetype);
                await executarIntencao(intencao, msg, true);
            }
        } catch (err) {
            console.error('[❌] Erro ao processar áudio:', err.message);
            msg.reply('❌ Não consegui processar a mensagem de voz.');
        }
        return;
    }

    const texto = (msg.body || '').trim();
    if (!texto) return;

    // Rate limit
    if (emCooldown(texto.toLowerCase().slice(0, 15))) {
        return;
    }

    // ── 2. Mensagens sem prefixo "!" (Linguagem Natural) ──
    if (!texto.startsWith('!')) {
        try {
            const intencao = await ia.interpretarTexto(texto);
            if (intencao && intencao.comando && intencao.comando !== 'conversa') {
                console.log(`[🧠] Intenção detectada para "${texto}":`, intencao.comando);
                await executarIntencao(intencao, msg, false);
            }
        } catch (e) {
            console.error('[⚠️] Erro na interpretação natural:', e.message);
        }
        return;
    }

    // ── 3. Comandos com prefixo "!" ─────────────────
    const partes  = texto.split(/\s+/);
    const comando = partes[0].toLowerCase();

    console.log(`[💬] Comando: ${texto}`);

    try {
        // Ajuda e Utilidades
        if (comando === '!ajuda') return msg.reply(mensagemAjuda());
        if (comando === '!hora')  return msg.reply(`🕐 ${sistema.hora()}`);

        // Voz do Jarvis sob demanda
        if (comando === '!falar') {
            const falaTexto = partes.slice(1).join(' ');
            if (!falaTexto) return msg.reply('❌ Uso: *!falar <texto a ser dito>*');
            return responderComVoz(msg, falaTexto);
        }

        // Downloader de Vídeos e Torrents
        if (comando === '!baixar') {
            const link = partes[1];
            if (!link) return msg.reply('❌ Uso: *!baixar <link do youtube, video ou magnet>*');
            msg.reply('⏳ Iniciando processamento do download...');
            const res = await downloader.baixarMidia(link);
            return msg.reply(`✅ ${res}`);
        }

        // Telemetria e Captura de Tela
        if (comando === '!pc') {
            msg.reply('⏳ Coletando stats do G15...');
            const stats = await sistema.pcStats();
            return msg.reply(sistema.formatarStats(stats));
        }

        if (comando === '!screenshot') {
            msg.reply('📸 Tirando print...');
            const filePath = await sistema.screenshot();
            if (!fs.existsSync(filePath)) return msg.reply('❌ Falha ao gerar o screenshot.');
            const media = MessageMedia.fromFilePath(filePath);
            await msg.reply(media, undefined, { caption: '🖥️ Print da tela agora' });
            fs.unlink(filePath, () => {});
            return;
        }

        // Bloqueio e Limpeza do PC
        if (comando === '!bloquear') {
            return msg.reply(`✅ ${await sistema.bloquearTela()}`);
        }

        if (comando === '!limpar') {
            msg.reply('🧹 Executando limpeza de RAM e arquivos temporários...');
            return msg.reply(`✅ ${await sistema.limparSistema()}`);
        }

        // Fechar Aplicativo
        if (comando === '!fechar') {
            const appAlvo = partes[1];
            if (!appAlvo) return msg.reply('❌ Uso: *!fechar <nome_do_app>*\nEx: !fechar chrome');
            return msg.reply(`✅ ${await sistema.fecharApp(appAlvo)}`);
        }

        // Controles de Mídia
        if (['!play', '!pause', '!playpause'].includes(comando)) {
            return msg.reply(`✅ ${await sistema.controlarMidia('playpause')}`);
        }
        if (['!proxima', '!next'].includes(comando)) {
            return msg.reply(`✅ ${await sistema.controlarMidia('next')}`);
        }
        if (['!anterior', '!prev'].includes(comando)) {
            return msg.reply(`✅ ${await sistema.controlarMidia('prev')}`);
        }

        // Volume do PC
        if (comando === '!volume') {
            const nivel = parseInt(partes[1]);
            if (isNaN(nivel) || nivel < 0 || nivel > 100) {
                return msg.reply('❌ Uso: *!volume [0-100]*\nEx: !volume 50');
            }
            msg.reply(`🔊 Ajustando volume para ${nivel}%...`);
            return msg.reply(`✅ ${await service.setVolume(nivel)}`);
        }

        // Samsung Crystal 55"
        if (comando === '!tv') {
            if (!st.isConfigured()) {
                return msg.reply('❌ SmartThings não configurado.\nAdicione SMARTTHINGS_TOKEN e SMARTTHINGS_TV_DEVICE_ID no .env');
            }
            const sub = partes[1]?.toLowerCase();
            if (!sub) return msg.reply('❌ Uso: !tv ligar | desligar | volume 50 | mute | hdmi1 | netflix | youtube | prime');

            if (sub === 'volume') {
                const nivel = parseInt(partes[2]);
                if (isNaN(nivel) || nivel < 0 || nivel > 100) return msg.reply('❌ Uso: *!tv volume [0-100]*');
                return msg.reply(`✅ ${await st.setVolumeTV(nivel)}`);
            }

            const tvFn = TV_CMDS[sub];
            if (!tvFn) return msg.reply(`❌ Subcomando TV desconhecido: "${sub}". Digite *!ajuda*.`);
            return msg.reply(`✅ ${await tvFn()}`);
        }

        // Plano de Energia Dell G15
        if (comando === '!modo') {
            const sub = partes[1]?.toLowerCase();
            const modoFn = sub ? MODO_CMDS[sub] : null;
            if (!modoFn) return msg.reply('❌ Uso: *!modo performance | balanceado | silencioso*');
            return msg.reply(`✅ ${await modoFn()}`);
        }

        // Modos de Cena Principais
        const cena = CENAS[comando];
        if (!cena) return;

        msg.reply(`⏳ Executando *${comando}*...`);
        return msg.reply(`✅ ${await cena.fn()}`);

    } catch (error) {
        console.error('[❌] Erro ao executar comando:', error.message);
        msg.reply('❌ Falha ao executar o comando. Verifique o terminal do Jarvis.');
    }
}

// ─────────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────────

const iniciarBot = () => criarCliente();

module.exports = { iniciarBot };