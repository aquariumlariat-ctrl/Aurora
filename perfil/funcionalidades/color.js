// perfil/funcionalidades/color.js
// Sistema completo de personalización de color del perfil

const { createCanvas } = require('canvas');
const { actualizarColorPerfil } = require('../../base_de_datos/perfiles_helpers');

const SERVIDOR_ID = process.env.SERVIDOR_ID;
const MAX_EMOJIS_COLOR = 15; // Máximo de emojis de color a mantener
const EMOJI_SIZE = 100; // Tamaño del canvas
const SQUARE_SIZE = 54; // Tamaño del cuadrado de color

// ============================================================================
// UTILIDADES Y VALIDACIÓN
// ============================================================================

/**
 * Valida si un string es un color hexadecimal válido
 * @param {string} color - String a validar
 * @returns {boolean} - true si es válido
 */
function esColorHexValido(color) {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    return colorRegex.test(color);
}

/**
 * Normaliza un color hex a mayúsculas
 * @param {string} color - Color hex (ej: #ff5733)
 * @returns {string} - Color normalizado (ej: #FF5733)
 */
function normalizarColor(color) {
    return color.toUpperCase();
}

/**
 * Genera el nombre del emoji basado en el color
 * @param {string} color - Color hex normalizado
 * @returns {string} - Nombre del emoji (ej: color_FF5733)
 */
function generarNombreEmoji(color) {
    return `color_${color.replace('#', '')}`;
}

// ============================================================================
// CREACIÓN DE EMOJI
// ============================================================================

/**
 * Crea un canvas con un cuadrado de color
 * @param {string} color - Color hex del cuadrado
 * @returns {Buffer} - Buffer PNG del emoji
 */
function crearCanvasColor(color) {
    // Crear lienzo de 100x100 con fondo transparente
    const canvas = createCanvas(EMOJI_SIZE, EMOJI_SIZE);
    const ctx = canvas.getContext('2d');
    
    // Fondo transparente
    ctx.clearRect(0, 0, EMOJI_SIZE, EMOJI_SIZE);
    
    // Desactivar antialias para bordes nítidos
    ctx.imageSmoothingEnabled = false;
    
    // Crear cuadrado sólido centrado con ajuste óptico
    ctx.fillStyle = color;
    
    // Centrar: (100 - 54) / 2 = 23
    // Ajuste óptico: -1 píxel en Y para mejor centrado visual
    const x = (EMOJI_SIZE - SQUARE_SIZE) / 2;
    const y = ((EMOJI_SIZE - SQUARE_SIZE) / 2) - 1;
    
    ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
    
    // Convertir a buffer PNG
    return canvas.toBuffer('image/png');
}

/**
 * Limpia emojis antiguos si se excede el límite
 * @param {Guild} guild - Servidor de Discord
 * @returns {Promise<void>}
 */
async function limpiarEmojisAntiguos(guild) {
    const emojisColor = guild.emojis.cache.filter(e => e.name.startsWith('color_'));
    
    if (emojisColor.size >= MAX_EMOJIS_COLOR) {
        // Ordenar por fecha de creación (más antiguo primero)
        const emojisOrdenados = emojisColor.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        const emojiMasAntiguo = emojisOrdenados.first();
        
        await emojiMasAntiguo.delete('Límite de emojis de color alcanzado');
        console.log(`🗑️ Emoji de color eliminado: ${emojiMasAntiguo.name}`);
    }
}

/**
 * Busca o crea un emoji de color en el servidor
 * @param {string} color - Color hex (ej: #FF5733)
 * @param {Client} client - Cliente de Discord
 * @returns {Promise<Object>} - { emoji: Emoji, creado: boolean }
 */
async function obtenerOCrearEmojiColor(color, client) {
    try {
        // Validar color
        if (!esColorHexValido(color)) {
            throw new Error('Color hex inválido. Usa formato #RRGGBB (ej: #FF5733)');
        }
        
        // Normalizar color
        const colorNormalizado = normalizarColor(color);
        
        // Obtener servidor
        const guild = await client.guilds.fetch(SERVIDOR_ID);
        
        // Nombre del emoji
        const emojiName = generarNombreEmoji(colorNormalizado);
        
        // Verificar si ya existe
        const emojiExistente = guild.emojis.cache.find(e => e.name === emojiName);
        
        if (emojiExistente) {
            console.log(`♻️ Emoji de color reutilizado: ${emojiName}`);
            return { emoji: emojiExistente, creado: false };
        }
        
        // Limpiar emojis antiguos si es necesario
        await limpiarEmojisAntiguos(guild);
        
        // Crear canvas con el color
        const buffer = crearCanvasColor(colorNormalizado);
        
        // Crear emoji en el servidor
        const emoji = await guild.emojis.create({
            attachment: buffer,
            name: emojiName
        });
        
        console.log(`✅ Emoji de color creado: ${emojiName}`);
        return { emoji, creado: true };
        
    } catch (error) {
        console.error('❌ Error al obtener/crear emoji de color:', error);
        throw error;
    }
}

// ============================================================================
// PERSONALIZACIÓN DE COLOR (INTEGRACIÓN CON PERSONALIZAR)
// ============================================================================

/**
 * Inicia el proceso de personalización de color
 * @param {Object} dmChannel - Canal de DM
 * @param {string} userId - ID del usuario de Discord
 * @returns {Promise<Object>} - { etapa: string }
 */
