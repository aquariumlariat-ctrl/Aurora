// registro/registro.js
const mensajes = require('./mensajes');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { estaVetado, registrarCancelacion, registrarTimeout } = require('../base_de_datos/seguridad/vetos');
const { validarRiotID, validarRegion } = require('./validaciones');
const { guardarRegistro, cargarTodosLosUsuarios } = require('../base_de_datos/sheets_helpers');
const fs = require('fs').promises;
const path = require('path');

// Guardar el estado de cada usuario en proceso de registro
const usuariosEnRegistro = new Map();

// Cache de usuarios registrados (en memoria)
let usuariosRegistrados = new Set();

// Archivo JSON para persistencia
const CACHE_FILE = path.join(__dirname, '../base_de_datos/cache/registrados.json');

// Cargar usuarios al iniciar
async function inicializarCache() {
    try {
        // Cargar desde Google Sheets
        console.log('🔄 Cargando usuarios registrados desde Google Sheets...');
        const idsDesdeSheet = await cargarTodosLosUsuarios();
        
        // Guardar/actualizar JSON
        await fs.writeFile(CACHE_FILE, JSON.stringify(idsDesdeSheet, null, 2));
        
        // Cargar en RAM
        usuariosRegistrados = new Set(idsDesdeSheet);
        
        console.log(`✅ ${usuariosRegistrados.size} usuarios registrados cargados`);
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar cache:', error);
        
        // Intentar cargar desde JSON como fallback
        try {
            const data = await fs.readFile(CACHE_FILE, 'utf8');
            usuariosRegistrados = new Set(JSON.parse(data));
            console.log(`⚠️ Cargado desde cache local (${usuariosRegistrados.size} usuarios)`);
            return true;
        } catch {
            console.log('⚠️ No se pudo cargar cache, iniciando vacío');
            usuariosRegistrados = new Set();
            return false;
        }
    }
}

// Actualizar cache después de nuevo registro
async function actualizarCache(discordId) {
    usuariosRegistrados.add(discordId);
    
    try {
        await fs.writeFile(CACHE_FILE, JSON.stringify([...usuariosRegistrados], null, 2));
    } catch (error) {
        console.error('❌ Error al actualizar cache JSON:', error);
    }
}

async function ejecutar(message) {
    const esEnDM = message.channel.isDMBased();
    
    // Si NO es DM, verificar si ya tiene un registro en proceso
    if (!esEnDM) {
        const tieneRegistro = usuariosEnRegistro.has(message.author.id);
        if (tieneRegistro) {
            await message.reply(mensajes.UsuarioEnRegistro(message.author));
            return;
        }
    }
    
    // Verificar si el usuario ya completó un registro (verificación en RAM - rápida)
    if (usuariosRegistrados.has(message.author.id)) {
        await message.reply(mensajes.UsuarioYaConRegistro(message.author));
        return;
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
        
        const client = message.client;
        
        // Intentar enviar el mensaje inicial al DM
        await message.author.send(mensajes.ArranqueRegistro);
        
        // Solo si el DM se envió correctamente, agregar al usuario al registro
        usuariosEnRegistro.set(message.author.id, { 
            etapa: 'riotid',
            tiempoInicio: tiempoInicio
        });
        
        setTimeout(async () => {
            const estadoActual = usuariosEnRegistro.get(message.author.id);
            if (estadoActual && estadoActual.tiempoInicio === tiempoInicio) {
                // Deshabilitar botones si existen
                if (estadoActual.messageId && estadoActual.channelId) {
                    try {
                        const channel = await client.channels.fetch(estadoActual.channelId);
                        const msg = await channel.messages.fetch(estadoActual.messageId);
                        
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
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            );
                        
                        await msg.edit({ components: [rowDisabled] });
                    } catch (error) {
                        // Ignorar error al deshabilitar botones
                    }
                }
                
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
        
        // Solo responder en el canal si NO es un DM
        if (!esEnDM) {
            await message.reply(mensajes.LlamadoRegistro(message.author));
        }
    } catch (error) {
        console.error('Error en ejecutar:', error);
        
        // Limpiar el estado del usuario si falla
        // Esto previene que quede "atrapado" en un registro fantasma
        usuariosEnRegistro.delete(message.author.id);
        
        // Responder con mensaje de error si no es DM
        if (!esEnDM) {
            // Verificar si el error es por DMs cerrados
            if (error.code === 50007 || error.message?.includes('Cannot send messages to this user')) {
                await message.reply(mensajes.FalloLlamadoRegistro(message.author));
            } else {
                // Otro tipo de error
                await message.reply(`Hubo un error al iniciar el registro. Por favor, intenta nuevamente. <:AuroraPout:1465262072932728939>`);
            }
        }
    }
}

async function procesarRespuestaDM(message) {
    const userId = message.author.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    if (!estadoUsuario) return;
    
    if (message.content.toLowerCase() === 'aurora!cancelar') {
        // Deshabilitar botones si existen
        if (estadoUsuario.messageId && estadoUsuario.channelId) {
            try {
                const channel = await message.client.channels.fetch(estadoUsuario.channelId);
                const msg = await channel.messages.fetch(estadoUsuario.messageId);
                
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
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                
                await msg.edit({ components: [rowDisabled] });
            } catch (error) {
                // Ignorar error al deshabilitar botones
            }
        }
        
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


async function manejarBotonConfirmacion(interaction) {
    const userId = interaction.user.id;
    const estadoUsuario = usuariosEnRegistro.get(userId);
    
    if (!estadoUsuario) {
        await interaction.reply({ 
            content: mensajes.SinRegistroEnProceso,
            ephemeral: true 
        });
        return;
    }
    
    if (interaction.customId === 'confirmar_cuenta') {
        const riotID = estadoUsuario.riotID;
        const region = estadoUsuario.region;
        const puuid = estadoUsuario.puuid;
        const rangos = estadoUsuario.rangos;
        
        // ✅ CAMBIO 1: Guardar en Google Sheets (mantener compatibilidad)
        const datosParaGuardar = {
            discordId: userId,
            discordUsername: interaction.user.username,
            riotID: riotID,
            region: region,
            rangos: rangos,
            puuid: puuid
        };
        
        const guardadoSheet = await guardarRegistro(datosParaGuardar);
        
        // ✅ CAMBIO 2: Guardar en perfiles_lol_datos.json
        const { guardarDatosIniciales } = require('./validaciones');
        const guardadoJSON = await guardarDatosIniciales(userId, estadoUsuario);
        
        // Actualizar cache en memoria y JSON (registrados.json)
        if (guardadoSheet) {
            await actualizarCache(userId);
        }
        
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
        
        if (guardadoSheet && guardadoJSON) {
            await interaction.channel.send(mensajes.CompletoRegistro(riotID, region));
        } else {
            await interaction.channel.send('❌ Hubo un error al completar el registro. Por favor, contacta a un administrador.');
        }
        
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
     
    manejarBotonConfirmacion, 
    tieneRegistroEnProceso,
    inicializarCache
};