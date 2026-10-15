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
};
