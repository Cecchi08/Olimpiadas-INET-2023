import { useState } from 'react';
import Modal from './Modal';
import Feedback from './Feedback';
import { useSocket } from '../hooks/useSocket';
import { llamadosAPI, mensajeError } from '../services/api';
import { habilitarAudio } from '../utils/alarma';
import styles from './ModalSimulacion.module.css';
import ui from '../styles/ui.module.css';
export default function ModalSimulacion({ pacientes, areas, initialPatient = '', onClose, onSuccess }) {
  const [pacienteId, setPacienteId] = useState(String(initialPatient));
  const [origen, setOrigen] = useState('Cama');
  const [tipo, setTipo] = useState('Emergencia');
  const [banoId, setBanoId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { registrarLlamado } = useSocket();
  const patient = pacientes.find(row => String(row.id) === pacienteId);
  const invalidBed = origen === 'Cama' && patient && !patient.cama_id;
  async function submit(event) {
    event.preventDefault(); habilitarAudio(); setBusy(true); setError('');
    try {
      const { data } = await llamadosAPI.crear({
        paciente_id: Number(pacienteId), origen, tipo, simulacion: true,
        area_id: origen === 'Baño' ? Number(banoId) : patient.area_id
      });
      registrarLlamado(data); onSuccess?.('Simulación activada. Se atenderá automáticamente a los 30 segundos si sigue pendiente.'); onClose();
    } catch (failure) { setError(mensajeError(failure)); }
    finally { setBusy(false); }
  }
  return <Modal title="Simular Código Azul" onClose={() => { if (!busy) onClose(); }}>
    <form className={`${ui.form} ${styles.form}`} onSubmit={submit}>
      <p className={styles.note}>Modo demostración · atención automática a los 30 segundos.</p>
      <label className={ui.field}>Paciente<select aria-label="Paciente" value={pacienteId} onChange={event => setPacienteId(event.target.value)} required disabled={busy}><option value="">Seleccionar paciente</option>{pacientes.map(row => <option key={row.id} value={row.id}>{row.nombre} · DNI {row.dni}</option>)}</select></label>
      <div className={ui.row}><label className={ui.field}>Origen<select aria-label="Origen" value={origen} onChange={event => setOrigen(event.target.value)} disabled={busy}><option>Cama</option><option>Baño</option></select></label>
        <label className={ui.field}>Tipo<select aria-label="Tipo" value={tipo} onChange={event => setTipo(event.target.value)} disabled={busy}><option>Emergencia</option><option>Normal</option></select></label></div>
      {origen === 'Baño' && <label className={ui.field}>Baño de origen<select aria-label="Baño de origen" value={banoId} onChange={event => setBanoId(event.target.value)} required disabled={busy}><option value="">Seleccionar baño</option>{areas.filter(area => area.tipo === 'Bano').map(area => <option key={area.id} value={area.id}>{area.nombre}</option>)}</select></label>}
      {invalidBed && <p className={ui.error} role="alert">El paciente no tiene cama asignada. Asignale una cama o seleccioná Baño.</p>}
      {!pacientes.length && <p className={ui.notice}>Primero registrá un paciente en la página Pacientes.</p>}
      <Feedback error={error} />
      <div className={ui.formFooter}><button type="button" className={ui.secondary} onClick={onClose} disabled={busy}>Cancelar</button><button className={ui.primary} disabled={busy || !pacientes.length || invalidBed} aria-busy={busy}>{busy ? 'Activando…' : 'ACTIVAR ALARMA'}</button></div>
    </form>
  </Modal>;
}
