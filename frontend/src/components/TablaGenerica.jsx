import styles from './TablaGenerica.module.css';
export default function TablaGenerica({ columns, rows, loading = false, empty = 'No hay registros para mostrar.', actions }) {
  return <div className={styles.wrapper}><table className={styles.table}><thead><tr>{columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}{actions && <th scope="col">Acciones</th>}</tr></thead><tbody>{loading || !rows.length ? <tr><td className={styles.empty} colSpan={columns.length + Number(Boolean(actions))} role="status">{loading ? 'Cargando registros…' : empty}</td></tr> : rows.map(row => <tr key={row.id}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}{actions && <td><div className={styles.actions}>{actions(row)}</div></td>}</tr>)}</tbody></table></div>;
}

