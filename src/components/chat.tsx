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

interface UserData {
    id?: string;
    username?: string;
    name?: string;
    email?: string;
    phone?: string;
}

interface ChatProps {
    clientId: string;
    musicianId: string;
    clientName: string;
    musicianName: string;
    reservationData?: ReservationData;
}

export function Chat({ clientId, musicianId, clientName, musicianName, reservationData }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [userRole, setUserRole] = useState<"CLIENT" | "MUSICIAN" | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
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
                setUserData(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }

        // Si hay datos de reserva, crear un mensaje inicial
        if (reservationData) {
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
        } else {
            // En un escenario real, aquí cargaríamos los mensajes de la API
            // Por ahora, simularemos algunos mensajes
            const demoMessages: Message[] = [
                {
                    id: "1",
                    senderId: clientId,
                    receiverId: musicianId,
                    content: "Hola, estoy interesado en contratarte para mi evento",
                    timestamp: new Date(Date.now() - 3600000),
                    senderName: clientName,
                    senderType: "client"
                },
                {
                    id: "2",
                    senderId: musicianId,
                    receiverId: clientId,
                    content: "¡Hola! Gracias por contactarme. ¿Para qué fecha necesitas el servicio?",
                    timestamp: new Date(Date.now() - 3500000),
                    senderName: musicianName,
                    senderType: "musician"
                }
            ];
            setMessages(demoMessages);
        }
    }, [clientId, musicianId, clientName, musicianName, reservationData]);

    // Auto-scroll cuando se añaden nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !userRole) return;

        const message: Message = {
            id: Date.now().toString(),
            senderId: userRole === "CLIENT" ? clientId : musicianId,
            receiverId: userRole === "CLIENT" ? musicianId : clientId,
            content: newMessage,
            timestamp: new Date(),
            senderName: userRole === "CLIENT" ? clientName : musicianName,
            senderType: userRole === "CLIENT" ? "client" : "musician"
        };

        setMessages(prev => [...prev, message]);
        setNewMessage("");

        // En un escenario real, aquí enviaríamos el mensaje a la API
        // saveMessageToDatabase(message);
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
                        <div className="flex max-w-[80%]">
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