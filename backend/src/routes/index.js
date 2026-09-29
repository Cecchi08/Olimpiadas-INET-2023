import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { roleMiddleware } from '../middlewares/authMiddleware.js';
import * as v from '../middlewares/validate.js';

export function createRoutes(controllers, authMiddleware) {
  const router = Router();
  const admin = roleMiddleware('Administrador');
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Demasiados intentos. Intentar más tarde.' } });
  router.post('/auth/login', loginLimit, v.loginRules(), v.validate, controllers.auth.login);
  router.use(authMiddleware);
  router.post('/auth/register', admin, v.registerRules(), v.validate, controllers.auth.register);
  router.get('/auth/me', controllers.auth.me);
  router.get('/usuarios', admin, v.pagingRules(), v.validate, controllers.usuarios.list);

  for (const [resource, rules, filters] of [
    ['areas', v.areaRules, () => []],
    ['camas', v.camaRules, () => [v.areaFilter()]],
    ['pacientes', v.pacienteRules, v.pacienteFilters]
  ]) {
    const controller = controllers[resource];
    router.get(`/${resource}`, filters(), v.pagingRules(), v.validate, controller.list);
    router.post(`/${resource}`, admin, rules(), v.validate, controller.create);
    router.put(`/${resource}/:id`, ...(resource === 'pacientes' ? [] : [admin]),
      v.idRule(), rules(true), v.validate, controller.update);
    router.delete(`/${resource}/:id`, admin, v.idRule(), v.validate, controller.remove);
  }
  router.get('/pacientes/:id', v.idRule(), v.validate, controllers.pacientes.get);
  router.post('/llamados/crear', v.llamadoRules(), v.validate, controllers.llamados.create);
  router.put('/llamados/:id/atender', v.idRule(), v.validate, controllers.llamados.attend);
  router.get('/llamados/activos', v.llamadoFilters(), v.pagingRules(), v.validate, controllers.llamados.active);
  router.get('/llamados', v.llamadoFilters(), v.pagingRules(), v.validate, controllers.llamados.list);
  router.get('/reportes/estadisticas', v.llamadoFilters(), v.validate, controllers.reportes.stats);
  router.get('/reportes/export/pdf', v.llamadoFilters(), v.validate, controllers.reportes.pdf);
  router.get('/reportes/export/csv', v.llamadoFilters(), v.validate, controllers.reportes.csv);
  return router;
}
