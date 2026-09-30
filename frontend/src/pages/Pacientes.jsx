import { useState } from 'react';
import { useRecursos } from '../hooks/useRecursos';
import { useCrud } from '../hooks/useCrud';
import TablaGenerica from '../components/TablaGenerica';
import Modal from '../components/Modal';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import Feedback from '../components/Feedback';
import styles from './Pacientes.module.css';
import ui from '../styles/ui.module.css';
const textMedical = value => typeof value === 'object' && value !== null ? JSON.stringify(value) : value || '';
function PacienteForm({ crud, areas, camas, pacientes, nurses }) {
  const patient = crud.editing;
  const [areaId, setAreaId] = useState(String(patient.area_id || ''));
  const [camaId, setCamaId] = useState(String(patient.cama_id || ''));
  async function submit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    await crud.save({ nombre: form.nombre.trim(), dni: form.dni.trim(), datos_medicos: form.datos_medicos, area_id: Number(areaId), cama_id: camaId ? Number(camaId) : null, enfermero_asignado_id: form.enfermero_asignado_id.trim() || null });
  }
  return <form onSubmit={submit} className={ui.form}>
    <label className={ui.field}>Nombre completo<input name="nombre" defaultValue={patient.nombre || ''} required maxLength={160} disabled={crud.busy} /></label>
    <label className={ui.field}>DNI<input name="dni" inputMode="numeric" pattern="[0-9]{6,12}" title="Entre 6 y 12 dígitos" defaultValue={patient.dni || ''} required disabled={crud.busy} /></label>
    <label className={ui.field}>Datos médicos<textarea name="datos_medicos" defaultValue={textMedical(patient.datos_medicos)} disabled={crud.busy} /></label>
    <div className={ui.row}><label className={ui.field}>Área<select aria-label="Área" value={areaId} onChange={event => { setAreaId(event.target.value); setCamaId(''); }} required disabled={crud.busy}><option value="">Seleccionar área</option>{areas.map(area => <option value={area.id} key={area.id}>{area.nombre}</option>)}</select></label>
    <label className={ui.field}>Cama<select aria-label="Cama" value={camaId} onChange={event => setCamaId(event.target.value)} disabled={!areaId || crud.busy}><option value="">Sin cama asignada</option>{camas.filter(cama => String(cama.area_id) === areaId && !pacientes.some(item => String(item.cama_id) === String(cama.id) && item.id !== patient.id)).map(cama => <option value={cama.id} key={cama.id}>{cama.nombre}</option>)}</select></label></div>
    <label className={ui.field}>Enfermero asignado<select aria-label="Enfermero asignado" name="enfermero_asignado_id" defaultValue={patient.enfermero_asignado_id || patient.enfermero_id || ''} disabled={crud.busy}><option value="">Sin asignar</option>{nurses.map(nurse => <option key={nurse.id} value={nurse.id}>{nurse.nombre || nurse.email}{nurse.area ? ` · ${nurse.area.nombre}` : ''}</option>)}</select></label>
    {crud.error && <p className={ui.error} role="alert">{crud.error}</p>}
    <div className={ui.formFooter}><button type="button" className={ui.secondary} disabled={crud.busy} onClick={crud.close}>Cancelar</button><button className={ui.primary} disabled={crud.busy}>{crud.busy ? 'Guardando…' : 'Guardar paciente'}</button></div>
  </form>;
}
export default function Pacientes() {
  const { data, loading, error, reload } = useRecursos(['/api/pacientes', '/api/areas', '/api/camas', '/api/enfermeros']);
  const crud = useCrud('/api/pacientes', reload);
  const [search, setSearch] = useState('');
  const pacientes = data['/api/pacientes'] || [];
  const areas = data['/api/areas'] || [];
  const camas = data['/api/camas'] || [];
  const columns = [
    { key: 'id', label: 'ID' }, { key: 'nombre', label: 'Nombre' }, { key: 'dni', label: 'DNI' },
    { key: 'datos_medicos', label: 'Datos médicos', render: row => <span className={styles.medical} title={textMedical(row.datos_medicos)}>{textMedical(row.datos_medicos) || '—'}</span> },
    { key: 'cama_id', label: 'Cama', render: row => camas.find(item => item.id === row.cama_id)?.nombre || row.cama?.nombre || 'Sin asignar' },
    { key: 'area_id', label: 'Área', render: row => areas.find(item => item.id === row.area_id)?.nombre || row.area?.nombre || '—' },
    { key: 'enfermero_asignado_id', label: 'Enfermero', render: row => row.enfermero?.nombre || row.enfermero?.email || row.enfermero_asignado_id || row.enfermero_id || 'Sin asignar' },
  ];
  return <div className={styles.page}><div className={ui.header}><div><p className={ui.eyebrow}>GESTIÓN HOSPITALARIA</p><h1 className={ui.title}>Pacientes</h1><p className={ui.subtitle}>Información y asignaciones para una atención coordinada.</p></div><button className={ui.primary} disabled={loading || Boolean(error)} onClick={() => crud.edit()}>＋ Nuevo Paciente</button></div>
    <div className={styles.toolbar}><input className={ui.search} aria-label="Buscar pacientes" placeholder="Buscar por nombre o DNI…" value={search} onChange={event => setSearch(event.target.value)} /><span>{pacientes.length} pacientes</span><button className={ui.secondary} onClick={reload} disabled={loading}>Actualizar</button></div>
    <Feedback error={error} success={crud.success} loading={loading} />
    <TablaGenerica columns={columns} rows={pacientes.filter(row => `${row.nombre} ${row.dni}`.toLowerCase().includes(search.toLowerCase()))} loading={loading} actions={row => <><button className={ui.secondary} onClick={() => crud.edit(row)}>Editar</button><button className={ui.danger} onClick={() => crud.remove(row)}>Eliminar</button></>} />
    {crud.editing && <Modal title={crud.editing.id ? 'Editar paciente' : 'Nuevo paciente'} onClose={crud.close}><PacienteForm crud={crud} areas={areas} camas={camas} pacientes={pacientes} nurses={data['/api/enfermeros'] || []} /></Modal>}
    <ConfirmarEliminar crud={crud} />
  </div>;
}
