const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const iptvParser = require("iptv-playlist-parser");

const M3U_URL = "https://raw.githubusercontent.com/Eletrovision373iptv/embedtvonline/refs/heads/main/lista_embedtv.m3u";

const manifest = {
    id: "org.meuaddon.iptv.vercel",
    version: "1.0.0",
    name: "Addon Canais Vercel",
    description: "Canais via M3U hospedados no Vercel",
    resources: ["catalog", "stream"],
    types: ["tv"],
    catalogs: [{ type: "tv", id: "canais_m3u", name: "Canais Online" }]
};

const builder = new addonBuilder(manifest);

// Handlers (mesma lógica do anterior)
builder.defineCatalogHandler(async () => {
    try {
        const response = await axios.get(M3U_URL);
        const playlist = iptvParser.parse(response.data);
        const metas = playlist.items.map((item, index) => ({
            id: `m3u_channel_${index}`,
            type: "tv",
            name: item.name,
            poster: item.tvg.logo || "",
            description: `Canal: ${item.name}`
        }));
        return { metas };
    } catch (e) { return { metas: [] }; }
});

builder.defineStreamHandler(async (args) => {
    try {
        const response = await axios.get(M3U_URL);
        const playlist = iptvParser.parse(response.data);
        const index = parseInt(args.id.replace("m3u_channel_", ""));
        const channel = playlist.items[index];
        return { streams: channel ? [{ title: channel.name, url: channel.url }] : [] };
    } catch (e) { return { streams: [] }; }
});

// Exporta para o Vercel
const addonInterface = builder.getInterface();
module.exports = (req, res) => {
    // Basicamente transforma a requisição do Vercel no formato que o SDK entende
    const { url } = req;
    const path = url.replace('/api', '');
    
    // O SDK do Stremio resolve as rotas automaticamente
    addonInterface.getRouter().handle(req, res);
};
