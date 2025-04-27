"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { usePathname } from 'next/navigation';

export default function ClientOnlyLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Rutas donde no queremos mostrar navbar o footer
    const hideNavbarRoutes = ['/sign-in', '/sign-up'];
    const shouldHideNavbar = hideNavbarRoutes.some(route => pathname?.startsWith(route));

    return (
        <>
            {!shouldHideNavbar && <Navbar />}
            <main className="flex-grow">
                {children}
            </main>
            {!shouldHideNavbar && <Footer />}
        </>
    );
}