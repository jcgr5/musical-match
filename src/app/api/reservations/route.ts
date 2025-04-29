import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema para la consulta de reservas
const getReservationsSchema = z.object({
    clientId: z.string().optional(),
    musicianId: z.string().optional(),
    status: z.string().optional()
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const musicianId = searchParams.get('musicianId');
        const status = searchParams.get('status');

        // Construir where según parámetros
        const where: Record<string, unknown> = {};

        if (clientId) {
            where.clientId = clientId;
        }

        if (musicianId) {
            where.musicianId = musicianId;
        }

        if (status) {
            where.reservationStatusId = status;
        }

        // Validar que tenemos al menos un criterio de búsqueda
        if (Object.keys(where).length === 0) {
            return NextResponse.json({
                success: false,
                message: "Debe proporcionar al menos un criterio de búsqueda (clientId, musicianId o status)"
            }, { status: 400 });
        }

        // Obtener reservas
        const reservations = await prisma.reservation.findMany({
            where,
            orderBy: {
                creationDate: 'desc'
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                musician: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                reservationstatus: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: reservations
        }, { status: 200 });

    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// Endpoint para crear una nueva reserva
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validar datos de entrada
        const reservationData = {
            clientId: body.clientId,
            musicianId: body.musicianId,
            price: parseFloat(body.price) || 0,
            serviceDate: new Date(body.serviceDate),
            reservationStatusId: body.reservationStatusId || "pending" // Valor por defecto
        };

        // Crear reserva
        const reservation = await prisma.reservation.create({
            data: reservationData
        });

        return NextResponse.json({
            success: true,
            message: "Reserva creada correctamente",
            data: reservation
        }, { status: 201 });

    } catch (error) {
        console.error('Error al crear reserva:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// Endpoint para actualizar el estado de una reserva
export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({
                success: false,
                message: "Debe proporcionar un ID de reserva y un estado"
            }, { status: 400 });
        }

        // Actualizar estado
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                reservationStatusId: status
            }
        });

        return NextResponse.json({
            success: true,
            message: "Estado de reserva actualizado correctamente",
            data: reservation
        }, { status: 200 });

    } catch (error) {
        console.error('Error al actualizar reserva:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 