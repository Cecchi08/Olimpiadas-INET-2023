import { useCallback, useEffect, useState } from 'react';
import { listarTodos, mensajeError } from '../services/api';
export function useRecursos(paths) {
  const key = JSON.stringify(paths);
  const [state, setState] = useState({ data: {}, loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: true, error: '' }));
    });
    Promise.all(JSON.parse(key).map(async path => [path, await listarTodos(path, {}, controller.signal)]))
      .then(entries => { if (!controller.signal.aborted) setState({ data: Object.fromEntries(entries), loading: false, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: mensajeError(error) })); });
    return () => controller.abort();
  }, [key, revision]);
  return { ...state, reload };
}

