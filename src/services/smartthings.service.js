const https = require('https');

const TOKEN = () => process.env.SMARTTHINGS_TOKEN;
const TV_ID = () => process.env.SMARTTHINGS_TV_DEVICE_ID;

const isConfigured = () => !!(TOKEN() && TV_ID());

/**
 * Executa uma requisição HTTPS para a API do SmartThings.
 */
const stRequest = (method, path, body = null) => {
    return new Promise((resolve, reject) => {
        if (!TOKEN()) {
            return reject(new Error('SMARTTHINGS_TOKEN não configurado no .env'));
        }

        const bodyStr = body ? JSON.stringify(body) : null;

        const options = {
            hostname: 'api.smartthings.com',
            path: `/v1${path}`,
            method,
            headers: {
                'Authorization': `Bearer ${TOKEN()}`,
                'Content-Type': 'application/json',
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    return reject(new Error(`SmartThings API retornou ${res.statusCode}: ${data}`));
                }
                try { resolve(JSON.parse(data)); }
                catch { resolve(data); }
            });
        });

        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
};

/**
 * Envia comandos para a TV Samsung via SmartThings.
 */
const tvCommand = (commands) => {
    if (!TV_ID()) throw new Error('SMARTTHINGS_TV_DEVICE_ID não configurado no .env');
    return stRequest('POST', `/devices/${TV_ID()}/commands`, { commands });
};

// --- Ligar / Desligar ---
const ligarTV = async () => {
    await tvCommand([{ component: 'main', capability: 'switch', command: 'on' }]);
    return 'TV Samsung ligada!';
};

const desligarTV = async () => {
    await tvCommand([{ component: 'main', capability: 'switch', command: 'off' }]);
    return 'TV Samsung desligada!';
};

// --- Volume e mute ---
const setVolumeTV = async (nivel) => {
    await tvCommand([{
        component: 'main',
        capability: 'audioVolume',
        command: 'setVolume',
        arguments: [nivel],
    }]);
    return `Volume da TV ajustado para ${nivel}!`;
};

const muteTV = async () => {
    await tvCommand([{ component: 'main', capability: 'audioMute', command: 'mute' }]);
    return 'TV mutada!';
};

const unmuteTV = async () => {
    await tvCommand([{ component: 'main', capability: 'audioMute', command: 'unmute' }]);
    return 'Mute da TV desativado!';
};

// --- Entrada HDMI ---
const setInputTV = async (input) => {
    await tvCommand([{
        component: 'main',
        capability: 'mediaInputSource',
        command: 'setInputSource',
        arguments: [input],
    }]);
    return `Entrada da TV: ${input}!`;
};

// --- Apps (IDs Samsung Crystal / Tizen) ---
const TV_APPS = {
    netflix:  'org.tizen.netflix-app',
    youtube:  'com.samsung.tv.youtube',
    prime:    'org.tizen.primevideo',
    disney:   'MCmYXNxgcu.DisneyPlusAmazon',
    spotify:  'kIciSQlYEM.Spotify',
};

const abrirAppTV = async (appKey) => {
    const chave = typeof appKey === 'string' ? appKey.toLowerCase() : '';
    const appId = Object.prototype.hasOwnProperty.call(TV_APPS, chave) ? TV_APPS[chave] : null;
    if (!appId) {
        throw new Error(`App "${appKey}" não reconhecido. Disponíveis: ${Object.keys(TV_APPS).join(', ')}`);
    }
    await tvCommand([{
        component: 'main',
        capability: 'custom.launchapp',
        command: 'launchApp',
        arguments: [{ appId }],
    }]);
    return `${appKey} aberto na TV!`;
};

// --- Status da TV ---
const statusTV = async () => {
    const data = await stRequest('GET', `/devices/${TV_ID()}/status`);
    const main = data?.components?.main || {};
    return {
        ligada:  main?.switch?.switch?.value === 'on',
        volume:  main?.audioVolume?.volume?.value,
        mutado:  main?.audioMute?.mute?.value === 'muted',
        input:   main?.mediaInputSource?.inputSource?.value,
    };
};

// --- Utilitário para descobrir IDs (use npm run setup:smartthings) ---
const listarDispositivos = () => stRequest('GET', '/devices');

module.exports = {
    isConfigured,
    ligarTV,
    desligarTV,
    setVolumeTV,
    muteTV,
    unmuteTV,
    setInputTV,
    abrirAppTV,
    statusTV,
    TV_APPS,
    listarDispositivos,
};
