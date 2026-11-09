const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dell = require('./dell.service');
const sistema = require('./sistema.service');

const ARQUIVO_JOGOS = path.join(__dirname, '../../data/jogos.json');

let timerGamer = null;
let jogoAtivo = null;
let clientZap = null;

const JOGOS_PADRAO = {
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

let jogosAtivosLista = { ...JOGOS_PADRAO };

const carregarJogosCustom = () => {
    try {
        if (fs.existsSync(ARQUIVO_JOGOS)) {
            const data = fs.readFileSync(ARQUIVO_JOGOS, 'utf8');
            const custom = JSON.parse(data);
            jogosAtivosLista = { ...JOGOS_PADRAO, ...custom };
        } else {
            jogosAtivosLista = { ...JOGOS_PADRAO };
        }
    } catch (e) {
        console.error('[⚠️] Erro ao carregar jogos customizados:', e.message);
        jogosAtivosLista = { ...JOGOS_PADRAO };
    }
};

const salvarJogosCustom = (novosJogos) => {
    try {
        const dir = path.dirname(ARQUIVO_JOGOS);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(ARQUIVO_JOGOS, JSON.stringify(novosJogos, null, 2), 'utf8');
    } catch (e) {
        console.error('[❌] Erro ao salvar jogos:', e.message);
    }
};

const adicionarJogo = (processo, nome) => {
    if (!processo || !nome) throw new Error('Informe o nome do processo e o título do jogo.');
    const procLimpo = processo.toLowerCase().replace(/\.exe$/, '').trim();
    const nomeLimpo = nome.trim();

    carregarJogosCustom();
    // Salva apenas os customizados
    let custom = {};
    if (fs.existsSync(ARQUIVO_JOGOS)) {
        try { custom = JSON.parse(fs.readFileSync(ARQUIVO_JOGOS, 'utf8')); } catch (_) {}
    }
    custom[procLimpo] = nomeLimpo;
    salvarJogosCustom(custom);
    jogosAtivosLista[procLimpo] = nomeLimpo;

    return `Jogo cadastrado com sucesso: *${nomeLimpo}* (processo: \`${procLimpo}.exe\`)`;
};

const removerJogo = (processo) => {
    const procLimpo = processo.toLowerCase().replace(/\.exe$/, '').trim();
    let custom = {};
    if (fs.existsSync(ARQUIVO_JOGOS)) {
        try { custom = JSON.parse(fs.readFileSync(ARQUIVO_JOGOS, 'utf8')); } catch (_) {}
    }

    if (custom[procLimpo]) {
        const nomeRemovido = custom[procLimpo];
        delete custom[procLimpo];
        salvarJogosCustom(custom);
        delete jogosAtivosLista[procLimpo];
        return `Jogo *${nomeRemovido}* removido da lista customizada!`;
    }

    if (JOGOS_PADRAO[procLimpo]) {
        return `O processo \`${procLimpo}\` faz parte da lista padrão do Jarvis e não pode ser deletado, mas pode ser sobrescrito com !addjogo.`;
    }

    return `Processo \`${procLimpo}\` não encontrado na lista de jogos.`;
};

const listarJogos = () => {
    carregarJogosCustom();
    const linhas = Object.entries(jogosAtivosLista).map(
        ([proc, nome]) => `• *${nome}* — \`${proc}.exe\``
    );
    return `🎮 *Lista de Jogos Reconhecidos (${linhas.length} títulos):*\n\n${linhas.join('\n')}\n\n_Para adicionar mais títulos use:_ *!addjogo <processo> <nome>*`;
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

        for (const [proc, nome] of Object.entries(jogosAtivosLista)) {
            if (processos.includes(proc)) {
                jogoEncontrado = nome;
                break;
            }
        }

        // Cenário 1: Jogo acabou de iniciar
        if (jogoEncontrado && !jogoAtivo) {
            jogoAtivo = jogoEncontrado;
            console.log(`[🎮] Jogo detectado: ${jogoEncontrado}! Ativando Alto Desempenho e liberando RAM...`);

            await dell.modoPerformance().catch(() => {});
            await sistema.limparSistema().catch(() => {});

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

            await dell.modoBalanceado().catch(() => {});

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
    carregarJogosCustom();
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
    adicionarJogo,
    removerJogo,
    listarJogos,
};
