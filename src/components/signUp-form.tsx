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
        },
    })

    async function onSubmit(data: SignUpFormValues) {
        setIsLoading(true)

        try {
            // Añadir role=CLIENT por defecto a los datos enviados
            const formData = {
                ...data,
                role: "CLIENT" // Role por defecto
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
                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                        O continúa con
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <Button variant="outline" className="w-full" disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path
                                d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="sr-only">Registrarse con Apple</span>
                    </Button>
                    <Button variant="outline" className="w-full" disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path
                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="sr-only">Registrarse con Google</span>
                    </Button>
                    <Button variant="outline" className="w-full" disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path
                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="sr-only">Registrarse con Facebook</span>
                    </Button>
                </div>
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