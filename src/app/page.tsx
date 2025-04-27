"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un token de autenticación
    const authToken = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");

    if (authToken) {
      // Si el usuario está autenticado
      if (userRole === "MUSICIAN") {
        // Si es músico, redirigir a su perfil
        router.push("/profile");
      } else {
        // Si es cliente, redirigir al dashboard
        router.push("/dashboard");
      }
    } else {
      // Si no está autenticado, redirigir a inicio de sesión
      router.push("/sign-in");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redireccionando...</p>
    </div>
  );
}
