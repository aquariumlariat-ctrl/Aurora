// scripts/inicializar_personalizaciones_default.js
// Crea entradas default en perfiles_personalizacion.json para todos los usuarios registrados

require('dotenv').config();
const { 
    cargarDatosLoL,
    cargarPersonalizaciones,
    guardarPersonalizaciones 
} = require('../base_de_datos/perfiles_helpers');

/**
 * Perfil de personalización por defecto
 */
const PERSONALIZACION_DEFAULT = {
    campeonFavorito: null,
    club: null,
    clubEmoji: null,
    puesto: null,
    pareja: null,
    biografia: '*Este usuario es todo un misterio… aún no ha agregado una biografía a su perfil.*',
    redesSociales: null,
    colorPersonalizado: null,
    thumbnailUrl: null
};

/**
 * Inicializa personalizaciones default para todos los usuarios
 */
async function inicializarPersonalizaciones() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎨 INICIALIZANDO PERSONALIZACIONES DEFAULT');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`⏰ Hora: ${new Date().toLocaleString()}\n`);
    
    try {
        // 1. Cargar usuarios registrados desde perfiles_lol_datos.json
        console.log('📋 Cargando usuarios registrados...');
        const datosLoL = await cargarDatosLoL();
        const idsUsuarios = Object.keys(datosLoL);
        
        console.log(`✅ Encontrados ${idsUsuarios.length} usuarios\n`);
        
        if (idsUsuarios.length === 0) {
            console.log('⚠️ No hay usuarios registrados en perfiles_lol_datos.json');
            console.log('   Ejecuta primero: node scripts/migrar_usuarios_sheets_a_json.js');
            return;
        }
        
        // 2. Cargar personalizaciones actuales
        console.log('📂 Cargando personalizaciones actuales...');
        const personalizaciones = await cargarPersonalizaciones();
        
        let creados = 0;
        let yaExistian = 0;
        
        // 3. Crear entradas default para usuarios sin personalización
        console.log('🔄 Procesando usuarios...\n');
        
        for (const discordId of idsUsuarios) {
            if (personalizaciones[discordId]) {
                console.log(`[${yaExistian + creados + 1}/${idsUsuarios.length}] ✅ ${discordId} - Ya tiene personalización`);
                yaExistian++;
            } else {
                console.log(`[${yaExistian + creados + 1}/${idsUsuarios.length}] ➕ ${discordId} - Creando entrada default`);
                personalizaciones[discordId] = { ...PERSONALIZACION_DEFAULT };
                creados++;
            }
        }
        
        // 4. Guardar personalizaciones actualizadas
        if (creados > 0) {
            console.log(`\n💾 Guardando ${creados} nuevas personalizaciones...`);
            const guardado = await guardarPersonalizaciones(personalizaciones);
            
            if (guardado) {
                console.log('✅ Personalizaciones guardadas correctamente');
            } else {
                console.log('❌ Error al guardar personalizaciones');
            }
        } else {
            console.log('\n⚠️ No había usuarios nuevos para agregar');
        }
        
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ INICIALIZACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`➕ Creados: ${creados}`);
        console.log(`✅ Ya existían: ${yaExistian}`);
        console.log(`📊 Total usuarios: ${idsUsuarios.length}`);
        console.log('═══════════════════════════════════════════════════════');
        
        if (creados > 0) {
            console.log('\n🎉 ¡Inicialización exitosa!');
            console.log('Ahora todos los usuarios tienen personalización default.');
            console.log('Pueden personalizarla con: Aurora!personalizar');
        }
        
    } catch (error) {
        console.error('\n❌ Error fatal:', error);
    }
}

// Ejecutar
inicializarPersonalizaciones().then(() => {
    console.log('\n👋 Inicialización finalizada. Saliendo...\n');
    process.exit(0);
});