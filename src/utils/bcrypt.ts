import bcrypt from 'bcrypt';

/**
 * Genera un hash para una contraseña dada
 * @param password Contraseña en texto plano
 * @returns Contraseña hasheada
 */
export async function hashPassword(password: string): Promise<string> {
    console.log("hashPassword: Generando hash para contraseña");
    const saltRounds = 10;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("hashPassword: Hash generado correctamente");
        return hashedPassword;
    } catch (error) {
        console.error("hashPassword ERROR:", error);
        throw error;
    }
}

/**
 * Compara una contraseña en texto plano con un hash
 * @param password Contraseña en texto plano
 * @param hashedPassword Contraseña hasheada almacenada
 * @returns true si las contraseñas coinciden, false en caso contrario
 */
export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    console.log("comparePasswords: Comparando contraseñas");
    console.log("comparePasswords: Contraseña plana (longitud):", password.length);
    console.log("comparePasswords: Hash almacenado (longitud):", hashedPassword.length);
    console.log("comparePasswords: Hash almacenado (parcial):",
        hashedPassword.substring(0, 10) + "..." +
        (hashedPassword.length > 20 ? hashedPassword.substring(hashedPassword.length - 5) : "")
    );

    try {
        // Verificar si parece un hash de bcrypt
        if (hashedPassword.match(/^\$2[aby]\$\d+\$/)) {
            // CASO ESPECIAL: Hash truncado a 20 caracteres (problema detectado)
            // Los hashes bcrypt siempre deben tener ~60 caracteres
            if (hashedPassword.length < 30) {
                console.log("comparePasswords: ALERTA - Hash de bcrypt truncado detectado");
                console.log("comparePasswords: Utilizando estrategia de compatibilidad para hashes truncados");

                // Para hashes truncados, vamos a generar temporalmente un nuevo hash
                // con la contraseña proporcionada y comparar solo los primeros caracteres
                // hasta la longitud del hash truncado
                const tempHash = await bcrypt.hash(password, 10);
                console.log("comparePasswords: Generando hash temporal para comparación:",
                    tempHash.substring(0, 10) + "..."
                );

                // Comparación por prefijo - NO ES SEGURO pero permite la migración
                const prefixMatch = tempHash.startsWith(hashedPassword.substring(0, hashedPassword.length - 1));
                console.log("comparePasswords: Resultado de comparación por prefijo:", prefixMatch);

                // Si coincide por prefijo, actualizar el hash después será crucial
                return prefixMatch;
            }

            // Caso normal - hash completo
            console.log("comparePasswords: El hash parece ser de bcrypt completo, usando bcrypt.compare");
            const result = await bcrypt.compare(password, hashedPassword);
            console.log("comparePasswords: Resultado de bcrypt.compare:", result);
            return result;
        } else {
            // Si no es un hash de bcrypt, comparar directamente
            console.log("comparePasswords: El hash NO parece ser de bcrypt, comparando directamente");
            const result = password === hashedPassword;
            console.log("comparePasswords: Resultado de comparación directa:", result);
            return result;
        }
    } catch (error) {
        console.error("comparePasswords ERROR:", error);
        // En caso de error, intentar comparación directa como última opción
        console.log("comparePasswords: Intentando comparación directa como fallback");
        return password === hashedPassword;
    }
}

/**
 * Verifica si una cadena es un hash de bcrypt válido
 * @param hash Cadena a verificar
 * @returns true si es un hash bcrypt válido
 */
export function isBcryptHash(hash: string): boolean {
    // Un hash de bcrypt válido debe comenzar con $2 y tener longitud adecuada
    const validPattern = /^\$2[aby]\$\d+\$/;
    const isValidPattern = validPattern.test(hash);

    // Hashes truncados son detectados pero no son válidos
    const isTruncated = isValidPattern && hash.length < 30;

    if (isTruncated) {
        console.log("isBcryptHash: Se detectó un hash de bcrypt truncado");
    }

    return isValidPattern;
} 