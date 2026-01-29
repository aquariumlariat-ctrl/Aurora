// index.js
const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();
const registroCommand = require('./registro/registro');

// Crear el cliente del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel]
});

// Cuando el bot esté listo
client.on('ready', async () => {
    console.log(`${client.user.tag} se ha encendido correctamente.`);
    
    // Inicializar cache de usuarios registrados
    await registroCommand.inicializarCache();
});

// Cuando alguien escriba un mensaje
client.on('messageCreate', async (message) => {
    // Ignorar mensajes del propio bot
    if (message.author.bot) return;
    
    const content = message.content;
    
    // Si es un DM, procesar según el contexto
    if (message.channel.isDMBased()) {
        // Si hay registro en proceso, tratar Aurora!registro como respuesta normal
        const tieneRegistro = registroCommand.tieneRegistroEnProceso(message.author.id);
        
        if (content.toLowerCase().startsWith('aurora!registro') && !tieneRegistro) {
            // Solo iniciar registro si NO hay uno en proceso
            await registroCommand.ejecutar(message);
            return;
        }
        
        // Procesar respuesta del registro (incluye Aurora!registro si ya hay proceso)
        await registroCommand.procesarRespuestaDM(message);
        return;
    }
    
    // Detectar comando Aurora!registro en canal
    if (content.toLowerCase().startsWith('aurora!registro')) {
        await registroCommand.ejecutar(message);
        return;
    }
});

// Manejar interacciones de botones
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'confirmar_cuenta' || interaction.customId === 'reintentar_cuenta') {
        await registroCommand.manejarBotonConfirmacion(interaction);
    }
});

// Conectar el bot
client.login(process.env.DISCORD_TOKEN);