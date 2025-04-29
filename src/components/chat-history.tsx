"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Chat } from "@/components/chat";

interface Reservation {
    id: string;
    clientId: string;
    musicianId: string;
    price: number;
    creationDate: string;
    serviceDate: string;
    reservationStatusId: string;
    client: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    musician: {
        id: string;
        name: string;
    };
    reservationstatus: {
        id: string;
        name: string;
    };
}

export function ChatHistory() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("pending");

    useEffect(() => {
        // Obtener el rol del usuario desde localStorage
        const storedRole = localStorage.getItem("userRole");
        const storedUser = localStorage.getItem("userData");

        if (storedRole) {
            setUserRole(storedRole);
        }

        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUserId(userData.id);
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchReservations = async () => {
            if (!userId || !userRole) return;

            try {
                // Construir el parámetro según el rol
                const param = userRole === "CLIENT" ? `clientId=${userId}` : `musicianId=${userId}`;
                const response = await fetch(`/api/reservations?${param}`);

                if (!response.ok) {
                    throw new Error('Error obteniendo reservas');
                }

                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    setReservations(data.data);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error al cargar reservas:', error);
                setLoading(false);
            }
        };

        fetchReservations();
    }, [userId, userRole]);

    const handleReservationSelect = (reservation: Reservation) => {
        setSelectedReservation(reservation);
    };

    const handleUpdateStatus = async (reservationId: string, status: string) => {
        try {
            const response = await fetch('/api/reservations', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: reservationId,
                    status
                }),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar estado');
            }

            const data = await response.json();

            if (data.success) {
                // Actualizar localmente
                setReservations(prev =>
                    prev.map(res =>
                        res.id === reservationId
                            ? { ...res, reservationStatusId: status, reservationstatus: { ...res.reservationstatus, id: status, name: getStatusName(status) } }
                            : res
                    )
                );

                if (selectedReservation?.id === reservationId) {
                    setSelectedReservation({
                        ...selectedReservation,
                        reservationStatusId: status,
                        reservationstatus: {
                            ...selectedReservation.reservationstatus,
                            id: status,
                            name: getStatusName(status)
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
        }
    };

    const handlePayment = async (reservationId: string) => {
        if (!reservationId) return;

        setProcessing(true);

        try {
            const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reservationId,
                    successUrl: `${window.location.origin}/payment/success`,
                    cancelUrl: `${window.location.origin}/payment/cancel`
                }),
            });

            if (!response.ok) {
                throw new Error('Error al iniciar el proceso de pago');
            }

            const data = await response.json();

            if (data.success && data.url) {
                // Redirigir al usuario a la página de pago de Stripe
                window.location.href = data.url;
            } else {
                throw new Error('No se pudo obtener la URL de pago');
            }
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            alert('Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusName = (statusId: string): string => {
        switch (statusId) {
            case "accepted": return "Aceptada";
            case "rejected": return "Rechazada";
            case "pending": return "Pendiente";
            case "completed": return "Completada";
            case "canceled": return "Cancelada";
            case "payment_pending": return "Pago Pendiente";
            default: return "Desconocido";
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case "accepted":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "canceled":
                return "bg-gray-100 text-gray-800";
            case "payment_pending":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Filtrar reservas según la pestaña activa
    const filteredReservations = reservations.filter(res => {
        if (activeTab === "all") return true;
        return res.reservationStatusId === activeTab;
    });

    if (loading) {
        return <div className="flex justify-center p-8">Cargando historial de reservas...</div>;
    }

    return (
        <div className="p-4">
            <Tabs defaultValue="pending" onValueChange={setActiveTab}>
                <TabsList className="mb-6 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="pending">Pendientes</TabsTrigger>
                    <TabsTrigger value="accepted">Aceptadas</TabsTrigger>
                    <TabsTrigger value="payment_pending">Pago Pendiente</TabsTrigger>
                    <TabsTrigger value="completed">Completadas</TabsTrigger>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <div className="space-y-4">
                            {filteredReservations.length > 0 ? (
                                filteredReservations.map((reservation) => (
                                    <Card
                                        key={reservation.id}
                                        className={`cursor-pointer ${selectedReservation?.id === reservation.id ? 'border-black' : ''}`}
                                        onClick={() => handleReservationSelect(reservation)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>
                                                        {userRole === "CLIENT" ? reservation.musician.name : reservation.client.name}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {format(new Date(reservation.serviceDate), "dd/MM/yyyy")}
                                                    </CardDescription>
                                                </div>
                                                <Badge className={getStatusColor(reservation.reservationStatusId)}>
                                                    {reservation.reservationstatus.name}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <p className="text-sm text-gray-500">
                                                Precio: COP ${reservation.price.toLocaleString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-center p-4 text-gray-500">No hay reservas en esta categoría</p>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        {selectedReservation ? (
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-4 border-b">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {userRole === "CLIENT" ? selectedReservation.musician.name : selectedReservation.client.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Reserva para el {format(new Date(selectedReservation.serviceDate), "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                        <Badge className={getStatusColor(selectedReservation.reservationStatusId)}>
                                            {selectedReservation.reservationstatus.name}
                                        </Badge>
                                    </div>

                                    {/* Mostrar botones de acción según el rol y estado */}
                                    {userRole === "MUSICIAN" && selectedReservation.reservationStatusId === "pending" && (
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                onClick={() => handleUpdateStatus(selectedReservation.id, "accepted")}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                Aceptar Reserva
                                            </Button>
                                            <Button
                                                onClick={() => handleUpdateStatus(selectedReservation.id, "rejected")}
                                                variant="outline"
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                Rechazar
                                            </Button>
                                        </div>
                                    )}

                                    {/* Botón de pago - solo visible para clientes cuando la reserva está aceptada */}
                                    {userRole === "CLIENT" && selectedReservation.reservationStatusId === "accepted" && (
                                        <div className="mt-4">
                                            <Button
                                                className="bg-black hover:bg-gray-800"
                                                onClick={() => handlePayment(selectedReservation.id)}
                                                disabled={processing}
                                            >
                                                {processing ? 'Procesando...' : 'Proceder al Pago'}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Componente de chat */}
                                <Chat
                                    clientId={selectedReservation.clientId}
                                    musicianId={selectedReservation.musicianId}
                                    clientName={selectedReservation.client.name}
                                    musicianName={selectedReservation.musician.name}
                                    reservationId={selectedReservation.id}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full border rounded-lg p-8 bg-gray-50">
                                <p className="text-gray-500">Selecciona una reserva para ver la conversación</p>
                            </div>
                        )}
                    </div>
                </div>
            </Tabs>
        </div>
    );
} 