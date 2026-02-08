// perfil/embed_perfil_usuario.js
const { EmbedBuilder } = require('discord.js');
const { obtenerEmojisRango } = require('../utilidades/emblemas');
const { roleEmojis, roleTranslations } = require('../utilidades/roles');
const { espaciadoPorRol } = require('../utilidades/espaciados_roles');
const { espaciadosRankeds } = require('../utilidades/espaciados_rankeds');

/**
 * Crear embed de perfil de usuario completo
 * @param {Object} datosUsuario - Datos del usuario
 * @param {string} datosUsuario.discordUsername - Nombre de usuario de Discord
 * @param {string} datosUsuario.discordAvatar - URL del avatar de Discord
 * @param {string} datosUsuario.riotID - Riot ID del usuario
 * @param {string} datosUsuario.region - Región del usuario
 * @param {string} datosUsuario.iconoId - ID del icono de invocador
 * @param {Object} datosUsuario.rangos - Rangos del usuario (soloq, flex, tft)
 * @param {Array} datosUsuario.campeonesFavoritos - Top 3 campeones
 * @param {Array} datosUsuario.ultimasPartidas - Últimas 3 partidas
 * @param {string} datosUsuario.rolPrincipal - Rol principal (opcional)
 * @param {string} datosUsuario.campeonFavorito - Campeón favorito (opcional)
 * @param {string} datosUsuario.club - Nombre del club (opcional)
 * @param {string} datosUsuario.clubEmoji - Emoji del club (opcional)
 * @param {string} datosUsuario.pareja - ID de Discord de la pareja (opcional)
 * @param {Array} datosUsuario.insignias - Array de emojis de insignias (opcional)
 * @param {string} datosUsuario.biografia - Biografía del usuario (opcional)
 * @param {Object} datosUsuario.redesSociales - Redes sociales (opcional)
 * @param {string} colorPersonalizado - Color hex personalizado (opcional)
 */
