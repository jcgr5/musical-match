"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ReservationData } from "./reservation-form";

interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
    senderName?: string;
    senderType: "client" | "musician";
}

interface ChatProps {
    clientId: string;
    musicianId: string;
    clientName: string;
    musicianName: string;
    reservationData?: ReservationData;
    reservationId?: string;
}

export function Chat({ clientId, musicianId, clientName, musicianName, reservationData, reservationId }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [userRole, setUserRole] = useState<"CLIENT" | "MUSICIAN" | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Obtener el rol del usuario desde localStorage
        const storedRole = localStorage.getItem("userRole") as "CLIENT" | "MUSICIAN" | null;
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

        const fetchMessages = async () => {
            if (!reservationId) return;

            try {
                const response = await fetch(`/api/messages?reservationId=${reservationId}`);
                if (!response.ok) {
                    throw new Error('Error obteniendo mensajes');
                }

                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    // Transformar al formato esperado por el componente
                    const formattedMessages = data.data.map((msg: any) => ({
                        id: msg.id,
                        senderId: msg.clientId === userId ? msg.clientId : msg.musicianId,
                        receiverId: msg.clientId === userId ? msg.musicianId : msg.clientId,
                        content: msg.content,
                        timestamp: new Date(msg.timestamp),
                        senderName: msg.clientId === userId ? msg.client.name : msg.musician.name,
                        senderType: msg.clientId === userId ? "client" : "musician"
                    }));

                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error('Error al cargar mensajes:', error);
            }
        };

        // Si hay un reservationId, cargar mensajes de la API
        if (reservationId) {
            fetchMessages();
        }
        // Si solo hay datos de reserva pero no ID, crear mensaje inicial
        else if (reservationData) {
            const initialMessage: Message = {
                id: Date.now().toString(),
                senderId: clientId,
                receiverId: musicianId,
                content: createReservationMessage(reservationData),
                timestamp: new Date(),
                senderName: clientName,
                senderType: "client"
            };
            setMessages([initialMessage]);
        }
    }, [clientId, musicianId, clientName, musicianName, reservationData, reservationId, userId]);

    // Auto-scroll cuando se añaden nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !userRole || !reservationId) return;

        const message: Message = {
            id: Date.now().toString(),
            senderId: userRole === "CLIENT" ? clientId : musicianId,
            receiverId: userRole === "CLIENT" ? musicianId : clientId,
            content: newMessage,
            timestamp: new Date(),
            senderName: userRole === "CLIENT" ? clientName : musicianName,
            senderType: userRole === "CLIENT" ? "client" : "musician"
        };

        // Agregar mensaje localmente para UX inmediata
        setMessages(prev => [...prev, message]);
        setNewMessage("");

        // Enviar mensaje a la API
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId,
                    musicianId,
                    content: message.content,
                    reservationId
                }),
            });

            if (!response.ok) {
                throw new Error('Error al enviar mensaje');
            }

            const data = await response.json();
            if (data.success) {
                console.log('Mensaje enviado correctamente');
            }
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            // Notificar al usuario sobre el error
        }
    };

    const createReservationMessage = (data: ReservationData): string => {
        return `
📅 *SOLICITUD DE RESERVA*
            
Tipo de evento: ${data.eventType}
Fecha: ${format(new Date(data.eventDate), "dd/MM/yyyy")}
Ubicación: ${data.location.city}, ${data.location.department}
Dirección: ${data.address}
            
Precio inicial: COP $${data.initialPrice.toLocaleString()}
            
Comentarios adicionales: ${data.comments || "Ninguno"}
        `;
    };

    return (
        <div className="flex flex-col h-[600px] bg-white border rounded-lg shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b">
                <h3 className="text-lg font-semibold">Chat con {userRole === "CLIENT" ? musicianName : clientName}</h3>
                <p className="text-sm text-gray-500">Coordina los detalles de tu reserva</p>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.senderType === (userRole === "CLIENT" ? "client" : "musician") ? "justify-end" : "justify-start"}`}
                    >
                        {message.senderType !== (userRole === "CLIENT" ? "client" : "musician") && (
                            <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src="/images/avatar.jpg" />
                                <AvatarFallback>
                                    {message.senderName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <div>
                            <div
                                className={`rounded-lg px-4 py-2 whitespace-pre-wrap ${message.senderType === (userRole === "CLIENT" ? "client" : "musician")
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-800"
                                    }`}
                            >
                                {message.content}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(message.timestamp), "h:mm a")}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t">
                <div className="flex gap-2">
                    <Input
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="px-3">
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
} 