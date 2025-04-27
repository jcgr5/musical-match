"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MusiciansPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirigir al dashboard
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Redireccionando al dashboard...</p>
        </div>
    );
} 