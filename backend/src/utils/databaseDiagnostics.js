// Solo se devuelven mensajes controlados: nunca el texto crudo del proveedor,
// su stack, las URLs completas, las cabeceras o los valores de una consulta.
const definitions = {
  DB_HOST_NOT_FOUND: ['host', 'No se pudo resolver el host de Supabase.', 'Revisar el dominio de SUPABASE_URL y el estado del proyecto. El DNS no confirmó ese host.'],
  DB_DNS_TEMPORARY: ['host', 'La resolución DNS falló temporalmente.', 'Revisar DNS, conexión a Internet y VPN. Reintentar cuando la red esté disponible.'],
  DB_CONNECTION_REFUSED: ['puerto', 'La conexión al host y puerto configurados fue rechazada.', 'Comprobar que la API esté activa y que el puerto sea el de HTTP/HTTPS. Revisar también firewall y proxy. Esto no confirma una contraseña incorrecta.'],
  DB_TIMEOUT: ['conexión', 'Supabase no respondió dentro del tiempo permitido.', 'Revisar host, puerto, conectividad, firewall y estado del proyecto. Un timeout no permite determinar por sí solo cuál de esas causas falló.'],
  DB_NETWORK_UNREACHABLE: ['conexión', 'La red o el host de destino no son alcanzables.', 'Revisar conexión a Internet, rutas, VPN, proxy y soporte IPv4/IPv6.'],
  DB_CONNECTION_RESET: ['conexión', 'La conexión con Supabase se interrumpió.', 'Revisar el estado del servicio y posibles cortes en proxy, firewall o red.'],
  DB_TLS_INVALID: ['certificado', 'No se pudo establecer una conexión TLS válida.', 'Revisar el certificado, el dominio de SUPABASE_URL y la fecha del equipo. No desactivar la verificación TLS.'],
  DB_REQUEST_ABORTED: ['conexión', 'La solicitud a Supabase fue cancelada.', 'Puede deberse a una cancelación del cliente. Si existe un timeout explícito se informa por separado.'],
  DB_API_KEY_INVALID: ['credenciales', 'Supabase rechazó la clave o el token de acceso de la API.', 'Revisar SUPABASE_KEY: debe pertenecer al mismo proyecto que SUPABASE_URL y estar vigente. La contraseña de PostgreSQL no reemplaza esta clave.'],
  DB_PERMISSION_DENIED: ['permisos', 'La solicitud no tiene permisos suficientes para acceder a la base de datos.', 'Usar una clave de servidor secret/service_role y revisar grants, roles y RLS. No desactivar RLS para resolverlo.'],
  DB_PASSWORD_INVALID: ['contraseña', 'PostgreSQL rechazó la contraseña de conexión (28P01).', 'Revisar las credenciales PostgreSQL del servicio que conecta directamente a la base. Este backend usa SUPABASE_KEY mediante HTTP, no una contraseña de PostgreSQL.'],
  DB_AUTH_INVALID: ['credenciales', 'PostgreSQL rechazó la configuración de autenticación.', 'Revisar usuario, rol y método de autenticación del conector PostgreSQL. El error no permite atribuirlo solamente a la contraseña.'],
  DB_DATABASE_NOT_FOUND: ['base de datos', 'La base de datos solicitada no existe.', 'Revisar el nombre de la base y la cadena de conexión del servicio PostgreSQL.'],
  DB_CONNECTION_LIMIT: ['conexiones', 'PostgreSQL alcanzó el límite de conexiones.', 'Revisar el pool de conexiones, conexiones sin cerrar y límites del proyecto.'],
  DB_POOL_TIMEOUT: ['conexiones', 'La API agotó el tiempo de espera para obtener una conexión del pool.', 'Revisar saturación del pool, consultas prolongadas y estado de PostgreSQL.'],
  DB_SERVICE_UNAVAILABLE: ['servicio', 'La API no puede conectarse a PostgreSQL o el servicio no está disponible.', 'Revisar estado del proyecto, pausa, mantenimiento y logs de Supabase. Este error no identifica por sí solo host, puerto o contraseña.'],
  DB_TABLE_MISSING: ['esquema', 'La tabla consultada no existe o no está disponible en la caché de la API.', 'En un proyecto nuevo instalar backend/supabase/schema.sql. En una instalación existente revisar la tabla y recargar la caché de PostgREST.'],
  DB_COLUMN_MISSING: ['esquema', 'La columna consultada no existe o el esquema está desactualizado.', 'Aplicar la actualización correspondiente de backend/supabase/migrations y recargar la caché de la API.'],
  DB_FUNCTION_MISSING: ['esquema', 'La función RPC no existe o su firma no coincide.', 'Revisar las funciones del esquema, sus parámetros y la caché de PostgREST.'],
  DB_RELATIONSHIP_MISSING: ['esquema', 'No se pudo resolver la relación entre tablas.', 'Revisar claves foráneas y caché de PostgREST; no se trata de un error de contraseña.'],
  DB_SCHEMA_NOT_EXPOSED: ['esquema', 'El esquema solicitado no está expuesto en la Data API.', 'Revisar los esquemas expuestos del proyecto y los permisos del rol de servidor.'],
  DB_READ_ONLY: ['permisos', 'La base de datos o la transacción está en modo de solo lectura.', 'Revisar el estado de PostgreSQL y si la conexión apunta a una réplica de lectura.'],
  DB_QUERY_CANCELLED: ['consulta', 'PostgreSQL canceló la consulta.', 'Revisar statement_timeout y los logs de cancelación. El código 57014 también puede representar una cancelación manual.'],
  DB_RATE_LIMITED: ['límite', 'Supabase limitó temporalmente la cantidad de solicitudes.', 'Esperar antes de reintentar y revisar los límites de uso.'],
  DB_HTTP_ENDPOINT_INVALID: ['configuración', 'El servidor respondió que el endpoint de la API no existe.', 'SUPABASE_URL debe ser el origen de la API del proyecto, sin /rest/v1, rutas del dashboard ni cadenas PostgreSQL.'],
  DB_UNKNOWN: ['desconocido', 'No se pudo completar la operación de base de datos; la causa no está identificada.', 'Revisar los logs de Supabase y ejecutar npm run check. No se deduce una falla de host, puerto o credenciales sin evidencia.']
};

