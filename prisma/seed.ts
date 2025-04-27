import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando seed...');

    // Limpiar datos existentes
    await cleanData();

    // Crear datos de prueba
    await createMusicalGenres();
    await createInstruments();
    await createPaymentMethods();
    await createReservationStatus();
    await createUsers();

    console.log('Seed completado con éxito!');
}

async function cleanData() {
    console.log('Limpiando datos existentes...');

    // El orden es importante para evitar errores de relaciones
    await prisma.message.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.completedreservation.deleteMany({});
    await prisma.reservation.deleteMany({});
    await prisma.media.deleteMany({});
    await prisma.musiciangenre.deleteMany({});
    await prisma.musicianinstrument.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.musician.deleteMany({});
    await prisma.musicalgenre.deleteMany({});
    await prisma.instrument.deleteMany({});
    await prisma.paymentmethod.deleteMany({});
    await prisma.reservationstatus.deleteMany({});
    await prisma.requeststatus.deleteMany({});
}

async function createMusicalGenres() {
    console.log('Creando géneros musicales...');

    const genres = [
        { name: 'Pop' },
        { name: 'Rock' },
        { name: 'Jazz' },
        { name: 'Clásica' },
        { name: 'Electrónica' },
        { name: 'Reggaeton' },
        { name: 'Salsa' },
        { name: 'Cumbia' },
        { name: 'Bolero' },
        { name: 'Merengue' },
        { name: 'Bachata' },
        { name: 'Vallenato' },
        { name: 'Balada' },
        { name: 'Hip Hop' },
        { name: 'Metal' },
        { name: 'Blues' },
        { name: 'Country' },
        { name: 'Indie' },
        { name: 'Flamenco' },
        { name: 'Mariachi' }
    ];

    for (const genre of genres) {
        await prisma.musicalgenre.create({
            data: genre
        });
    }

    console.log(`✅ Creados ${genres.length} géneros musicales`);
}

async function createInstruments() {
    console.log('Creando instrumentos...');

    const instruments = [
        { name: 'Guitarra' },
        { name: 'Piano' },
        { name: 'Violín' },
        { name: 'Batería' },
        { name: 'Bajo' },
        { name: 'Saxofón' },
        { name: 'Flauta' },
        { name: 'Trompeta' },
        { name: 'Clarinete' },
        { name: 'Violonchelo' },
        { name: 'Acordeón' },
        { name: 'Arpa' },
        { name: 'Trompa' },
        { name: 'Oboe' },
        { name: 'Banjo' },
        { name: 'Ukelele' },
        { name: 'Marimba' },
        { name: 'Sintetizador' },
        { name: 'Percusión' },
        { name: 'Voz' }
    ];

    for (const instrument of instruments) {
        await prisma.instrument.create({
            data: instrument
        });
    }

    console.log(`✅ Creados ${instruments.length} instrumentos`);
}

async function createPaymentMethods() {
    console.log('Creando métodos de pago...');

    const paymentMethods = [
        { name: 'Tarjeta de Crédito' },
        { name: 'Tarjeta de Débito' },
        { name: 'PayPal' },
        { name: 'Transferencia Bancaria' },
        { name: 'Efectivo' },
        { name: 'Nequi' },
        { name: 'Daviplata' }
    ];

    for (const method of paymentMethods) {
        await prisma.paymentmethod.create({
            data: method
        });
    }

    console.log(`✅ Creados ${paymentMethods.length} métodos de pago`);
}

async function createReservationStatus() {
    console.log('Creando estados de reserva...');

    const statuses = [
        { name: 'Pendiente' },
        { name: 'Confirmada' },
        { name: 'Cancelada' },
        { name: 'Completada' },
        { name: 'En Progreso' }
    ];

    for (const status of statuses) {
        await prisma.reservationstatus.create({
            data: status
        });
    }

    console.log(`✅ Creados ${statuses.length} estados de reserva`);
}

async function createUsers() {
    console.log('Creando usuarios...');

    // Crear músicos
    // Obtener géneros musicales e instrumentos para asignar a los músicos
    const genres = await prisma.musicalgenre.findMany();
    const instruments = await prisma.instrument.findMany();

    // Crear músicos
    const musicians = [
        {
            username: 'musico1',
            password: await hash('123456', 10),
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '3201234567',
            genres: [genres[0].id, genres[1].id, genres[12].id],
            instruments: [instruments[0].id, instruments[4].id]
        },
        {
            username: 'musico2',
            password: await hash('123456', 10),
            name: 'María López',
            email: 'maria@example.com',
            phone: '3002587413',
            genres: [genres[6].id, genres[7].id, genres[10].id],
            instruments: [instruments[1].id, instruments[19].id]
        },
        {
            username: 'musico3',
            password: await hash('123456', 10),
            name: 'David Sánchez',
            email: 'david@example.com',
            phone: '3156987412',
            genres: [genres[3].id, genres[4].id],
            instruments: [instruments[2].id, instruments[9].id]
        },
        {
            username: 'musico4',
            password: await hash('123456', 10),
            name: 'Laura Jiménez',
            email: 'laura@example.com',
            phone: '3109632587',
            genres: [genres[8].id, genres[11].id],
            instruments: [instruments[5].id, instruments[19].id]
        },
        {
            username: 'musico5',
            password: await hash('123456', 10),
            name: 'Carlos Vives',
            email: 'carlosvives@example.com',
            phone: '3152345678',
            genres: [genres[2].id, genres[6].id, genres[7].id, genres[8].id],
            instruments: [instruments[0].id, instruments[19].id]
        }
    ];

    for (const musician of musicians) {
        const { genres: genreIds, instruments: instrumentIds, ...musicianData } = musician;

        // Crear el músico
        const createdMusician = await prisma.musician.create({
            data: musicianData
        });

        // Agregar géneros musicales
        for (const genreId of genreIds) {
            await prisma.musiciangenre.create({
                data: {
                    musicianId: createdMusician.id,
                    musicalGenreId: genreId
                }
            });
        }

        // Agregar instrumentos
        for (const instrumentId of instrumentIds) {
            await prisma.musicianinstrument.create({
                data: {
                    musicianId: createdMusician.id,
                    instrumentId: instrumentId
                }
            });
        }

        // Agregar imágenes de perfil (en un escenario real serían URLs reales)
        await prisma.media.create({
            data: {
                musicianId: createdMusician.id,
                mediaType: 'image',
                filePath: '/images/profile.jpg'
            }
        });
    }

    console.log(`✅ Creados ${musicians.length} músicos`);

    // Crear algunas reseñas
    await createSampleReviews();

    // Crear algunas reservas
    await createSampleReservations();
}

async function createSampleReviews() {
    console.log('Creando reseñas de ejemplo...');

    // Ya que eliminamos la creación automática de clientes, 
    // no podemos crear reseñas que los involucren
    console.log('⚠️ No se crearán reseñas hasta que haya clientes registrados manualmente');
}

async function createSampleReservations() {
    console.log('Creando reservas de ejemplo...');

    // Ya que eliminamos la creación automática de clientes,
    // no podemos crear reservas que los involucren
    console.log('⚠️ No se crearán reservas hasta que haya clientes registrados manualmente');
}

main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 