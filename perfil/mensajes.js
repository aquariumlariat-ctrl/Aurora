// perfil/mensajes.js

module.exports = {
    // Usuario sin registro
    UsuarioSinRegistro: (usuario) => `¡Hola ${usuario}! <:AuroraHiiiiii:1465210040989388810>
No tienes una cuenta registrada aún.
Usa \`Aurora!registro\` para registrarte.`,
    
    // Cargando perfil
    CargandoPerfil: `Estoy buscando tu perfil, dame un momento por favor. <a:AuroraLoading:1466251290576290049>`,
    
    // Error al cargar perfil
    ErrorCargarPerfil: `Hubo un problema al cargar tu perfil. <:AuroraPout:1465262072932728939>
Por favor, intenta nuevamente más tarde.`,
    
    // Usuario mencionado sin registro
    UsuarioMencionadoSinRegistro: (usuarioMencionado) => `${usuarioMencionado} no tiene una cuenta registrada. <:AuroraPout:1465262072932728939>`,
    
    // Cargando perfil de usuario mencionado
    CargandoPerfilMencionado: (usuarioMencionado) => `Estoy buscando el perfil de ${usuarioMencionado}, dame un momento por favor. <a:AuroraLoading:1466251290576290049>`,
    
    // Número de registro no encontrado
    NumeroRegistroNoEncontrado: (numero) => `No encontré ningún usuario con el número de registro ${numero}. <:AuroraPout:1465262072932728939>`,
    
    // Cargando perfil por número de registro
    CargandoPerfilNumero: (numero) => `Estoy buscando el perfil del registro ${numero}, dame un momento por favor. <a:AuroraLoading:1466251290576290049>`,
    
    // ID no encontrado
    IdNoEncontrado: `No encontré ningún usuario registrado con ese ID. <:AuroraPout:1465262072932728939>`,
    
    // Cargando perfil por ID
    CargandoPerfilId: `Estoy buscando ese perfil, dame un momento por favor. <a:AuroraLoading:1466251290576290049>`,
};