// personalizar/personalizar.js (VERSIÓN CORREGIDA - GUARDA EN JSON)
const mensajes = require('./mensajes');
const { iniciarPersonalizacionColor, procesarRespuestaColor } = require('../perfil/funcionalidades/color');

// Guardar el estado de cada usuario en proceso de personalización
const usuariosEnPersonalizacion = new Map();

// ============================================================================
// FUNCIÓN AUXILIAR: Deshabilitar botones
// ============================================================================

/**
 * Deshabilita los botones de color cuando el proceso termina
 */
async function deshabilitarBotonesColor(client, messageId, channelId) {
    try {
        if (!messageId || !channelId) return;
        
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;
        
        const msg = await channel.messages.fetch(messageId);
        if (!msg) return;
        
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const botonesDeshabilitados = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guardar_color_disabled')
                    .setLabel('¡Me encanta, Guardar!')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('1465263781348118564')
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_color_disabled')
                    .setLabel('Probar otro Color')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('1465270799781859393')
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('cancelar_color_disabled')
                    .setLabel('Salir')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('1469787904980156519')
                    .setDisabled(true)
            );
        
        await msg.edit({ components: [botonesDeshabilitados] });
        console.log(`🔒 Botones de color deshabilitados para usuario por proceso terminado`);
    } catch (error) {
        console.error('Error al deshabilitar botones:', error);
    }
}

