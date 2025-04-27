import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
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

const signUpSchema = z.object({
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

type SignUpFormValues = z.infer<typeof signUpSchema>

export function SignUpForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"form">) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
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

    async function onSubmit(data: SignUpFormValues) {
        setIsLoading(true)

        try {
            const formData = {
                ...data,
                role: data.role // Ahora el rol viene del formulario
            };

            const response = await fetch('/api/auth/register', {
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
                throw new Error(result.message || "Error al registrar usuario");
            }

            toast({
                title: "Registro exitoso",
                description: "Tu cuenta ha sido creada correctamente",
            })

            // Redireccionar al usuario después de un registro exitoso
            setTimeout(() => {
                router.push('/sign-in')
            }, 2000)
        } catch (error) {
            console.error("Error al registrar usuario:", error)

            toast({
                variant: "destructive",
                title: "Error en el registro",
                description: error instanceof Error ? error.message : "Ocurrió un error durante el registro",
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
                <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
                <p className="lg:text-nowrap text-balance text-sm text-muted-foreground">
                    Regístrate para mostrar tu talento y encontrar oportunidades de trabajo
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
                        disabled={isLoading}
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

                <div className="grid gap-2">
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
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
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
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
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
                    {isLoading ? "Registrando..." : "Registrarse"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes una cuenta?{" "}
                    <Link
                        href="/sign-in"
                        className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                    >
                        Inicia sesión
                    </Link>
                </div>
            </div>
            <Toaster />
        </form>
    )
} 