// perfil/perfil.js
const mensajes = require('./mensajes');
const { cargarUsuariosDesdeSheet } = require('../registro/google_sheets');
const { 
    regionAPlatforma, 
    obtenerSummoner,
    obtenerRangos,
    obtenerCampeonesFavoritos, 
    obtenerUltimasPartidas,
    obtenerRolPrincipal,
    obtenerRolesPrincipales
} = require('../registro/riot_api');
const { obtenerRangoTFT } = require('../tft_elo');
const { crearEmbedPerfilUsuario } = require('./embed_perfil_usuario');
const { google } = require('googleapis');
require('dotenv').config();

// Sistema de cache de perfiles
const cachePerfiles = new Map();
const TIEMPO_CACHE = 5 * 60 * 1000; // 5 minutos

// Función para verificar si el cache es válido
function esCacheValido(userId) {
    const datosCache = cachePerfiles.get(userId);
    if (!datosCache) return false;
    
    const tiempoTranscurrido = Date.now() - datosCache.timestamp;
    return tiempoTranscurrido < TIEMPO_CACHE;
}

// Función para guardar en cache
function guardarEnCache(userId, datosJugador, embed) {
    cachePerfiles.set(userId, {
        datosJugador,
        embed,
        timestamp: Date.now()
    });
}

// Función para obtener del cache
function obtenerDeCache(userId) {
    return cachePerfiles.get(userId);
}

// Obtener credenciales de Google (reutilizado de google_sheets)
function obtenerCredenciales() {
    try {
        const credentials = {
            type: 'service_account',
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
        };
        
        return credentials;
    } catch (error) {
        console.error('Error al cargar credenciales:', error);
        return null;
    }
}

// Autenticar con Google Sheets
async function autenticar() {
    const credentials = obtenerCredenciales();
    
    if (!credentials) {
        throw new Error('No se pudieron cargar las credenciales de Google');
    }
    
    const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    return await auth.getClient();
}

// Función para obtener Riot ID actual desde PUUID
async function obtenerRiotIDActual(puuid) {
    try {
        const routingRegion = 'americas';
        const url = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
        
        const response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RIOT_API_KEY
            }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            return `${data.gameName}#${data.tagLine}`;
        }
        
        return null;
    } catch (error) {
        console.error('Error al obtener Riot ID actual:', error);
        return null;
    }
}

// Función para actualizar Riot ID en Google Sheets
async function actualizarRiotIDEnSheet(discordId, nuevoRiotID) {
    try {
        const authClient = await autenticar();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        
        // Obtener todas las filas para encontrar el índice del usuario
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:J'
        });
        
        const valores = response.data.values || [];
        const filas = valores.slice(2); // Saltar título y encabezados
        
        // Encontrar el índice de la fila (sumamos 3 porque: 1 título + 1 encabezados + índice base 1)
        const indiceRelativo = filas.findIndex(fila => fila[1] === discordId);
        
        if (indiceRelativo === -1) {
            console.error('Usuario no encontrado en Sheet para actualizar');
            return false;
        }
        
        const filaReal = indiceRelativo + 3; // +3 por las 2 filas de cabecera + base 1
        
        // Actualizar columna D (Riot ID)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `D${filaReal}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[nuevoRiotID]]
            }
        });
        
        console.log(`✅ Riot ID actualizado en Sheet: ${nuevoRiotID}`);
        return true;
        
    } catch (error) {
        console.error('Error al actualizar Riot ID en Sheet:', error);
        return false;
    }
}

// Obtener datos de un usuario desde Google Sheets
async function obtenerDatosUsuario(discordId) {
    try {
        const authClient = await autenticar();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        
        // Obtener todas las filas (ahora incluye columna J - PUUID)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:J' // Todas las columnas incluyendo PUUID
        });
        
        const valores = response.data.values || [];
        
        // Saltar las primeras 2 filas (título y encabezados)
        const filas = valores.slice(2);
        
        // Buscar la fila del usuario (columna B = Discord ID)
        const filaUsuario = filas.find(fila => fila[1] === discordId);
        
        if (!filaUsuario) {
            return null;
        }
        
        // Retornar datos estructurados
        return {
            numeroRegistro: filaUsuario[0],      // A: Número de Registro
            discordId: filaUsuario[1],           // B: ID Discord
            discordUsername: filaUsuario[2],     // C: Username Discord
            riotID: filaUsuario[3],              // D: RIOT ID
            region: filaUsuario[4],              // E: Región
            rangoSoloq: filaUsuario[5],          // F: Clasificación Solo/Duo
            rangoFlex: filaUsuario[6],           // G: Clasificación Flexible
            rangoTFT: filaUsuario[7],            // H: Clasificación TFT
            fechaRegistro: filaUsuario[8],       // I: Fecha de Registro
            puuid: filaUsuario[9]                // J: PUUID
        };
        
    } catch (error) {
        console.error('❌ Error al obtener datos del usuario:', error);
        return null;
    }
}

