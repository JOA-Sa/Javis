const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Gera um arquivo de áudio MP3 em Português Brasileiro (voz natural)
 * usando endpoint leve de TTS sem necessidade de chaves de API pagas.
 * 
 * @param {string} texto Texto que o Jarvis irá falar
 * @returns {Promise<string>} Caminho do arquivo de áudio gerado
 */
const falar = (texto) => {
    return new Promise((resolve, reject) => {
        // Limpa o texto para fala (remove emojis e asteriscos de formatação do WhatsApp)
        const textoLimpo = texto
            .replace(/[\*\_\~]/g, '')
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
            .trim();

        if (!textoLimpo) return reject(new Error('Texto vazio'));

        const caminhoArquivo = path.join(os.tmpdir(), `jarvis_fala_${Date.now()}.mp3`);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textoLimpo.slice(0, 200))}&tl=pt-BR&client=tw-ob`;

        const file = fs.createWriteStream(caminhoArquivo);

        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Falha ao gerar voz: status ${res.statusCode}`));
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(caminhoArquivo));
            });
        }).on('error', (err) => {
            fs.unlink(caminhoArquivo, () => {});
            reject(err);
        });
    });
};

module.exports = { falar };
