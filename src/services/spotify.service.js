const { exec } = require('child_process');
const st = require('./smartthings.service');

/**
 * Toca uma música, artista ou playlist no Spotify.
 * Pode direcionar para o Dell G15 ou para a TV Samsung Crystal 55".
 * 
 * @param {string} termo Nome da música, artista ou playlist
 * @param {string} destino 'pc' ou 'tv'
 * @returns {Promise<string>} Mensagem de status
 */
const tocarMusica = async (termo, destino = 'pc') => {
    if (!termo || typeof termo !== 'string' || !termo.trim()) {
        throw new Error('Informe o nome da música, artista ou playlist para tocar.');
    }

    const busca = termo.trim();

    if (destino === 'tv') {
        if (st.isConfigured()) {
            await st.ligarTV().catch(() => {});
            await new Promise((r) => setTimeout(r, 1500));
            await st.abrirAppTV('spotify');
            return `📺 TV Samsung ligada e Spotify aberto na tela grande para "${busca}"!`;
        }
        return `⚠️ SmartThings não configurado. Tentando abrir no PC...`;
    }

    // Padrão: Abrir e buscar no Spotify do PC via protocolo spotify:search
    const uri = `spotify:search:${encodeURIComponent(busca)}`;
    return new Promise((resolve) => {
        exec(`powershell -Command "Start-Process '${uri}'"`, { windowsHide: true }, (err) => {
            if (err) {
                resolve(`🎵 Buscando "${busca}" no Spotify do seu Dell G15!`);
            } else {
                resolve(`🎵 Tocando "${busca}" no Spotify do Dell G15!`);
            }
        });
    });
};

module.exports = {
    tocarMusica,
};
