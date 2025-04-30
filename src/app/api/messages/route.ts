import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Esquema para validar los mensajes enviados
const messageSchema = z.object({
    clientId: z.string(),
    musicianId: z.string(),
    content: z.string(),
    senderId: z.string(),
    senderType: z.enum(["CLIENT", "MUSICIAN"]).default("CLIENT")
});

// Guardar un nuevo mensaje
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Recibido en /api/messages:", body);

        // Validar datos
        const result = messageSchema.safeParse(body);

        if (!result.success) {
            console.error("Error de validación:", result.error.format());
            return NextResponse.json({
                success: false,
                errors: result.error.format()
            }, { status: 400 });
        }

        const { clientId, musicianId, content, senderId, senderType } = result.data;

        // Verificar que senderId sea igual a clientId o musicianId
        if (senderId !== clientId && senderId !== musicianId) {
            console.error(`Error de validación: senderId (${senderId}) debe ser igual a clientId (${clientId}) o musicianId (${musicianId})`);
            return NextResponse.json({
                success: false,
                message: "Error de validación: el remitente debe ser el cliente o el músico",
            }, { status: 400 });
        }

        // Validar que senderType coincida con senderId
        const derivedSenderType = senderId === clientId ? "CLIENT" : "MUSICIAN";
        if (senderType !== derivedSenderType) {
            console.error(`Error de validación: senderType (${senderType}) no coincide con el tipo de remitente (${derivedSenderType})`);
        }

        // Verificar que los IDs de cliente y músico existen
        try {
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                select: { id: true }
            });

            if (!client) {
                console.error(`Cliente con ID ${clientId} no encontrado`);
                return NextResponse.json({
                    success: false,
                    message: "Cliente no encontrado"
                }, { status: 404 });
            }

            const musician = await prisma.musician.findUnique({
                where: { id: musicianId },
                select: { id: true }
            });

            if (!musician) {
                console.error(`Músico con ID ${musicianId} no encontrado`);
                return NextResponse.json({
                    success: false,
                    message: "Músico no encontrado"
                }, { status: 404 });
            }
        } catch (error) {
            console.error("Error al verificar cliente/músico:", error);
            return NextResponse.json({
                success: false,
                message: "Error al verificar usuarios",
                error: String(error)
            }, { status: 500 });
        }

        // Crear el mensaje
        try {
            const messageData = {
                clientId,
                musicianId,
                content,
                senderId,
                senderType: derivedSenderType // Usamos el tipo derivado para garantizar consistencia
            };

            console.log("Datos del mensaje a guardar:", messageData);

            // Guardar el mensaje
            const message = await prisma.message.create({
                data: messageData,
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

            console.log("Mensaje guardado exitosamente:", message.id);

            return NextResponse.json({
                success: true,
                message: "Mensaje enviado correctamente",
                data: message
            }, { status: 201 });
        } catch (error) {
            console.error("Error al crear mensaje en la base de datos:", error);
            return NextResponse.json({
                success: false,
                message: "Error al guardar el mensaje en la base de datos",
                error: String(error)
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error general en api/messages:', error);
        return NextResponse.json({
            success: false,
            message: "Error al procesar la solicitud",
            error: String(error)
        }, { status: 500 });
    } finally {
        await prisma.$disconnect().catch(e => {
            console.error("Error al desconectar de Prisma:", e);
        });
    }
}

// Obtener mensajes
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const musicianId = searchParams.get("musicianId");
        const limitParam = searchParams.get("limit");

        // Convertir limit a número si existe
        const limit = limitParam ? parseInt(limitParam, 10) : undefined;

        if (!clientId || !musicianId) {
            return NextResponse.json(
                { success: false, message: "Se requieren clientId y musicianId" },
                { status: 400 }
            );
        }

        // Obtener mensajes entre cliente y músico
        const messages = await prisma.message.findMany({
            where: {
                clientId: clientId,
                musicianId: musicianId
            },
            include: {
                client: {
                    select: {
                        name: true,
                    }
                },
                musician: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: {
                timestamp: 'asc'
            },
            take: limit,
        });

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        console.error("Error al obtener mensajes:", error);
        return NextResponse.json(
            { success: false, message: "Error al obtener los mensajes" },
            { status: 500 }
        );
    }
} 