async function iniciarPersonalizacionColor(dmChannel, userId) {
    const mensajes = require('../../personalizar/mensajes');
    // No se envía el mensaje inicial, solo se retorna el estado
    
    return {
        etapa: 'esperando_color',
        subFuncionalidad: 'color'
    };
}

/**
 * Procesa la respuesta del usuario con el color
 * @param {Message} message - Mensaje del usuario
 * @param {Client} client - Cliente de Discord
 * @param {Object} dmChannel - Canal de DM
 * @returns {Promise<Object>} - { completado: boolean, esperandoConfirmacion?: boolean, colorTemporal?: string }
 */
async function procesarRespuestaColor(message, client, dmChannel) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const { crearEmbedPerfilUsuario } = require('../embed_perfil_usuario');
    const { obtenerPerfilCompleto } = require('../../base_de_datos/perfiles_helpers');
    const mensajes = require('../../personalizar/mensajes');
    
    const color = message.content.trim();
    
    // Validar formato
    if (!esColorHexValido(color)) {
        await dmChannel.send(mensajes.ColorInvalido());
        return { completado: false };
    }
    
    try {
        // Crear emoji del color (sin mensaje de carga)
        const { emoji, creado } = await obtenerOCrearEmojiColor(color, client);
        
        // Obtener perfil completo desde JSON (sin mensaje de carga - es instantáneo)
        const perfilCompleto = await obtenerPerfilCompleto(message.author.id);
        
        if (!perfilCompleto) {
            await dmChannel.send(mensajes.UsuarioNoRegistradoColor());
            return { completado: true, error: 'No registrado' };
        }
        
        // Preparar datos para el embed con el nuevo color
        const datosParaEmbed = {
            discordUsername: message.author.displayName || message.author.username,
            discordAvatar: message.author.displayAvatarURL({ size: 256 }),
            riotID: perfilCompleto.riotID,
            region: perfilCompleto.region,
            thumbnailUrl: perfilCompleto.thumbnailUrl,
            rangos: perfilCompleto.rangos,
            rolesPrincipales: perfilCompleto.rolesPrincipales,
            campeonFavorito: perfilCompleto.campeonFavorito,
            club: perfilCompleto.club,
            clubEmoji: perfilCompleto.clubEmoji,
            puesto: perfilCompleto.puesto,
            pareja: perfilCompleto.pareja,
            biografia: perfilCompleto.biografia,
            redesSociales: perfilCompleto.redesSociales
        };
        
        const embed = await crearEmbedPerfilUsuario(datosParaEmbed, color.toUpperCase());
        
        // Crear botones
        const botonesConfirmacion = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guardar_color')
                    .setLabel('¡Me encanta, Guardar!')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('1465263781348118564'),
                new ButtonBuilder()
                    .setCustomId('reintentar_color')
                    .setLabel('Probar otro Color')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('1465270799781859393'),
                new ButtonBuilder()
                    .setCustomId('cancelar_color')
                    .setLabel('Salir')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('1469787904980156519')
            );
        
        // Enviar embed con botones
        const mensajeConBotones = await dmChannel.send({
            content: mensajes.PreviewColor(emoji, color.toUpperCase()),
            embeds: [embed],
            components: [botonesConfirmacion]
        });
        
        return { 
            completado: false, 
            esperandoConfirmacion: true,
            colorTemporal: color.toUpperCase(),
            emojiColor: emoji.toString(),
            messageId: mensajeConBotones.id // Guardar ID del mensaje
        };
        
    } catch (error) {
        console.error('Error al procesar color:', error);
        await dmChannel.send(mensajes.ErrorProcesarColor());
        return { completado: true, error: error.message };
    }
}

// ============================================================================
// GUARDAR COLOR (usado por personalizar.js al confirmar)
// ============================================================================

/**
 * Guarda el color en el JSON de personalización
 * @param {string} userId - ID del usuario de Discord
 * @param {string} color - Color hex normalizado
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
async function guardarColor(userId, color) {
    return await actualizarColorPerfil(userId, color);
}

// ============================================================================
// FUNCIÓN LEGACY (TESTING RÁPIDO)
// ============================================================================

/**
 * Procesa un mensaje que podría ser un color hex (para testing)
 * @param {Message} message - Mensaje de Discord
 * @param {Client} client - Cliente de Discord
 * @returns {Promise<boolean>} - true si se procesó como color
 */
async function procesarColorEmoji(message, client) {
    const mensajes = require('../../personalizar/mensajes');
    
    // Verificar si el mensaje es un color hexadecimal
    if (!esColorHexValido(message.content)) {
        return false;
    }
    
    try {
        await message.reply(mensajes.CreandoEmojiColor());
        
        const { emoji, creado } = await obtenerOCrearEmojiColor(message.content, client);
        
        if (creado) {
            await message.reply(mensajes.EmojiColorCreado(emoji));
        } else {
            await message.reply(mensajes.EmojiColorExiste(emoji));
        }
        
        return true;
        
    } catch (error) {
        console.error('Error al procesar color emoji:', error);
        await message.reply(mensajes.ErrorPermisosEmoji());
        return true;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Funciones de personalización (usadas por personalizar.js)
    iniciarPersonalizacionColor,
    procesarRespuestaColor,
    guardarColor,
    
    // Funciones de emoji (por si se necesitan en otros lugares)
    obtenerOCrearEmojiColor,
    esColorHexValido,
    normalizarColor,
    generarNombreEmoji,
    
    // Función legacy (para testing)
    procesarColorEmoji
};