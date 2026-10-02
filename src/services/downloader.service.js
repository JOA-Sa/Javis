const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const executar = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout.trim());
    });
});

/**
 * Trata o comando de download:
 * 1. Se for link magnet: abre no qBittorrent / cliente padrão do Windows.
 * 2. Se for link do YouTube / mídia e tiver yt-dlp: baixa na pasta Downloads.
 * 3. Se for link direto de arquivo: baixa via PowerShell.
 */
const baixarMidia = async (url) => {
    if (!url || typeof url !== 'string') {
        throw new Error('URL ou link não informado');
    }

    const pastaDownloads = path.join(os.homedir(), 'Downloads');

    // 1. Link Magnet de Torrent
    if (url.startsWith('magnet:?')) {
        console.log('[🧲] Adicionando link Magnet de Torrent...');
        await executar(`start "" "${url}"`);
        return 'Link Magnet enviado para o cliente de torrent no PC!';
    }

    // 2. Link do YouTube ou mídias de vídeo
    if (/youtube\.com|youtu\.be|instagram\.com|tiktok\.com|twitter\.com|x\.com/.test(url)) {
        console.log('[📥] Tentando baixar vídeo via yt-dlp...');
        try {
            // Tenta usar o yt-dlp se disponível no sistema
            await executar(`yt-dlp -P "${pastaDownloads}" "${url}"`);
            return `Vídeo baixado com sucesso na pasta Downloads do Dell G15!`;
        } catch (e) {
            // Se não tiver yt-dlp instalado, abre o link no navegador para download
            await executar(`start "" "${url}"`);
            return `Link de mídia aberto no navegador do Dell G15 para reprodução/download. (Dica: instale o yt-dlp para download automático silencioso).`;
        }
    }

    // 3. Arquivo direto HTTP / HTTPS
    if (url.startsWith('http://') || url.startsWith('https://')) {
        const nomeArquivo = `download_${Date.now()}_${path.basename(url.split('?')[0]) || 'arquivo'}`;
        const destino = path.join(pastaDownloads, nomeArquivo);

        console.log(`[📥] Baixando arquivo para: ${destino}...`);
        await executar(`powershell -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${destino}'"`);
        return `Arquivo baixado na sua pasta Downloads: ${nomeArquivo}`;
    }

    throw new Error('Formato de link não reconhecido.');
};

module.exports = { baixarMidia };
