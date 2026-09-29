export const TIPOS_AREA = ['Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'Secretaria', 'SalaEspera', 'Enfermeria', 'Pasillo'];
export const NOMBRES_TIPO = { Quirofano: 'Quirófano', Habitacion: 'Habitación', Bano: 'Baño', Recepcion: 'Recepción', Secretaria: 'Secretaría', SalaEspera: 'Sala de espera', Enfermeria: 'Enfermería', Pasillo: 'Pasillo' };
export const ROLES = ['Administrador', 'Generico'];
// Referencia de dimensiones únicamente; nunca se presentan áreas ficticias como datos del servidor.
export const PLANO_REFERENCIA = [
  ['Recepción', 'Recepcion', 12, 17, 18, 22], ['Secretaría', 'Secretaria', 32, 17, 16, 20],
  ['Sala de Espera', 'SalaEspera', 56, 17, 22, 22], ['Enfermería', 'Enfermeria', 82, 17, 20, 20],
  ['Pasillo', 'Pasillo', 50, 37, 90, 8], ['Quirófano', 'Quirofano', 15, 62, 22, 28],
  ['Baño 1', 'Bano', 8, 84, 9, 10], ['Baño 2', 'Bano', 22, 84, 9, 10],
  ['Habitación 1', 'Habitacion', 55, 56, 20, 18], ['Habitación 2', 'Habitacion', 80, 56, 20, 18],
  ['Habitación 3', 'Habitacion', 55, 80, 20, 18], ['Habitación 4', 'Habitacion', 80, 80, 20, 18],
].map(([nombre, tipo, coordenadas_x, coordenadas_y, ancho, alto]) => ({ nombre, tipo, coordenadas_x, coordenadas_y, ancho, alto }));
export function normalizarArea(area) {
  const reference = PLANO_REFERENCIA.find(item => item.nombre === area.nombre) || PLANO_REFERENCIA.find(item => item.tipo === area.tipo);
  return { ...area, coordenadas_x: area.coordenadas_x ?? area.coord_x, coordenadas_y: area.coordenadas_y ?? area.coord_y, ancho: area.ancho ?? reference?.ancho ?? 16, alto: area.alto ?? reference?.alto ?? 18 };
}
export function posicion(item) {
  return { left: `${item.coordenadas_x ?? item.coord_x}%`, top: `${item.coordenadas_y ?? item.coord_y}%` };
}

