import { LoginForm } from "@/components/login-form";
import { Toaster } from "sonner";

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <Toaster position="top-center" closeButton richColors />
            <div className="w-full max-w-sm md:max-w-3xl">
                <LoginForm />
            </div>
        </div>
    )
}
