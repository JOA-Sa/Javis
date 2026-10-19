const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const st = require('./smartthings.service');
const dell = require('./dell.service');
const sistema = require('./sistema.service');


const executar = (comando) => {
    return new Promise((resolve, reject) => {
        exec(comando, (error, stdout) => {
            if (error) {
                console.error(`[❌] Erro ao executar: ${error.message}`);
                return reject(error);
            }
            resolve(stdout.trim());
        });
    });
};

const abrirChromeKiosk = (valorUrl) => {
    let url;
    try {
        url = new URL(valorUrl);
    } catch {
        throw new Error('PIRATA_URL deve ser um endereço HTTP ou HTTPS válido.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('PIRATA_URL deve ser um endereço HTTP ou HTTPS válido.');
    }

    const candidatosChrome = [
        process.env.CHROME_BIN,
        process.env.PUPPETEER_EXECUTABLE_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    const chromePath = candidatosChrome.find((caminho) => caminho && fs.existsSync(caminho)) || 'chrome.exe';

    return new Promise((resolve, reject) => {
        const processo = spawn(chromePath, ['--kiosk', url.href], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        });
        processo.once('error', reject);
        processo.once('spawn', () => {
            processo.unref();
            resolve();
        });
    });
};

/**
 * Tenta executar uma função e loga warning se falhar.
 * Tarefas "nice-to-have" (ex: SmartThings) não devem travar o fluxo principal.
 */
const tentar = async (fn, descricao) => {
    try { return await fn(); }
    catch (e) { console.warn(`[⚠️] ${descricao}: ${e.message}`); return null; }
};

// Lê configurações do .env com fallbacks sensatos
const HDMI_INPUT     = () => process.env.SMARTTHINGS_TV_HDMI_INPUT || 'HDMI1';
const TV_VOL_GAMING  = () => parseInt(process.env.TV_VOLUME_GAMING  ?? 40);
const TV_VOL_PIRATA  = () => parseInt(process.env.TV_VOLUME_PIRATA  ?? 30);
const TV_VOL_NOTURNO = () => parseInt(process.env.TV_VOLUME_NOTURNO ?? 12);
const PC_VOL_NOTURNO = () => parseInt(process.env.PC_VOLUME_NOTURNO ?? 20);

// ─────────────────────────────────────────────────
//  HELPERS INTERNOS
// ─────────────────────────────────────────────────

const setVolumePC = async (nivel) => {
    const volume = typeof nivel === 'number'
        ? nivel
        : typeof nivel === 'string' && /^\d+$/.test(nivel)
            ? Number(nivel)
            : NaN;
    if (!Number.isInteger(volume) || volume < 0 || volume > 100) {
        throw new Error('Volume deve ser um número inteiro entre 0 e 100.');
    }
    const scriptPath = path.join(__dirname, '../scripts/set_volume.ps1');
    await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Volume ${volume}`);
};

const validarDelay = (delay) => {
    const segundos = typeof delay === 'number'
        ? delay
        : typeof delay === 'string' && /^\d+$/.test(delay)
            ? Number(delay)
            : NaN;

    if (!Number.isSafeInteger(segundos) || segundos < 0 || segundos > 86400) {
        throw new Error('O atraso deve ser um número inteiro entre 0 e 86400 segundos.');
    }
    return segundos;
};

const prepararTV = async (input) => {
    if (!st.isConfigured()) return;
    await Promise.all([
        tentar(() => st.ligarTV(),         'Ligar TV'),
        tentar(() => st.setInputTV(input), 'Input HDMI TV'),
    ]);
};

// ─────────────────────────────────────────────────
//  MODOS DE CENA
// ─────────────────────────────────────────────────

const modoGaming = async () => {
    console.log('[🎮] Acionando Modo Gaming...');

    await prepararTV(HDMI_INPUT());

    // Volume da TV automático (configurável no .env)
    if (st.isConfigured()) {
        await tentar(() => st.setVolumeTV(TV_VOL_GAMING()), 'Volume TV gaming');
    }

    await tentar(() => dell.modoPerformance(), 'Plano Performance');
    await tentar(() => sistema.definirDispositivoAudio('Samsung'), 'Comutar som para TV');
    await tentar(() => sistema.controleFoco('ativar'), 'Ativar Foco (Não Perturbe)');
    await executar('displayswitch.exe /external');
    await executar('start steam://open/bigpicture');

    return `🎮 Gaming Mode ON! TV no HDMI (vol ${TV_VOL_GAMING()}), som na TV, notificações silenciadas, G15 em performance máxima.`;
};

const modoPirata = async () => {
    console.log('[🍿] Acionando Modo Pirata...');
    const url = process.env.PIRATA_URL || 'https://yts.mx';

    await prepararTV(HDMI_INPUT());

    if (st.isConfigured()) {
        await tentar(() => st.setVolumeTV(TV_VOL_PIRATA()), 'Volume TV pirata');
    }

    await tentar(() => dell.modoBalanceado(), 'Plano Balanceado');
    await tentar(() => sistema.definirDispositivoAudio('Samsung'), 'Comutar som para TV');
    await tentar(() => sistema.controleFoco('ativar'), 'Ativar Foco (Não Perturbe)');
    await executar('displayswitch.exe /external');
    await abrirChromeKiosk(url);

    return '🍿 Modo Pirata ON! Prepara a pipoca, som na TV e notificações em silêncio.';
};

const modoTrabalho = async () => {
    console.log('[💻] Acionando Modo Trabalho...');

    if (st.isConfigured()) {
        await tentar(() => st.desligarTV(), 'Desligar TV');
    }

    await tentar(() => dell.modoBalanceado(), 'Plano Balanceado');
    await tentar(() => sistema.definirDispositivoAudio('Realtek'), 'Comutar som para Alto-falantes/Fones');
    await tentar(() => sistema.controleFoco('desativar'), 'Desativar Foco (Notificações normais)');
    await executar('displayswitch.exe /internal');

    return '💻 Modo Trabalho ON! TV desligada, som no notebook, notificações reativadas, foco total.';
};


const modoEspelho = async () => {
    console.log('[🖥️] Acionando Modo Espelho...');

    await prepararTV(HDMI_INPUT());
    await executar('displayswitch.exe /clone');

    return '🖥️ Modo Espelho ON! Tela espelhada na Samsung Crystal 55".';
};

/**
 * Modo Noturno — volume baixo no PC e na TV, G15 silencioso.
 * Ideal pra madrugada sem acordar ninguém.
 */
const modoNoturno = async () => {
    console.log('[🌙] Acionando Modo Noturno...');

    const tarefas = [
        tentar(() => setVolumePC(PC_VOL_NOTURNO()), 'Volume PC noturno'),
        tentar(() => dell.modoSilencioso(), 'Plano Silencioso'),
    ];

    if (st.isConfigured()) {
        tarefas.push(tentar(() => st.setVolumeTV(TV_VOL_NOTURNO()), 'Volume TV noturno'));
    }

    await Promise.all(tarefas);

    return `🌙 Modo Noturno ON! PC em ${PC_VOL_NOTURNO()}%, TV em ${TV_VOL_NOTURNO()}%, G15 silencioso.`;
};

/**
 * Silêncio total — mute no PC e na TV.
 */
const silencio = async () => {
    console.log('[🔇] Acionando Silêncio Total...');

    const tarefas = [
        tentar(() => setVolumePC(0), 'Mute PC'),
    ];

    if (st.isConfigured()) {
        tarefas.push(tentar(() => st.muteTV(), 'Mute TV'));
    }

    await Promise.all(tarefas);

    return '🔇 Silêncio total! PC e TV mutados.';
};

// ─────────────────────────────────────────────────
//  CONTROLES AVULSOS
// ─────────────────────────────────────────────────

const setVolume = async (nivel) => {
    console.log(`[🔊] Ajustando volume do PC para ${nivel}%...`);
    await setVolumePC(nivel);
    return `Volume do PC: ${nivel}%!`;
};

const desligar = async (delay = 30) => {
    const segundos = validarDelay(delay);
    console.log(`[💤] Desligando PC em ${segundos} segundos...`);
    await executar(`shutdown /s /t ${segundos}`);
    return `PC desligando em ${segundos} segundos. Use !cancelar para abortar.`;
};

const reiniciar = async (delay = 30) => {
    const segundos = validarDelay(delay);
    console.log(`[🔄] Reiniciando PC em ${segundos} segundos...`);
    await executar(`shutdown /r /t ${segundos}`);
    return `PC reiniciando em ${segundos} segundos. Use !cancelar para abortar.`;
};

const cancelarDesligamento = async () => {
    console.log('[🛑] Cancelando desligamento agendado...');
    await executar('shutdown /a');
    return 'Desligamento cancelado!';
};

const abrirSpotify = async () => {
    console.log('[🎵] Abrindo Spotify...');
    await executar('start spotify:');
    return 'Abrindo Spotify no PC...';
};

module.exports = {
    modoGaming,
    modoPirata,
    modoTrabalho,
    modoEspelho,
    modoNoturno,
    silencio,
    setVolume,
    desligar,
    reiniciar,
    cancelarDesligamento,
    abrirSpotify,
};
