const https = require('https');

const GEMINI_API_KEY = () => process.env.GEMINI_API_KEY;
const GEMINI_MODEL = () => process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Memória de curto prazo para manter o contexto das últimas interações
const historicoMemoria = [];
const LIMITE_MEMORIA = 6;

const registrarMemoria = (papel, texto) => {
    historicoMemoria.push({ papel, texto });
    if (historicoMemoria.length > LIMITE_MEMORIA) {
        historicoMemoria.shift();
    }
};

/**
 * Chamada HTTPS nativa para a API do Google Gemini (sem depender de pacotes externos)
 */
const chamarGemini = (corpoRequisicao) => {
    return new Promise((resolve, reject) => {
        const key = GEMINI_API_KEY();
        if (!key) return reject(new Error('GEMINI_API_KEY não configurada'));

        const modelo = GEMINI_MODEL();
        const dataStr = JSON.stringify(corpoRequisicao);
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${modelo}:generateContent?key=${key}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataStr),
            },
        };

        const req = https.request(options, (res) => {
            let buffer = '';
            res.on('data', (chunk) => buffer += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    return reject(new Error(`Gemini API retornou erro ${res.statusCode}: ${buffer}`));
                }
                try {
                    const parsed = JSON.parse(buffer);
                    let texto = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (texto) {
                        // Remove possíveis blocos markdown ```json ... ```
                        texto = texto.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
                    }
                    resolve(texto);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(dataStr);
        req.end();
    });
};

const PROMPT_SISTEMA = `
Você é o Jarvis, assistente pessoal do usuário no PC Dell G15 e TV Samsung Crystal 55".
Seu objetivo é interpretar a mensagem (seja texto ou áudio) e categorizar a intenção em um comando do sistema OU responder dúvidas gerais e conversar de forma educada e prestativa como o Jarvis do Homem de Ferro.

Responda ESTRITAMENTE em formato JSON (sem blocos markdown, apenas o JSON puro):
{
  "comando": "gaming" | "pirata" | "trabalho" | "espelho" | "noturno" | "silencio" | "screenshot" | "pc" | "volume" | "brilho" | "suspender" | "tv" | "midia" | "bloquear" | "limpar" | "desligar" | "spotify" | "conversa",
  "parametro": string ou numero (se houver, ex: 50 para volume ou brilho, "netflix" ou "ligar" ou "desligar" para tv, "playpause" ou "next" para midia),
  "resposta": "Uma resposta concisa com personalidade do Jarvis ao usuário"
}

Se a mensagem for uma pergunta do dia a dia, curiosidade, código ou conversa geral, use comando="conversa" e forneça uma resposta completa e útil.
`;

/**
 * Processa texto com fallback por Regex ou IA
 */
