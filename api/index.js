const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const iptvParser = require("iptv-playlist-parser");

// Link da sua lista M3U
const M3U_URL = "https://raw.githubusercontent.com/Eletrovision373iptv/embedtvonline/refs/heads/main/lista_embedtv.m3u";

const manifest = {
    id: "org.meuaddon.iptv.vercel",
    version: "1.0.0",
    name: "Canais Online Grátis",
    description: "Canais extraídos do link M3U",
    resources: ["catalog", "stream"],
    types: ["tv"],
    catalogs: [{ type: "tv", id: "canais_m3u", name: "Minha TV Online" }]
};

const builder = new addonBuilder(manifest);

// Função que cria a lista de canais que você vê no Stremio
builder.defineCatalogHandler(async () => {
    try {
        const response = await axios.get(M3U_URL);
        const playlist = iptvParser.parse(response.data);
        const metas = playlist.items.map((item, index) => ({
            id: `m3u_ch_${index}`,
            type: "tv",
            name: item.name,
            poster: item.tvg.logo || "https://placehold.co/400x600?text=TV", 
            description: `Assistir ${item.name}`
        }));
        return { metas };
    } catch (e) { return { metas: [] }; }
});

// Função que entrega o sinal do vídeo quando você clica no canal
builder.defineStreamHandler(async (args) => {
    try {
        const response = await axios.get(M3U_URL);
        const playlist = iptvParser.parse(response.data);
        const index = parseInt(args.id.replace("m3u_ch_", ""));
        const channel = playlist.items[index];
        
        if (channel && channel.url) {
            return { streams: [{ title: "Sinal Online", url: channel.url }] };
        }
        return { streams: [] };
    } catch (e) { return { streams: [] }; }
});

module.exports = (req, res) => {
    builder.getInterface().getRouter().handle(req, res);
};
