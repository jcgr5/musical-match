'use Client';
import { SignInForm } from "@/components/signIn-form"
import Link from "next/link"

export default function SignInPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <SignInForm />
                    </div>
                </div>
            </div>
            <div className="relative hidden h-full flex-col bg-primary p-10 text-primary-foreground lg:flex dark:border-r">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1920&auto=format&fit=crop')",
                            opacity: 0.4
                        }}
                    />
                </div>
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <Link href="/" className="flex items-center">
                        <span className="text-2xl font-bold">MusicalMatch</span>
                    </Link>
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-4">
                        <p className="text-2xl font-serif italic tracking-wide leading-relaxed">
                            &ldquo;La música es el lenguaje universal que conecta talentos con oportunidades.&rdquo;
                        </p>
                        <footer className="text-sm font-light text-primary-foreground/80">— Musical Match, conectando músicos con los que valoran su arte</footer>
                    </blockquote>
                </div>
            </div>
        </div>
    )
}
