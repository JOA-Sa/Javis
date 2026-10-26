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
 * Captura a tela (todos os monitores ativos) e salva em um arquivo PNG.
 * @returns {string} Caminho do arquivo gerado
 */
const screenshot = async () => {
    const outputPath = path.join(os.tmpdir(), `jarvis_${Date.now()}.png`);
    const scriptPath = path.join(__dirname, '../scripts/screenshot.ps1');
    await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -OutputPath "${outputPath}"`);
    return outputPath;
};

/**
 * Coleta estatísticas do Dell G15 5525:
 * CPU%, RAM, bateria, temperatura GPU (NVIDIA) e plano de energia ativo.
 * @returns {Object} stats
 */
const pcStats = async () => {
    const scriptPath = path.join(__dirname, '../scripts/pc_stats.ps1');
    const jsonStr = await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
    return JSON.parse(jsonStr);
};

/**
 * Formata os stats do PC numa mensagem bonita para o WhatsApp.
 */
const formatarStats = (s) => {
    const linhas = ['*💻 Dell G15 5525 — Status*\n'];

    linhas.push(`⚙️ *CPU:* ${s.cpu_pct}%`);
    linhas.push(`🧠 *RAM:* ${s.ram_usada} / ${s.ram_total} GB (${s.ram_pct}%)`);

    if (s.bateria !== null) {
        const estadoBateria = s.carregando
            ? '🔌 Carregando'
            : s.na_tomada
                ? '🔌 Na tomada'
                : '🔋';
        linhas.push(`🔋 *Bateria:* ${s.bateria}% ${estadoBateria}`);
    }

    if (s.gpu_temp !== null) {
        const emoji = s.gpu_temp > 80 ? '🔴' : s.gpu_temp > 65 ? '🟡' : '🟢';
        linhas.push(`🎮 *GPU NVIDIA:* ${s.gpu_temp}°C ${emoji}`);
    }

    linhas.push(`⚡ *Plano:* ${s.plano}`);

    return linhas.join('\n');
};

/**
 * Retorna a hora atual formatada em pt-BR.
 */
const hora = () => {
    return new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Bloqueia a tela do Windows (Win + L)
 */
const bloquearTela = async () => {
    console.log('[🔒] Bloqueando a tela do Windows...');
    await executar('rundll32.exe user32.dll,LockWorkStation');
    return 'Tela do Windows bloqueada!';
};

/**
 * Controla a reprodução de mídia global do Windows (Play/Pause, Próxima, Anterior)
 */
const controlarMidia = async (acao) => {
    const acoesValidas = ['playpause', 'play', 'pause', 'next', 'prev', 'stop'];
    if (!acoesValidas.includes(acao.toLowerCase())) {
        throw new Error(`Ação de mídia inválida: ${acao}`);
    }
    const scriptPath = path.join(__dirname, '../scripts/media_control.ps1');
    const output = await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Acao "${acao}"`);
    return output || 'Comando de mídia enviado!';
};

/**
 * Finaliza um aplicativo no Windows por nome de processo de forma segura
 */
const fecharApp = async (nomeApp) => {
    if (!nomeApp || typeof nomeApp !== 'string') {
        throw new Error('Nome do aplicativo não informado.');
    }
    // Remove caracteres perigosos
    const limpo = nomeApp.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    const exe = limpo.toLowerCase().endsWith('.exe') ? limpo : `${limpo}.exe`;

    console.log(`[🛑] Fechando aplicativo: ${exe}...`);
    try {
        await executar(`taskkill /F /IM "${exe}"`);
        return `Processo ${exe} finalizado com sucesso!`;
    } catch (err) {
        throw new Error(`Não foi possível finalizar "${exe}". Verifique se o app está aberto.`);
    }
};

/**
 * Executa a limpeza de memória RAM, arquivos temporários e esvazia lixeira
 */
const limparSistema = async () => {
    console.log('[🧹] Executando rotina de limpeza do Dell G15...');
    const scriptPath = path.join(__dirname, '../scripts/limpeza_ram.bat');
    await executar(`cmd.exe /c "${scriptPath}"`);
    return 'Limpeza concluída! Temporários apagados, lixeira esvaziada e cache de memória liberado.';
};