export function crearDiagnostico(code, sourceCode) {
  const [categoria, mensaje, sugerencia] = definitions[code] || definitions.DB_UNKNOWN;
  return {
    codigo: definitions[code] ? code : 'DB_UNKNOWN', categoria, mensaje, sugerencia,
    ...(sourceCode && /^[A-Z0-9_]{2,40}$/.test(sourceCode) ? { codigo_origen: sourceCode } : {})
  };
}

function evidence(error) {
  const codes = new Set();
  const parts = [];
  const visited = new Set();
  function visit(value, depth = 0) {
    if (!value || typeof value !== 'object' || visited.has(value) || depth > 8) return;
    visited.add(value);
    if (typeof value.code === 'string') codes.add(value.code.toUpperCase());
    for (const key of ['name', 'message', 'details', 'hint']) {
      if (typeof value[key] === 'string') parts.push(value[key].slice(0, 16000));
    }
    visit(value.cause, depth + 1);
    if (Array.isArray(value.errors)) value.errors.forEach(item => visit(item, depth + 1));
  }
  visit(error);
  const text = parts.join(' ');
  // El SDK de PostgREST serializa los códigos de red dentro de details.
  for (const match of text.matchAll(/\b(?:E[A-Z_]+|UND_ERR_[A-Z_]+|CERT_[A-Z_]+|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DB_[A-Z_]+)\b/g)) {
    codes.add(match[0]);
  }
  return { codes, text };
}

