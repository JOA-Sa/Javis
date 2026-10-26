const ia = require('./ia.service');
const st = require('./smartthings.service');

// Mapeamento amigável de nomes de streaming
const NOMES_STREAMING = {
    netflix: 'Netflix',
    max: 'Max (antiga HBO Max)',
    hbomax: 'Max (antiga HBO Max)',
    prime: 'Prime Video',
    disney: 'Disney+',
    apple: 'Apple TV+',
    globoplay: 'Globoplay',
    paramount: 'Paramount+',
    youtube: 'YouTube Filmes',
    google: 'Google TV',
};

const obterMeusStreamings = () => {
    const config = process.env.MEUS_STREAMINGS || 'netflix,prime,max,disney';
    return config.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
};

/**
 * Consulta onde assistir um filme ou série no Brasil e, se disponível
 * nas assinaturas do usuário, liga a TV Samsung e abre o aplicativo.
 * 
 * @param {string} consulta Nome do filme ou série
 * @returns {Promise<{ mensagem: string, appAberto: string|null, dados: Object }>}
 */
const processarPedidoAssistir = async (consulta) => {
    if (!consulta || typeof consulta !== 'string' || !consulta.trim()) {
        throw new Error('Informe o nome do filme ou série.');
    }

    const prompt = `Você é um especialista em catálogo de streaming no Brasil.
Analise a solicitação: "${consulta.trim()}".
Identifique o título, tipo e em quais plataformas ele está disponível no Brasil no momento.

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem markdown adicional, com o seguinte formato:
{
  "titulo": "Nome Oficial do Filme ou Série",
  "tipo": "filme" ou "serie",
  "streamings_inclusos": ["netflix", "max", "prime", "disney", "apple", "globoplay", "paramount"],
  "streamings_aluguel": ["apple", "prime", "youtube", "google"],
  "preco_aluguel": "a partir de R$ 9,90" ou null,
  "ano": "ano de lançamento" ou null,
  "sinopse": "uma frase curta sobre a história"
}

Importante:
- No array "streamings_inclusos", liste apenas plataformas onde o título faz parte do catálogo por assinatura fixa no Brasil (sem aluguel avulso).
- Exemplo: "Friends" está no "max". "Stranger Things" está na "netflix". "The Boys" está no "prime". "The Mandalorian" está no "disney".`;

    let info;
    try {
        const respostaIa = await ia.chamarGemini(prompt);
        const limpa = respostaIa.replace(/```json/g, '').replace(/```/g, '').trim();
        info = JSON.parse(limpa);
    } catch (err) {
        console.error('[⚠️] Erro ao consultar catálogo com IA:', err.message);
        // Fallback básico caso o parse falhe
        return {
            mensagem: `🎬 Pesquisei por "${consulta}", mas não consegui obter o catálogo exato no momento. Tente abrir o app diretamente via *!tv netflix* ou *!tv prime*.`,
            appAberto: null,
            dados: null,
        };
    }

    const meusStreamings = obterMeusStreamings();
    const inclusos = Array.isArray(info.streamings_inclusos) ? info.streamings_inclusos.map((s) => s.toLowerCase()) : [];
    const aluguel = Array.isArray(info.streamings_aluguel) ? info.streamings_aluguel.map((s) => s.toLowerCase()) : [];

    // Encontrar qual dos meus streamings tem o título disponível
    const streamingsQuePossuoComTitulo = inclusos.filter((s) => meusStreamings.includes(s));

    let mensagem = '';
    let appAberto = null;

    if (streamingsQuePossuoComTitulo.length > 0) {
        // Usuário tem o streaming onde o título está incluso!
        const appEscolhido = streamingsQuePossuoComTitulo[0];
        const nomeApp = NOMES_STREAMING[appEscolhido] || appEscolhido.toUpperCase();

        mensagem = `🎬 *${info.titulo}* (${(info.tipo || 'conteúdo').toUpperCase()}${info.ano ? ' • ' + info.ano : ''})\n`
            + `✅ *Disponível no ${nomeApp}* (incluso na sua assinatura!)\n`;

        if (info.sinopse) {
            mensagem += `📝 _"${info.sinopse}"_\n\n`;
        }

        // Tenta acionar a Samsung Crystal 55"
        try {
            if (st.isConfigured()) {
                await st.ligarTV().catch(() => {});
                await new Promise((r) => setTimeout(r, 1500));
                await st.abrirAppTV(appEscolhido);
                mensagem += `📺 *Samsung Crystal 55" ligada e app ${nomeApp} aberto!* Pegue o controle e bom filme! 🍿`;
                appAberto = appEscolhido;
            } else {
                mensagem += `💡 O app correspondente é o *${nomeApp}*. (Configure seu SmartThings no .env para abrir a TV automaticamente).`;
            }
        } catch (tvErr) {
            console.warn('[⚠️] Não foi possível abrir o app na TV automaticamente:', tvErr.message);
            mensagem += `📺 Encontrado no *${nomeApp}*! (Tentativa de abrir a TV retornou: ${tvErr.message})`;
        }
    } else if (inclusos.length > 0) {
        // Título está incluso em outros streamings que o usuário NÃO assina
        const plataformas = inclusos.map((s) => NOMES_STREAMING[s] || s).join(', ');
        const assinaturasFormatadas = meusStreamings.map((s) => NOMES_STREAMING[s] || s).join(', ');

        mensagem = `🎬 *${info.titulo}* (${(info.tipo || 'conteúdo').toUpperCase()})\n`
            + `⚠️ *Não disponível nas suas assinaturas ativas* (${assinaturasFormatadas}).\n\n`
            + `📺 Disponível no Brasil pela assinatura do *${plataformas}*.\n`;

        if (aluguel.length > 0) {
            const ondeAlugar = aluguel.map((s) => NOMES_STREAMING[s] || s).join(', ');
            mensagem += `💳 Opção para alugar/comprar avulso: *${ondeAlugar}* (${info.preco_aluguel || 'preço sob consulta'}).\n`;
        }
    } else if (aluguel.length > 0) {
        // Apenas aluguel / compra avulsa
        const ondeAlugar = aluguel.map((s) => NOMES_STREAMING[s] || s).join(', ');
        mensagem = `🎬 *${info.titulo}* (${(info.tipo || 'conteúdo').toUpperCase()})\n`
            + `🟡 Este título não está no catálogo fixo de nenhum streaming por assinatura no Brasil.\n`
            + `💳 Disponível apenas para *aluguel/compra avulsa* em: *${ondeAlugar}* (${info.preco_aluguel || 'preço sob consulta'}).`;
    } else {
        mensagem = `🎬 *${info.titulo}*: Não encontrei disponibilidade oficial em streaming no Brasil no momento. Você pode pesquisar via torrent com *!baixar <link>* ou tentar pelo navegador.`;
    }

    return {
        mensagem,
        appAberto,
        dados: info,
    };
};

module.exports = {
    processarPedidoAssistir,
    obterMeusStreamings,
    NOMES_STREAMING,
};