// Obtener datos de un usuario por número de registro
async function obtenerDatosUsuarioPorNumero(numeroRegistro) {
    try {
        const authClient = await autenticar();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        
        // Obtener todas las filas (ahora incluye columna J - PUUID)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A:J' // Todas las columnas incluyendo PUUID
        });
        
        const valores = response.data.values || [];
        
        // Saltar las primeras 2 filas (título y encabezados)
        const filas = valores.slice(2);
        
        // Buscar la fila por número de registro (columna A)
        const filaUsuario = filas.find(fila => fila[0] === numeroRegistro);
        
        if (!filaUsuario) {
            return null;
        }
        
        // Retornar datos estructurados
        return {
            numeroRegistro: filaUsuario[0],      // A: Número de Registro
            discordId: filaUsuario[1],           // B: ID Discord
            discordUsername: filaUsuario[2],     // C: Username Discord
            riotID: filaUsuario[3],              // D: RIOT ID
            region: filaUsuario[4],              // E: Región
            rangoSoloq: filaUsuario[5],          // F: Clasificación Solo/Duo
            rangoFlex: filaUsuario[6],           // G: Clasificación Flexible
            rangoTFT: filaUsuario[7],            // H: Clasificación TFT
            fechaRegistro: filaUsuario[8],       // I: Fecha de Registro
            puuid: filaUsuario[9]                // J: PUUID
        };
        
    } catch (error) {
        console.error('❌ Error al obtener datos por número de registro:', error);
        return null;
    }
}

