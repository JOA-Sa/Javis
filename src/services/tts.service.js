const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

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
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textoLimpo.slice(0, 500))}&tl=pt-BR&client=tw-ob`;

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

/**
 * Fala o texto diretamente nos alto-falantes físicos do Dell G15.
 * Se houver conexão de internet, utiliza o MP3 neural reproduzido via PowerShell / Media.SoundPlayer.
 * Se falhar ou estiver offline, faz fallback para a SAPI nativa do Windows (System.Speech).
 * 
 * @param {string} texto Frase a ser dita no computador
 * @returns {Promise<string>} Confirmação de áudio reproduzido
 */
const falarNoPC = async (texto) => {
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
        throw new Error('Informe o texto para o Jarvis falar.');
    }
    const textoLimpo = texto.trim();

    try {
        const audioPath = await falar(textoLimpo);
        // Toca o MP3 gerado nos alto-falantes do Windows via MediaPlayer do WPF/PowerShell
        const psCmd = `Add-Type -AssemblyName presentationCore; $player = New-Object System.Windows.Media.MediaPlayer; $player.Open([System.Uri]'${audioPath.replace(/\\/g, '/')}'); $player.Play(); Start-Sleep -Seconds 4; $player.Close()`;
        
        await new Promise((resolve) => {
            exec(`powershell -NoProfile -Command "${psCmd}"`, { windowsHide: true }, () => {
                fs.unlink(audioPath, () => {});
                resolve();
            });
        });
        return `Voz reproduzida nos alto-falantes do Dell G15: "${textoLimpo}"`;
    } catch (e) {
        // Fallback para a voz do Windows SAPI nativa (offline)
        const textoEscapado = textoLimpo.replace(/"/g, '`"').replace(/'/g, "''");
        const sapiCmd = `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak('${textoEscapado}')`;
        await new Promise((resolve) => {
            exec(`powershell -NoProfile -Command "${sapiCmd}"`, { windowsHide: true }, () => resolve());
        });
        return `Voz nativa do Windows reproduzida no Dell G15: "${textoLimpo}"`;
    }
};

module.exports = { falar, falarNoPC };
