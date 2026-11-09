const fs = require('fs');
const path = require('path');

const ARQUIVO_LEMBRETES = path.join(__dirname, '../../data/lembretes.json');

let lembretes = [];
let timerInterval = null;
let clientZap = null;

const carregarLembretes = () => {
    try {
        if (fs.existsSync(ARQUIVO_LEMBRETES)) {
            const data = fs.readFileSync(ARQUIVO_LEMBRETES, 'utf8');
            lembretes = JSON.parse(data);
        } else {
            lembretes = [];
        }
    } catch (e) {
        console.error('[⚠️] Erro ao carregar lembretes:', e.message);
        lembretes = [];
    }
};

const salvarLembretes = () => {
    try {
        const dir = path.dirname(ARQUIVO_LEMBRETES);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(ARQUIVO_LEMBRETES, JSON.stringify(lembretes, null, 2), 'utf8');
    } catch (e) {
        console.error('[❌] Erro ao salvar lembretes:', e.message);
    }
};

/**
 * Cria um novo lembrete agendado.
 * @param {string} texto Mensagem do lembrete
 * @param {number|Date} quando Timestamp em ms ou objeto Date
 * @returns {Object} Lembrete criado
 */
const adicionarLembrete = (texto, quando) => {
    const timestamp = quando instanceof Date ? quando.getTime() : Number(quando);
    if (!timestamp || isNaN(timestamp) || timestamp <= Date.now()) {
        throw new Error('Horário do lembrete deve ser no futuro.');
    }
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
        throw new Error('Informe o texto do lembrete.');
    }

    const novo = {
        id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        texto: texto.trim(),
        timestamp,
        criadoEm: Date.now(),
    };

    lembretes.push(novo);
    // Ordena por horário mais próximo
    lembretes.sort((a, b) => a.timestamp - b.timestamp);
    salvarLembretes();
    return novo;
};

/**
 * Interpreta expressões de tempo simples em português como:
 * - "em 30 minutos", "em 2 horas", "em 10m", "em 45s"
 * - "18:30", "08:15" (hoje ou amanhã se já tiver passado)
 * @param {string} expressao
 * @returns {number|null} Timestamp em ms ou null se não reconhecer
 */
const interpretarTempo = (expressao) => {
    if (!expressao) return null;
    const exp = expressao.toLowerCase().trim();

    // 1. "em X minutos/horas/segundos"
    const matchRelativo = exp.match(/(?:em\s+)?(\d+)\s*(minutos?|mins?|m|horas?|hrs?|h|segundos?|segs?|s)\b/i);
    if (matchRelativo) {
        const qtd = parseInt(matchRelativo[1]);
        const unidade = matchRelativo[2].toLowerCase();
        let ms = 0;
        if (unidade.startsWith('m')) ms = qtd * 60 * 1000;
        else if (unidade.startsWith('h')) ms = qtd * 60 * 60 * 1000;
        else if (unidade.startsWith('s')) ms = qtd * 1000;
        return Date.now() + ms;
    }

    // 2. Horário fixo "HH:MM"
    const matchHora = exp.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (matchHora) {
        const horas = parseInt(matchHora[1]);
        const minutos = parseInt(matchHora[2]);
        const alvo = new Date();
        alvo.setHours(horas, minutos, 0, 0);
        // Se o horário já passou hoje, agenda para amanhã
        if (alvo.getTime() <= Date.now()) {
            alvo.setDate(alvo.getDate() + 1);
        }
        return alvo.getTime();
    }

    return null;
};

/**
 * Remove um lembrete pelo ID ou índice.
 */
const removerLembrete = (idOuIndice) => {
    let removido = null;
    if (typeof idOuIndice === 'number' || /^\d+$/.test(idOuIndice)) {
        const idx = parseInt(idOuIndice) - 1;
        if (idx >= 0 && idx < lembretes.length) {
            removido = lembretes.splice(idx, 1)[0];
        }
    } else {
        const idx = lembretes.findIndex(l => l.id === idOuIndice);
        if (idx !== -1) {
            removido = lembretes.splice(idx, 1)[0];
        }
    }
    if (removido) salvarLembretes();
    return removido;
};

const listarLembretes = () => {
    return lembretes.map((l, i) => {
        const data = new Date(l.timestamp);
        const dataFmt = data.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        const minutosRestantes = Math.max(0, Math.round((l.timestamp - Date.now()) / 60000));
        return `${i + 1}. ⏰ *${dataFmt}* (em ~${minutosRestantes} min): ${l.texto}`;
    });
};

const verificarLembretes = async () => {
    if (!clientZap || !clientZap.info || !clientZap.info.wid) return;

    const agora = Date.now();
    const pendentes = [];
    const ativos = [];

    for (const l of lembretes) {
        if (l.timestamp <= agora) {
            pendentes.push(l);
        } else {
            ativos.push(l);
        }
    }

    if (pendentes.length > 0) {
        lembretes = ativos;
        salvarLembretes();

        const meJid = clientZap.info.wid._serialized;
        for (const p of pendentes) {
            const msg = `🔔 *LEMBRETE DO JARVIS!*\n\n📝 *${p.texto}*\n\n_Agendado anteriormente._`;
            try {
                await clientZap.sendMessage(meJid, msg);
                console.log(`[🔔] Lembrete disparado no WhatsApp: "${p.texto}"`);
            } catch (err) {
                console.error('[❌] Erro ao enviar lembrete:', err.message);
            }
        }
    }
};

const iniciarServicoLembretes = (client) => {
    clientZap = client;
    carregarLembretes();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(verificarLembretes, 15_000); // Checa a cada 15 segundos
    console.log('[⏰] Serviço de Lembretes do Jarvis ativo!');
};

const pararServicoLembretes = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
};

module.exports = {
    adicionarLembrete,
    interpretarTempo,
    listarLembretes,
    removerLembrete,
    iniciarServicoLembretes,
    pararServicoLembretes,
};
