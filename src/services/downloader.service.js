const { execFile } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const { randomBytes } = require('crypto');

const executarArquivo = promisify(execFile);
const pastaDownloads = path.join(os.homedir(), 'Downloads');
const DOMINIOS_VIDEO = [
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
];

const executarPrograma = async (programa, argumentos, opcoes = {}) => {
    const { stdout } = await executarArquivo(programa, argumentos, {
        windowsHide: true,
        maxBuffer: 5 * 1024 * 1024,
        ...opcoes,
    });
    return stdout.trim();
};

const validarUrlWeb = (valor) => {
    let url;
    try {
        url = valor instanceof URL ? valor : new URL(valor);
    } catch {
        throw new Error('URL inválida.');
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Somente links HTTP e HTTPS podem ser baixados.');
    }
    if (url.username || url.password) {
        throw new Error('Links com usuário ou senha embutidos não são aceitos.');
    }

    return url;
};

const ehDominioDeVideo = (hostname) => {
    const host = hostname.toLowerCase().replace(/\.$/, '');
    return DOMINIOS_VIDEO.some((dominio) => host === dominio || host.endsWith(`.${dominio}`));
};

const nomeSeguroDoArquivo = (url) => {
    let nomeOriginal = 'arquivo';
    try {
        nomeOriginal = decodeURIComponent(path.posix.basename(url.pathname)) || 'arquivo';
    } catch {
        nomeOriginal = path.posix.basename(url.pathname) || 'arquivo';
    }

    const nomeSeguro = nomeOriginal
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/^\.+$/, 'arquivo')
        .slice(0, 100) || 'arquivo';

    return `download_${Date.now()}_${randomBytes(16).toString('hex')}_${nomeSeguro}`;
};

const obterRespostaHttp = (url) => new Promise((resolve, reject) => {
    const protocolo = url.protocol === 'https:' ? https : http;
    const requisicao = protocolo.get(url, {
        headers: { 'User-Agent': 'JavisDownloader/1.0' },
    }, resolve);

    requisicao.setTimeout(60_000, () => {
        requisicao.destroy(new Error('Tempo limite excedido ao baixar o arquivo.'));
    });
    requisicao.once('error', reject);
});

const baixarHttp = async (url, destino, redirecionamentos = 0) => {
    if (redirecionamentos > 5) {
        throw new Error('O link excedeu o limite de redirecionamentos.');
    }

    const resposta = await obterRespostaHttp(url);
    const status = resposta.statusCode || 0;

    if (status >= 300 && status < 400 && resposta.headers.location) {
        const destinoRedirecionado = validarUrlWeb(new URL(resposta.headers.location, url));
        resposta.resume();
        return baixarHttp(destinoRedirecionado, destino, redirecionamentos + 1);
    }

    if (status < 200 || status >= 300) {
        resposta.resume();
        throw new Error(`O servidor respondeu com status HTTP ${status}.`);
    }

    const arquivo = fs.createWriteStream(destino, { flags: 'wx' });
    try {
        await new Promise((resolve, reject) => {
            arquivo.once('error', reject);
            resposta.once('error', reject);
            arquivo.once('finish', () => {
                arquivo.close((error) => error ? reject(error) : resolve());
            });
            resposta.pipe(arquivo);
        });
    } catch (error) {
        arquivo.destroy();
        throw error;
    }
};

const abrirLink = async (url) => {
    await executarPrograma('explorer.exe', [url], { timeout: 30_000 });
};

/**
 * Trata o comando de download:
 * 1. Abre links magnet no aplicativo padrão do Windows.
 * 2. Usa yt-dlp para sites de vídeo quando estiver instalado.
 * 3. Baixa links HTTP/HTTPS diretamente para a pasta Downloads.
 */
const baixarMidia = async (valorUrl) => {
    if (typeof valorUrl !== 'string' || !valorUrl.trim()) {
        throw new Error('URL ou link não informado.');
    }

    const textoUrl = valorUrl.trim();

    if (/^magnet:/i.test(textoUrl)) {
        let magnet;
        try {
            magnet = new URL(textoUrl);
        } catch {
            throw new Error('Link magnet inválido.');
        }
        if (magnet.protocol !== 'magnet:') throw new Error('Link magnet inválido.');

        console.log('[🧲] Adicionando link Magnet de Torrent...');
        await abrirLink(magnet.href);
        return 'Link Magnet enviado para o cliente de torrent no PC!';
    }

    const url = validarUrlWeb(textoUrl);

    if (ehDominioDeVideo(url.hostname)) {
        console.log('[📥] Tentando baixar vídeo via yt-dlp...');
        try {
            await executarPrograma('yt-dlp', ['-P', pastaDownloads, url.href], {
                timeout: 15 * 60 * 1000,
            });
            return 'Vídeo baixado com sucesso na pasta Downloads do Dell G15!';
        } catch (error) {
            console.warn('[⚠️] yt-dlp falhou; abrindo o link no navegador:', error.message);
            await abrirLink(url.href);
            return 'Link de mídia aberto no navegador do Dell G15 para reprodução/download.';
        }
    }

    const nomeArquivo = nomeSeguroDoArquivo(url);
    const destino = path.join(pastaDownloads, nomeArquivo);
    await fs.promises.mkdir(pastaDownloads, { recursive: true });

    console.log(`[📥] Baixando arquivo para: ${destino}...`);
    try {
        await baixarHttp(url, destino);
    } catch (error) {
        await fs.promises.unlink(destino).catch(() => {});
        throw new Error(`Falha ao baixar o arquivo: ${error.message}`);
    }

    return `Arquivo baixado na sua pasta Downloads: ${nomeArquivo}`;
};

module.exports = { baixarMidia };