export function diagnosticarBaseDatos(error, { status = error?.status } = {}) {
  const { codes, text } = evidence(error);
  const match = (...values) => values.find(value => codes.has(value));
  for (const code of codes) if (definitions[code]) return crearDiagnostico(code);
  const rules = [
    [['ENOTFOUND', 'EAI_NONAME'], 'DB_HOST_NOT_FOUND'],
    [['EAI_AGAIN'], 'DB_DNS_TEMPORARY'],
    [['ECONNREFUSED'], 'DB_CONNECTION_REFUSED'],
    [['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT'], 'DB_TIMEOUT'],
    [['ENETUNREACH', 'EHOSTUNREACH', 'EHOSTDOWN'], 'DB_NETWORK_UNREACHABLE'],
    [['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET'], 'DB_CONNECTION_RESET'],
    [['CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'ERR_TLS_CERT_ALTNAME_INVALID', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'ERR_SSL_WRONG_VERSION_NUMBER'], 'DB_TLS_INVALID'],
    [['28P01'], 'DB_PASSWORD_INVALID'],
    [['28000'], 'DB_AUTH_INVALID'],
    [['3D000'], 'DB_DATABASE_NOT_FOUND'],
    [['53300'], 'DB_CONNECTION_LIMIT'],
    [['PGRST003'], 'DB_POOL_TIMEOUT'],
    [['PGRST000', 'PGRST001', 'PGRST002', '57P01', '57P02', '57P03', '08000', '08001', '08003', '08004', '08006'], 'DB_SERVICE_UNAVAILABLE'],
    [['PGRST301', 'PGRST302', 'PGRST303'], 'DB_API_KEY_INVALID'],
    [['42501'], 'DB_PERMISSION_DENIED'],
    [['42P01', 'PGRST205'], 'DB_TABLE_MISSING'],
    [['42703', 'PGRST204'], 'DB_COLUMN_MISSING'],
    [['42883', 'PGRST202'], 'DB_FUNCTION_MISSING'],
    [['PGRST200', 'PGRST201'], 'DB_RELATIONSHIP_MISSING'],
    [['PGRST106'], 'DB_SCHEMA_NOT_EXPOSED'],
    [['25006'], 'DB_READ_ONLY'],
    [['57014'], 'DB_QUERY_CANCELLED']
  ];
  for (const [values, diagnosis] of rules) {
    const source = match(...values);
    if (source) return crearDiagnostico(diagnosis, source);
  }
  if (/TimeoutError|timed?\s*out|timeout/i.test(text)) return crearDiagnostico('DB_TIMEOUT');
  if (match('ABORT_ERR') || /AbortError/i.test(text)) return crearDiagnostico('DB_REQUEST_ABORTED');
  if (/invalid api key|invalid apikey|no api key found|invalid jwt|jwt expired/i.test(text)) return crearDiagnostico('DB_API_KEY_INVALID');
  if (/password authentication failed/i.test(text)) return crearDiagnostico('DB_PASSWORD_INVALID', '28P01');
  if (status === 401) return crearDiagnostico('DB_API_KEY_INVALID');
  if (status === 403) return crearDiagnostico('DB_PERMISSION_DENIED');
  if (status === 429) return crearDiagnostico('DB_RATE_LIMITED');
  if (status === 404) return crearDiagnostico('DB_HTTP_ENDPOINT_INVALID');
  if (status >= 500) return crearDiagnostico('DB_SERVICE_UNAVAILABLE');
  return crearDiagnostico('DB_UNKNOWN');
}

export class ConfigurationError extends Error {
  constructor(codigo, campo, mensaje, sugerencia) {
    super(mensaje);
    this.name = 'ConfigurationError';
    this.diagnostico = { codigo, categoria: 'configuración', campo, mensaje, sugerencia };
  }
}

export function formatearDiagnostico(error) {
  const diagnostic = error?.diagnostico || diagnosticarBaseDatos(error);
  return `[${diagnostic.codigo}] ${diagnostic.mensaje}\nQué revisar: ${diagnostic.sugerencia}` +
    (diagnostic.codigo_origen ? `\nCódigo del proveedor: ${diagnostic.codigo_origen}` : '');
}

export function diagnosticarPuertoServidor(error, port) {
  const code = error?.code;
  return new ConfigurationError(
    code === 'EADDRINUSE' ? 'SERVER_PORT_IN_USE' : code === 'EACCES' ? 'SERVER_PORT_PERMISSION_DENIED' : 'SERVER_LISTEN_FAILED',
    'PORT',
    code === 'EADDRINUSE' ? `El puerto ${port} del backend ya está ocupado.` :
      code === 'EACCES' ? `No hay permisos para escuchar en el puerto ${port}.` : 'No se pudo abrir el puerto del backend.',
    'Revisar PORT en backend/.env y los procesos locales. Este puerto pertenece a Express; no es el puerto de PostgreSQL.'
  );
}

