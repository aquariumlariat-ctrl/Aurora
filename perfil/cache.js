// perfil/cache.js
// Sistema de cache para perfiles de usuarios

const cachePerfiles = new Map();
const TIEMPO_CACHE = 5 * 60 * 1000; // 5 minutos

/**
 * Verifica si el cache de un usuario es válido
 * @param {string} userId - ID del usuario de Discord
 * @returns {boolean} - true si el cache es válido
 */
function esCacheValido(userId) {
    const datosCache = cachePerfiles.get(userId);
    if (!datosCache) return false;
    
    const tiempoTranscurrido = Date.now() - datosCache.timestamp;
    return tiempoTranscurrido < TIEMPO_CACHE;
}

/**
 * Guarda datos de perfil en cache
 * @param {string} userId - ID del usuario de Discord
 * @param {Object} datosJugador - Datos del jugador
 * @param {Object} embed - Embed generado
 */
function guardarEnCache(userId, datosJugador, embed) {
    cachePerfiles.set(userId, {
        datosJugador,
        embed,
        timestamp: Date.now()
    });
}

/**
 * Obtiene datos de perfil desde cache
 * @param {string} userId - ID del usuario de Discord
 * @returns {Object|undefined} - Datos cacheados o undefined
 */
function obtenerDeCache(userId) {
    return cachePerfiles.get(userId);
}

/**
 * Limpia el cache de un usuario específico
 * @param {string} userId - ID del usuario de Discord
 */
function limpiarCache(userId) {
    cachePerfiles.delete(userId);
}

/**
 * Limpia todo el cache
 */
function limpiarTodoCache() {
    cachePerfiles.clear();
}

module.exports = {
    esCacheValido,
    guardarEnCache,
    obtenerDeCache,
    limpiarCache,
    limpiarTodoCache
};