// scripts/actualizar_perfiles_lol.js
// Script que actualiza los datos de LoL de todos los usuarios cada hora
// ✅ INCLUYE: Verificación automática de cambios en Riot ID

require('dotenv').config();
const { 
    obtenerTodosLosUsuariosRegistrados, 
    obtenerDatosLoL,
    actualizarDatosLoL 
} = require('../base_de_datos/perfiles_helpers');
const { obtenerDatosUsuario, verificarYActualizarRiotID } = require('../base_de_datos/sheets_helpers');
const { 
    obtenerRangos, 
    obtenerRolesPrincipales,
    regionAPlatforma 
} = require('../apis/lol_api');
const { obtenerRangoTFT } = require('../apis/tft_api');

// Configuración
const INTERVALO_ACTUALIZACION = 60 * 60 * 1000; // 1 hora en milisegundos
const DELAY_ENTRE_USUARIOS = 2000; // 2 segundos entre usuarios (evitar rate limit)

/**
 * Actualiza los datos de LoL de un solo usuario
 * ✅ INCLUYE: Verificación de cambios en Riot ID
 * @param {string} discordId - ID del usuario de Discord
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function actualizarUsuario(discordId) {
    try {
        console.log(`\n📄 Actualizando usuario: ${discordId}`);
        
        // Obtener datos básicos desde Sheets (puuid, region, riotID)
        const datosSheet = await obtenerDatosUsuario(discordId);
        
        if (!datosSheet) {
            console.log(`⚠️ Usuario ${discordId} no encontrado en Sheets`);
            return false;
        }
        
        let { puuid, region, riotID } = datosSheet;
        
        // ✅ NUEVO: Verificar si el Riot ID cambió
        console.log(`🔍 Verificando si Riot ID cambió...`);
        const verificacion = await verificarYActualizarRiotID(discordId, puuid, riotID);
        
        if (verificacion.cambio) {
            console.log(`✅ Riot ID fue actualizado: ${riotID} → ${verificacion.riotIDNuevo}`);
            riotID = verificacion.riotIDNuevo; // Usar el nuevo Riot ID
        }
        
        const plataforma = regionAPlatforma[region];
        const [gameName, tagLine] = riotID.split('#');
        
        // Obtener datos actualizados de Riot API (en paralelo)
        const [rangos, rolesPrincipales, rangoTFT] = await Promise.all([
            obtenerRangos(puuid, plataforma),
            obtenerRolesPrincipales(puuid, plataforma),
            obtenerRangoTFT(gameName, tagLine, plataforma)
        ]);
        
        // Preparar datos para actualizar
        const datosActualizados = {
            riotID: riotID,
            region: region,
            puuid: puuid,
            rangos: {
                soloq: rangos.soloq,
                flex: rangos.flex,
                tft: rangoTFT
            },
            rolesPrincipales: rolesPrincipales
        };
        
        // Guardar en JSON
        const guardado = await actualizarDatosLoL(discordId, datosActualizados);
        
        if (guardado) {
            console.log(`✅ Usuario ${discordId} actualizado correctamente`);
            
            // Log de cambios importantes
            const datosAnteriores = await obtenerDatosLoL(discordId);
            if (datosAnteriores) {
                // Comparar rangos
                if (datosAnteriores.rangos?.soloq?.tier !== rangos.soloq?.tier || 
                    datosAnteriores.rangos?.soloq?.rank !== rangos.soloq?.rank) {
                    console.log(`   📊 Cambio en SoloQ: ${datosAnteriores.rangos?.soloq?.tier || 'Unranked'} ${datosAnteriores.rangos?.soloq?.rank || ''} → ${rangos.soloq?.tier || 'Unranked'} ${rangos.soloq?.rank || ''}`);
                }
            }
            
            return true;
        } else {
            console.log(`❌ Error al guardar datos de ${discordId}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error al actualizar usuario ${discordId}:`, error.message);
        return false;
    }
}

/**
 * Actualiza todos los usuarios registrados
 * @returns {Promise<Object>} - { exitosos, fallidos, total }
 */
