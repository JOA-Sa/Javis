const { exec } = require('child_process');

const executar = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (error, stdout) => {
        if (error) return reject(error);
        resolve(stdout.trim());
    });
});

/**
 * Planos de energia padrão do Windows.
 * Funcionam no Dell G15 5525 (Windows 10/11) sem softwares adicionais.
 *
 * Dica: para ver os planos disponíveis no seu sistema, rode no terminal:
 *   powercfg /list
 */
const PLANOS = {
    performance: '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', // Alto Desempenho
    balanceado:  '381b4222-f694-41f0-9685-ff5bb260df2e', // Equilibrado
    silencioso:  'a1841308-3541-4fab-bc81-f71556f20b4a', // Economia de energia
};

const NOMES = {
    performance: 'Alto Desempenho 🔥',
    balanceado:  'Equilibrado ⚖️',
    silencioso:  'Economia de Energia 🌿',
};

const setPlanoEnergia = async (modo) => {
    const guid = PLANOS[modo];
    if (!guid) throw new Error(`Modo "${modo}" inválido. Use: performance | balanceado | silencioso`);

    console.log(`[⚡] Ativando plano de energia: ${NOMES[modo]}`);
    await executar(`powercfg /setactive ${guid}`);
    return `Plano de energia ativado: ${NOMES[modo]}`;
};

const modoPerformance = () => setPlanoEnergia('performance');
const modoBalanceado  = () => setPlanoEnergia('balanceado');
const modoSilencioso  = () => setPlanoEnergia('silencioso');

module.exports = {
    modoPerformance,
    modoBalanceado,
    modoSilencioso,
};