async function crearEmbedPerfilUsuario(datosUsuario, colorPersonalizado = null) {
    // Thumbnail: imagen de perfil social (no el icono de LoL)
    const thumbnailUrl = datosUsuario.thumbnailUrl || 'https://i.imgur.com/2bowbEO.png';
    
    // Función auxiliar para formatear rangos con emojis
    function formatearRangoConEmoji(rango, despuesEmoji) {
        if (!rango) return `<:SinRango:1469941168270872696>${despuesEmoji}Sin Clasificación`;
        
        const tier = rango.tier;
        const rank = rango.rank;
        const lp = rango.lp || 0;
        
        // Obtener emojis usando la utilidad
        const emojis = obtenerEmojisRango(tier, rank);
        
        // Traducir tier
        const traducciones = {
            'IRON': 'Hierro', 'BRONZE': 'Bronce', 'SILVER': 'Plata',
            'GOLD': 'Oro', 'PLATINUM': 'Platino', 'EMERALD': 'Esmeralda',
            'DIAMOND': 'Diamante', 'MASTER': 'Maestro',
            'GRANDMASTER': 'Gran Maestro', 'CHALLENGER': 'Retador'
        };
        
        const tierTraducido = traducciones[tier] || tier;
        
        // Para Master+, no mostrar división
        if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) {
            return `${emojis.tierEmoji}${despuesEmoji}${tierTraducido} · ${lp} Puntos de Liga`;
        }
        
        return `${emojis.tierEmoji}${despuesEmoji}${tierTraducido} ${rank} · ${lp} Puntos de Liga`;
    }
    
    // Formatear campeones destacados - PRUEBA CON YUUMI HARDCODEADA
    function formatearCampeones(campeones) {
        // 5 Yuumis para prueba de espaciado
        return '';
    }
    
    // Formatear partidas recientes - PRUEBA CON YUUMI HARDCODEADA
    function formatearPartidas(partidas) {
        // 5 Yuumis para prueba de espaciado
        return '';
    }
    
    // Construir el primer field (izquierda) - con línea invisible al inicio
    let campoIzquierdo = ``; // Línea invisible
    
    // Separar el Riot ID en nombre y tag
    const [gameName, tagLine] = datosUsuario.riotID.split('#');
    campoIzquierdo += `**ID** ${gameName}\n`;
    campoIzquierdo += `**TAG** #${tagLine}\n`;
    
    // Roles Principales: mostrar top 2 con emojis y porcentajes alineados
    if (datosUsuario.rolesPrincipales && datosUsuario.rolesPrincipales.length > 0) {
        campoIzquierdo += `**Roles Principales**\n`;
        
        // Determinar la jerarquía más alta presente
        const jerarquia = ['TOP', 'UTILITY', 'BOTTOM', 'MIDDLE', 'JUNGLE'];
        const rolesPresentes = datosUsuario.rolesPrincipales.map(r => r.rol);
        let rolMasAlto = null;
        
        for (const rol of jerarquia) {
            if (rolesPresentes.includes(rol)) {
                rolMasAlto = rol;
                break;
            }
        }
        
        datosUsuario.rolesPrincipales.forEach(rolData => {
            const emoji = roleEmojis[rolData.rol] || '❓';
            const nombreRol = roleTranslations[rolData.rol] || rolData.rol;
            const espaciado = espaciadoPorRol[rolMasAlto]?.[rolData.rol] || '';
            
            // Sin espacio entre emoji y nombre
            campoIzquierdo += `${emoji}${nombreRol}${espaciado}(${rolData.porcentaje}%)\n`;
        });
        
        // Si solo tiene 1 rol, agregar mensaje de sin rol secundario
        if (datosUsuario.rolesPrincipales.length === 1) {
            campoIzquierdo += `<:abeja:1468085357248516136>Sin otros roles\n`;
        }
    }
    
    campoIzquierdo += ``;
    
    // Construir el segundo field (derecha) - con línea invisible al inicio
    let campoDerecho = ``; // Línea invisible
    
    // Club: mostrar "Agentes Libres" si no tiene club asignado
    const clubNombre = datosUsuario.club || 'Agentes Libres';
    const clubEmoji = datosUsuario.clubEmoji || '<:FreeAgent:1467857491835486268>';
    campoDerecho += `**Club** ${clubNombre} ${clubEmoji}\n`;
    
    // Puesto: mostrar puesto en el club o "Miembro" por defecto
    const puesto = datosUsuario.puesto || 'Miembro';
    campoDerecho += `**Puesto** ${puesto}\n`;
    
    // Pareja: mostrar mención o mensaje por defecto
    if (datosUsuario.pareja) {
        campoDerecho += `**Pareja** <@${datosUsuario.pareja}>\n`;
    } else {
        campoDerecho += `**Pareja** Sin compromiso\n`;
    }
    
    // Campeón favorito: mover aquí desde el campo izquierdo
    if (datosUsuario.campeonFavorito) {
        campoDerecho += `**${datosUsuario.campeonFavorito}** es su campeón favorito, simplemente le encanta. <:Aurora_Comfy:1463652023747743880>`;
    } else {
        campoDerecho += `Aún no se decide por un campeón favorito.`;
    }
    
    // Construir descripción con biografía y redes sociales
    let descripcion = datosUsuario.biografia || 'Sin biografía';
    descripcion += '\n**   **\n';
    
    if (datosUsuario.redesSociales) {
        if (datosUsuario.redesSociales.instagram) {
            descripcion += `<:a:1467239729459101707> [@${datosUsuario.redesSociales.instagram}](https://instagram.com/${datosUsuario.redesSociales.instagram})\n`;
        }
        if (datosUsuario.redesSociales.twitter) {
            descripcion += `<:a:1467239483379548406> [@${datosUsuario.redesSociales.twitter}](https://twitter.com/${datosUsuario.redesSociales.twitter})\n`;
        }
        if (datosUsuario.redesSociales.tiktok) {
            descripcion += `<:a:1467240496081666172> [@${datosUsuario.redesSociales.tiktok}](https://tiktok.com/@${datosUsuario.redesSociales.tiktok})\n`;
        }
    }
    
    // Construir link de DPM.lol usando gameName y tagLine ya declarados arriba
    // Formato: https://dpm.lol/[gameName]-[tagLine]
    const urlDPM = `https://dpm.lol/${encodeURIComponent(gameName.toLowerCase())}-${encodeURIComponent(tagLine.toLowerCase())}`;
    const linkDPM = `<:dpm:1467862743531913516> [DPM](${urlDPM})`;
    
    // Crear el embed
    const embed = new EmbedBuilder()
        .setColor(colorPersonalizado || 0x87B1E1) // Color personalizado o por defecto (#87B1E1)
        .setAuthor({
            name: `Perfil de ${datosUsuario.discordUsername}`,
            iconURL: datosUsuario.discordAvatar || 'https://i.imgur.com/kEgAzcb.png'
        })
        .setThumbnail(thumbnailUrl)
        .setDescription(descripcion)
        .addFields(
            // 3 fields en fila (van primero, justo abajo de descripción)
            {
                name: ' ',
                value: linkDPM,
                inline: true
            },
            {
                name: ' ',
                value: ' ',
                inline: true
            },
            {
                name: ' ',
                value: ' ',
                inline: true
            },
            // Field invisible (separador)
            {
                name: '',
                value: `**Un poco de ${datosUsuario.discordUsername}**`,
                inline: false
            },

            //titulo invi del derecho
            {
                name: '',
                value: campoIzquierdo,
                inline: true
            },

            //titulo invi del izquiero
            {
                name: '',
                value: campoDerecho,
                inline: true
            },
            {
                name: '',
                value: `**Datos de Clasificatorias**`,
                inline: false
            },            
            {
                name: '',
                value: `**Solo/Duo** ${espaciadosRankeds.soloq}${formatearRangoConEmoji(datosUsuario.rangos.soloq, espaciadosRankeds.despuesEmoji)}\n` +
                       `**Flexible** ${espaciadosRankeds.flex}${formatearRangoConEmoji(datosUsuario.rangos.flex, espaciadosRankeds.despuesEmoji)}\n` +
                       `**TFT** ${espaciadosRankeds.tft}${formatearRangoConEmoji(datosUsuario.rangos.tft, espaciadosRankeds.despuesEmoji)}`,
                inline: false
            }
        )
        .setImage('https://i.imgur.com/sZWCDyT.png'); // Imagen banner al final
    
    return embed;
}

module.exports = {
    crearEmbedPerfilUsuario
};