const interpretarTexto = async (texto) => {
    const textoLimpo = texto.toLowerCase().trim();

    // Se tiver Gemini Key configurada, usa o modelo para máxima inteligência
    if (GEMINI_API_KEY()) {
        try {
            const contextoAnterior = historicoMemoria.length > 0 
                ? `\nHistórico recente:\n${historicoMemoria.map(m => `${m.papel}: ${m.texto}`).join('\n')}\n`
                : '';

            const prompt = `${PROMPT_SISTEMA}${contextoAnterior}\nMensagem atual do usuário: "${texto}"`;
            const respostaIA = await chamarGemini({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            });

            const parsed = JSON.parse(respostaIA);
            registrarMemoria('Usuário', texto);
            if (parsed.resposta) registrarMemoria('Jarvis', parsed.resposta);
            return parsed;
        } catch (e) {
            console.warn('[⚠️] Falha na IA Gemini, usando motor local de regras:', e.message);
        }
    }

    // Motor local de interpretação semântica / NLP por palavras-chave
    if (/jogar|game|gaming|steam|jogatina/.test(textoLimpo)) {
        return { comando: 'gaming', resposta: 'Preparando o ambiente para games, senhor.' };
    }
    if (/filme|cinema|pirata|pipoca|assistir/.test(textoLimpo)) {
        return { comando: 'pirata', resposta: 'Iniciando modo cinema na TV.' };
    }
    if (/trabalh|trampo|estud|foco|notebook/.test(textoLimpo)) {
        return { comando: 'trabalho', resposta: 'Configurando modo trabalho no Dell G15.' };
    }
    if (/print|screenshot|tela|captura/.test(textoLimpo)) {
        return { comando: 'screenshot', resposta: 'Capturando a tela agora.' };
    }
    if (/status|temperatura|gpu|cpu|bateria|como t[aá] o pc/.test(textoLimpo)) {
        return { comando: 'pc', resposta: 'Verificando a telemetria do sistema.' };
    }
    if (/dormir|noite|noturno|madrugada/.test(textoLimpo)) {
        return { comando: 'noturno', resposta: 'Ativando modo noturno com ruído e brilho reduzidos.' };
    }
    if (/sil[eê]ncio|mudo|mute|cala a boca/.test(textoLimpo)) {
        return { comando: 'silencio', resposta: 'Mutando todo o áudio.' };
    }
    if (/suspender|sleep|hibernar/.test(textoLimpo)) {
        return { comando: 'suspender', resposta: 'Colocando o Dell G15 em modo de suspensão.' };
    }
    if (/bloquear|travar|trancar/.test(textoLimpo)) {
        return { comando: 'bloquear', resposta: 'Bloqueando o Windows para sua segurança.' };
    }
    if (/limpar|limpeza|otimizar|ram/.test(textoLimpo)) {
        return { comando: 'limpar', resposta: 'Executando otimização de memória.' };
    }
    if (/pausar|pause|despausar|play|tocar/.test(textoLimpo)) {
        return { comando: 'midia', parametro: 'playpause', resposta: 'Alternando reprodução de mídia.' };
    }
    if (/pr[oó]xim[ao]|passar m[uú]sica|avan[cç]ar/.test(textoLimpo)) {
        return { comando: 'midia', parametro: 'next', resposta: 'Avançando faixa.' };
    }
    if (/desligar pc|desliga o pc/.test(textoLimpo)) {
        return { comando: 'desligar', parametro: 30, resposta: 'Agendando desligamento do sistema.' };
    }
    if (/ligar tv|liga a tv/.test(textoLimpo)) {
        return { comando: 'tv', parametro: 'ligar', resposta: 'Ligando a Samsung Crystal.' };
    }
    if (/desligar tv|desliga a tv/.test(textoLimpo)) {
        return { comando: 'tv', parametro: 'desligar', resposta: 'Desligando a TV.' };
    }

    const matchBrilho = textoLimpo.match(/brilho.*?(\d+)/);
    if (matchBrilho) {
        return { comando: 'brilho', parametro: parseInt(matchBrilho[1]), resposta: `Ajustando brilho para ${matchBrilho[1]}%` };
    }

    const matchVol = textoLimpo.match(/volume.*?(\d+)/);
    if (matchVol) {
        return { comando: 'volume', parametro: parseInt(matchVol[1]), resposta: `Ajustando volume para ${matchVol[1]}%` };
    }

    return null;
};

/**
 * Processa áudios (PTT / Voice Notes) do WhatsApp
 */
const interpretarAudio = async (base64Audio, mimetype) => {
    if (!GEMINI_API_KEY()) {
        return {
            comando: 'conversa',
            resposta: '🎙️ Recebi seu áudio! Para que eu possa entender mensagens de voz, adicione sua *GEMINI_API_KEY* no arquivo *.env* (ela é 100% gratuita no Google AI Studio).'
        };
    }

    try {
        const corpo = {
            contents: [
                {
                    parts: [
                        { text: PROMPT_SISTEMA },
                        {
                            inlineData: {
                                mimeType: mimetype || 'audio/ogg; codecs=opus',
                                data: base64Audio
                            }
                        }
                    ]
                }
            ],
            generationConfig: { responseMimeType: "application/json" }
        };

        const respostaJson = await chamarGemini(corpo);
        return JSON.parse(respostaJson);
    } catch (err) {
        console.error('[❌] Erro ao processar áudio com Gemini:', err.message);
        return {
            comando: 'conversa',
            resposta: '❌ Tive dificuldades para processar o áudio com a IA. Tente novamente ou use texto.'
        };
    }
};

module.exports = {
    interpretarTexto,
    interpretarAudio,
};
