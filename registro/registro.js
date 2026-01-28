// registro/registro.js
const mensajes = require('./mensajes');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { estaVetado, registrarCancelacion, registrarTimeout } = require('./cancelaciones');
const { validarRiotID, validarRegion } = require('./validaciones');

// Guardar el estado de cada usuario en proceso de registro
const usuariosEnRegistro = new Map();

async function ejecutar(message) {
    const esEnDM = message.channel.isDMBased();
    console.log('=== Ejecutando registro ===');
    console.log('Es en DM:', esEnDM);
    
    // Si NO es DM, verificar si ya tiene un registro en proceso
    if (!esEnDM) {
        const tieneRegistro = usuariosEnRegistro.has(message.author.id);
        if (tieneRegistro) {
            await message.reply(mensajes.UsuarioEnRegistro(message.author));
            return;
        }
    }
    
    // Verificar si el usuario está vetado
    const veto = await estaVetado(message.author.id);
    if (veto.vetado) {
        const tiempoEspera = Math.floor((Date.now() + veto.tiempoRestante * 1000) / 1000);
        
        if (veto.tipoCausa === 'timeout') {
            await message.reply(mensajes.VetoPorTimeOutsRegistro(tiempoEspera));
        } else {
            await message.reply(mensajes.VetoPorCancelacionRegistro(tiempoEspera));
        }
        return;
    }
    
    try {
        const dmChannel = esEnDM ? message.channel : await message.author.createDM();
        
        const mensajesPrevios = await dmChannel.messages.fetch({ limit: 50 });
        
        const mensajesRegistro = mensajesPrevios.filter(msg => 
            msg.author.id === message.client.user.id && 
            (msg.content.includes('Bienvenido al proceso de registro') ||
            msg.content.includes('Empecemos con el registro de tu cuenta de League of Legends.'))
        );
        
        for (const [, msgBot] of mensajesRegistro) {
            const mensajesDespues = mensajesPrevios.filter(msg => 
                msg.author.id === message.author.id && 
                msg.createdTimestamp > msgBot.createdTimestamp
            );
            
            if (mensajesDespues.size === 0) {
                await msgBot.delete().catch(() => {});
            }
        }
        
        const tiempoInicio = Date.now();
        usuariosEnRegistro.set(message.author.id, { 
            etapa: 'riotid',
            tiempoInicio: tiempoInicio
        });
        
        setTimeout(async () => {
            const estadoActual = usuariosEnRegistro.get(message.author.id);
            if (estadoActual && estadoActual.tiempoInicio === tiempoInicio) {
                usuariosEnRegistro.delete(message.author.id);
                
                // Registrar timeout
                const userData = await registrarTimeout(message.author.id);
                
                try {
                    if (userData.vetoHasta) {
                        // Tercer timeout - veto aplicado
                        const tiempoEspera = Math.floor(userData.vetoHasta / 1000);
                        await message.author.send(mensajes.VetoPorTimeOutsRegistro(tiempoEspera));
                    } else {
                        // Timeout normal (1ro o 2do)
                        await message.author.send(mensajes.TimeOutRegistro());
                    }
                } catch (error) {
                    // Ignorar si no se puede enviar DM
                }
            }
        }, 60 * 60 * 1000);
        
        await message.author.send(mensajes.ArranqueRegistro);
        
        // Solo responder en el canal si NO es un DM
        if (!esEnDM) {
            await message.reply(mensajes.LlamadoRegistro(message.author));
        }
    } catch (error) {
        console.error('Error en ejecutar:', error);
        if (!esEnDM) {
            await message.reply(mensajes.FalloLlamadoRegistro(message.author));
        }
    }
}

async function procesarRespuestaDM(message) {
    const userId = message.author.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    if (!estadoUsuario) return;
    
    if (message.content === 'Aurora!RTO') {
        usuariosEnRegistro.delete(userId);
        
        // Registrar timeout
        const userData = await registrarTimeout(userId);
        
        if (userData.vetoHasta) {
            // Tercer timeout - veto aplicado
            const tiempoEspera = Math.floor(userData.vetoHasta / 1000);
            await message.reply(mensajes.VetoPorTimeOutsRegistro(tiempoEspera));
        } else {
            // Timeout normal (1ro o 2do)
            await message.reply(mensajes.TimeOutRegistro());
        }
        return;
    }
    
    if (message.content.toLowerCase() === 'aurora!cancelar') {
        usuariosEnRegistro.delete(userId);
        
        // Registrar cancelación
        const userData = await registrarCancelacion(userId);
        
        if (userData.vetoHasta) {
            // Tercer cancel - veto aplicado
            const tiempoEspera = Math.floor(userData.vetoHasta / 1000);
            await message.reply(mensajes.VetoPorCancelacionRegistro(tiempoEspera));
        } else {
            // Cancel normal (1ro o 2do)
            await message.reply(mensajes.FinRegistro());
        }
        return;
    }
    
    if (estadoUsuario.etapa === 'riotid') {
        await validarRiotID(message, estadoUsuario, usuariosEnRegistro);
    } else if (estadoUsuario.etapa === 'region') {
        await validarRegion(message, estadoUsuario, usuariosEnRegistro);
    }
}

