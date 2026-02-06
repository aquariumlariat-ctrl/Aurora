// registro/validaciones.js
const mensajes = require('./mensajes');
const { crearEmbedPerfil } = require('./embed_perfil');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { 
    regionAPlatforma, 
    verificarCuentaRiot, 
    obtenerSummoner,
    obtenerRangos,
    obtenerCampeonesFavoritos, 
    obtenerUltimasPartidas 
} = require('./riot_api');
const { obtenerRangoTFT } = require('../tft_elo');

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
            
            
            // Hacer llamadas en paralelo para optimizar velocidad (LoL + TFT)
            const [rangos, rangoTFT, campeonesFavoritos, ultimasPartidas] = await Promise.all([
                obtenerRangos(puuid, plataforma),
                obtenerRangoTFT(gameName, tagLine, plataforma), // ✅ CAMBIO: Ahora usa gameName y tagLine
                obtenerCampeonesFavoritos(puuid, plataforma),
                obtenerUltimasPartidas(puuid, plataforma)
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
            await loadingMessage.edit(mensajes.ErrorSummonerRegistro);
            return;
        }
    } else {
        estadoUsuario.etapa = 'riotid';
        usuariosEnRegistro.set(message.author.id, estadoUsuario);
        await loadingMessage.edit(mensajes.CuentaNoEncontradaRegistro);
    }
}

module.exports = {
    validarRiotID,
    validarRegion
};