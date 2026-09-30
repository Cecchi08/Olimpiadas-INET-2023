import { useState } from 'react';
import api, { mensajeError } from '../services/api';
export function useCrud(path, reload, { createPath = path, updatePath = id => `${path}/${id}` } = {}) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  function edit(row = {}) { setError(''); setSuccess(''); setEditing(row); }
  function remove(row) { setError(''); setSuccess(''); setDeleting(row); }
  function close() { if (!busy) { setEditing(null); setDeleting(null); setError(''); } }
  async function save(payload) {
    setBusy(true); setError('');
    try {
      if (editing.id != null) await api.put(updatePath(editing.id), payload);
      else await api.post(createPath, payload);
      setEditing(null); setSuccess('Registro guardado correctamente.'); reload(); return true;
    } catch (err) { setError(mensajeError(err)); return false; }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    setBusy(true); setError('');
    try { await api.delete(`${path}/${deleting.id}`); setDeleting(null); setSuccess('Registro eliminado correctamente.'); reload(); }
    catch (err) { setError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return { editing, deleting, busy, error, success, edit, remove, close, save, confirmDelete };
}
