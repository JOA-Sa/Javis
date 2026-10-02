const sistema = require('./sistema.service');

let timerMonitor = null;
let ultimoAlertaBateria = 0;
let ultimoAlertaGPU = 0;

const COOLDOWN_BATERIA_MS = 30 * 60 * 1000; // 30 minutos
const COOLDOWN_GPU_MS     = 15 * 60 * 1000; // 15 minutos

/**
 * Inicia o monitoramento proativo em segundo plano do Dell G15.
 * @param {Object} client Instância ativa do cliente do WhatsApp
 */
const iniciarMonitor = (client) => {
    if (timerMonitor) clearInterval(timerMonitor);

    console.log('[🛡️] Monitor proativo do Dell G15 ativado (Bateria & GPU)');

    timerMonitor = setInterval(async () => {
        try {
            // Só tenta enviar mensagem se o bot estiver pronto
            if (!client || !client.info || !client.info.wid) return;

            const stats = await sistema.pcStats();
            const agora = Date.now();
            const meJid = client.info.wid._serialized;

            // 1. Alerta de Bateria Crítica (< 20% fora da tomada)
            if (stats.bateria !== null && !stats.carregando && stats.bateria <= 20) {
                if (agora - ultimoAlertaBateria > COOLDOWN_BATERIA_MS) {
                    ultimoAlertaBateria = agora;
                    const msg = `⚠️ *Aviso do Jarvis:* A bateria do seu Dell G15 atingiu *${stats.bateria}%* e o carregador está desconectado. Conecte-o à tomada para evitar desligamento.`;
                    console.log('[⚠️] Disparando alerta de bateria baixa via WhatsApp');
                    await client.sendMessage(meJid, msg);
                }
            }

            // 2. Alerta de Superaquecimento da GPU NVIDIA RTX (>= 85°C)
            if (stats.gpu_temp !== null && stats.gpu_temp >= 85) {
                if (agora - ultimoAlertaGPU > COOLDOWN_GPU_MS) {
                    ultimoAlertaGPU = agora;
                    const msg = `🔥 *Alerta Térmico do Jarvis:* A GPU NVIDIA do seu Dell G15 atingiu *${stats.gpu_temp}°C*. Recomendo verificar a ventilação ou elevar a base do notebook.`;
                    console.log('[🔥] Disparando alerta térmico de GPU via WhatsApp');
                    await client.sendMessage(meJid, msg);
                }
            }
        } catch (err) {
            // Falha silenciosa no ciclo de telemetria
        }
    }, 120_000); // Executa a cada 2 minutos
};

const pararMonitor = () => {
    if (timerMonitor) {
        clearInterval(timerMonitor);
        timerMonitor = null;
    }
};

module.exports = {
    iniciarMonitor,
    pararMonitor,
};
