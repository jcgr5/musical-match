import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Obtener todos los instrumentos
        const instruments = await prisma.instrument.findMany();

        // Devolver solo los nombres de los instrumentos
        const instrumentNames = instruments.map(instrument => instrument.name);

        return NextResponse.json(instrumentNames);
    } catch (error) {
        console.error('Error al obtener instrumentos:', error);
        return NextResponse.json(
            { error: 'Error al obtener los instrumentos' },
            { status: 500 }
        );
    }
} 