// Comando principal de perfil
async function ejecutar(message) {
    // Determinar de quién mostrar el perfil
    let datosSheet = null;
    let usuarioObjetivo;
    let tipoBusqueda = 'propio'; // 'propio', 'mencion', 'id', 'numero'
    
    // Obtener el argumento después del comando
    const args = message.content.trim().split(/\s+/);
    const argumento = args[1]; // Aurora!perfil [argumento]
    
    // 1. Verificar si hay una mención (@usuario)
    if (message.mentions.users.size > 0) {
        const usuarioMencionado = message.mentions.users.first();
        datosSheet = await obtenerDatosUsuario(usuarioMencionado.id);
        usuarioObjetivo = usuarioMencionado;
        tipoBusqueda = 'mencion';
    }
    // 2. Verificar si es un número de registro (#1, #2, etc.)
    else if (argumento && argumento.startsWith('#')) {
        const numeroRegistro = argumento; // Mantener el formato #1, #2, etc.
        datosSheet = await obtenerDatosUsuarioPorNumero(numeroRegistro);
        
        if (datosSheet) {
            // Intentar obtener el usuario de Discord
            try {
                usuarioObjetivo = await message.client.users.fetch(datosSheet.discordId);
            } catch {
                // Si no se puede obtener el usuario, usar nombre del Sheet
                usuarioObjetivo = { username: datosSheet.discordUsername };
            }
        }
        tipoBusqueda = 'numero';
    }
    // 3. Verificar si es un Discord ID (solo números, 17-19 dígitos)
    else if (argumento && /^\d{17,19}$/.test(argumento)) {
        datosSheet = await obtenerDatosUsuario(argumento);
        
        if (datosSheet) {
            // Intentar obtener el usuario de Discord
            try {
                usuarioObjetivo = await message.client.users.fetch(argumento);
            } catch {
                // Si no se puede obtener el usuario, usar nombre del Sheet
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
    
    // Verificar si se encontraron datos
    if (!datosSheet) {
        if (tipoBusqueda === 'propio') {
            await message.reply(mensajes.UsuarioSinRegistro(message.author));
        } else if (tipoBusqueda === 'mencion') {
            await message.reply(mensajes.UsuarioMencionadoSinRegistro(usuarioObjetivo));
        } else if (tipoBusqueda === 'numero') {
            await message.reply(mensajes.NumeroRegistroNoEncontrado(argumento));
        } else if (tipoBusqueda === 'id') {
            await message.reply(mensajes.IdNoEncontrado);
        }
        return;
    }
    
    // Verificar si hay cache válido
    if (esCacheValido(datosSheet.discordId)) {
        const cache = obtenerDeCache(datosSheet.discordId);
        await message.reply({ embeds: [cache.embed] });
        return;
    }
    
    // Mostrar mensaje de carga
    let mensajeCarga;
    if (tipoBusqueda === 'propio') {
        mensajeCarga = mensajes.CargandoPerfil;
    } else if (tipoBusqueda === 'mencion') {
        mensajeCarga = mensajes.CargandoPerfilMencionado(usuarioObjetivo);
    } else if (tipoBusqueda === 'numero') {
        mensajeCarga = mensajes.CargandoPerfilNumero(argumento);
    } else {
        mensajeCarga = mensajes.CargandoPerfilId;
    }
    
    const loadingMessage = await message.reply(mensajeCarga);
    
    try {
        // Extraer información
        let [gameName, tagLine] = datosSheet.riotID.split('#'); // Cambiado a 'let' para poder reasignar
        const region = datosSheet.region;
        const plataforma = regionAPlatforma[region];
        
        // Usar PUUID del Sheet (ya no necesitamos llamar a verificarCuentaRiot)
        const puuid = datosSheet.puuid;
        
        // Si no hay PUUID en el Sheet (usuarios antiguos), obtenerlo de la API
        let puuidFinal = puuid;
        if (!puuid) {
            const { verificarCuentaRiot } = require('../registro/riot_api');
            const resultado = await verificarCuentaRiot(gameName, tagLine, region);
            
            if (!resultado.existe) {
                await loadingMessage.edit(mensajes.ErrorCargarPerfil);
                return;
            }
            
            puuidFinal = resultado.data.puuid;
        }
        
        // 🔄 VERIFICAR Y ACTUALIZAR RIOT ID SI CAMBIÓ
        if (puuidFinal) {
            const riotIDActual = await obtenerRiotIDActual(puuidFinal);
            
            if (riotIDActual && riotIDActual !== datosSheet.riotID) {
                console.log(`🔄 Riot ID cambió: ${datosSheet.riotID} → ${riotIDActual}`);
                
                // Actualizar en Google Sheets
                await actualizarRiotIDEnSheet(datosSheet.discordId, riotIDActual);
                
                // Actualizar en datos locales para usar el nuevo
                datosSheet.riotID = riotIDActual;
                const [nuevoGameName, nuevoTagLine] = riotIDActual.split('#');
                // Actualizar variables locales
                gameName = nuevoGameName;
                tagLine = nuevoTagLine;
            }
        }
        
        // Obtener datos actualizados de Riot
        const summoner = await obtenerSummoner(puuidFinal, plataforma);
        
        if (!summoner) {
            await loadingMessage.edit(mensajes.ErrorCargarPerfil);
            return;
        }
        
        
        // Hacer llamadas en paralelo para optimizar (LoL data + TFT)
        const [rangos, rangoTFT, campeonesFavoritos, ultimasPartidas, rolesPrincipales] = await Promise.all([
            obtenerRangos(puuidFinal, plataforma),
            obtenerRangoTFT(gameName, tagLine, plataforma), // ✅ CAMBIO: Ahora usa gameName y tagLine
            obtenerCampeonesFavoritos(puuidFinal, plataforma),
            obtenerUltimasPartidas(puuidFinal, plataforma),
            obtenerRolesPrincipales(puuidFinal, plataforma)
        ]);
        
        // Obtener avatar y nombre de visualización del usuario de Discord
        let discordAvatar = usuarioObjetivo.displayAvatarURL ? usuarioObjetivo.displayAvatarURL({ size: 256 }) : null;
        let nombreVisualizacion = usuarioObjetivo.displayName || usuarioObjetivo.globalName || usuarioObjetivo.username;
        
        // Preparar datos para el nuevo embed
        const datosJugador = {
            discordUsername: nombreVisualizacion,
            discordAvatar: discordAvatar,
            riotID: datosSheet.riotID,
            region: region,
            thumbnailUrl: null, // Por defecto usa la imagen https://i.imgur.com/vmjLxxr.png
            rangos: {
                soloq: rangos.soloq,
                flex: rangos.flex,
                tft: rangoTFT
            },
            campeonesFavoritos: campeonesFavoritos,
            ultimasPartidas: ultimasPartidas,
            // Campos opcionales (por ahora sin datos, se implementarán después)
            rolesPrincipales: rolesPrincipales,
            campeonFavorito: null,
            club: null,
            clubEmoji: null,
            puesto: null, // Puesto en el club (por defecto "Miembro")
            pareja: null,
            insignias: [],
            biografia: '*Este usuario es todo un misterio… aún no ha agregado una biografía a su perfil.*',
            redesSociales: null
        };
        
        // Crear el embed
        const embed = await crearEmbedPerfilUsuario(datosJugador);
        
        // Guardar en cache
        guardarEnCache(datosSheet.discordId, datosJugador, embed);
        
        // Editar el mensaje de loading con el embed
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