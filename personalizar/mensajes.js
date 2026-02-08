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

Para continuar, responde con el elemento que desees editar.

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
Por favor, responde con un número del \`\`#1\`\` al \`\`#6\`\` para continuar.`,
    
    // ========================================================================
    // MENSAJES DE COLOR
    // ========================================================================
    
    // Editar color del perfil (inicio)
    EditarColorPerfil: () => `Vamos a editar el color de tu perfil. <:Aurorarisita:1465263781348118564> 

Envía el color que quieres usar para tu perfil en formato hexadecimal.

Formato: \`\`#RRGGBB\`\`.
Ejemplo:  \`\`#FF5733\`\`.

¿Buscando inspiración?
La siguiente [página](<https://htmlcolorcodes.com>) te puede ayudar a encontrar el color que más te guste.`,

    // Color inválido
    ColorInvalido: () => `No pude encontrar ese color. <:AuroraF:1469787904980156519>
El color debe estar en formato hexadecimal \`#RRGGBB\`.

Te dejo algunos ejemplos para aclararlo un poco:
· \`#FF5733\` | \`#3498DB\` | \`#2ECC71\` | \`#FF6F91\`.

¿Todo más claro? Intentémoslo de nuevo.`,

    // Usuario no registrado
    UsuarioNoRegistradoColor: () => `❌ No estás registrado. Usa \`Aurora!registro\` primero.`,
    
    // Error al cargar perfil
    ErrorCargarPerfilColor: () => `❌ Error al cargar tu perfil.`,
    
    // Preview con color (se usa en código)
    PreviewColor: (emoji, color) => `${emoji}${color} ¡Qué genial color! <:AuroraSquish:1469795883494412310> 

Veamos como se vería tu perfil con este nuevo color.

Confirma con los botones de abajo si te quieres quedar con él.
O puedes decirme y buscamos uno que vaya mejor con tu personalidad.
** **`,

    // Error general al procesar color
    ErrorProcesarColor: () => `❌ **Error**

Hubo un error al crear el preview. Verifica que el bot tenga permisos necesarios.

Si el problema persiste, contacta a un administrador.`,

// ========================================================================
    // MENSAJES DE BOTONES DE COLOR
    // ========================================================================

    // Guardar color - respuesta del botón
    GuardandoColor: () => `Guardando el nuevo color de tu perfil, dame un momento por favor. <a:AuroraLoading:1466251290576290049>`,

    ColorGuardadoExito: (emoji, color) => `Se actualizó el color de tu perfil. <:AuroraTea:1465551396848930901>

${emoji}${color} Es el nuevo color de tu perfil.

Puedes cambiar el color cuando quieras usando el comando \`Aurora!personalizar\`.

¡Nos vemos pronto!`,

    ErrorGuardarColor: () => `❌ Error al guardar el color. Intenta de nuevo más tarde.`,

    // Error general en botones
    ErrorProcesarBoton: () => `❌ Error al procesar tu selección.`,

    ErrorProcesoExpirado: () => `❌ Este proceso ya expiró. Inicia uno nuevo con \`Aurora!personalizar\`.`,

};