import { useState } from 'react';
import api, { mensajeError } from '../services/api';
export function useCrud(path, reload) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function edit(row = {}) { setError(''); setEditing(row); }
  function remove(row) { setError(''); setDeleting(row); }
  function close() { if (!busy) { setEditing(null); setDeleting(null); setError(''); } }
  async function save(payload) {
    setBusy(true); setError('');
    try {
      if (editing.id != null) await api.put(`${path}/${editing.id}`, payload);
      else await api.post(path, payload);
      setEditing(null); reload(); return true;
    } catch (err) { setError(mensajeError(err)); return false; }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    setBusy(true); setError('');
    try { await api.delete(`${path}/${deleting.id}`); setDeleting(null); reload(); }
    catch (err) { setError(mensajeError(err)); }
    finally { setBusy(false); }
  }
  return { editing, deleting, busy, error, edit, remove, close, save, confirmDelete };
}

