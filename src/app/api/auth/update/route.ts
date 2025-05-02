import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '@/utils/bcrypt';

// Instanciar PrismaClient con debug para ver las consultas SQL
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

// Esquema de validación para el registro
const registerSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    username: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" }),
    email: z.string().email({ message: "Correo electrónico inválido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
    phone: z.string().min(7, { message: "Número de teléfono inválido" }),
    role: z.enum(['CLIENT', 'MUSICIAN'], {
        required_error: "El rol es requerido",
        invalid_type_error: "El rol debe ser CLIENT o MUSICIAN"
    })
});

export async function POST(request: Request) {
    try {
        console.log("Iniciando proceso de update");

        // Probar la conexión a la base de datos primero
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

        // Intentar parsear el JSON con manejo específico de errores
        let body;
        try {
            body = await request.json();
            console.log("Datos recibidos:", JSON.stringify(body));
        } catch (error) {
            console.error('Error al parsear JSON:', error);
            return NextResponse.json({
                success: false,
                message: "Error al parsear los datos enviados"
            }, { status: 400 });
        }

        // Validar datos de entrada
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            console.error('Error de validación:', result.error);
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        // Usar el rol seleccionado por el usuario
        const { name, username, email, password, phone, role } = result.data;

        console.log(`Registro de usuario: ${username}, rol: ${role}`);

        try {
            // Verificar si el email ya está registrado
            console.log("Verificando email:", email);

            // Verificación para Cliente
            const existingClientByEmail = await prisma.client.findUnique({
                where: { email },
                select: { id: true }
            });

            // Verificación para Músico
            const existingMusicianByEmail = await prisma.musician.findUnique({
                where: { email },
                select: { id: true }
            });

            if (existingClientByEmail || existingMusicianByEmail) {
                console.log("Email ya registrado");
                return NextResponse.json({
                    success: false,
                    message: "El correo electrónico ya está registrado"
                }, { status: 409 });
            }

            // Verificar si el username ya está registrado
            console.log("Verificando username:", username);

            // Verificación para Cliente
            const existingClientByUsername = await prisma.client.findUnique({
                where: { username },
                select: { id: true }
            });

            // Verificación para Músico
            const existingMusicianByUsername = await prisma.musician.findUnique({
                where: { username },
                select: { id: true }
            });

            if (existingClientByUsername || existingMusicianByUsername) {
                console.log("Username ya registrado");
                return NextResponse.json({
                    success: false,
                    message: "El nombre de usuario ya está registrado"
                }, { status: 409 });
            }

            // Hashear la contraseña con nuestra función de utilidad
            console.log("Hasheando contraseña para:", username);
            const hashedPassword = await hashPassword(password);
            console.log("Contraseña hasheada correctamente");

            // Crear usuario según el rol seleccionado
            let user;

            if (role === 'CLIENT') {
                user = await prisma.client.create({
                    data: {
                        name,
                        username,
                        email,
                        password: hashedPassword,
                        phone
                    },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        phone: true,
                    }
                });
            } else if (role === 'MUSICIAN') {
                user = await prisma.musician.create({
                    data: {
                        name,
                        username,
                        email,
                        password: hashedPassword,
                        phone
                    },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        phone: true,
                    }
                });
            }

            console.log("Usuario creado correctamente:", user);
            return NextResponse.json({
                success: true,
                message: "Usuario registrado correctamente",
                user,
                role
            }, { status: 201 });
        } catch (dbError) {
            console.error('Error en operaciones de base de datos:', dbError);
            return NextResponse.json({
                success: false,
                message: "Error al interactuar con la base de datos",
                error: dbError instanceof Error ? dbError.message : String(dbError)
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error general al registrar usuario:', error);
        return NextResponse.json({
            success: false,
            message: "Error interno del servidor",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    } finally {
        // Desconectar Prisma al finalizar
        await prisma.$disconnect();
    }
} 