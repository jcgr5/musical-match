"use client";

import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Music, User } from "lucide-react";

type RoleSelectionModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRoleSelect: (role: string) => void;
    userId: string;
};

export default function RoleSelectionModal({
    open,
    onOpenChange,
    onRoleSelect,
    userId
}: RoleSelectionModalProps) {
    const router = useRouter();

    const handleRoleSelection = async (role: "CLIENT" | "MUSICIAN") => {
        try {
            // Actualizar el rol del usuario en la base de datos
            const response = await fetch('/api/auth/set-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    role
                }),
            });

            if (!response.ok) {
                throw new Error('Error al establecer el rol');
            }

            // Actualizar el rol en la sesión
            localStorage.setItem("userRole", role);

            // Notificar al componente padre
            onRoleSelect(role);

            // Cerrar el modal
            onOpenChange(false);

            // Redirigir según el rol
            if (role === "MUSICIAN") {
                router.push("/dashboard/musician");
            } else {
                router.push("/dashboard/client");
            }
        } catch (error) {
            console.error("Error al establecer rol:", error);
            // Manejar el error aquí
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        ¡Bienvenido a Musical Match!
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Selecciona cómo deseas utilizar la plataforma
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="flex flex-col items-center">
                        <div className="p-6 bg-blue-100 text-blue-600 rounded-full mb-4">
                            <User size={32} />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Cliente</h3>
                        <p className="text-sm text-gray-500 text-center mb-4">
                            Encuentra músicos para tus eventos
                        </p>
                        <Button
                            onClick={() => handleRoleSelection("CLIENT")}
                            className="w-full"
                        >
                            Soy Cliente
                        </Button>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="p-6 bg-green-100 text-green-600 rounded-full mb-4">
                            <Music size={32} />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Músico</h3>
                        <p className="text-sm text-gray-500 text-center mb-4">
                            Ofrece tus servicios musicales
                        </p>
                        <Button
                            onClick={() => handleRoleSelection("MUSICIAN")}
                            variant="outline"
                            className="w-full"
                        >
                            Soy Músico
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 