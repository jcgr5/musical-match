import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Creando estados de reserva...');

    const reservationStatuses = [
        { id: 'pending', name: 'Pendiente' },
        { id: 'accepted', name: 'Aceptada' },
        { id: 'rejected', name: 'Rechazada' },
        { id: 'completed', name: 'Completada' },
        { id: 'canceled', name: 'Cancelada' },
        { id: 'payment_pending', name: 'Pago Pendiente' }
    ];

    for (const status of reservationStatuses) {
        await prisma.reservationstatus.upsert({
            where: { id: status.id },
            update: { name: status.name },
            create: status
        });
    }

    console.log(`✅ Creados ${reservationStatuses.length} estados de reserva`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 