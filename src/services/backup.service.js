const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const DIRETORIO_RAIZ = path.join(__dirname, '../../');

/**
 * Cria um arquivo ZIP de backup das configurações essenciais do Jarvis:
 * - .env
 * - data/ (lembretes, jogos customizados)
 * - package.json
 * 
 * @returns {Promise<string>} Caminho do arquivo .zip gerado
 */
const criarBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeZip = `jarvis_backup_${timestamp}.zip`;
    const destinoZip = path.join(os.tmpdir(), nomeZip);

    const arquivosParaIncluir = [
        path.join(DIRETORIO_RAIZ, '.env'),
        path.join(DIRETORIO_RAIZ, 'package.json'),
        path.join(DIRETORIO_RAIZ, 'data'),
    ].filter(p => fs.existsSync(p));

    if (arquivosParaIncluir.length === 0) {
        throw new Error('Nenhum arquivo encontrado para backup.');
    }

    // Cria o ZIP usando o comando nativo Compress-Archive do PowerShell
    const caminhosFormatados = arquivosParaIncluir.map(p => `'${p.replace(/\\/g, '/')}'`).join(', ');
    const cmd = `powershell -NoProfile -Command "Compress-Archive -Path ${caminhosFormatados} -DestinationPath '${destinoZip.replace(/\\/g, '/')}' -Force"`;

    await new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err) => {
            if (err) return reject(new Error('Falha ao compactar backup: ' + err.message));
            if (!fs.existsSync(destinoZip)) return reject(new Error('Arquivo ZIP de backup não foi gerado.'));
            resolve();
        });
    });

    return destinoZip;
};

module.exports = { criarBackup };
