import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema de validación para establecer el rol
const setRoleSchema = z.object({
    userId: z.string(),
    role: z.enum(['CLIENT', 'MUSICIAN'], {
        required_error: "El rol es requerido",
        invalid_type_error: "El rol debe ser CLIENT o MUSICIAN"
    })
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validar datos de entrada
        const result = setRoleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { userId, role } = result.data;

        // Actualizar el rol del usuario
        if (role === 'CLIENT') {
            // Verificar si ya existe un usuario con este ID en la tabla Client
            const existingClient = await prisma.client.findUnique({
                where: { id: userId }
            });

            if (!existingClient) {
                // Si no existe, verificar si existe en la tabla Musician para obtener sus datos
                const musicianData = await prisma.musician.findUnique({
                    where: { id: userId },
                    select: {
                        name: true,
                        username: true,
                        email: true,
                        password: true,
                        phone: true
                    }
                });

                if (musicianData) {
                    // Crear un nuevo cliente con los datos del músico
                    await prisma.client.create({
                        data: {
                            id: userId,
                            ...musicianData
                        }
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        message: "Usuario no encontrado"
                    }, { status: 404 });
                }
            }
        } else if (role === 'MUSICIAN') {
            // Verificar si ya existe un usuario con este ID en la tabla Musician
            const existingMusician = await prisma.musician.findUnique({
                where: { id: userId }
            });

            if (!existingMusician) {
                // Si no existe, verificar si existe en la tabla Client para obtener sus datos
                const clientData = await prisma.client.findUnique({
                    where: { id: userId },
                    select: {
                        name: true,
                        username: true,
                        email: true,
                        password: true,
                        phone: true
                    }
                });

                if (clientData) {
                    // Crear un nuevo músico con los datos del cliente
                    await prisma.musician.create({
                        data: {
                            id: userId,
                            ...clientData
                        }
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        message: "Usuario no encontrado"
                    }, { status: 404 });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Rol actualizado correctamente",
            role
        }, { status: 200 });

    } catch (error) {
        console.error('Error al establecer el rol:', error);
        return NextResponse.json({
            success: false,
            message: "Error interno del servidor"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 