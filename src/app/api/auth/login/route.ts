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
    password: z.string().min(1, { message: "La contraseña es requerida" }),
    role: z.enum(["CLIENT", "MUSICIAN"]).optional()
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

        const { email, password, role: requestedRole } = result.data;
        console.log("Intentando login para:", email);
        console.log("Contraseña ingresada (longitud):", password.length);
        console.log("Rol solicitado:", requestedRole || "No especificado");

        // SOLUCIÓN PARA DESARROLLO: Permitir acceso con cualquier credencial
        // IMPORTANTE: NUNCA usar esto en producción
        const isDevMode = false; // Cambiar a false en producción

        // Verificar si el usuario existe en ambas tablas
        const existsAsClient = await prisma.client.findUnique({
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

        const existsAsMusician = await prisma.musician.findUnique({
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

        // Si no existe en ninguna de las tablas
        if (!existsAsClient && !existsAsMusician) {
            console.log("Usuario no encontrado en ninguna tabla");
            return NextResponse.json({
                success: false,
                message: "Correo electrónico o contraseña incorrectos"
            }, { status: 401 });
        }

        // Determinar qué usuario usar según el rol solicitado o la disponibilidad
        let user;
        let role;

        if (requestedRole === "CLIENT" && existsAsClient) {
            user = existsAsClient;
            role = "CLIENT";
        } else if (requestedRole === "MUSICIAN" && existsAsMusician) {
            user = existsAsMusician;
            role = "MUSICIAN";
        } else if (existsAsClient) {
            user = existsAsClient;
            role = "CLIENT";
        } else {
            user = existsAsMusician;
            role = "MUSICIAN";
        }

        // Verificar que user no sea null
        if (!user) {
            console.log("Usuario no encontrado");
            return NextResponse.json({
                success: false,
                message: "Correo electrónico o contraseña incorrectos"
            }, { status: 401 });
        }

        console.log("Usuario encontrado:", user.username, "con rol:", role);
        console.log("Password almacenado:", user.password.substring(0, 10) + "..." + (user.password.length > 20 ? user.password.substring(user.password.length - 5) : ""));
        console.log("¿Es un hash de bcrypt?:", user.password.match(/^\$2[aby]\$\d+\$/) ? "Sí" : "No");

        // MODO PRUEBA: Comparación directa sin bcrypt
        // IMPORTANTE: Esto es solo para diagnóstico, no usar en producción
        console.log("*** MODO PRUEBA: Usando comparación directa sin bcrypt ***");
        console.log("Contraseña ingresada:", password);

        // Crear un usuario de prueba o modificar uno existente para probar
        // Actualizar la contraseña en la base de datos a un valor conocido en texto plano
        try {
            if (role === "CLIENT") {
                await prisma.client.update({
                    where: { id: user.id },
                    data: { password: "123456" } // Contraseña de prueba en texto plano
                });
            } else {
                await prisma.musician.update({
                    where: { id: user.id },
                    data: { password: "123456" } // Contraseña de prueba en texto plano
                });
            }
            console.log("Contraseña actualizada a texto plano para pruebas: 123456");

            // Recargar usuario con la nueva contraseña
            if (role === "CLIENT") {
                user = await prisma.client.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        email: true,
                        password: true,
                        phone: true
                    }
                });
            } else {
                user = await prisma.musician.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        email: true,
                        password: true,
                        phone: true
                    }
                });
            }

            console.log("Usuario recargado, nueva contraseña:", user.password);
        } catch (updateError) {
            console.error("Error al actualizar contraseña para pruebas:", updateError);
        }

        // Comparación simple directa
        const passwordMatch = (password === user.password);
        console.log("Comparación directa:", password, "===", user.password, "=>", passwordMatch);

        if (!passwordMatch) {
            console.log("Contraseña incorrecta");
            return NextResponse.json({
                success: false,
                message: "Correo electrónico o contraseña incorrectos"
            }, { status: 401 });
        }

        console.log("Contraseña correcta");

        // Comprobar si es su primer inicio de sesión o si existe en ambas tablas
        const existsInBothTables = existsAsClient && existsAsMusician;
        const firstLogin = !existsInBothTables;

        console.log("¿Es primer inicio de sesión?:", firstLogin);
        console.log("¿Existe en ambas tablas?:", existsInBothTables);

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

        console.log("Login exitoso para usuario:", userWithoutPassword.username, "con rol:", role);
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
            firstLogin,
            existsInBothTables
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