async function ejecutar(message) {
    const esEnDM = message.channel.isDMBased();
    console.log('=== Ejecutando personalizar ===');
    console.log('Es en DM:', esEnDM);
    
    // Si NO es DM, verificar si ya tiene un proceso en curso
    if (!esEnDM) {
        const tieneProcesoActivo = usuariosEnPersonalizacion.has(message.author.id);
        if (tieneProcesoActivo) {
            await message.reply(mensajes.UsuarioEnPersonalizacion(message.author));
            return;
        }
    }
    
    try {
        // Intentar crear DM
        const dmChannel = esEnDM ? message.channel : await message.author.createDM();
        
        // Limpiar mensajes anteriores de personalización en DM
        const mensajesPrevios = await dmChannel.messages.fetch({ limit: 50 });
        
        const mensajesPersonalizacion = mensajesPrevios.filter(msg => 
            msg.author.id === message.client.user.id && 
            (msg.content.includes('Vamos a personalizar tu perfil') ||
            msg.content.includes('Que quieres editar?'))
        );
        
        for (const [, msgBot] of mensajesPersonalizacion) {
            const mensajesDespues = mensajesPrevios.filter(msg => 
                msg.author.id === message.author.id && 
                msg.createdTimestamp > msgBot.createdTimestamp
            );
            
            if (mensajesDespues.size === 0) {
                await msgBot.delete().catch(() => {});
            }
        }
        
        // Registrar inicio del proceso
        const tiempoInicio = Date.now();
        const estadoUsuario = { 
            etapa: 'menu',
            tiempoInicio: tiempoInicio,
            collector: null // Se asignará después de crear el collector
        };
        usuariosEnPersonalizacion.set(message.author.id, estadoUsuario);
        
        const client = message.client;
        
        // Timeout de 1 hora (3600000 ms)
        setTimeout(async () => {
            const estadoActual = usuariosEnPersonalizacion.get(message.author.id);
            if (estadoActual && estadoActual.tiempoInicio === tiempoInicio) {
                // Deshabilitar botones si existen
                if (estadoActual.messageId && estadoActual.channelId) {
                    await deshabilitarBotonesColor(client, estadoActual.messageId, estadoActual.channelId);
                }
                
                usuariosEnPersonalizacion.delete(message.author.id);
                
                try {
                    await dmChannel.send(mensajes.TimeoutPersonalizacion());
                } catch (error) {
                    console.error('Error al enviar mensaje de timeout:', error);
                }
            }
        }, 3600000); // 1 hora
        
        // Si NO estamos en DM, responder en el canal
        if (!esEnDM) {
            await message.reply(mensajes.LlamadoCustomPerfil(message.author));
        }
        
        // Enviar mensaje de arranque con menú de opciones
        await dmChannel.send(mensajes.ArranqueCustomPerfil());
        
        // Crear collector para esperar respuesta del usuario
        const filter = m => m.author.id === message.author.id;
        const collector = dmChannel.createMessageCollector({ filter, time: 3600000 });
        
        // Asignar el collector al estado del usuario
        const estadoActual = usuariosEnPersonalizacion.get(message.author.id);
        if (estadoActual) {
            estadoActual.collector = collector;
        }
        
        collector.on('collect', async (m) => {
            const estado = usuariosEnPersonalizacion.get(message.author.id);
            if (!estado) return;
            
            // Cancelación
            if (m.content.toLowerCase() === 'aurora!cancelar') {
                const estadoParaCancelar = usuariosEnPersonalizacion.get(message.author.id);
                
                // Deshabilitar botones si existen
                if (estadoParaCancelar?.messageId && estadoParaCancelar?.channelId) {
                    await deshabilitarBotonesColor(client, estadoParaCancelar.messageId, estadoParaCancelar.channelId);
                }
                
                usuariosEnPersonalizacion.delete(message.author.id);
                await dmChannel.send(mensajes.CancelacionPersonalizacion());
                collector.stop();
                return;
            }
            
            // Menu principal - esperar número del 1 al 6
            if (estado.etapa === 'menu') {
                const opcion = m.content.trim();
                
                if (!['1', '2', '3', '4', '5', '6', '#1', '#2', '#3', '#4', '#5', '#6'].includes(opcion)) {
                    await dmChannel.send(mensajes.OpcionInvalida());
                    return;
                }
                
                // Extraer número
                const numero = opcion.replace('#', '');
                
                switch(numero) {
                    case '1':
                        await dmChannel.send('**Biografía** - Funcionalidad próximamente disponible.');
                        // Por ahora, cerrar el proceso
                        usuariosEnPersonalizacion.delete(message.author.id);
                        collector.stop();
                        break;
                    case '2':
                        // Iniciar personalización de color
                        console.log('🎨 Iniciando personalización de color...');
                        try {
                            const nuevoEstado = await iniciarPersonalizacionColor(dmChannel, message.author.id);
                            console.log('✅ Estado actualizado:', nuevoEstado);
                            // Enviar el mensaje inicial de color aquí
                            const mensajes = require('./mensajes');
                            await dmChannel.send(mensajes.EditarColorPerfil());
                            usuariosEnPersonalizacion.set(message.author.id, {
                                ...estado,
                                ...nuevoEstado
                            });
                        } catch (error) {
                            console.error('❌ Error en personalización de color:', error);
                            await dmChannel.send('❌ Error al iniciar personalización de color. Revisa la consola.');
                        }
                        break;
                    case '3':
                        await dmChannel.send('**Fijar campeón favorito** - Funcionalidad próximamente disponible.');
                        usuariosEnPersonalizacion.delete(message.author.id);
                        collector.stop();
                        break;
                    case '4':
                        await dmChannel.send('**Agregar redes sociales** - Funcionalidad próximamente disponible.');
                        usuariosEnPersonalizacion.delete(message.author.id);
                        collector.stop();
                        break;
                    case '5':
                        await dmChannel.send('**Avatar** - Funcionalidad próximamente disponible.');
                        usuariosEnPersonalizacion.delete(message.author.id);
                        collector.stop();
                        break;
                    case '6':
                        await dmChannel.send('**Cartel** - Funcionalidad próximamente disponible.');
                        usuariosEnPersonalizacion.delete(message.author.id);
                        collector.stop();
                        break;
                }
            }
            
            // Esperando color (opción #2)
            if (estado.etapa === 'esperando_color') {
                const resultado = await procesarRespuestaColor(m, client, dmChannel);
                
                if (resultado.esperandoConfirmacion) {
                    // Guardar color temporal y esperar botón
                    usuariosEnPersonalizacion.set(message.author.id, {
                        ...estado,
                        etapa: 'confirmando_color',
                        colorTemporal: resultado.colorTemporal,
                        emojiColor: resultado.emojiColor,
                        messageId: resultado.messageId,
                        channelId: dmChannel.id
                    });
                } else if (resultado.completado) {
                    // Proceso completado o error, limpiar estado
                    usuariosEnPersonalizacion.delete(message.author.id);
                    collector.stop();
                }
                // Si no está completado y no está esperando confirmación, el usuario debe reintentar
            }
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                usuariosEnPersonalizacion.delete(message.author.id);
            }
        });
        
    } catch (error) {
        console.error('Error al crear DM:', error);
        
        // Solo responder si NO estamos ya en DM
        if (!esEnDM) {
            await message.reply(mensajes.FalloCustomPerfil(message.author));
        }
    }
}

