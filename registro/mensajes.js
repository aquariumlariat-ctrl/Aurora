// registro/mensajes.js

module.exports = {
    // Respuesta en el canal
    LlamadoRegistro: (usuario) => `¡Hola ${usuario}! Encantada de conocerte. <:AuroraHiiiiii:1465210040989388810>
Vamos a comenzar con el registro de tu Riot ID.
Te he enviado un mensaje privado con los pasos a seguir.`,
    
    // Usuario ya tiene un registro en proceso (solo en servidor)
    UsuarioEnRegistro: (usuario) => `¡Hola ${usuario}! <:AuroraHiiiiii:1465210040989388810>
Ya tienes un proceso de registro abierto.
Revisa tus mensajes privados para continuar con él.`,
    
    // Error de DM
    FalloLlamadoRegistro: (usuario) => `¡Hola ${usuario}! Encantada de conocerte. <:AuroraHiiiiii:1465210040989388810>
He intentado comenzar con el registro de tu Riot ID, pero no pude enviarte un mensaje privado. 
Asegúrate de tener los mensajes privados abiertos e intentalo de nuevo.`,
      
    // Mensaje de bienvenida en DM
    ArranqueRegistro: `Bienvenido al proceso de registro. <:AuroraClap:1465217066813493386>
Este proceso tomará unos minutos y, una vez finalizado, podrás comenzar a utilizar mis funciones.

Puedes cancelar el proceso en cualquier momento usando el comando \`Aurora!cancelar\`.
El registro permanecerá abierto durante 1 hora; pasado ese tiempo se cancelará automáticamente.

Para continuar, envía tu **Riot ID** en el siguiente formato: \`NombreDeInvocador#TAG\`.`,
    
    FinRegistro: () => {
        return `Has cancelado el proceso de registro. <:AuroraBonk:1465219188561023124> 
Puedes iniciar uno nuevo en cualquier momento.
Cuando quieras volver a intentarlo, estaré aquí.`;
    },
    
    VetoPorCancelacionRegistro: (tiempoEspera) => {
        return `Has cancelado muchas veces el proceso de registro. <:AuroraBonk:1465219188561023124> 
Podrás volver a intentarlo <t:${tiempoEspera}:R>.
Cuando quieras volver a intentarlo, estaré aquí para ti.`;
    },
    
    TimeOutRegistro: () => {
        return `Se ha acabado el tiempo de registro. <:AuroraDead:1465242238794862686>
Puedes iniciar uno nuevo en cualquier momento.
Cuando quieras volver a intentarlo, estaré aquí.`;
    },
    
    VetoPorTimeOutsRegistro: (tiempoEspera) => {
        return `El tiempo para completar el registro se ha agotado en múltiples ocasiones. <:AuroraDead:1465242238794862686>
Podrás volver a intentarlo <t:${tiempoEspera}:R>.
Cuando quieras volver a intentarlo, estaré aquí para ti.`;
    },
    
    TAGIncorrectoRegistro: `¡Formato inválido! <:AuroraPout:1465262072932728939>
Debes incluir el #TAG en tu Riot ID.
Ejemplo: \`Hide on bush#KR1\`.`,

    IDIncorrectoRegistro: `¡Formato inválido! <:AuroraPout:1465262072932728939> 
Asegúrate de incluir tanto tu nombre como tu #TAG. 
Ejemplo: \`Hide on bush#KR1\`.`,
    
    RegionRegistro: (riotID) => `¿**${riotID}**? ¡Qué genial tu ID! <:AuroraFlower:1465262865869963440> 
Continuemos con el registro de tu cuenta.
¿A qué región de la lista pertenece?

\`LAN\`  Latinoamérica Norte  |  \`LAS\`  Latinoamérica Sur
 \`NA\`         Norte América        |   \`BR\`                Brasil`,

    RegionInvalidaRegistro: `Esa región no está disponible por el momento. <:AuroraGiggle:1465263781348118564>
Puede que aún no esté habilitada o no sea válida.
Intentalo nuevamente con una de las opciones de la lista.`,
    
    // Cuenta encontrada en Riot
    CuentaEncontrada: (riotID, region) => `✅ ¡Cuenta verificada exitosamente! <:AuroraClap:1465217066813493386>

**Riot ID:** ${riotID}
**Región:** ${region}

Tu cuenta ha sido encontrada en la base de datos de Riot Games.
Ya puedes comenzar a usar todas mis funciones. ¡Que tengas buenas partidas! <:Aurora_Comfy:1463652023747743880>`,

    // Cuenta no encontrada en Riot
    CuentaNoEncontradaRegistro: `No pude encontrar tu cuenta. <:AuroraHmph:1465262072932728939>
Verifica que tu Riot ID y región sean correctos e inténtalo de nuevo.
Para continuar, envía tu **Riot ID** en el siguiente formato: \`NombreDeInvocador#TAG\`.`,
    
    // Registro completado
    CompletoRegistro: (riotID, region) => `¡Registro completado con éxito! <:AuroraClap:1465217066813493386>

**Riot ID:** ${riotID}
**Región:** ${region}

Ya puedes comenzar a usar mis funciones.
¡Te deseo geniales partidas, nos vemos en la Grieta!`,

    // Comenzar de nuevo el registro
    ComenzarDeNuevoRegistro: `Entendido, empecemos de nuevo. <:AuroraBonk:1465219188561023124>

Este proceso tomará unos minutos y, una vez finalizado, podrás comenzar a utilizar mis funciones.
Puedes cancelar el proceso en cualquier momento usando el comando \`Aurora!cancelar\`.

El registro permanecerá abierto durante 1 hora; pasado ese tiempo se cancelará automáticamente.
Para continuar, envía tu **Riot ID** en el siguiente formato: \`NombreDeInvocador#TAG\`.`,
    
    // Registro completado (deprecated - ahora usa CuentaEncontrada)
    registroCompletado: (riotID, region) => `✅ ¡Registro completado exitosamente!
    
**Riot ID:** ${riotID}
**Región:** ${region}

Ya puedes comenzar a usar todas mis funciones. ¡Que tengas buenas partidas! <:Aurora_Comfy:1463652023747743880>`,

    // Sin registro en proceso
    SinRegistroEnProceso: `No tienes un registro en proceso. Usa \`Aurora!registro\` para comenzar <:AuroraPout:1465262072932728939>.`,
    
    // Error al obtener summoner
    ErrorSummonerRegistro: `Hubo un problema al obtener la información de tu cuenta. <:AuroraPout:1465262072932728939>
Por favor, intenta nuevamente más tarde.`,
};