async function testEmbed(message) {
    const { regionAPlatforma, verificarCuentaRiot, obtenerSummoner, obtenerCampeonesFavoritos, obtenerUltimasPartidas } = require('./riotAPI');
    const { crearEmbedPerfil } = require('./EmbedRegistro');
    
    const gameName = 'cachorracachonda';
    const tagLine = 'juzo';
    const region = 'LAN';
    const plataforma = regionAPlatforma[region];
    
    await message.reply('Generando embed de prueba...');
    
    try {
        const resultado = await verificarCuentaRiot(gameName, tagLine, region);
        
        if (!resultado.existe) {
            await message.reply('No se encontró la cuenta de prueba.');
            return;
        }
        
        const puuid = resultado.data.puuid;
        const summoner = await obtenerSummoner(puuid, plataforma);
        
        if (!summoner) {
            await message.reply('Error al obtener información del summoner.');
            return;
        }
        
        const rangos = {
            soloq: {
                tier: 'CHALLENGER',
                rank: 'I',
                lp: 1000
            },
            flex: {
                tier: 'DIAMOND',
                rank: 'III',
                lp: 45
            },
            tft: null
        };
        
        const campeonesFavoritos = await obtenerCampeonesFavoritos(puuid, plataforma);
        const ultimasPartidas = await obtenerUltimasPartidas(puuid, plataforma);
        
        const datosJugador = {
            riotID: `${gameName}#${tagLine}`,
            region: region,
            iconoId: summoner.profileIconId,
            rangos: rangos,
            campeonesFavoritos: campeonesFavoritos,
            ultimasPartidas: ultimasPartidas
        };
        
        const embed = await crearEmbedPerfil(datosJugador);
        await message.channel.send({ 
            content: 'Revisé mis archivos mágicos con la información que me diste. <:AuroraTea:1465551396848930901>\nEncontré esta cuenta… ¿Es la que quieres registrar?\nConfirma con los botones de abajo o dime y empezamos otra vez.',
            embeds: [embed] 
        });
    } catch (error) {
        console.error('Error en test:', error);
        await message.reply('Error al generar el embed de prueba.');
    }
}

async function manejarBotonConfirmacion(interaction) {
    const userId = interaction.user.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    if (!estadoUsuario) {
        await interaction.reply({ 
            content: 'No tienes un registro en proceso. Usa `Aurora!registro` para comenzar.',
            ephemeral: true 
        });
        return;
    }
    
    if (interaction.customId === 'confirmar_cuenta') {
        const riotID = estadoUsuario.riotID;
        const region = estadoUsuario.region;
        
        usuariosEnRegistro.delete(userId);
        
        const rowDisabled = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta_disabled')
                    .setLabel('Registrar Cuenta')
                    .setEmoji('1465263781348118564')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta_disabled')
                    .setLabel('Volver a Comenzar')
                    .setEmoji('1465219188561023124')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        await interaction.update({ 
            components: [rowDisabled]
        });
        
        await interaction.channel.send(mensajes.CompletoRegistro(riotID, region));
        
    } else if (interaction.customId === 'reintentar_cuenta') {
        estadoUsuario.etapa = 'riotid';
        usuariosEnRegistro.set(userId, estadoUsuario);
        
        const rowDisabled = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirmar_cuenta_disabled')
                    .setLabel('Registrar Cuenta')
                    .setEmoji('1465263781348118564')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_cuenta_disabled')
                    .setLabel('Volver a Comenzar')
                    .setEmoji('1465219188561023124')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );
        
        await interaction.update({ 
            components: [rowDisabled]
        });
        
        await interaction.channel.send(mensajes.ComenzarDeNuevoRegistro);
    }
}

function tieneRegistroEnProceso(userId) {
    return usuariosEnRegistro.has(userId);
}

module.exports = { 
    ejecutar, 
    procesarRespuestaDM, 
    testEmbed, 
    manejarBotonConfirmacion, 
    tieneRegistroEnProceso 
};