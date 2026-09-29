import { body, param, query, matchedData, validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';

const types = ['Quirofano', 'Habitacion', 'Bano', 'Recepcion', 'Secretaria', 'SalaEspera', 'Enfermeria', 'Pasillo'];
const positiveId = field => field.isInt({ min: 1, max: 2147483647 }).toInt();
const text = (field, max) => field.isString().bail().trim().isLength({ min: 1, max });
const optional = (field, partial) => partial ? field.optional() : field;
const coordinate = field => field.isFloat().bail().toFloat().custom(Number.isFinite);
const alias = (canonical, legacy) => (req, res, next) => {
  const input = req.body;
  if (!input || !Object.hasOwn(input, canonical)) return next();
  if (Object.hasOwn(input, legacy) && input[canonical] !== input[legacy]) {
    return next(new AppError(400, `Los campos ${canonical} y ${legacy} no coinciden`));
  }
  input[legacy] = input[canonical];
  next();
};
const coordinates = () => [alias('coordenadas_x', 'coord_x'), alias('coordenadas_y', 'coord_y')];
const origin = field => field.customSanitizer(value => value === 'Baño' ? 'Bano' : value).isIn(['Cama', 'Bano']);

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
  ...coordinates(),
  text(optional(body('nombre'), partial), 120),
  optional(body('tipo'), partial).isIn(types),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial)),
  body('ancho').optional().isFloat({ gt: 0, max: 100 }).toFloat(),
  body('alto').optional().isFloat({ gt: 0, max: 100 }).toFloat()
];
export const camaRules = (partial = false) => [
  ...coordinates(),
  positiveId(optional(body('area_id'), partial)), text(optional(body('nombre'), partial), 80),
  coordinate(optional(body('coord_x'), partial)), coordinate(optional(body('coord_y'), partial))
];
export const pacienteRules = (partial = false) => [
  alias('enfermero_asignado_id', 'enfermero_id'),
  text(optional(body('nombre'), partial), 160),
  optional(body('dni'), partial).isString().bail().matches(/^\d{6,12}$/),
  body('datos_medicos').optional().isString().isLength({ max: 20000 }),
  positiveId(body('cama_id').optional({ values: 'null' })),
  positiveId(optional(body('area_id'), partial)),
  body('enfermero_id').optional({ values: 'null' }).isUUID()
];
export const llamadoRules = () => [
  positiveId(body('paciente_id')), positiveId(body('area_id')),
  origin(body('origen')), body('tipo').isIn(['Normal', 'Emergencia'])
];
export const pagingRules = () => [
  positiveId(query('page').optional()), query('limit').optional().isInt({ min: 1, max: 500 }).toInt()
];
export const areaFilter = () => positiveId(query('area_id').optional());
export const pacienteFilters = () => [
  areaFilter(), positiveId(query('area').optional()),
  query('enfermero_id').optional().isUUID(), query('enfermero').optional().isUUID(),
  query('enfermero_asignado_id').optional().isUUID()
];
export const llamadoFilters = () => [
  areaFilter(), origin(query('origen').optional()),
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
