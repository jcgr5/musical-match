import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema para validar los mensajes enviados
const messageSchema = z.object({
    clientId: z.string(),
    musicianId: z.string(),
    content: z.string(),
    reservationId: z.string()
});

// Esquema para la consulta de mensajes
const getMessagesSchema = z.object({
    reservationId: z.string().optional(),
    clientId: z.string().optional(),
    musicianId: z.string().optional()
});

// Guardar un nuevo mensaje
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validar datos
        const result = messageSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { clientId, musicianId, content, reservationId } = result.data;

        // Verificar que la reserva existe
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId }
        });

        if (!reservation) {
            return NextResponse.json({
                success: false,
                message: "La reserva no existe"
            }, { status: 404 });
        }

        // Guardar el mensaje
        const message = await prisma.message.create({
            data: {
                clientId,
                musicianId,
                content,
                reservationId
            }
        });

        return NextResponse.json({
            success: true,
            message: "Mensaje enviado correctamente",
            data: message
        }, { status: 201 });

    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// Obtener mensajes
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const reservationId = searchParams.get('reservationId');
        const clientId = searchParams.get('clientId');
        const musicianId = searchParams.get('musicianId');

        // Construir where según parámetros
        const where: any = {};

        if (reservationId) {
            where.reservationId = reservationId;
        }

        if (clientId && musicianId) {
            where.AND = [
                { clientId },
                { musicianId }
            ];
        }

        // Validar que tenemos al menos un criterio de búsqueda
        if (Object.keys(where).length === 0) {
            return NextResponse.json({
                success: false,
                message: "Debe proporcionar al menos un criterio de búsqueda (reservationId, o clientId y musicianId)"
            }, { status: 400 });
        }

        // Obtener mensajes
        const messages = await prisma.message.findMany({
            where,
            orderBy: {
                timestamp: 'asc'
            },
            include: {
                client: {
                    select: {
                        name: true
                    }
                },
                musician: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: messages
        }, { status: 200 });

    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud"
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
} 