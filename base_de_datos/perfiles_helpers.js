// base_de_datos/perfiles_helpers.js
// Funciones para manejar los JSON de perfiles (personalización y datos LoL)

const fs = require('fs').promises;
const path = require('path');

// Rutas de los archivos JSON
const PERFILES_PERSONALIZACION_FILE = path.join(__dirname, 'cache/perfiles_personalizacion.json');
const PERFILES_LOL_DATOS_FILE = path.join(__dirname, 'cache/perfiles_lol_datos.json');

// ============================================================================
// PERFILES PERSONALIZACIÓN (datos configurados por el usuario)
// ============================================================================

/**
 * Cargar datos de personalización desde JSON
 * @returns {Promise<Object>} - Objeto con perfiles de personalización
 */
async function cargarPersonalizaciones() {
    try {
        const data = await fs.readFile(PERFILES_PERSONALIZACION_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si no existe el archivo, devolver objeto vacío
        console.log('📝 Creando nuevo archivo de personalizaciones...');
        return {};
    }
}

/**
 * Guardar datos de personalización en JSON
 * @param {Object} personalizaciones - Objeto completo de personalizaciones
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
async function guardarPersonalizaciones(personalizaciones) {
    try {
        await fs.writeFile(
            PERFILES_PERSONALIZACION_FILE, 
            JSON.stringify(personalizaciones, null, 2)
        );
        console.log('✅ Personalizaciones guardadas correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar personalizaciones:', error);
        return false;
    }
}

/**
 * Obtener personalización de un usuario
 * @param {string} discordId - ID del usuario de Discord
 * @returns {Promise<Object|null>} - Datos de personalización o null
 */
async function obtenerPersonalizacion(discordId) {
    const personalizaciones = await cargarPersonalizaciones();
    return personalizaciones[discordId] || null;
}

/**
 * Actualizar personalización de un usuario (o crear si no existe)
 * @param {string} discordId - ID del usuario de Discord
 * @param {Object} datosNuevos - Datos a actualizar/agregar
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarPersonalizacion(discordId, datosNuevos) {
    const personalizaciones = await cargarPersonalizaciones();
    
    // Si no existe, crear objeto vacío
    if (!personalizaciones[discordId]) {
        personalizaciones[discordId] = {};
    }
    
    // Actualizar con los nuevos datos
    personalizaciones[discordId] = {
        ...personalizaciones[discordId],
        ...datosNuevos
    };
    
    return await guardarPersonalizaciones(personalizaciones);
}

/**
 * Actualizar solo el color del perfil
 * @param {string} discordId - ID del usuario de Discord
 * @param {string} color - Color hex (ej: #87B1E1)
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarColorPerfil(discordId, color) {
    return await actualizarPersonalizacion(discordId, { colorPersonalizado: color });
}

/**
 * Actualizar biografía
 * @param {string} discordId - ID del usuario de Discord
 * @param {string} biografia - Texto de biografía
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarBiografia(discordId, biografia) {
    return await actualizarPersonalizacion(discordId, { biografia });
}

/**
 * Actualizar redes sociales
 * @param {string} discordId - ID del usuario de Discord
 * @param {Object} redesSociales - { instagram, twitter, tiktok }
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarRedesSociales(discordId, redesSociales) {
    return await actualizarPersonalizacion(discordId, { redesSociales });
}

/**
 * Actualizar campeón favorito
 * @param {string} discordId - ID del usuario de Discord
 * @param {string} campeonFavorito - Nombre del campeón
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarCampeonFavorito(discordId, campeonFavorito) {
    return await actualizarPersonalizacion(discordId, { campeonFavorito });
}

/**
 * Actualizar thumbnail (avatar personalizado)
 * @param {string} discordId - ID del usuario de Discord
 * @param {string} thumbnailUrl - URL de la imagen
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarThumbnail(discordId, thumbnailUrl) {
    return await actualizarPersonalizacion(discordId, { thumbnailUrl });
}

// ============================================================================
// PERFILES LOL DATOS (datos de Riot API actualizados automáticamente)
// ============================================================================

/**
 * Cargar datos de LoL desde JSON
 * @returns {Promise<Object>} - Objeto con datos de LoL
 */
async function cargarDatosLoL() {
    try {
        const data = await fs.readFile(PERFILES_LOL_DATOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('📝 Creando nuevo archivo de datos LoL...');
        return {};
    }
}

/**
 * Guardar datos de LoL en JSON
 * @param {Object} datosLoL - Objeto completo de datos LoL
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
async function guardarDatosLoL(datosLoL) {
    try {
        await fs.writeFile(
            PERFILES_LOL_DATOS_FILE, 
            JSON.stringify(datosLoL, null, 2)
        );
        console.log('✅ Datos LoL guardados correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar datos LoL:', error);
        return false;
    }
}

/**
 * Obtener datos de LoL de un usuario
 * @param {string} discordId - ID del usuario de Discord
 * @returns {Promise<Object|null>} - Datos de LoL o null
 */
async function obtenerDatosLoL(discordId) {
    const datosLoL = await cargarDatosLoL();
    return datosLoL[discordId] || null;
}

/**
 * Actualizar datos de LoL de un usuario (usado por el script automático)
 * @param {string} discordId - ID del usuario de Discord
 * @param {Object} datosNuevos - Nuevos datos de LoL
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarDatosLoL(discordId, datosNuevos) {
    const datosLoL = await cargarDatosLoL();
    
    // Agregar timestamp de última actualización
    datosNuevos.ultimaActualizacion = new Date().toISOString();
    
    datosLoL[discordId] = datosNuevos;
    
    return await guardarDatosLoL(datosLoL);
}

/**
 * Crear entrada inicial de datos LoL (usado en registro)
 * @param {string} discordId - ID del usuario de Discord
 * @param {Object} datosIniciales - Datos iniciales { riotID, region, puuid, rangos, rolesPrincipales }
 * @returns {Promise<boolean>} - true si se creó correctamente
 */
async function crearEntradaLoL(discordId, datosIniciales) {
    return await actualizarDatosLoL(discordId, datosIniciales);
}

// ============================================================================
// FUNCIONES COMBINADAS (obtener perfil completo)
// ============================================================================

/**
 * Obtener perfil completo de un usuario (personalización + datos LoL)
 * @param {string} discordId - ID del usuario de Discord
 * @returns {Promise<Object|null>} - Perfil completo o null si no existe
 */
async function obtenerPerfilCompleto(discordId) {
    const [personalizacion, datosLoL] = await Promise.all([
        obtenerPersonalizacion(discordId),
        obtenerDatosLoL(discordId)
    ]);
    
    // Si no tiene datos de LoL, no está registrado
    if (!datosLoL) {
        return null;
    }
    
    // Combinar datos (personalización puede ser null si nunca personalizó)
    return {
        // Datos de LoL (siempre presentes)
        ...datosLoL,
        
        // Datos de personalización (opcionales)
        campeonFavorito: personalizacion?.campeonFavorito || null,
        club: personalizacion?.club || null,
        clubEmoji: personalizacion?.clubEmoji || null,
        puesto: personalizacion?.puesto || null,
        pareja: personalizacion?.pareja || null,
        biografia: personalizacion?.biografia || '*Este usuario es todo un misterio… aún no ha agregado una biografía a su perfil.*',
        redesSociales: personalizacion?.redesSociales || null,
        colorPersonalizado: personalizacion?.colorPersonalizado || null,
        thumbnailUrl: personalizacion?.thumbnailUrl || null
    };
}

/**
 * Obtener todos los usuarios registrados (para el script de actualización)
 * @returns {Promise<Array>} - Array de IDs de Discord
 */
async function obtenerTodosLosUsuariosRegistrados() {
    const datosLoL = await cargarDatosLoL();
    return Object.keys(datosLoL);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Personalización
    cargarPersonalizaciones,
    guardarPersonalizaciones,
    obtenerPersonalizacion,
    actualizarPersonalizacion,
    actualizarColorPerfil,
    actualizarBiografia,
    actualizarRedesSociales,
    actualizarCampeonFavorito,
    actualizarThumbnail,
    
    // Datos LoL
    cargarDatosLoL,
    guardarDatosLoL,
    obtenerDatosLoL,
    actualizarDatosLoL,
    crearEntradaLoL,
    
    // Combinadas
    obtenerPerfilCompleto,
    obtenerTodosLosUsuariosRegistrados
};