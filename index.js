// index.js
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const registroCommand = require('./registro/registro');

// Crear el cliente del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ]
});

// Cuando el bot esté listo
client.on('clientReady', () => {
    console.log(`${client.user.tag} se ha encendido correctamente.`);
});

// Cuando alguien escriba un mensaje
client.on('messageCreate', async (message) => {
    // Ignorar mensajes del propio bot
    if (message.author.bot) return;
    
    // Si es un DM (mensaje directo)
    if (message.channel.isDMBased()) {
        await registroCommand.procesarRespuestaDM(message);
        return;
    }
    
    // Responder a un mensaje simple
    if (message.content === 'ping') {
        message.reply('pong!');
    }

    // Detectar comando Aurora!registro (case insensitive para la A)
    const content = message.content;
    if (content.toLowerCase().startsWith('aurora!registro')) {
        await registroCommand.ejecutar(message);
    }
});

// Conectar el bot
client.login(process.env.DISCORD_TOKEN);