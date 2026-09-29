export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function dbResult({ data, error }) {
  if (error) {
    const errors = {
      '23505': [409, 'El registro ya existe o la cama está ocupada'],
      '23503': [409, 'Referencia inexistente o registro utilizado por otros datos'],
      '23001': [409, 'El registro está utilizado por otros datos'],
      '23514': [400, 'Los datos incumplen una restricción'],
      '22P02': [400, 'Formato de datos inválido'],
      PGRST116: [404, 'Registro no encontrado'],
      PGRST205: [503, 'Faltan tablas en Supabase. Ejecutar backend/supabase/schema.sql en un proyecto nuevo.'],
      PGRST202: [503, 'Faltan funciones en Supabase. Revisar la instalación del esquema.'],
      PGRST204: [503, 'El esquema de Supabase está desactualizado. Aplicar la actualización de backend/supabase/migrations.'],
      '42703': [503, 'El esquema de Supabase está desactualizado. Aplicar la actualización de backend/supabase/migrations.'],
      PT400: [400, error.message], PT404: [404, error.message], PT409: [409, error.message]
    };
    const mapped = errors[error.code];
    if (mapped) throw new AppError(...mapped);
    console.error('Error de base de datos', { code: error.code });
    throw new AppError(503, 'Base de datos no disponible');
  }
  return data;
}