/**
 * Ajusta o brilho da tela do Dell G15 (0 a 100%)
 */
const ajustarBrilho = async (nivel) => {
    const n = Math.max(0, Math.min(100, parseInt(nivel)));
    if (isNaN(n)) throw new Error('Nível de brilho inválido. Informe de 0 a 100.');
    console.log(`[💡] Ajustando brilho da tela para ${n}%...`);
    const scriptPath = path.join(__dirname, '../scripts/set_brightness.ps1');
    await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Nivel ${n}`);
    return `Brilho da tela ajustado para ${n}%!`;
};


/**
 * Coloca o Windows em modo de suspensão rápida (Sleep)
 */
const suspenderPC = async () => {
    console.log('[💤] Colocando o PC em suspensão...');
    await executar('powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)"');
    return 'Dell G15 entrando em modo de suspensão (Sleep)!';
};

/**
 * Lista os dispositivos de saída de áudio ativos no Windows
 */
const listarDispositivosAudio = async () => {
    const scriptPath = path.join(__dirname, '../scripts/audio_control.ps1');
    const jsonStr = await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Acao listar`);
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [parsed];
};

/**
 * Define o dispositivo de saída de áudio padrão por correspondência de nome
 */
const definirDispositivoAudio = async (nome) => {
    const scriptPath = path.join(__dirname, '../scripts/audio_control.ps1');
    const saida = await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Acao definir -Nome "${nome}"`);
    return saida || `Dispositivo de áudio comutado para "${nome}"`;
};

/**
 * Ativa ou desativa o Modo Não Perturbe (Focus Assist) do Windows
 */
const controleFoco = async (acao = 'status') => {
    const scriptPath = path.join(__dirname, '../scripts/focus_assist.ps1');
    const saida = await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Acao "${acao}"`);
    try { return JSON.parse(saida); }
    catch { return saida; }
};

/**
 * Lista os principais processos em execução no Windows consumindo memória
 */
const listarProcessos = async () => {
    const scriptPath = path.join(__dirname, '../scripts/process_manager.ps1');
    const jsonStr = await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Acao listar`);
    return JSON.parse(jsonStr);
};

/**
 * Encerra um processo com segurança através de seu PID
 */
const matarProcesso = async (pid) => {
    const id = parseInt(pid);
    if (isNaN(id) || id <= 4) throw new Error('PID inválido ou processo protegido.');
    const scriptPath = path.join(__dirname, '../scripts/process_manager.ps1');
    return await executar(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -Acao matar -ProcessoId ${id}`);
};

/**
 * Obtém previsão do tempo atual via wttr.in
 */
const obterPrevisaoTempo = (cidade = 'Sao_Paulo') => {
    const https = require('https');
    return new Promise((resolve) => {
        const cidadeFormatada = encodeURIComponent(cidade.trim().replace(/\s+/g, '_'));
        const url = `https://wttr.in/${cidadeFormatada}?format=%C+%t+%w+%h`;
        const req = https.get(url, { headers: { 'User-Agent': 'curl/7.68.0' }, timeout: 6000 }, (res) => {
            let buffer = '';
            res.on('data', c => buffer += c);
            res.on('end', () => {
                if (res.statusCode === 200 && buffer.trim()) {
                    resolve(buffer.trim());
                } else {
                    resolve('Previsão indisponível no momento');
                }
            });
        });
        req.on('error', () => resolve('Previsão indisponível'));
        req.on('timeout', () => { req.destroy(); resolve('Previsão indisponível (timeout)'); });
    });
};

/**
 * Gera um resumo matinal executivo (Briefing do Jarvis)
 */
