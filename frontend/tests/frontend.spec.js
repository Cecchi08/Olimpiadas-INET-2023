import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { PLANO_REFERENCIA } from '../src/utils/constantes.js';
import { respuestaPorDia } from '../src/utils/reportes.js';
let http;
let io;
const automaticTimers = [];
test.afterEach(() => { for (const timer of automaticTimers.splice(0)) clearTimeout(timer); });
test.beforeAll(async () => {
  http = createServer();
  io = new Server(http, { cors: { origin: '*' } });
  await new Promise(resolve => http.listen(3099, '127.0.0.1', resolve));
});
test.afterAll(async () => { await new Promise(resolve => io.close(resolve)); });
async function setup(page, { rol = 'Administrador', authenticated = true, active = [], delayActive = 0, autoMs = 30000 } = {}) {
  const usuario = { id: 'nurse-1', email: 'equipo@hospital.test', rol };
  const areas = PLANO_REFERENCIA.map((area, index) => ({ ...area, id: index + 1 }));
  const camas = [{ id: 1, area_id: 9, nombre: 'Cama 1', coordenadas_x: 51, coordenadas_y: 57 }];
  const enfermera = { id: 'nurse-2', nombre: 'Enfermera Demo', email: 'enfermera@hospital.test', rol: 'Generico', area_asignada_id: 4, turno: 'Manana', created_at: new Date().toISOString() };
  let users = [usuario,enfermera];
  let pending = [...active];
  let pacientes = [{ id: 1, nombre: 'Paciente de prueba', dni: '12345678', datos_medicos: 'Observación', area_id: 9, cama_id: 1, enfermero_asignado_id: enfermera.id, enfermero: enfermera }];
  const calls = [];
  await page.addInitScript(({ authenticated }) => { if (authenticated) localStorage.setItem('codigoAzul.token', 'test-token'); }, { authenticated });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url()); const path = url.pathname;
    const body = request.postDataJSON();
    calls.push({ path, method: request.method(), body, params: Object.fromEntries(url.searchParams) });
    let result;
    if (path === '/api/auth/me') result = usuario;
    else if (path === '/api/auth/login') {
      if (body.password === 'incorrecta') return route.fulfill({ status: 401, json: { error: 'Credenciales inválidas' } });
      result = { token: 'test-token', usuario };
    } else if (path === '/api/areas' && request.method() === 'POST') { result = { ...body, id: 13 }; areas.push(result); }
    else if (path.startsWith('/api/areas/') && request.method() === 'PUT') { const index = areas.findIndex(row => row.id === Number(path.split('/').at(-1))); result = { ...areas[index], ...body }; areas[index] = result; }
    else if (path.startsWith('/api/areas/') && request.method() === 'DELETE') { areas.splice(areas.findIndex(row => row.id === Number(path.split('/').at(-1))), 1); return route.fulfill({ status: 204 }); }
    else if (path === '/api/areas') result = areas;
    else if (path === '/api/camas' && request.method() === 'POST') { result={...body,id:2}; camas.push(result); }
    else if (path.startsWith('/api/camas/') && request.method() === 'PUT') { const index=camas.findIndex(row=>row.id===Number(path.split('/').at(-1))); result={...camas[index],...body}; camas[index]=result; }
    else if (path.startsWith('/api/camas/') && request.method() === 'DELETE') { camas.splice(camas.findIndex(row=>row.id===Number(path.split('/').at(-1))),1); return route.fulfill({status:204}); }
    else if (path === '/api/camas') result = camas;
    else if (path === '/api/auth/usuarios') result = users;
    else if (path === '/api/enfermeros') result = users.filter(row=>row.rol==='Generico').map(row=>({...row,area:areas.find(area=>area.id===row.area_asignada_id),pacientes_asignados:pacientes.filter(p=>p.enfermero_asignado_id===row.id).length}));
    else if (path === '/api/auth/register') { result = { ...body, id: 'new-user', password: undefined, created_at: new Date().toISOString() }; users.push(result); }
    else if (path.startsWith('/api/auth/usuarios/') && request.method()==='PUT') { const id = path.split('/')[4]; result={...users.find(row=>row.id===id),...body}; users=users.map(row=>row.id===result.id?result:row); }
    else if (path.startsWith('/api/auth/usuarios/') && request.method()==='DELETE') { users=users.filter(row=>row.id!==path.split('/').at(-1)); return route.fulfill({status:204}); }
    else if (path === '/api/pacientes' && request.method() === 'POST') {
      result = { ...body, id: 2 }; pacientes.push(result);
    } else if (path.startsWith('/api/pacientes/') && request.method() === 'PUT') {
      result = { ...body, id: Number(path.split('/').at(-1)) }; pacientes = pacientes.map(row => row.id === result.id ? result : row);
    } else if (path.startsWith('/api/pacientes/') && request.method() === 'DELETE') {
      pacientes = pacientes.filter(row => row.id !== Number(path.split('/').at(-1))); return route.fulfill({ status: 204 });
    } else if (path === '/api/pacientes') result = pacientes;
    else if (path === '/api/llamados/activos') { if (delayActive) await new Promise(resolve => setTimeout(resolve, delayActive)); result = pending; }
    else if (path === '/api/llamados/crear') {
      result={...body,id:55,llamado_id:55,estado:'No Atendido',es_simulacion:true,
        paciente:pacientes.find(row=>row.id===body.paciente_id),area:areas.find(row=>row.id===body.area_id),
        cama:body.origen==='Cama'?camas[0]:null,enfermero_destino:enfermera,enfermero_destino_id:enfermera.id,
        area_enfermero:areas.find(row=>row.id===4),fecha_hora_activacion:new Date().toISOString()};
      pending.push(result); io.emit('nuevoLlamado',result); if(body.tipo==='Emergencia') io.emit('codigoAzul',result);
      automaticTimers.push(setTimeout(()=>{if(pending.some(row=>row.id===55)){pending=pending.filter(row=>row.id!==55);io.emit('llamadoAtendido',{id:55,enfermero:enfermera,tiempo_respuesta_segundos:30,atencion_automatica:true});}},autoMs));
    }
    else if (path.endsWith('/atender')) { const id=Number(path.split('/').at(-2)); pending=pending.filter(row=>row.id!==id); result = {id,enfermero:usuario,tiempo_respuesta_segundos:15}; io.emit('llamadoAtendido', result); }
    else if (path === '/api/reportes/estadisticas') result = { total_llamados: 2, atendidos: 1, tiempo_promedio_respuesta_seg: 15, por_area: [{ nombre: 'Habitación 1', total_llamados: 2 }], por_tipo: [{ tipo: 'Normal', total_llamados: 1 }, { tipo: 'Emergencia', total_llamados: 1 }], por_dia: [{ fecha: '2026-09-29', promedio: 15 }] };
    else if (path === '/api/reportes/export/csv') return route.fulfill({ contentType: 'text/csv', body: 'id,nombre\n1,Prueba' });
    else result = [];
    await route.fulfill({ json: Array.isArray(result) ? { data: result, total: result.length, page: 1, limit: 500 } : result });
  });
  return { calls, areas };
}
test('login, errores del backend y cierre de sesión', async ({ page }) => {
  await setup(page, { authenticated: false });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Correo electrónico').fill('equipo@hospital.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas');
  await page.getByLabel('Contraseña', { exact: true }).fill('correcta');
  await page.getByRole('button', { name: 'Ingresar al sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Todo el hospital, conectado.' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/login/);
  expect(await page.evaluate(() => localStorage.getItem('codigoAzul.token'))).toBeNull();
});
test('permisos de usuario genérico y expiración de sesión', async ({ page }) => {
  await setup(page, { rol: 'Generico' });
  await page.goto('/usuarios');
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('link', { name: 'Usuarios', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Pacientes', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Paciente de prueba', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo Paciente' })).toBeVisible();
  await page.route('**/api/pacientes*', route => route.fulfill({ status: 401, json: { error: 'Token expirado' } }));
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(page).toHaveURL(/login/);
});
test('CRUD pacientes, contrato español y cierre accesible del modal', async ({ page }) => {
  const { calls } = await setup(page, { rol: 'Generico' });
  await page.goto('/pacientes');
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await page.getByLabel('Nombre completo').fill('Ana Prueba');
  await page.getByLabel('DNI', { exact: true }).fill('23456789');
  await page.getByLabel('Área', { exact: true }).selectOption('10');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page.getByRole('cell', { name: 'Ana Prueba', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar notificación' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Registro guardado correctamente.' })).toHaveCount(0);
  expect(calls.find(call => call.path === '/api/pacientes' && call.method === 'POST').body).toMatchObject({ area_id: 10, enfermero_asignado_id: null, cama_id: null });
  const row = page.getByRole('row').filter({ hasText: 'Ana Prueba' });
  await row.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('Nombre completo').fill('Ana Editada');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  const edited = page.getByRole('row').filter({ hasText: 'Ana Editada' });
  await expect(edited).toBeVisible();
  await edited.getByRole('button', { name: 'Eliminar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Ana Editada' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nuevo Paciente' })).toBeFocused();
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await page.mouse.click(5, 5);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('geometría, eventos en vivo, atención y overlay de tres segundos', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await setup(page);
  await page.goto('/dashboard');
  await expect(page.getByText('Llamados activos sincronizados.', { exact: false })).toBeVisible();
  const image = page.getByRole('img', { name: 'Recepción', exact: true });
  await expect(image).toHaveCSS('position', 'absolute');
  expect(await image.evaluate(element => element.style.left)).toBe('12%');
  const event = { id: 42, paciente_id: 1, area_id: 9, paciente: { nombre: 'Paciente de prueba' }, area: { nombre: 'Habitación 1' }, tipo: 'Emergencia', origen: 'Cama', fecha_hora_activacion: new Date().toISOString() };
  io.emit('nuevoLlamado', event); io.emit('codigoAzul', event);
  await expect(page.getByRole('alert').filter({ hasText: 'CÓDIGO AZUL' })).toBeVisible();
  await expect(page.getByLabel('Paciente de prueba · Llamado activo', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'CÓDIGO AZUL' })).toHaveCount(0, { timeout: 5000 });
  await page.getByRole('button', { name: 'Atender llamado', exact: true }).click();
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
});
test('la sincronización conserva eventos recibidos durante el fetch', async ({ page }) => {
  const call = { id: 6, paciente_id: 1, area_id: 9, tipo: 'Normal', origen: 'Cama', paciente: { nombre: 'Paciente de prueba' } };
  await setup(page, { active: [call], delayActive: 600 });
  await page.goto('/dashboard');
  await expect(page.getByText('Conexión establecida. Sincronizando', { exact: false })).toBeVisible();
  io.emit('llamadoAtendido', { id: 6, tiempo_respuesta_segundos: 5 });
  await expect(page.getByText('Llamados activos sincronizados.', { exact: false })).toBeVisible();
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
});
test('reportes filtran, muestran gráficos y descargan CSV', async ({ page }) => {
  const { calls } = await setup(page);
  await page.goto('/reportes');
  await expect(page.getByRole('heading', { name: 'Llamados por área' })).toBeVisible();
  await page.getByLabel('Área', { exact: true }).selectOption('9');
  await page.getByLabel('Origen', { exact: true }).selectOption('Baño');
  await page.getByLabel('Desde', { exact: true }).fill('2026-09-01');
  await page.getByLabel('Hasta', { exact: true }).fill('2026-09-29');
  await expect.poll(() => calls.filter(call => call.path.endsWith('/estadisticas')).at(-1)?.params).toMatchObject({ area_id: '9', origen: 'Baño', fecha_desde: expect.any(String), fecha_hasta: expect.any(String) });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/codigo-azul-.*\.csv/);
});
test('usuario nuevo y adaptación móvil sin desbordamiento', async ({ page }) => {
  const { calls } = await setup(page);
  await page.goto('/usuarios');
  await page.getByRole('button', { name: 'Nuevo Usuario' }).click();
  await page.getByLabel('Email', { exact: true }).fill('nuevo@hospital.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('password-de-prueba');
  await page.getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page.getByRole('cell', { name: 'nuevo@hospital.test' })).toBeVisible();
  expect(calls.find(call => call.path === '/api/auth/register').body.rol).toBe('Generico');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Mapa del hospital' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
});
test('promedio diario excluye llamados no atendidos y conserva cero segundos', () => {
  const data = respuestaPorDia([
    { estado: 'Atendido', fecha_hora_activacion: '2026-09-29T12:00:00Z', tiempo_respuesta_segundos: 0 },
    { estado: 'Atendido', fecha_activacion: '2026-09-29T12:00:00Z', tiempo_respuesta_seg: 20 },
    { estado: 'No Atendido', fecha_activacion: '2026-09-29T12:00:00Z', tiempo_respuesta_seg: null },
  ]);
  expect(data).toEqual([{ fecha: '2026-09-29', promedio: 10 }]);
});

test('enfermeros: alta, edición, contador y selector de pacientes', async ({ page }) => {
  const { calls } = await setup(page);
  await page.goto('/enfermeros');
  await expect(page.getByRole('cell', { name: 'Enfermera Demo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nuevo Enfermero' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Ana Enfermera');
  await page.getByLabel('Email', { exact: true }).fill('ana@hospital.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('password-de-prueba');
  await page.getByLabel('Área asignada').selectOption('9');
  await page.getByLabel('Turno').selectOption('Noche');
  await page.getByRole('button', { name: 'Crear enfermero' }).click();
  const row=page.getByRole('row').filter({hasText:'ana@hospital.test'});
  await expect(row).toBeVisible();
  expect(calls.find(call=>call.path==='/api/auth/register').body).toMatchObject({rol:'Generico',area_asignada_id:9,turno:'Noche',nombre:'Ana Enfermera'});
  await row.getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Turno').selectOption('Tarde');
  await page.getByRole('button',{name:'Guardar cambios'}).click();
  await expect(row.getByRole('cell',{name:'Tarde'})).toBeVisible();
  await page.getByRole('link',{name:'Pacientes',exact:true}).click();
  await page.getByRole('button',{name:'Nuevo Paciente'}).click();
  await expect(page.getByLabel('Enfermero asignado').locator('option').filter({hasText:'Ana Enfermera'})).toHaveCount(1);
});

test('usuarios: cambiar rol y eliminar con confirmación', async ({ page }) => {
  const { calls } = await setup(page); await page.goto('/usuarios');
  const row=page.getByRole('row').filter({hasText:'enfermera@hospital.test'});
  await row.getByRole('button',{name:'Editar rol'}).click();
  await page.getByLabel('Rol',{exact:true}).selectOption('Administrador');
  await page.getByRole('button',{name:'Guardar cambios'}).click();
  await expect(row.getByRole('cell',{name:'Administrador',exact:true})).toBeVisible();
  expect(calls.find(call => call.method === 'PUT').path).toBe('/api/auth/usuarios/nurse-2/rol');
  await row.getByRole('button',{name:'Eliminar',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Enfermera Demo');
  await page.getByRole('dialog').getByRole('button',{name:'Eliminar',exact:true}).click();
  await expect(row).toHaveCount(0);
});

test('camas: crear, editar, filtrar y eliminar', async ({ page }) => {
  const { calls }=await setup(page); await page.goto('/camas');
  await page.getByRole('button',{name:'Nueva Cama'}).click();
  await page.getByLabel('Nombre',{exact:true}).fill('Cama Demo');
  await page.getByLabel('Área',{exact:true}).selectOption('10');
  await page.getByLabel('Coordenada X (%)',{exact:true}).fill('80');
  await page.getByLabel('Coordenada Y (%)',{exact:true}).fill('56');
  await page.getByRole('button',{name:'Guardar cama'}).click();
  const row=page.getByRole('row').filter({hasText:'Cama Demo'});
  await expect(row).toBeVisible();
  expect(calls.find(call=>call.path==='/api/camas' && call.method==='POST').body).toMatchObject({area_id:10,coordenadas_x:80,coordenadas_y:56});
  await page.getByLabel('Filtrar por área').selectOption('9'); await expect(row).toHaveCount(0);
  await page.getByLabel('Filtrar por área').selectOption('10');
  await row.getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Nombre',{exact:true}).fill('Cama Editada'); await page.getByRole('button',{name:'Guardar cama'}).click();
  const edited=page.getByRole('row').filter({hasText:'Cama Editada'});
  await edited.getByRole('button',{name:'Eliminar',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Eliminar',exact:true}).click();
  await expect(edited).toHaveCount(0);
});

test('áreas: crear, corregir geometría, editar y eliminar', async ({ page }) => {
  const { calls } = await setup(page); await page.goto('/areas');
  await page.getByRole('button', { name: 'Nueva Área' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Área Prueba');
  await page.getByLabel('Centro X (%)').fill('0');
  await page.getByRole('button', { name: 'Guardar área' }).click();
  expect(calls.filter(call => call.path === '/api/areas' && call.method === 'POST')).toHaveLength(0);
  await page.getByLabel('Centro X (%)').fill('50');
  await page.getByRole('button', { name: 'Guardar área' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Área Prueba' });
  await expect(row).toBeVisible();
  expect(calls.find(call => call.path === '/api/areas' && call.method === 'POST').body)
    .toMatchObject({ tipo: 'Habitacion', coordenadas_x: 50, coordenadas_y: 50, ancho: 20, alto: 18 });
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Área Editada');
  await page.getByRole('button', { name: 'Guardar área' }).click();
  const edited = page.getByRole('row').filter({ hasText: 'Área Editada' });
  await edited.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(edited).toHaveCount(0);
});

test('simulación completa: modal, pulso, movimiento, llegada y atención manual', async ({ page }) => {
  const { calls }=await setup(page); await page.goto('/dashboard');
  await expect(page.getByText('Llamados activos sincronizados.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'SIMULAR CÓDIGO AZUL'}).click();
  await page.getByLabel('Paciente',{exact:true}).selectOption('1');
  await page.getByRole('button',{name:'ACTIVAR ALARMA'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Paciente de prueba · Llamado activo',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Alarma en Habitación 1',{exact:true})).toBeVisible();
  await expect(page.getByRole('alert').filter({hasText:'CÓDIGO AZUL'})).toBeVisible();
  await expect(page.getByLabel('Enfermera Demo · Caminando',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Atender llamado 55',exact:true})).toBeVisible({timeout:6000});
  await expect(page.getByText('🏃 Enfermera Demo llegó a Habitación 1', { exact: false })).toHaveCount(1);
  await page.getByRole('button',{name:'Atender llamado 55',exact:true}).click();
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
  await expect(page.getByLabel('Alarma en Habitación 1',{exact:true})).toHaveCount(0);
  expect(calls.filter(call=>call.path==='/api/llamados/crear')).toHaveLength(1);
  expect(calls.find(call=>call.path==='/api/llamados/crear').body).toMatchObject({paciente_id:1,area_id:9,simulacion:true,origen:'Cama',tipo:'Emergencia'});
  await page.screenshot({path:'test-results/demo-atendido.png',fullPage:true});
});

test('simulación desde cama: atención automática recibida por socket', async ({ page }) => {
  const { calls }=await setup(page,{autoMs:6000}); await page.goto('/dashboard');
  await expect(page.getByText('Llamados activos sincronizados.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Simular alarma para Paciente de prueba',exact:true}).click();
  await expect(page.getByLabel('Paciente de prueba · Llamado activo',{exact:true})).toBeVisible();
  await expect(page.getByText('Atención automática del demo',{exact:false})).toBeVisible({timeout:9000});
  await expect(page.getByText('No hay llamados pendientes')).toBeVisible();
  expect(calls.filter(call=>call.path.endsWith('/atender'))).toHaveLength(0);
});

test('simulación normal desde baño mantiene el origen y no muestra alerta roja', async ({ page }) => {
  const { calls }=await setup(page); await page.goto('/dashboard');
  await page.getByRole('button',{name:'SIMULAR CÓDIGO AZUL'}).click();
  await page.getByLabel('Paciente',{exact:true}).selectOption('1');
  await page.getByLabel('Origen',{exact:true}).selectOption('Baño');
  await page.getByLabel('Tipo',{exact:true}).selectOption('Normal');
  await page.getByLabel('Baño de origen').selectOption('7');
  await page.getByRole('button',{name:'ACTIVAR ALARMA'}).click();
  await expect(page.getByLabel('Alarma en Baño 1',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Atender llamado 55',exact:true})).toBeVisible({timeout:6000});
  await expect(page.getByRole('alert').filter({hasText:'CÓDIGO AZUL'})).toHaveCount(0);
  expect(calls.find(call=>call.path==='/api/llamados/crear').body).toMatchObject({area_id:7,origen:'Baño',tipo:'Normal'});
});
