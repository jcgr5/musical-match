import jwt from 'jsonwebtoken';

// Esta clave debe estar en variables de entorno en producción
const JWT_SECRET = 'supersecretkey123456789';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        console.error('Error al verificar token JWT:', error);
        return null;
    }
} 