/**
 * Script de setup do SmartThings — rode UMA VEZ para descobrir o ID da sua TV Samsung.
 *
 * Como usar:
 *   npm run setup:smartthings
 *
 * Pré-requisito: SMARTTHINGS_TOKEN configurado no .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { listarDispositivos } = require('../services/smartthings.service');

(async () => {
    const token = process.env.SMARTTHINGS_TOKEN;
    if (!token || token.includes('seu-token')) {
        console.error('❌ Configure o SMARTTHINGS_TOKEN no .env antes de rodar este script.');
        console.error('   → Gere um token em: https://account.smartthings.com/tokens');
        process.exit(1);
    }

    console.log('🔍 Listando dispositivos SmartThings...\n');

    try {
        const data = await listarDispositivos();

        if (!data.items || data.items.length === 0) {
            console.log('Nenhum dispositivo encontrado. Verifique se o token tem permissão de leitura.');
            return;
        }

        data.items.forEach((d) => {
            const nome = d.label || d.name || '(sem nome)';
            const tipo = d.deviceTypeName || d.type || '?';
            console.log(`📱 ${nome}`);
            console.log(`   ID:   ${d.deviceId}`);
            console.log(`   Tipo: ${tipo}`);
            console.log('   ─────────────────────────────────');
        });

        console.log('\n✅ Copie o ID da sua Samsung Crystal 55" e coloque em:');
        console.log('   SMARTTHINGS_TV_DEVICE_ID=<id-copiado>  no arquivo .env\n');
    } catch (e) {
        console.error('❌ Erro ao conectar com SmartThings:', e.message);
    }
})();
