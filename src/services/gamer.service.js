const { exec } = require('child_process');
const dell = require('./dell.service');
const sistema = require('./sistema.service');

let timerGamer = null;
let jogoAtivo = null;
let clientZap = null;

const JOGOS_CONHECIDOS = {
    'cs2': 'Counter-Strike 2',
    'csgo': 'Counter-Strike: Global Offensive',
    'valorant': 'Valorant',
    'valorant-win64-shipping': 'Valorant',
    'r5apex': 'Apex Legends',
    'gta5': 'Grand Theft Auto V',
    'cyberpunk2077': 'Cyberpunk 2077',
    'fortniteclient-win64-shipping': 'Fortnite',
    'leagueclient': 'League of Legends',
    'overwatch': 'Overwatch 2',
    'dota2': 'Dota 2',
    'rocketleague': 'Rocket League',
    'eldenring': 'Elden Ring',
    'genshinimpact': 'Genshin Impact',
    'warzone': 'Call of Duty: Warzone',
    'cod': 'Call of Duty',
    'javaw': 'Minecraft',
    'fifa23': 'EA Sports FIFA 23',
    'fc24': 'EA Sports FC 24',
    'fc25': 'EA Sports FC 25',
};

const listarProcessos = () => {
    return new Promise((resolve) => {
        exec('tasklist /FO CSV /NH', { windowsHide: true }, (err, stdout) => {
            if (err || !stdout) return resolve([]);
            const linhas = stdout.split('\r\n');
            const nomes = linhas.map((l) => {
                const match = l.match(/^"([^"]+)"/);
                return match ? match[1].toLowerCase().replace(/\.exe$/, '') : '';
            }).filter(Boolean);
            resolve(nomes);
        });
    });
};

const verificarJogos = async () => {
    try {
        const processos = await listarProcessos();
        let jogoEncontrado = null;

        for (const [proc, nome] of Object.entries(JOGOS_CONHECIDOS)) {
            if (processos.includes(proc)) {
                jogoEncontrado = nome;
                break;
            }
        }

        // Cenário 1: Jogo acabou de iniciar
        if (jogoEncontrado && !jogoAtivo) {
            jogoAtivo = jogoEncontrado;
            console.log(`[🎮] Jogo detectado: ${jogoEncontrado}! Ativando Alto Desempenho e liberando RAM...`);

            await dell.setModo('performance').catch(() => {});
            await sistema.limparMemoria().catch(() => {});

            if (clientZap && clientZap.info && clientZap.info.wid) {
                const meJid = clientZap.info.wid._serialized;
                const msg = `🎮 *Modo Gamer Ativado Automaticamente!*\n\n• *Jogo:* ${jogoEncontrado}\n⚡ *Dell G15:* Plano Alto Desempenho ativado\n🧹 *RAM:* Cache liberado para a GPU RTX\n\n_Boa gameplay, senhor!_`;
                await clientZap.sendMessage(meJid, msg).catch(() => {});
            }
        }
        // Cenário 2: Jogo acabou de fechar
        else if (!jogoEncontrado && jogoAtivo) {
            console.log(`[🎮] ${jogoAtivo} finalizado. Retornando ao modo Balanceado.`);
            const jogoAnterior = jogoAtivo;
            jogoAtivo = null;

            await dell.setModo('balanceado').catch(() => {});

            if (clientZap && clientZap.info && clientZap.info.wid) {
                const meJid = clientZap.info.wid._serialized;
                const msg = `🎮 *Sessão de jogo finalizada (${jogoAnterior}).*\n⚡ Dell G15 retornou ao modo Balanceado.`;
                await clientZap.sendMessage(meJid, msg).catch(() => {});
            }
        }
    } catch (_) {}
};

const iniciarMonitorGamer = (client) => {
    clientZap = client;
    if (timerGamer) clearInterval(timerGamer);
    timerGamer = setInterval(verificarJogos, 20_000); // Verifica a cada 20 segundos
    console.log('[🎮] Monitor de detecção automática de jogos ativado!');
};

const pararMonitorGamer = () => {
    if (timerGamer) {
        clearInterval(timerGamer);
        timerGamer = null;
    }
};

module.exports = {
    iniciarMonitorGamer,
    pararMonitorGamer,
    verificarJogos,
};
