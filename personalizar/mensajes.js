// personalizar/mensajes.js

module.exports = {
    // Respuesta en el canal cuando se puede enviar DM
    LlamadoCustomPerfil: (usuario) => `¡Hola ${usuario}! Feliz de verte de nuevo. <:AuroraHiiiiii:1465210040989388810> 
Vamos adelante con la personalizacion de tu perfil.
Te he enviado un mensaje privado con los pasos a seguir.`,
    
    // Usuario ya tiene un proceso en curso
    UsuarioEnPersonalizacion: (usuario) => `¡Hola ${usuario}! <:AuroraHiiiiii:1465210040989388810>
Ya tienes un proceso de personalización abierto.
Revisa tus mensajes privados para continuar con él.`,
    
    // Error al enviar DM
    FalloCustomPerfil: (usuario) => `¡Hola ${usuario}! Feliz de verte de nuevo. <:AuroraHiiiiii:1465210040989388810> 
He intentado comenzar con la personalizacion de tu perfil, pero no pude enviarte un mensaje privado. 
Asegúrate de tener los mensajes privados abiertos e intentalo de nuevo.`,
    
    // Mensaje inicial en DM con menú
    ArranqueCustomPerfil: () => `Vamos a personalizar tu perfil. <:AuroraClap:1465217066813493386>
Te guiaré paso a paso para que puedas editarlo a tu gusto.
    
Puedes cancelar el proceso en cualquier momento usando el comando \`Aurora!cancelar\`.
El proceso permanecerá abierto durante 1 hora; pasado ese tiempo se cancelará automáticamente.

Para continuar, selecciona una opción de la lista.
**¿Qué quieres editar?**

\`\`#1\`\`  Biografía  |  \`\`#5\`\`  Avatar  
\`\`#2\`\`  Color          |  \`\`#6\`\`  Cartel
\`\`#3\`\`  Fijar campeón favorito
\`\`#4\`\`  Agregar redes sociales`,
    
    // Cancelación del proceso
    CancelacionPersonalizacion: () => `Has cancelado el proceso de personalización. <:AuroraBonk:1465219188561023124> 
Puedes iniciar uno nuevo en cualquier momento.
Cuando quieras volver a intentarlo, estaré aquí.`,
    
    // Timeout (1 hora)
    TimeoutPersonalizacion: () => `Se ha acabado el tiempo de personalización. <:AuroraDead:1465242238794862686>
Puedes iniciar uno nuevo en cualquier momento.
Cuando quieras volver a intentarlo, estaré aquí.`,
    
    // Opción inválida
    OpcionInvalida: () => `¡Esa opción no es válida! <:AuroraPout:1465262072932728939>
Por favor, selecciona un número del \`\`#1\`\` al \`\`#6\`\` para continuar.`,
};