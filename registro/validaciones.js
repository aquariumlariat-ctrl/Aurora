// registro/validaciones.js (VERSIÓN CORREGIDA)
const mensajes = require('./mensajes');
const { crearEmbedPerfil } = require('./embed_perfil');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { 
    regionAPlatforma, 
    verificarCuentaRiot, 
    obtenerSummoner,
    obtenerRangos,
    obtenerCampeonesFavoritos, 
    obtenerUltimasPartidas,
    obtenerRolesPrincipales
} = require('../apis/lol_api');
const { obtenerRangoTFT } = require('../apis/tft_api');
const { crearEntradaLoL, actualizarPersonalizacion } = require('../base_de_datos/perfiles_helpers');

// Validar formato de Riot ID
async function validarRiotID(message, estadoUsuario, usuariosEnRegistro) {
    const riotID = message.content.trim();
    
    if (!riotID.includes('#')) {
        await message.reply(mensajes.TAGIncorrectoRegistro);
        return;
    }
    
    const [nombre, tag] = riotID.split('#');
    
    if (!nombre || !tag) {
        await message.reply(mensajes.IDIncorrectoRegistro);
        return;
    }
    
    estadoUsuario.riotID = riotID;
    estadoUsuario.etapa = 'region';
    usuariosEnRegistro.set(message.author.id, estadoUsuario);
    
    await message.reply(mensajes.RegionRegistro(riotID));
}

// Validar región y verificar cuenta
async function validarRegion(message, estadoUsuario, usuariosEnRegistro) {
    const region = message.content.trim().toUpperCase();
    const regionesValidas = ['LAN', 'LAS', 'NA', 'BR'];
    
    if (!regionesValidas.includes(region)) {
        await message.reply(mensajes.RegionInvalidaRegistro);
        return;
    }
    
    estadoUsuario.region = region;
    
    // Mostrar mensaje de loading
    const loadingMessage = await message.reply(mensajes.CargandoEmbedRegistro);
    
    const [gameName, tagLine] = estadoUsuario.riotID.split('#');
    const resultado = await verificarCuentaRiot(gameName, tagLine, region);
    
    if (resultado.existe) {
        const plataforma = regionAPlatforma[region];
        const puuid = resultado.data.puuid;
        
        try {
            // Obtener summoner primero (necesario para iconoId)
            const summoner = await obtenerSummoner(puuid, plataforma);
            
            if (!summoner) {
                await loadingMessage.edit(mensajes.ErrorSummonerRegistro);
                return;
            }
            
            // Hacer llamadas en paralelo para optimizar velocidad (LoL + TFT + Roles)
            const [rangos, rangoTFT, campeonesFavoritos, ultimasPartidas, rolesPrincipales] = await Promise.all([
                obtenerRangos(puuid, plataforma),
                obtenerRangoTFT(gameName, tagLine, plataforma),
                obtenerCampeonesFavoritos(puuid, plataforma),
                obtenerUltimasPartidas(puuid, plataforma),
                obtenerRolesPrincipales(puuid, plataforma)
            ]);
            
            estadoUsuario.etapa = 'confirmacion';
            estadoUsuario.riotID = `${resultado.data.gameName}#${resultado.data.tagLine}`;
            estadoUsuario.region = region;
            estadoUsuario.puuid = puuid;
            estadoUsuario.rangos = {
                soloq: rangos.soloq,
                flex: rangos.flex,
                tft: rangoTFT
            };
            estadoUsuario.rolesPrincipales = rolesPrincipales;
            
            const datosJugador = {
                riotID: `${resultado.data.gameName}#${resultado.data.tagLine}`,
                region: region,
                iconoId: summoner.profileIconId,
                rangos: {
                    soloq: rangos.soloq,
                    flex: rangos.flex,
                    tft: rangoTFT
                },
                campeonesFavoritos: campeonesFavoritos,
                ultimasPartidas: ultimasPartidas
            };
            
            const embed = await crearEmbedPerfil(datosJugador);
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirmar_cuenta')
                        .setLabel('Registrar Cuenta')
                        .setEmoji('1465263781348118564')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('reintentar_cuenta')
                        .setLabel('Volver a Comenzar')
                        .setEmoji('1465219188561023124')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await loadingMessage.edit({ 
                content: 'Revisé mis archivos mágicos con la información que me diste. <:AuroraTea:1465551396848930901>\nEncontré esta cuenta… ¿Es la que quieres registrar?\nConfirma con los botones de abajo o dime y empezamos otra vez.',
                embeds: [embed],
                components: [row]
            });
            
            // Guardar el ID del mensaje y canal para poder deshabilitar los botones después
            estadoUsuario.messageId = loadingMessage.id;
            estadoUsuario.channelId = loadingMessage.channel.id;
            usuariosEnRegistro.set(message.author.id, estadoUsuario);
        } catch (error) {
            console.error('❌ Error al obtener datos:', error);
            await loadingMessage.edit(mensajes.ErrorSummonerRegistro);
            return;
        }
    } else {
        estadoUsuario.etapa = 'riotid';
        usuariosEnRegistro.set(message.author.id, estadoUsuario);
        await loadingMessage.edit(mensajes.CuentaNoEncontradaRegistro);
    }
}

/**
 * Guardar datos iniciales en AMBOS JSON
 * Esta función se llama cuando el usuario confirma su cuenta
 * @param {string} userId - ID del usuario de Discord
 * @param {Object} estadoUsuario - Estado del usuario en registro
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
async function guardarDatosIniciales(userId, estadoUsuario) {
    try {
        // 1. Crear entrada en perfiles_lol_datos.json
        const datosLoL = {
            riotID: estadoUsuario.riotID,
            region: estadoUsuario.region,
            puuid: estadoUsuario.puuid,
            rangos: estadoUsuario.rangos,
            rolesPrincipales: estadoUsuario.rolesPrincipales || []
        };
        
        const guardadoLoL = await crearEntradaLoL(userId, datosLoL);
        
        // 2. Crear entrada DEFAULT en perfiles_personalizacion.json
        const datosPersonalizacion = {
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
        
        const guardadoPersonalizacion = await actualizarPersonalizacion(userId, datosPersonalizacion);
        
        // Retornar true solo si AMBOS se guardaron correctamente
        const exito = guardadoLoL && guardadoPersonalizacion;
        
        if (exito) {
            console.log(`✅ Usuario ${userId} creado en ambos JSON`);
        } else {
            console.error(`❌ Error al crear usuario ${userId} en JSON`);
        }
        
        return exito;
        
    } catch (error) {
        console.error(`❌ Error en guardarDatosIniciales:`, error);
        return false;
    }
}

module.exports = {
    validarRiotID,
    validarRegion,
    guardarDatosIniciales
};