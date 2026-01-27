// registro/EmbedRegistro.js
const { EmbedBuilder } = require('discord.js');
const { obtenerEmojisRango } = require('../utilidades/emblemas');

// Cache para la versión de Data Dragon
let latestVersion = null;

// Función para obtener la última versión de Data Dragon
async function obtenerUltimaVersion() {
    if (latestVersion) {
        return latestVersion;
    }
    
    try {
        const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await response.json();
        latestVersion = versions[0];
        return latestVersion;
    } catch (error) {
        console.error('Error al obtener versión de Data Dragon:', error);
        return '14.1.1'; // Fallback
    }
}

async function crearEmbedPerfil(datosJugador) {
    const { riotID, region, iconoId, rangos, campeonesFavoritos, ultimasPartidas } = datosJugador;
    
    // Obtener última versión y construir URL del icono
    const version = await obtenerUltimaVersion();
    const iconoUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconoId}.png`;
    
    // Formatear clasificaciones
    let clasificacionTexto = '';
    
    // Solo/Duo
    if (rangos.soloq) {
        const emojis = obtenerEmojisRango(rangos.soloq.tier, rangos.soloq.rank);
        if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rangos.soloq.tier)) {
            clasificacionTexto += `**Solo/Duo**⠀${emojis.combined} ⠀ ⠀${rangos.soloq.lp} Puntos de Liga\n`;
        } else {
            clasificacionTexto += `**Solo/Duo**⠀${emojis.combined} ${rangos.soloq.lp} Puntos de Liga\n`;
        }
    } else {
        const emojis = obtenerEmojisRango('UNRANKED');
        clasificacionTexto += `**Solo/Duo**⠀${emojis.combined} ⠀ ⠀Sin Clasificación\n`;
    }
    
    // Flexible
    if (rangos.flex) {
        const emojis = obtenerEmojisRango(rangos.flex.tier, rangos.flex.rank);
        if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rangos.flex.tier)) {
            clasificacionTexto += `**Flexible**⠀⠀${emojis.combined} ⠀ ⠀${rangos.flex.lp} Puntos de Liga\n`;
        } else {
            clasificacionTexto += `**Flexible**⠀⠀${emojis.combined} ${rangos.flex.lp} Puntos de Liga\n`;
        }
    } else {
        const emojis = obtenerEmojisRango('UNRANKED');
        clasificacionTexto += `**Flexible**⠀⠀${emojis.combined} ⠀ ⠀Sin Clasificación\n`;
    }
    
    // TFT (si existe)
    if (rangos.tft) {
        const emojis = obtenerEmojisRango(rangos.tft.tier, rangos.tft.rank);
        if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rangos.tft.tier)) {
            clasificacionTexto += `**TFT**            ${emojis.combined} ⠀ ⠀${rangos.tft.lp} Puntos de Liga`;
        } else {
            clasificacionTexto += `**TFT**            ${emojis.combined} ${rangos.tft.lp} Puntos de Liga`;
        }
    } else {
        const emojis = obtenerEmojisRango('UNRANKED');
        clasificacionTexto += `**TFT**⠀ ⠀ ⠀⠀${emojis.combined} ⠀ ⠀Sin Clasificación`;
    }
    
    // Formatear campeones favoritos
    let campeonesTexto = '';
    campeonesFavoritos.forEach((campeon) => {
        const puntos = campeon.championPoints.toLocaleString();
        campeonesTexto += `${campeon.championEmoji} **${campeon.championName}** (${puntos})\n`;
    });
    
    // Formatear últimas partidas
    let partidasTexto = 'Sin partidas recientes';
    if (ultimasPartidas && ultimasPartidas.length > 0) {
        partidasTexto = ultimasPartidas.map(partida => {
            const resultado = partida.win ? 'Victoria' : 'Derrota';
            return `${partida.championEmoji} **${partida.queueName}** (${resultado})`;
        }).join('\n');
    }
    
    // Crear el embed
    const embed = new EmbedBuilder()
        .setColor('#fe9075')
        .setAuthor({
            name: `Perfil de ${riotID}`,
            iconURL: 'https://cdn.discordapp.com/emojis/1263996583112872017.webp?size=40'
        })
        .setThumbnail(iconoUrl)
        .addFields(
            {
                name: 'Datos de Clasificatorias',
                value: clasificacionTexto,
                inline: false
            },
            {
                name: 'Campeones Favoritos',
                value: campeonesTexto || 'Sin datos',
                inline: true
            },
            {
                name: 'Ultimas Partidas',
                value: partidasTexto,
                inline: true
            }
        )
        .setImage();
    
    return embed;
}

module.exports = { crearEmbedPerfil };