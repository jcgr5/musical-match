import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Obtener todos los géneros musicales
        const genres = await prisma.musicalgenre.findMany();

        // Devolver solo los nombres de los géneros
        const genreNames = genres.map(genre => genre.name);

        return NextResponse.json(genreNames);
    } catch (error) {
        console.error('Error al obtener géneros musicales:', error);
        return NextResponse.json(
            { error: 'Error al obtener los géneros musicales' },
            { status: 500 }
        );
    }
} 