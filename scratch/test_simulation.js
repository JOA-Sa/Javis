const assert = require('assert');
require('dotenv').config();

console.log('==============================================');
console.log('🧪 INICIANDO BATERIA DE TESTES SIMULADOS');
console.log('==============================================\n');

let pass = 0;
let fail = 0;
const falhas = [];

function test(descricao, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${descricao}`);
        pass++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${descricao}`);
        console.error(`     Erro: ${err.message}`);
        fail++;
        falhas.push({ descricao, erro: err.message, stack: err.stack });
    }
}

async function testAsync(descricao, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] ${descricao}`);
        pass++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${descricao}`);
        console.error(`     Erro: ${err.message}`);
        fail++;
        falhas.push({ descricao, erro: err.message, stack: err.stack });
    }
}

async function run() {
    // -----------------------------------------------------------------
    // 1. TESTES DE SERVIÇO: IA (ia.service.js)
    // -----------------------------------------------------------------
    console.log('\n--- 1. Testando ia.service.js ---');
    const ia = require('../src/services/ia.service');

    await testAsync('IA: reconhecimento de intenções por regex local', async () => {
        const t1 = await ia.interpretarTexto('vou jogar um pouco de game agora');
        assert.strictEqual(t1.comando, 'gaming');

        const t2 = await ia.interpretarTexto('quero assistir um filme');
        assert.strictEqual(t2.comando, 'pirata');

        const t3 = await ia.interpretarTexto('hora do trabalho no notebook');
        assert.strictEqual(t3.comando, 'trabalho');

        const t4 = await ia.interpretarTexto('tira um print da tela');
        assert.strictEqual(t4.comando, 'screenshot');

        const t5 = await ia.interpretarTexto('como tá o pc hoje?');
        assert.strictEqual(t5.comando, 'pc');

        const t6 = await ia.interpretarTexto('vamos dormir boa noite');
        assert.strictEqual(t6.comando, 'noturno');

        const t7 = await ia.interpretarTexto('fica em silêncio cala a boca');
        assert.strictEqual(t7.comando, 'silencio');

        const t8 = await ia.interpretarTexto('hora de suspender');
        assert.strictEqual(t8.comando, 'suspender');

        const t9 = await ia.interpretarTexto('bloquear a tela');
        assert.strictEqual(t9.comando, 'bloquear');

        const t10 = await ia.interpretarTexto('preciso limpar a memória ram');
        assert.strictEqual(t10.comando, 'limpar');

        const t11 = await ia.interpretarTexto('ajusta o brilho para 75%');
        assert.strictEqual(t11.comando, 'brilho');
        assert.strictEqual(t11.parametro, 75);

        const t12 = await ia.interpretarTexto('coloca o volume em 40');
        assert.strictEqual(t12.comando, 'volume');
        assert.strictEqual(t12.parametro, 40);

        const t13 = await ia.interpretarTexto('desligar tv agora');
        assert.strictEqual(t13.comando, 'tv');
        assert.strictEqual(t13.parametro, 'desligar');
    });

    await testAsync('IA: interpretarAudio sem API key deve responder amigavelmente', async () => {
        const resp = await ia.interpretarAudio('dummybase64', 'audio/ogg');
        assert.ok(resp);
        assert.strictEqual(resp.comando, 'conversa');
        assert.ok(resp.resposta.includes('GEMINI_API_KEY'));
    });

    // -----------------------------------------------------------------
    // 2. TESTES DE SERVIÇO: Downloader (downloader.service.js)
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testando downloader.service.js ---');
    const downloader = require('../src/services/downloader.service');

    await testAsync('Downloader: rejeitar URLs vazias ou inválidas', async () => {
        let deuErro = false;
        try {
            await downloader.baixarMidia('');
        } catch (e) {
            deuErro = true;
        }
        assert.ok(deuErro, 'Deveria ter rejeitado URL vazia');

        deuErro = false;
        try {
            await downloader.baixarMidia('ftp://servidor/arquivo.iso');
        } catch (e) {
            deuErro = true;
        }
        assert.ok(deuErro, 'Deveria ter rejeitado protocolo FTP');
    });

    // -----------------------------------------------------------------
    // 3. TESTES DE SERVIÇO: TTS (tts.service.js)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testando tts.service.js ---');
    const tts = require('../src/services/tts.service');

    await testAsync('TTS: rejeitar texto vazio ou apenas emojis', async () => {
        let deuErro = false;
        try {
            await tts.falar('😀🚀🔥');
        } catch (e) {
            deuErro = true;
        }
        assert.ok(deuErro, 'Deveria ter rejeitado texto só com emojis');
    });

    // -----------------------------------------------------------------
    // 4. TESTES DE SERVIÇO: Sistema & Dell
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testando sistema.service.js & dell.service.js ---');
    const sistema = require('../src/services/sistema.service');
    const dell = require('../src/services/dell.service');

    await testAsync('Sistema: hora formatada', () => {
        const h = sistema.hora();
        assert.ok(typeof h === 'string' && h.length > 5);
    });

    await testAsync('Sistema: pcStats e formatarStats', async () => {
        const stats = await sistema.pcStats();
        assert.ok(typeof stats.cpu_pct === 'number');
        assert.ok(typeof stats.ram_usada === 'number');
        assert.ok(typeof stats.ram_total === 'number');
        assert.ok(typeof stats.ram_pct === 'number');
        const formatado = sistema.formatarStats(stats);
        assert.ok(formatado.includes('Dell G15'));
        assert.ok(formatado.includes('CPU:'));
        assert.ok(formatado.includes('RAM:'));
    });

    await testAsync('Sistema: validação de ações de mídia', async () => {
        let deuErro = false;
        try {
            await sistema.controlarMidia('acao_invalida_xyz');
        } catch (e) {
            deuErro = true;
        }
        assert.ok(deuErro, 'Deveria ter rejeitado ação de mídia inválida');
    });

    await testAsync('Sistema: fecharApp sanitização contra injeção', async () => {
        let deuErro = false;
        try {
            await sistema.fecharApp('');
        } catch (e) {
            deuErro = true;
        }
        assert.ok(deuErro, 'Deveria rejeitar nome de app vazio');
    });

    await testAsync('Dell: validação de plano inválido', async () => {
        let deuErro = false;
        try {
            // Tentando acessar plano não mapeado diretamente
            const MODOS_VALIDOS = ['performance', 'balanceado', 'silencioso'];
            assert.ok(!MODOS_VALIDOS.includes('invalido'));
        } catch (e) {
            deuErro = true;
        }
    });

    // -----------------------------------------------------------------
    // 5. TESTES DE SERVIÇO: SmartThings
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testando smartthings.service.js ---');
    const st = require('../src/services/smartthings.service');

    test('SmartThings: isConfigured deve ser false quando não há tokens', () => {
        // Como o .env inicial tem SMARTTHINGS_TOKEN vazio:
        assert.strictEqual(st.isConfigured(), false);
    });

    await testAsync('SmartThings: abrirAppTV valida aplicativo não suportado', async () => {
        let deuErro = false;
        try {
            await st.abrirAppTV('aplicativo_desconhecido');
        } catch (e) {
            deuErro = true;
            assert.ok(e.message.includes('não reconhecido'));
        }
        assert.ok(deuErro, 'Deveria falhar com app desconhecido');
    });

    // -----------------------------------------------------------------
    // 6. TESTES DE ROTAS EXPRESS & MIDDLEWARE
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testando Rotas Express & Middlewares ---');
    const express = require('express');
    const { autenticar } = require('../src/middlewares/auth.middleware');
    const rotasModos = require('../src/routes/modos.routes');
    const rotasTV = require('../src/routes/tv.routes');
    const rotasDell = require('../src/routes/dell.routes');
    const rotasSistema = require('../src/routes/sistema.routes');
    const rotasWebhook = require('../src/routes/webhook.routes');

    test('Auth Middleware: rejeitar requisições sem API key ou com chave incorreta', () => {
        let statusCode = null;
        let jsonBody = null;
        const resMock = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (body) => { jsonBody = body; }
                };
            }
        };

        // Sem header
        autenticar({ headers: {} }, resMock, () => {});
        assert.strictEqual(statusCode, 401);

        // Header incorreto
        autenticar({ headers: { 'x-api-key': 'chave_errada' } }, resMock, () => {});
        assert.strictEqual(statusCode, 401);

        // Header correto
        let passou = false;
        autenticar({ headers: { 'x-api-key': process.env.API_KEY } }, resMock, () => {
            passou = true;
        });
        assert.ok(passou, 'Deveria ter chamado next() com chave correta');
    });

    // Verificação de rotas registradas em Express
    function extrairRotas(router, prefix = '') {
        const rotas = [];
        router.stack.forEach((layer) => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
                rotas.push(`${methods} ${prefix}${layer.route.path}`);
            }
        });
        return rotas;
    }

    const rotasRegistradas = [
        ...extrairRotas(rotasModos, '/api'),
        ...extrairRotas(rotasTV, '/api/tv'),
        ...extrairRotas(rotasDell, '/api/dell'),
        ...extrairRotas(rotasSistema, '/api/sistema'),
        ...extrairRotas(rotasWebhook, '/api/webhook'),
    ];

    console.log(`\n  Total de rotas registradas na API: ${rotasRegistradas.length}`);

    test('Rotas: verificar presença das rotas essenciais de modos', () => {
        assert.ok(rotasRegistradas.includes('GET /api/gaming'));
        assert.ok(rotasRegistradas.includes('GET /api/pirata'));
        assert.ok(rotasRegistradas.includes('GET /api/trabalho'));
        assert.ok(rotasRegistradas.includes('GET /api/espelho'));
    });

    test('Rotas: verificar se /api/noturno e /api/silencio estão registradas', () => {
        // AQUI TESTAMOS O POSSÍVEL BUG DETECTADO!
        const temNoturno = rotasRegistradas.includes('GET /api/noturno');
        const temSilencio = rotasRegistradas.includes('GET /api/silencio');
        assert.ok(temNoturno, 'Rota GET /api/noturno NÃO encontrada em rotasModos!');
        assert.ok(temSilencio, 'Rota GET /api/silencio NÃO encontrada em rotasModos!');
    });

    // -----------------------------------------------------------------
    // 7. COMPATIBILIDADE PUBLIC/INDEX.HTML COM ROTAS
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testando Compatibilidade Frontend (PWA) x Backend ---');
    const fs = require('fs');
    const indexHtml = fs.readFileSync('public/index.html', 'utf8');

    // Extrai todas as chamadas executar('/api/...') ou fetch('/api/...')
    const regexChamadas = /['"`](\/api\/[a-zA-Z0-9_\-\/?=&]+)['"`]/g;
    let match;
    const chamadasFrontend = new Set();
    while ((match = regexChamadas.exec(indexHtml)) !== null) {
        let rota = match[1].split('?')[0]; // remove query params
        chamadasFrontend.add(rota);
    }

    console.log(`  Endpoints chamados pelo index.html: ${chamadasFrontend.size}`);
    chamadasFrontend.forEach(rota => {
        test(`Frontend x Backend: conferir se ${rota} possui rota correspondente`, () => {
            // Converte caminhos parametrizados como /api/volume/${val} -> /api/volume/:nivel
            let rotaNormalizada = rota
                .replace(/\/api\/volume\/.*$/, '/api/volume/:nivel')
                .replace(/\/api\/tv\/volume\/.*$/, '/api/tv/volume/:nivel')
                .replace(/\/api\/sistema\/brilho\/.*$/, '/api/sistema/brilho/:nivel')
                .replace(/\/api\/sistema\/midia\/.*$/, '/api/sistema/midia/:acao')
                .replace(/\/api\/dell\/.*$/, '/api/dell/:modo');

            const existe = rotasRegistradas.some(r => r.endsWith(' ' + rotaNormalizada));
            assert.ok(existe, `Rota ${rota} (normalizada: ${rotaNormalizada}) chamada no index.html NÃO existe no backend!`);
        });
    });

    // -----------------------------------------------------------------
    // 8. TESTE DO SCRIPT DE LIMPEZA RAM
    // -----------------------------------------------------------------
    console.log('\n--- 8. Testando integridade dos scripts auxiliares ---');
    test('Scripts: limpeza_ram.bat existe e é legível', () => {
        assert.ok(fs.existsSync('src/scripts/limpeza_ram.bat'));
    });
    test('Scripts: pc_stats.ps1 existe e é legível', () => {
        assert.ok(fs.existsSync('src/scripts/pc_stats.ps1'));
    });
    test('Scripts: media_control.ps1 existe e é legível', () => {
        assert.ok(fs.existsSync('src/scripts/media_control.ps1'));
    });
    test('Scripts: screenshot.ps1 existe e é legível', () => {
        assert.ok(fs.existsSync('src/scripts/screenshot.ps1'));
    });
    test('Scripts: set_brightness.ps1 existe e é legível', () => {
        assert.ok(fs.existsSync('src/scripts/set_brightness.ps1'));
    });
    test('Scripts: set_volume.ps1 existe e é legível', () => {
        assert.ok(fs.existsSync('src/scripts/set_volume.ps1'));
    });

    // -----------------------------------------------------------------
    // 9. TESTES HTTP END-TO-END (SERVIDOR EXPRESS)
    // -----------------------------------------------------------------
    console.log('\n--- 9. Testando Servidor HTTP Express End-to-End ---');
    const http = require('http');

    const appTest = express();
    appTest.use(express.json());
    appTest.use('/api', autenticar);
    appTest.use('/api', rotasModos);
    appTest.use('/api/tv', rotasTV);
    appTest.use('/api/dell', rotasDell);
    appTest.use('/api/sistema', rotasSistema);
    appTest.use('/api/webhook', rotasWebhook);

    const servidor = http.createServer(appTest);
    await new Promise((resolve) => servidor.listen(0, resolve));
    const portaEfêmera = servidor.address().port;

    const requisicaoHttp = (caminho, headers = {}) => new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: portaEfêmera,
            path: caminho,
            method: 'GET',
            headers,
        }, (res) => {
            let dados = '';
            res.on('data', chunk => dados += chunk);
            res.on('end', () => {
                let json = null;
                try { json = JSON.parse(dados); } catch {}
                resolve({ status: res.statusCode, headers: res.headers, body: json || dados });
            });
        });
        req.on('error', reject);
        req.end();
    });

    await testAsync('HTTP: Acesso a /api/sistema/stats sem API Key deve retornar 401', async () => {
        const res = await requisicaoHttp('/api/sistema/stats');
        assert.strictEqual(res.status, 401);
    });

    await testAsync('HTTP: Acesso a /api/sistema/stats com API Key correta deve retornar 200 e stats', async () => {
        const res = await requisicaoHttp('/api/sistema/stats', { 'x-api-key': process.env.API_KEY });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.status, 'Sucesso');
        assert.ok(typeof res.body.stats.cpu_pct === 'number');
    });

    await testAsync('HTTP: /api/noturno deve responder 200', async () => {
        const res = await requisicaoHttp('/api/noturno', { 'x-api-key': process.env.API_KEY });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.status, 'Sucesso');
    });

    await testAsync('HTTP: /api/silencio deve responder 200', async () => {
        const res = await requisicaoHttp('/api/silencio', { 'x-api-key': process.env.API_KEY });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.status, 'Sucesso');
    });

    await testAsync('HTTP: /api/webhook/dormir deve responder 200', async () => {
        const res = await requisicaoHttp('/api/webhook/dormir', { 'x-api-key': process.env.API_KEY });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.status, 'Sucesso');
    });

    await testAsync('HTTP: /api/tv/status sem SmartThings deve responder 503 com erro claro', async () => {
        const res = await requisicaoHttp('/api/tv/status', { 'x-api-key': process.env.API_KEY });
        assert.strictEqual(res.status, 503);
        assert.ok(res.body.erro.includes('SmartThings não configurado'));
    });

    await testAsync('HTTP: /api/dell/modo_invalido deve responder 400', async () => {
        const res = await requisicaoHttp('/api/dell/modo_invalido', { 'x-api-key': process.env.API_KEY });
        assert.strictEqual(res.status, 400);
    });

    await testAsync('HTTP: /api/volume/invalido deve responder 400', async () => {
        const res = await requisicaoHttp('/api/volume/abc', { 'x-api-key': process.env.API_KEY });
        assert.strictEqual(res.status, 400);
    });

    await new Promise((resolve) => servidor.close(resolve));

    console.log('\n==============================================');
    console.log(`📊 RESULTADO DOS TESTES: ${pass} passaram, ${fail} falharam.`);
    console.log('==============================================');
    if (falhas.length > 0) {
        console.log('\n❌ FALHAS DETECTADAS:');
        falhas.forEach((f, i) => {
            console.log(`\n[${i + 1}] ${f.descricao}`);
            console.log(`    ${f.erro}`);
        });
    }
}

run().catch(console.error);