/**
 * Maneja las interacciones de botones de confirmación de color
 */
async function manejarBotonColor(interaction, client) {
    const { actualizarColorPerfil } = require('../base_de_datos/perfiles_helpers');
    const { limpiarCache } = require('../perfil/cache');
    const { iniciarPersonalizacionColor } = require('../perfil/funcionalidades/color.js');
    
    const userId = interaction.user.id;
    const estado = usuariosEnPersonalizacion.get(userId);
    
    if (!estado || estado.etapa !== 'confirmando_color') {
        await interaction.reply(
            mensajes.ErrorProcesoExpirado()
        );
        return;
    }
    
    const dmChannel = interaction.channel;
    
    try {
        // Crear botones deshabilitados
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const botonesDeshabilitados = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('guardar_color')
                    .setLabel('¡Me encanta, Guardar!')
                    .setStyle(interaction.customId === 'guardar_color' ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setEmoji('1465263781348118564')
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('reintentar_color')
                    .setLabel('Probar otro Color')
                    .setStyle(interaction.customId === 'reintentar_color' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setEmoji('1465270799781859393')
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('cancelar_color')
                    .setLabel('Salir')
                    .setStyle(interaction.customId === 'cancelar_color' ? ButtonStyle.Danger : ButtonStyle.Secondary)
                    .setEmoji('1469787904980156519')
                    .setDisabled(true)
            );
        
        if (interaction.customId === 'guardar_color') {
            // Guardar color en perfiles_personalizacion.json
            const guardado = await actualizarColorPerfil(userId, estado.colorTemporal);
            
            if (guardado) {
                // Limpiar cache para que se actualice el perfil
                limpiarCache(userId);
                console.log(`✅ Color guardado en JSON para usuario ${userId}: ${estado.colorTemporal}`);
                
                // Actualizar el mensaje con los botones deshabilitados
                await interaction.update({
                    components: [botonesDeshabilitados]
                });
                
                // Responder con el mensaje de éxito
                await interaction.followUp(
                    mensajes.ColorGuardadoExito(estado.emojiColor, estado.colorTemporal)
                );
            } else {
                // Actualizar el mensaje con los botones deshabilitados
                await interaction.update({
                    components: [botonesDeshabilitados]
                });
                
                await interaction.followUp(mensajes.ErrorGuardarColor());
            }
            
            // Detener el collector después de guardar
            const estadoParaDetener = usuariosEnPersonalizacion.get(userId);
            if (estadoParaDetener && estadoParaDetener.collector) {
                estadoParaDetener.collector.stop();
            }
            usuariosEnPersonalizacion.delete(userId);
            
        } else if (interaction.customId === 'reintentar_color') {
            // Actualizar el mensaje con los botones deshabilitados
            await interaction.update({
                components: [botonesDeshabilitados]
            });
            
            // Obtener el estado actual para preservar el collector
            const estadoActual = usuariosEnPersonalizacion.get(userId);
            
            // Actualizar el estado para volver a esperar color (preservando el collector)
            usuariosEnPersonalizacion.set(userId, {
                etapa: 'esperando_color',
                subFuncionalidad: 'color',
                collector: estadoActual?.collector // Preservar el collector
            });
            
            // Enviar solo el mensaje inicial de color
            await dmChannel.send(mensajes.EditarColorPerfil());
            
        } else if (interaction.customId === 'cancelar_color') {
            // Actualizar el mensaje con los botones deshabilitados
            await interaction.update({
                components: [botonesDeshabilitados]
            });
            
            // Enviar confirmación de cancelación
            await interaction.followUp(mensajes.CancelacionPersonalizacion());
            
            // Detener el collector después de cancelar
            const estadoParaDetener = usuariosEnPersonalizacion.get(userId);
            if (estadoParaDetener && estadoParaDetener.collector) {
                estadoParaDetener.collector.stop();
            }
            usuariosEnPersonalizacion.delete(userId);
        }
        
    } catch (error) {
        console.error('Error al manejar botón de color:', error);
        await interaction.reply(
            mensajes.ErrorProcesarBoton()
        );
    }
}

module.exports = {
    ejecutar,
    usuariosEnPersonalizacion,
    manejarBotonColor
};