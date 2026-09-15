import jwt from 'jsonwebtoken';
import { AppError, dbResult } from '../utils/errors.js';

const tokenOptions = { issuer: 'codigo-azul', audience: 'hospital' };

export function createAuth(db, secret) {
  async function authenticate(token) {
    let claims;
    try {
      claims = jwt.verify(token, secret, { ...tokenOptions, algorithms: ['HS256'] });
      if (!claims.sub || !Number.isInteger(claims.exp)) throw new Error();
    } catch {
      throw new AppError(401, 'Token inválido o expirado');
    }
    const profile = dbResult(await db.from('perfiles').select('id,email,rol')
      .eq('id', claims.sub).maybeSingle());
    if (!profile || !['Administrador', 'Generico'].includes(profile.rol)) {
      throw new AppError(401, 'Usuario no autorizado');
    }
    return { ...profile, exp: claims.exp };
  }
  return {
    authenticate,
    sign: profile => jwt.sign({ rol: profile.rol }, secret, {
      ...tokenOptions, subject: profile.id, algorithm: 'HS256', expiresIn: '1h'
    }),
    authMiddleware: async (req, res, next) => {
      try {
        const match = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
        if (!match) throw new AppError(401, 'Se requiere Bearer token');
        req.user = await authenticate(match[1]);
        next();
      } catch (error) { next(error); }
    }
  };
}

export const roleMiddleware = role => (req, res, next) => {
  if (req.user?.rol !== role) return next(new AppError(403, 'Permisos insuficientes'));
  next();
};
