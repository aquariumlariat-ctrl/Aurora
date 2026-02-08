// perfil/perfil.js
// Comando principal para mostrar perfiles de usuarios

const mensajes = require('./mensajes');
const { crearEmbedPerfilUsuario } = require('./embed_perfil_usuario');
const { esCacheValido, guardarEnCache, obtenerDeCache } = require('./cache');
const { obtenerDatosUsuario, obtenerDatosUsuarioPorNumero } = require('../base_de_datos/sheets_helpers');
const { obtenerPerfilCompleto } = require('../base_de_datos/perfiles_helpers');

/**
 * Determina qué tipo de búsqueda se está realizando y obtiene los datos
 * @param {Object} message - Mensaje de Discord
 * @returns {Promise<Object>} - { datosSheet, usuarioObjetivo, tipoBusqueda, argumento }
 */
async function determinarBusqueda(message) {
    const args = message.content.trim().split(/\s+/);
    const argumento = args[1]; // Aurora!perfil [argumento]
    
    let datosSheet = null;
    let usuarioObjetivo = null;
    let tipoBusqueda = 'propio';
    
    // 1. Verificar si hay una mención (@usuario)
    if (message.mentions.users.size > 0) {
        const usuarioMencionado = message.mentions.users.first();
        datosSheet = await obtenerDatosUsuario(usuarioMencionado.id);
        usuarioObjetivo = usuarioMencionado;
        tipoBusqueda = 'mencion';
    }
    // 2. Verificar si es un número de registro (#1, #2, etc.)
    else if (argumento && argumento.startsWith('#')) {
        datosSheet = await obtenerDatosUsuarioPorNumero(argumento);
        
        if (datosSheet) {
            try {
                usuarioObjetivo = await message.client.users.fetch(datosSheet.discordId);
            } catch {
                usuarioObjetivo = { username: datosSheet.discordUsername };
            }
        }
        tipoBusqueda = 'numero';
    }
    // 3. Verificar si es un Discord ID (solo números, 17-19 dígitos)
    else if (argumento && /^\d{17,19}$/.test(argumento)) {
        datosSheet = await obtenerDatosUsuario(argumento);
        
        if (datosSheet) {
            try {
                usuarioObjetivo = await message.client.users.fetch(argumento);
            } catch {
                usuarioObjetivo = { username: datosSheet.discordUsername };
            }
        }
        tipoBusqueda = 'id';
    }
    // 4. Sin argumentos = mostrar perfil propio
    else {
        datosSheet = await obtenerDatosUsuario(message.author.id);
        usuarioObjetivo = message.author;
        tipoBusqueda = 'propio';
    }
    
    return { datosSheet, usuarioObjetivo, tipoBusqueda, argumento };
}

/**
 * Obtiene el mensaje de carga apropiado según el tipo de búsqueda
 * @param {string} tipoBusqueda - Tipo de búsqueda
 * @param {Object} usuarioObjetivo - Usuario objetivo
 * @param {string} argumento - Argumento usado
 * @returns {string} - Mensaje de carga
 */
function obtenerMensajeCarga(tipoBusqueda, usuarioObjetivo, argumento) {
    switch (tipoBusqueda) {
        case 'mencion':
            return mensajes.CargandoPerfilMencionado(usuarioObjetivo);
        case 'numero':
            return mensajes.CargandoPerfilNumero(argumento);
        case 'id':
            return mensajes.CargandoPerfilId;
        default:
            return mensajes.CargandoPerfil;
    }
}

/**
 * Maneja el caso donde no se encuentran datos del usuario
 * @param {Object} message - Mensaje de Discord
 * @param {string} tipoBusqueda - Tipo de búsqueda
 * @param {Object} usuarioObjetivo - Usuario objetivo (puede ser null)
 * @param {string} argumento - Argumento usado
 */
async function manejarUsuarioNoEncontrado(message, tipoBusqueda, usuarioObjetivo, argumento) {
    switch (tipoBusqueda) {
        case 'propio':
            await message.reply(mensajes.UsuarioSinRegistro(message.author));
            break;
        case 'mencion':
            await message.reply(mensajes.UsuarioMencionadoSinRegistro(usuarioObjetivo));
            break;
        case 'numero':
            await message.reply(mensajes.NumeroRegistroNoEncontrado(argumento));
            break;
        case 'id':
            await message.reply(mensajes.IdNoEncontrado);
            break;
    }
}

/**
 * Prepara los datos del jugador para crear el embed
 * @param {Object} perfilCompleto - Datos completos del perfil (LoL + personalización)
 * @param {Object} usuarioObjetivo - Usuario de Discord
 * @returns {Object} - Datos formateados para el embed
 */
function prepararDatosParaEmbed(perfilCompleto, usuarioObjetivo) {
    const discordAvatar = usuarioObjetivo.displayAvatarURL 
        ? usuarioObjetivo.displayAvatarURL({ size: 256 }) 
        : null;
    
    const nombreVisualizacion = usuarioObjetivo.displayName 
        || usuarioObjetivo.globalName 
        || usuarioObjetivo.username;
    
    return {
        discordUsername: nombreVisualizacion,
        discordAvatar: discordAvatar,
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
}

/**
 * Comando principal - Muestra el perfil de un usuario
 * @param {Object} message - Mensaje de Discord
 */
async function ejecutar(message) {
    // 1. Determinar qué perfil mostrar
    const { datosSheet, usuarioObjetivo, tipoBusqueda, argumento } = await determinarBusqueda(message);
    
    // 2. Verificar si se encontraron datos básicos
    if (!datosSheet) {
        await manejarUsuarioNoEncontrado(message, tipoBusqueda, usuarioObjetivo, argumento);
        return;
    }
    
    // 3. Verificar cache (en memoria, 5 minutos)
    if (esCacheValido(datosSheet.discordId)) {
        const cache = obtenerDeCache(datosSheet.discordId);
        await message.reply({ embeds: [cache.embed] });
        return;
    }
    
    // 4. Mostrar mensaje de carga
    const mensajeCarga = obtenerMensajeCarga(tipoBusqueda, usuarioObjetivo, argumento);
    const loadingMessage = await message.reply(mensajeCarga);
    
    try {
        // 5. Obtener perfil completo desde los JSON (instantáneo ⚡)
        const perfilCompleto = await obtenerPerfilCompleto(datosSheet.discordId);
        
        if (!perfilCompleto) {
            await loadingMessage.edit(mensajes.ErrorCargarPerfil);
            return;
        }
        
        // 6. Preparar datos para el embed
        const datosJugador = prepararDatosParaEmbed(perfilCompleto, usuarioObjetivo);
        
        // 7. Crear embed (con color personalizado si existe)
        const embed = await crearEmbedPerfilUsuario(
            datosJugador, 
            perfilCompleto.colorPersonalizado
        );
        
        // 8. Guardar en cache
        guardarEnCache(datosSheet.discordId, datosJugador, embed);
        
        // 9. Enviar respuesta
        await loadingMessage.edit({
            content: null,
            embeds: [embed]
        });
        
    } catch (error) {
        console.error('❌ Error al cargar perfil:', error);
        await loadingMessage.edit(mensajes.ErrorCargarPerfil);
    }
}

module.exports = {
    ejecutar
};