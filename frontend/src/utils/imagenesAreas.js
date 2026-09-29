const pngs = import.meta.glob('../assets/{recepcion,secretaria,sala_espera,enfermeria,pasillo,quirofano,bano,habitacion1,habitacion2}.png', { eager: true, query: '?url', import: 'default' });
const names = { Recepcion: 'recepcion', Secretaria: 'secretaria', SalaEspera: 'sala_espera', Enfermeria: 'enfermeria', Pasillo: 'pasillo', Quirofano: 'quirofano', Bano: 'bano' };
export function imagenArea(area) {
  const name = area.tipo === 'Habitacion' ? (/1|3/.test(area.nombre) ? 'habitacion1' : 'habitacion2') : names[area.tipo];
  return pngs[`../assets/${name}.png`] || planoVectorial(area.tipo);
}
export function planoVectorial(tipo) {
  const furniture = tipo === 'Habitacion' ? '<rect x="15" y="34" width="24" height="40" rx="3"/><path d="M15 45h24M18 39h18"/><rect x="65" y="34" width="24" height="40" rx="3"/><path d="M65 45h24M68 39h18"/>' :
    tipo === 'Quirofano' ? '<rect x="39" y="30" width="25" height="49" rx="10"/><circle cx="51" cy="22" r="7"/><path d="M21 45h12M70 45h12M51 79v9"/>' :
    tipo === 'SalaEspera' ? '<path d="M15 35h70M15 42h70M15 62h70M15 69h70M25 32v13M45 32v13M65 32v13M25 59v13M45 59v13M65 59v13"/>' :
    tipo === 'Bano' ? '<ellipse cx="50" cy="52" rx="13" ry="18"/><rect x="37" y="27" width="26" height="13" rx="3"/>' :
    tipo === 'Pasillo' ? '<path d="M8 50h84" stroke-dasharray="4 4"/>' :
    '<path d="M17 35h65v28H65V49H34v26H17z"/><circle cx="48" cy="66" r="7"/>';
  const fill = tipo === 'Pasillo' ? '#f1f5f9' : tipo === 'Quirofano' ? '#eaf5f6' : '#f4f8fd';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><rect x="1" y="1" width="98" height="98" rx="3" fill="${fill}" stroke="#b7c9db" stroke-width="1.5"/><g fill="#e1ebf4" stroke="#a2b8ce" stroke-width="1.4">${furniture}</g><path d="M43 99h15" stroke="white" stroke-width="3"/></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
