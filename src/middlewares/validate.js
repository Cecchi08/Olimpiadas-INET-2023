import { body, param, query, matchedData, validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';

const types = ['Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'SalaEspera'];
const positiveId = field => field.isInt({ min: 1, max: 2147483647 }).toInt();
const text = (field, max) => field.isString().bail().trim().isLength({ min: 1, max });
const optional = (field, partial) => partial ? field.optional() : field;
const coordinate = field => field.isFloat().bail().toFloat().custom(Number.isFinite);

export const idRule = () => positiveId(param('id'));
export const loginRules = () => [
  body('email').isString().bail().trim().isEmail().isLength({ max: 254 }).toLowerCase(),
  body('password').isString().bail().isLength({ min: 1, max: 128 })
];
export const registerRules = () => [
  ...loginRules(), body('password').isLength({ min: 12, max: 128 }),
  body('rol').isIn(['Administrador', 'Generico'])
];
export const areaRules = (partial = false) => [
  text(optional(body('nombre'), partial), 120),
  optional(body('tipo'), partial).isIn(types),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial))
];
export const camaRules = (partial = false) => [
  positiveId(optional(body('area_id'), partial)), text(optional(body('nombre'), partial), 80),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial))
];
export const pacienteRules = (partial = false) => [
  text(optional(body('nombre'), partial), 160),
  optional(body('dni'), partial).isString().bail().matches(/^\d{6,12}$/),
  body('datos_medicos').optional().isString().isLength({ max: 20000 }),
  positiveId(body('cama_id').optional({ values: 'null' })),
  positiveId(optional(body('area_id'), partial)),
  body('enfermero_id').optional({ values: 'null' }).isUUID()
];
export const llamadoRules = () => [
  positiveId(body('paciente_id')), positiveId(body('area_id')),
  body('origen').isIn(['Cama', 'Bano']), body('tipo').isIn(['Normal', 'Emergencia'])
];
export const pagingRules = () => [
  positiveId(query('page').optional()), query('limit').optional().isInt({ min: 1, max: 500 }).toInt()
];
export const areaFilter = () => positiveId(query('area_id').optional());
export const pacienteFilters = () => [
  areaFilter(), positiveId(query('area').optional()),
  query('enfermero_id').optional().isUUID(), query('enfermero').optional().isUUID()
];
export const llamadoFilters = () => [
  areaFilter(), query('origen').optional().isIn(['Cama', 'Bano']),
  query('tipo').optional().isIn(['Normal', 'Emergencia']),
  query('estado').optional().isIn(['No Atendido', 'Atendido']),
  ...['fecha_desde', 'fecha_hasta'].map(key => query(key).optional().isISO8601({ strict: true })
    .bail().matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/).withMessage('Usar ISO 8601 con zona horaria')),
  query('fecha_hasta').optional().custom((value, { req }) => {
    if (req.query.fecha_desde && Date.parse(value) < Date.parse(req.query.fecha_desde)) {
      throw new Error('fecha_hasta debe ser mayor o igual a fecha_desde');
    }
    return true;
  })
];

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(400, 'Datos inválidos', errors.array().map(e => ({
    campo: e.path, mensaje: e.msg
  }))));
  req.input = Object.fromEntries(Object.entries(matchedData(req, {
    locations: ['body'], includeOptionals: true
  })).filter(([, value]) => value !== undefined));
  req.filters = matchedData(req, { locations: ['query'] });
  if (req.method === 'PUT' && !req.path.endsWith('/atender') && !Object.keys(req.input).length) {
    return next(new AppError(400, 'Enviar al menos un campo editable'));
  }
  next();
}
