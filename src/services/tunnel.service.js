const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let processoTunnel = null;
let urlAtual = null;
const ouvintes = [];

const obterCaminhoCloudflared = () => {
    const caminhoLocal = path.join(__dirname, '../../bin/cloudflared.exe');
    if (fs.existsSync(caminhoLocal)) {
        return caminhoLocal;
    }
    return 'cloudflared';
};

/**
 * Inicia o Cloudflare Tunnel para expor o Jarvis com HTTPS seguro
 * @param {number} porta Porta local do Express (padrão 3000)
 * @returns {Promise<string|null>} URL https://...trycloudflare.com
 */
const iniciarTunnel = (porta = 3000) => {
    if (urlAtual && processoTunnel && !processoTunnel.killed) {
        return Promise.resolve(urlAtual);
    }

    return new Promise((resolve) => {
        const bin = obterCaminhoCloudflared();
        console.log('[🌐] Iniciando Cloudflare Tunnel para acesso remoto...');

        try {
            processoTunnel = spawn(bin, ['tunnel', '--url', `http://localhost:${porta}`], {
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        } catch (err) {
            console.error('[❌] Erro ao disparar cloudflared:', err.message);
            return resolve(null);
        }

        let resolvida = false;
        const regexUrl = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

        const processarSaida = (dados) => {
            const texto = dados.toString();
            const match = texto.match(regexUrl);
            if (match && !resolvida) {
                resolvida = true;
                urlAtual = match[0];
                console.log(`[🌐] Acesso Remoto Seguro Ativo: ${urlAtual}`);

                // Gravar para o frontend ou atalhos
                try {
                    const arquivoUrl = path.join(__dirname, '../../public/tunnel_url.txt');
                    fs.writeFileSync(arquivoUrl, urlAtual, 'utf8');
                } catch (e) {
                    console.error('[⚠️] Não foi possível salvar tunnel_url.txt:', e.message);
                }

                ouvintes.forEach((fn) => {
                    try { fn(urlAtual); } catch (_) {}
                });

                resolve(urlAtual);
            }
        };

        processoTunnel.stdout.on('data', processarSaida);
        processoTunnel.stderr.on('data', processarSaida);

        processoTunnel.on('error', (err) => {
            console.error('[❌] Falha no processo do túnel:', err.message);
            if (!resolvida) {
                resolvida = true;
                resolve(null);
            }
        });

        processoTunnel.on('exit', (codigo) => {
            if (codigo !== null && codigo !== 0) {
                console.log(`[🌐] Cloudflare Tunnel finalizado (código ${codigo})`);
            }
            urlAtual = null;
            processoTunnel = null;
        });

        // Timeout seguro de 25s
        setTimeout(() => {
            if (!resolvida) {
                resolvida = true;
                console.warn('[⚠️] O Cloudflare Tunnel iniciou em background, aguardando URL...');
                resolve(null);
            }
        }, 25000);
    });
};

const obterUrl = () => urlAtual;

const pararTunnel = () => {
    if (processoTunnel) {
        try {
            processoTunnel.kill('SIGTERM');
        } catch (_) {}
        processoTunnel = null;
        urlAtual = null;
    }
};

const onTunnelUrl = (fn) => {
    if (typeof fn === 'function') {
        ouvintes.push(fn);
        if (urlAtual) fn(urlAtual);
    }
};

process.on('exit', pararTunnel);

module.exports = {
    iniciarTunnel,
    obterUrl,
    pararTunnel,
    onTunnelUrl,
};