async function actualizarTodosLosUsuarios() {
    const inicio = Date.now();
    console.log('\n█████████████████████████████████████████████████████████████████████');
    console.log('🚀 INICIANDO ACTUALIZACIÓN DE PERFILES LoL');
    console.log('█████████████████████████████████████████████████████████████████████');
    console.log(`⏰ Hora: ${new Date().toLocaleString()}`);
    
    // Obtener lista de usuarios registrados
    const usuariosRegistrados = await obtenerTodosLosUsuariosRegistrados();
    const total = usuariosRegistrados.length;
    
    console.log(`👥 Total de usuarios a actualizar: ${total}\n`);
    
    let exitosos = 0;
    let fallidos = 0;
    
    // Actualizar usuarios uno por uno con delay
    for (let i = 0; i < usuariosRegistrados.length; i++) {
        const discordId = usuariosRegistrados[i];
        
        console.log(`[${i + 1}/${total}] Procesando...`);
        
        const resultado = await actualizarUsuario(discordId);
        
        if (resultado) {
            exitosos++;
        } else {
            fallidos++;
        }
        
        // Delay entre usuarios para evitar rate limit
        if (i < usuariosRegistrados.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_USUARIOS));
        }
    }
    
    const duracion = Math.round((Date.now() - inicio) / 1000);
    
    console.log('\n█████████████████████████████████████████████████████████████████████');
    console.log('✅ ACTUALIZACIÓN COMPLETADA');
    console.log('█████████████████████████████████████████████████████████████████████');
    console.log(`✅ Exitosos: ${exitosos}`);
    console.log(`❌ Fallidos: ${fallidos}`);
    console.log(`📊 Total: ${total}`);
    console.log(`⏱️ Duración: ${duracion} segundos`);
    console.log(`⏰ Próxima actualización: ${new Date(Date.now() + INTERVALO_ACTUALIZACION).toLocaleString()}`);
    console.log('█████████████████████████████████████████████████████████████████████\n');
    
    return { exitosos, fallidos, total };
}

/**
 * Inicia el loop de actualización automática
 */
async function iniciarActualizacionAutomatica() {
    console.log('🤖 Sistema de actualización automática iniciado');
    console.log(`⏰ Intervalo: ${INTERVALO_ACTUALIZACION / 1000 / 60} minutos`);
    
    // Primera actualización inmediata
    await actualizarTodosLosUsuarios();
    
    // Programar actualizaciones periódicas
    setInterval(async () => {
        await actualizarTodosLosUsuarios();
    }, INTERVALO_ACTUALIZACION);
}

/**
 * Actualiza un solo usuario específico (útil para testing o comandos manuales)
 * @param {string} discordId - ID del usuario de Discord
 */
async function actualizarUsuarioManual(discordId) {
    console.log(`\n🔧 ACTUALIZACIÓN MANUAL DE USUARIO ${discordId}\n`);
    const resultado = await actualizarUsuario(discordId);
    
    if (resultado) {
        console.log('\n✅ Actualización manual completada exitosamente');
    } else {
        console.log('\n❌ Error en actualización manual');
    }
    
    return resultado;
}

// ============================================================================
// EXPORTS Y EJECUCIÓN
// ============================================================================

module.exports = {
    actualizarUsuario,
    actualizarTodosLosUsuarios,
    iniciarActualizacionAutomatica,
    actualizarUsuarioManual
};

// Si se ejecuta directamente (node actualizar_perfiles_lol.js)
if (require.main === module) {
    // Verificar si hay argumento para actualizar un usuario específico
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] === '--user' && args[1]) {
        // Actualización manual de un usuario
        actualizarUsuarioManual(args[1]).then(() => {
            process.exit(0);
        });
    } else if (args.length > 0 && args[0] === '--once') {
        // Ejecutar una sola vez
        actualizarTodosLosUsuarios().then(() => {
            console.log('✅ Actualización única completada. Saliendo...');
            process.exit(0);
        });
    } else {
        // Modo automático continuo
        iniciarActualizacionAutomatica();
    }
}