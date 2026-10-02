const { exec } = require('child_process');
const path = require('path');
const st = require('./smartthings.service');
const dell = require('./dell.service');

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
    const scriptPath = path.join(__dirname, '../scripts/set_volume.ps1');
    await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Volume ${nivel}`);
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
    await executar('displayswitch.exe /external');
    await executar('start steam://open/bigpicture');

    return `🎮 Gaming Mode ON! TV no HDMI (vol ${TV_VOL_GAMING()}), G15 em performance máxima, Steam na tela grande.`;
};

const modoPirata = async () => {
    console.log('[🍿] Acionando Modo Pirata...');
    const url = process.env.PIRATA_URL || 'https://yts.mx';

    await prepararTV(HDMI_INPUT());

    if (st.isConfigured()) {
        await tentar(() => st.setVolumeTV(TV_VOL_PIRATA()), 'Volume TV pirata');
    }

    await tentar(() => dell.modoBalanceado(), 'Plano Balanceado');
    await executar('displayswitch.exe /external');
    await executar(`start chrome --kiosk "${url}"`);

    return '🍿 Modo Pirata ON! Prepara a pipoca.';
};

const modoTrabalho = async () => {
    console.log('[💻] Acionando Modo Trabalho...');

    if (st.isConfigured()) {
        await tentar(() => st.desligarTV(), 'Desligar TV');
    }

    await tentar(() => dell.modoBalanceado(), 'Plano Balanceado');
    await executar('displayswitch.exe /internal');

    return '💻 Modo Trabalho ON! TV desligada, G15 equilibrado, foco total.';
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
    console.log(`[💤] Desligando PC em ${delay} segundos...`);
    await executar(`shutdown /s /t ${delay}`);
    return `PC desligando em ${delay} segundos. Use !cancelar para abortar.`;
};

const reiniciar = async (delay = 30) => {
    console.log(`[🔄] Reiniciando PC em ${delay} segundos...`);
    await executar(`shutdown /r /t ${delay}`);
    return `PC reiniciando em ${delay} segundos. Use !cancelar para abortar.`;
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
