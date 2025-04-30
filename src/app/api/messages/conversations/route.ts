import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface Conversation {
    clientId?: string;
    musicianId?: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get("clientId");
        const musicianId = searchParams.get("musicianId");

        if (!clientId && !musicianId) {
            return NextResponse.json(
                { success: false, message: "Se requiere clientId o musicianId" },
                { status: 400 }
            );
        }

        // Buscar mensajes únicos agrupados por pares cliente-músico
        let conversations: Conversation[] = [];

        if (clientId) {
            // Buscar todas las conversaciones de un cliente usando findMany en lugar de raw query
            const uniqueMusicians = await prisma.message.findMany({
                where: { clientId },
                select: { musicianId: true },
                distinct: ['musicianId']
            });

            conversations = uniqueMusicians.map(item => ({ musicianId: item.musicianId }));
        } else if (musicianId) {
            // Buscar todas las conversaciones de un músico usando findMany en lugar de raw query
            const uniqueClients = await prisma.message.findMany({
                where: { musicianId },
                select: { clientId: true },
                distinct: ['clientId']
            });

            conversations = uniqueClients.map(item => ({ clientId: item.clientId }));
        }

        return NextResponse.json({ success: true, data: conversations });
    } catch (error) {
        console.error("Error al obtener conversaciones:", error);
        return NextResponse.json(
            { success: false, message: "Error al obtener las conversaciones" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect().catch(e => {
            console.error("Error al desconectar Prisma:", e);
        });
    }
} 