const gerarBriefingMatinal = async (cidade = 'Sao_Paulo') => {
    const [stats, tempo] = await Promise.all([
        pcStats().catch(() => null),
        obterPrevisaoTempo(cidade).catch(() => 'Indisponível'),
    ]);

    const linhas = ['*☀️ Bom dia, senhor! Jarvis ao seu dispor.*\n'];
    linhas.push(`📅 *Data:* ${hora()}`);
    linhas.push(`🌤️ *Clima (${cidade.replace(/_/g, ' ')}):* ${tempo}\n`);

    if (stats) {
        linhas.push('*💻 Status do Dell G15:*');
        linhas.push(`⚙️ CPU: ${stats.cpu_pct}% | RAM: ${stats.ram_pct}% (${stats.ram_usada}/${stats.ram_total} GB)`);
        if (stats.bateria !== null) {
            linhas.push(`🔋 Bateria: ${stats.bateria}% ${stats.carregando ? '🔌 Carregando' : stats.na_tomada ? '🔌 Na tomada' : '🔋'}`);
        }
        if (stats.gpu_temp !== null) {
            linhas.push(`🎮 GPU RTX: ${stats.gpu_temp}°C`);
        }
        linhas.push(`⚡ Plano: ${stats.plano}`);
    }

    linhas.push('\n_Todos os sistemas operacionais e prontos para o seu comando!_');
    return linhas.join('\n');
};

/**
 * Envia Magic Packet UDP para acordar o Dell G15 via Wake-on-LAN.
 * Requer WOL_MAC_ADDRESS definido no .env.
 */
const acordarPC = () => {
    const mac = process.env.WOL_MAC_ADDRESS;
    if (!mac || !mac.trim()) {
        return Promise.reject(new Error('WOL_MAC_ADDRESS não configurado no .env'));
    }
    const broadcast = process.env.WOL_BROADCAST || '255.255.255.255';
    const scriptPath = path.join(__dirname, '../scripts/wol.ps1');
    const cmd = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -MacAddress "${mac}" -BroadcastAddress "${broadcast}"`;
    return executar(cmd);
};

/**
 * Copia um texto para a Área de Transferência (Clipboard) do Windows.
 */
const definirClipboard = async (texto) => {
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
        throw new Error('Informe o texto para copiar.');
    }
    const limpo = texto.trim();
    const script = `Set-Clipboard -Value @'\n${limpo.replace(/'/g, "''")}\n'@`;
    await executar(`powershell -NoProfile -Command "${script}"`);
    return 'Texto copiado com sucesso para a Área de Transferência do Dell G15!';
};

/**
 * Organiza arquivos soltos na pasta Downloads em subpastas organizadas.
 */
const organizarDownloads = async () => {
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    if (!fs.existsSync(downloadsPath)) {
        throw new Error('Pasta Downloads não encontrada.');
    }

    const categorias = {
        Instaladores: ['.exe', '.msi', '.bat'],
        Documentos: ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.txt', '.csv'],
        Imagens: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.ico'],
        Videos: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm'],
        Compactados: ['.zip', '.rar', '.7z', '.tar', '.gz'],
        Musicas: ['.mp3', '.wav', '.flac', '.m4a', '.ogg'],
    };

    for (const pasta of Object.keys(categorias)) {
        const p = path.join(downloadsPath, pasta);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    }

    const arquivos = fs.readdirSync(downloadsPath, { withFileTypes: true });
    let movidos = 0;

    for (const item of arquivos) {
        if (!item.isFile()) continue;
        const ext = path.extname(item.name).toLowerCase();
        let destinoPasta = null;

        for (const [pasta, extensoes] of Object.entries(categorias)) {
            if (extensoes.includes(ext)) {
                destinoPasta = pasta;
                break;
            }
        }

        if (destinoPasta) {
            const origem = path.join(downloadsPath, item.name);
            const destino = path.join(downloadsPath, destinoPasta, item.name);
            try {
                fs.renameSync(origem, destino);
                movidos++;
            } catch (_) {}
        }
    }

    return `Pasta Downloads organizada! ${movidos} arquivos movidos para as pastas apropriadas.`;
};

module.exports = {
    screenshot,
    pcStats,
    formatarStats,
    hora,
    bloquearTela,
    suspenderPC,
    ajustarBrilho,
    controlarMidia,
    fecharApp,
    limparSistema,
    listarDispositivosAudio,
    definirDispositivoAudio,
    controleFoco,
    listarProcessos,
    matarProcesso,
    obterPrevisaoTempo,
    gerarBriefingMatinal,
    acordarPC,
    definirClipboard,
    organizarDownloads,
};

