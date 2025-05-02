import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

const updateSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres",
    }),
    username: z.string().min(3, {
        message: "El nombre de usuario debe tener al menos 3 caracteres",
    }),
    email: z.string().email({
        message: "Por favor ingresa un correo electrónico válido",
    }),
    phone: z.string().min(7, {
        message: "Por favor ingresa un número de teléfono válido",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres",
    }),
    confirmPassword: z.string(),
    role: z.enum(["CLIENT", "MUSICIAN"], {
        required_error: "Por favor selecciona un rol",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

type updateFormValues = z.infer<typeof updateSchema>

export function UpdateForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"form">) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<updateFormValues>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            role: undefined,
        },
    })

    useEffect(() => {
        // Obtener el rol y datos del usuario desde el localStorage
        const storedRole = localStorage.getItem("userRole");
        const storedUser = localStorage.getItem("userData");

        if (storedUser) {
            try {
                const parsedUserData = JSON.parse(storedUser);
                form.reset({
                    name: parsedUserData.name || "",
                    username: parsedUserData.username || "",
                    email: parsedUserData.email || "",
                    phone: parsedUserData.phone || "",
                    password: "",
                    confirmPassword: "",
                    role: parsedUserData.role || undefined,
                });
                // Si es músico, obtener datos adicionales desde la API
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }
    }, []);



    async function onSubmit(data: updateFormValues) {
        setIsLoading(true)

        try {
            const formData = {
                ...data,
                role: data.role // Ahora el rol viene del formulario
            };

            const response = await fetch('/api/auth/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            // Comprobar si la respuesta es JSON antes de parsearla
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Error del servidor: respuesta no válida (${response.status})`);
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Error al actualizar usuario");
            }

            toast({
                title: "Actualizacion exitosa",
                description: "Tu cuenta ha sido actualizada correctamente",
            })

            // Redireccionar al usuario después de un registro exitoso
            setTimeout(() => {
                router.push('/sign-in')
            }, 2000)
        } catch (error) {
            console.error("Error al actualizar usuario:", error)

            toast({
                variant: "destructive",
                title: "Error en actualizacion",
                description: error instanceof Error ? error.message : "Ocurrió un error durante actualizacion",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form
            className={cn("flex flex-col gap-6", className)}
            {...props}
            onSubmit={form.handleSubmit(onSubmit)}
        >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Actualiza tu cuenta</h1>
                <p className="lg:text-nowrap text-balance text-sm text-muted-foreground">
                    Formulario para actualizar datos
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Ingrese su nombre completo"
                        {...form.register("name")}
                        disabled={isLoading}
                    />
                    {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="Ingrese un nombre de usuario"
                        {...form.register("username")}
                        disabled={isLoading}
                    />
                    {form.formState.errors.username && (
                        <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@ejemplo.com"
                        {...form.register("email")}
                        readOnly//disabled={isLoading}
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="Ingrese su número de teléfono"
                        {...form.register("phone")}
                        disabled={isLoading}
                    />
                    {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                </div>

                {/* <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="role">Rol</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Selecciona cómo deseas usar la plataforma</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Select onValueChange={(value) => form.setValue("role", value as "CLIENT" | "MUSICIAN")}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SelectItem value="CLIENT">Cliente</SelectItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>Como cliente podrás contratar músicos para tus eventos.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SelectItem value="MUSICIAN">Músico</SelectItem>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>Como músico podrás ofrecer tus servicios y ser contratado.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </SelectContent>
                    </Select>
                    {form.formState.errors.role && (
                        <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
                    )}
                </div> */}

                <div className="grid gap-2">
                    <Label htmlFor="password">Ingresa contraseña actual</Label>
                    <Input
                        id="password"
                        type="password"
                        {...form.register("password")}
                        disabled={isLoading}
                    />
                    {form.formState.errors.password && (
                        <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Contraseña nueva</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        {...form.register("confirmPassword")}
                        disabled={isLoading}
                    />
                    {form.formState.errors.confirmPassword && (
                        <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? "Actualizando..." : "Actualizar"}
                </Button>
            </div>
            <Toaster />
        </form>
    )
} 
