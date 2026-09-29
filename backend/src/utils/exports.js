import PDFDocument from 'pdfkit';
import json2csv from 'json2csv';

const fields = ['id', 'paciente', 'area', 'cama', 'origen', 'tipo', 'estado',
  'fecha_activacion', 'fecha_atencion', 'tiempo_respuesta_seg', 'enfermero'];

export function exportRows(rows) {
  return rows.map(row => ({
    id: row.id, paciente: row.paciente?.nombre || '', area: row.area?.nombre || '',
    cama: row.cama?.nombre || '', origen: row.origen, tipo: row.tipo, estado: row.estado,
    fecha_activacion: row.fecha_activacion, fecha_atencion: row.fecha_atencion || '',
    tiempo_respuesta_seg: row.tiempo_respuesta_seg ?? '', enfermero: row.enfermero?.email || ''
  }));
}

export function createCsv(rows) {
  const safe = exportRows(rows).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key, typeof value === 'string' && /^[\s\uFEFF]*[=+\-@\t\r\n]/u.test(value) ? `'${value}` : value
  ])));
  return '\uFEFF' + new json2csv.Parser({ fields }).parse(safe);
}

export function createPdf(rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(20).text('Código Azul - Reporte de llamados');
    doc.moveDown().fontSize(10).text(`Generado: ${new Date().toISOString()} | Total: ${rows.length}`);
    for (const row of exportRows(rows)) {
      if (doc.y > 665) doc.addPage();
      doc.moveDown().fontSize(11).text(`#${row.id} | ${row.tipo} | ${row.estado}`);
      doc.fontSize(9).text(`Paciente: ${row.paciente} | Área: ${row.area} | Cama: ${row.cama}`);
      doc.text(`Origen: ${row.origen} | Activación: ${row.fecha_activacion}`);
      doc.text(`Atención: ${row.fecha_atencion || '-'} | Respuesta: ${row.tiempo_respuesta_seg === '' ? '-' : row.tiempo_respuesta_seg + ' s'}`);
      doc.text(`Enfermero: ${row.enfermero || '-'}`);
    }
    if (!rows.length) doc.moveDown().text('Sin llamados para los filtros seleccionados.');
    doc.end();
  });
}
