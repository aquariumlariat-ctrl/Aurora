// scripts/migrar_usuarios_sheets_a_json.js
// Script de migración ÚNICA: Toma usuarios de Google Sheets y crea entradas en perfiles_lol_datos.json

require('dotenv').config();
const { cargarTodosLosUsuarios, obtenerDatosUsuario } = require('../base_de_datos/sheets_helpers');
const { crearEntradaLoL } = require('../base_de_datos/perfiles_helpers');
const { 
    obtenerRangos, 
    obtenerRolesPrincipales,
    regionAPlatforma 
} = require('../apis/lol_api');
const { obtenerRangoTFT } = require('../apis/tft_api');

const DELAY_ENTRE_USUARIOS = 2000; // 2 segundos entre usuarios

/**
 * Migra un usuario de Sheets a JSON
 * @param {string} discordId - ID del usuario
 * @returns {Promise<boolean>} - true si se migró correctamente
 */
async function migrarUsuario(discordId) {
    try {
        console.log(`\n🔄 Migrando usuario: ${discordId}`);
        
        // 1. Obtener datos desde Sheets
        const datosSheet = await obtenerDatosUsuario(discordId);
        
        if (!datosSheet) {
            console.log(`   ⚠️ No encontrado en Sheets`);
            return false;
        }
        
        const { puuid, region, riotID } = datosSheet;
        const plataforma = regionAPlatforma[region];
        const [gameName, tagLine] = riotID.split('#');
        
        console.log(`   📝 Riot ID: ${riotID}`);
        console.log(`   🌎 Región: ${region}`);
        
        // 2. Obtener datos de Riot API
        console.log(`   ⏳ Obteniendo datos de Riot API...`);
        
        const [rangos, rolesPrincipales, rangoTFT] = await Promise.all([
            obtenerRangos(puuid, plataforma),
            obtenerRolesPrincipales(puuid, plataforma),
            obtenerRangoTFT(gameName, tagLine, plataforma)
        ]);
        
        // 3. Crear entrada en JSON
        const datosParaJSON = {
            riotID: riotID,
            region: region,
            puuid: puuid,
            rangos: {
                soloq: rangos.soloq,
                flex: rangos.flex,
                tft: rangoTFT
            },
            rolesPrincipales: rolesPrincipales || []
        };
        
        const guardado = await crearEntradaLoL(discordId, datosParaJSON);
        
        if (guardado) {
            console.log(`   ✅ Migrado exitosamente`);
            
            // Log de rangos
            if (rangos.soloq) {
                console.log(`   🏆 SoloQ: ${rangos.soloq.tier} ${rangos.soloq.rank} (${rangos.soloq.lp} LP)`);
            }
            if (rolesPrincipales && rolesPrincipales.length > 0) {
                console.log(`   🎮 Roles: ${rolesPrincipales.map(r => `${r.rol} (${r.porcentaje}%)`).join(', ')}`);
            }
            
            return true;
        } else {
            console.log(`   ❌ Error al guardar en JSON`);
            return false;
        }
        
    } catch (error) {
        console.error(`   ❌ Error al migrar: ${error.message}`);
        return false;
    }
}

/**
 * Migra todos los usuarios de Sheets a JSON
 */
async function migrarTodosLosUsuarios() {
    const inicio = Date.now();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🚀 MIGRACIÓN INICIAL: SHEETS → JSON');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`⏰ Hora: ${new Date().toLocaleString()}\n`);
    
    try {
        // 1. Obtener todos los IDs de usuarios desde Sheets
        console.log('📋 Obteniendo usuarios desde Google Sheets...');
        const idsUsuarios = await cargarTodosLosUsuarios();
        
        // Filtrar el "0" que aparece en registrados.json
        const idsValidos = idsUsuarios.filter(id => id !== "0" && id.length > 10);
        
        const total = idsValidos.length;
        console.log(`✅ Encontrados ${total} usuarios para migrar\n`);
        
        if (total === 0) {
            console.log('⚠️ No hay usuarios para migrar. Verifica Google Sheets.');
            return;
        }
        
        let exitosos = 0;
        let fallidos = 0;
        
        // 2. Migrar usuarios uno por uno
        for (let i = 0; i < idsValidos.length; i++) {
            const discordId = idsValidos[i];
            
            console.log(`\n[${ i + 1}/${total}] ════════════════════════════════`);
            
            const resultado = await migrarUsuario(discordId);
            
            if (resultado) {
                exitosos++;
            } else {
                fallidos++;
            }
            
            // Delay entre usuarios
            if (i < idsValidos.length - 1) {
                console.log(`\n   ⏳ Esperando ${DELAY_ENTRE_USUARIOS / 1000}s antes del siguiente...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_USUARIOS));
            }
        }
        
        const duracion = Math.round((Date.now() - inicio) / 1000);
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ MIGRACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`✅ Exitosos: ${exitosos}`);
        console.log(`❌ Fallidos: ${fallidos}`);
        console.log(`📊 Total: ${total}`);
        console.log(`⏱️ Duración: ${duracion} segundos (${Math.round(duracion / 60)} minutos)`);
        console.log('═══════════════════════════════════════════════════════');
        
        if (exitosos > 0) {
            console.log('\n🎉 ¡Migración exitosa!');
            console.log('Ahora puedes usar:');
            console.log('  - Aurora!perfil (carga desde JSON)');
            console.log('  - node scripts/actualizar_perfiles_lol.js (actualización automática)');
        }
        
    } catch (error) {
        console.error('\n❌ Error fatal en la migración:', error);
    }
}

// Ejecutar
migrarTodosLosUsuarios().then(() => {
    console.log('\n👋 Migración finalizada. Saliendo...\n');
    process.exit(0);
});