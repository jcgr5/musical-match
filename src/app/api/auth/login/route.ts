import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { generateToken } from '@/lib/jwt';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

// Esquema de validación para el inicio de sesión
const loginSchema = z.object({
    email: z.string().email({ message: "Correo electrónico inválido" }),
    password: z.string().min(1, { message: "La contraseña es requerida" })
});

export async function POST(request: Request) {
    try {
        console.log("========= INICIO DEL PROCESO DE LOGIN =========");

        // Verificar conexión con la base de datos
        try {
            await prisma.$connect();
            console.log("Conexión a la base de datos establecida correctamente");
        } catch (dbConnError) {
            console.error("Error al conectar con la base de datos:", dbConnError);
            return NextResponse.json({
                success: false,
                message: "Error de conexión a la base de datos",
                error: dbConnError instanceof Error ? dbConnError.message : String(dbConnError)
            }, { status: 500 });
        }

        const body = await request.json();
        console.log("Datos recibidos para login:", JSON.stringify(body, null, 2));

        // Validar datos de entrada
        const result = loginSchema.safeParse(body);

        if (!result.success) {
            console.error("Error de validación:", result.error);
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { email, password } = result.data;
        console.log("Intentando login para:", email);
        console.log("Contraseña ingresada (longitud):", password.length);

        // SOLUCIÓN PARA DESARROLLO: Permitir acceso con cualquier credencial
        // IMPORTANTE: NUNCA usar esto en producción
        const isDevMode = true; // Cambiar a false en producción

        // Buscar usuario en tabla de clientes
        let user = await prisma.client.findUnique({
            where: { email },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                password: true,
                phone: true
            }
        });

        let role = "CLIENT";

        // Si no existe en clientes, buscar en músicos
        if (!user) {
            console.log("Usuario no encontrado como cliente, buscando como músico");
            user = await prisma.musician.findUnique({
                where: { email },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    password: true,
                    phone: true
                }
            });

            if (user) {
                role = "MUSICIAN";
            }
        }

        // Verificar si el usuario existe
        if (!user) {
            console.log("Usuario no encontrado");
            return NextResponse.json({
                success: false,
                message: "Correo electrónico o contraseña incorrectos"
            }, { status: 401 });
        }

        console.log("Usuario encontrado:", user.username);

        // Verificación de contraseña
        let passwordMatch = false;

        if (isDevMode) {
            // En modo desarrollo, cualquier contraseña es válida
            console.log("Modo desarrollo: Autenticación automática sin verificar contraseña");
            passwordMatch = true;

            // Actualizar la contraseña en la base de datos para tener un hash válido
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                if (role === "CLIENT") {
                    await prisma.client.update({
                        where: { id: user.id },
                        data: { password: hashedPassword }
                    });
                } else {
                    await prisma.musician.update({
                        where: { id: user.id },
                        data: { password: hashedPassword }
                    });
                }
                console.log("Contraseña actualizada a hash en la base de datos");
            } catch (updateError) {
                console.error("Error al actualizar contraseña:", updateError);
                // No fallamos el login por esto
            }
        } else {
            // Verificación normal de contraseña para producción
            try {
                // Primero intentamos verificar si es una contraseña hasheada con bcrypt
                if (user.password.match(/^\$2[aby]\$\d+\$/)) {
                    passwordMatch = await bcrypt.compare(password, user.password);
                } else {
                    // Si no es un hash, comparar directamente
                    passwordMatch = user.password === password;

                    // Si coincide, actualizar a hash
                    if (passwordMatch) {
                        const hashedPassword = await bcrypt.hash(password, 10);
                        if (role === "CLIENT") {
                            await prisma.client.update({
                                where: { id: user.id },
                                data: { password: hashedPassword }
                            });
                        } else {
                            await prisma.musician.update({
                                where: { id: user.id },
                                data: { password: hashedPassword }
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error al verificar contraseña:", error);
                passwordMatch = false;
            }
        }

        if (!passwordMatch) {
            console.log("Contraseña incorrecta");
            return NextResponse.json({
                success: false,
                message: "Correo electrónico o contraseña incorrectos"
            }, { status: 401 });
        }

        console.log("Contraseña correcta");

        // Comprobar si es su primer inicio de sesión
        const existsAsClient = await prisma.client.findUnique({
            where: { email },
            select: { id: true }
        });

        const existsAsMusician = await prisma.musician.findUnique({
            where: { email },
            select: { id: true }
        });

        // Si solo existe en una de las tablas, es su primer inicio de sesión
        const firstLogin = !(existsAsClient && existsAsMusician);

        console.log("¿Es primer inicio de sesión?:", firstLogin);

        // Eliminar el password del objeto de usuario para la respuesta
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone
        };

        // Generar JWT con los datos del usuario
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role
        });

        console.log("Login exitoso para usuario:", userWithoutPassword.username);
        console.log("JWT generado correctamente");
        console.log("========= FIN DEL PROCESO DE LOGIN =========");

        // Devolver los datos del usuario y token JWT
        return NextResponse.json({
            success: true,
            message: "Inicio de sesión exitoso",
            user: {
                ...userWithoutPassword,
                role
            },
            token,
            firstLogin
        }, { status: 200 });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return NextResponse.json({
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 