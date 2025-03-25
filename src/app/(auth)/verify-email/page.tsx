"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast, Toaster } from "sonner"
import { handleError } from "@/lib/error-handler"

function VerifyEmailContent() {
    const [email, setEmail] = useState("")
    const [verificationCode, setVerificationCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isCodeLoading, setIsCodeLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get the email from the URL parameters if available
    useEffect(() => {
        const emailParam = searchParams.get("email")
        if (emailParam) {
            setEmail(emailParam)
        }
    }, [searchParams])

    const handleResendVerification = async () => {
        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address")
            return
        }

        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.resend({
                type: "signup",
                email,
            })

            if (error) {
                handleError(error)
                return
            }

            setIsSuccess(true)
            toast.success("Verification email sent! Please check your inbox.")
        } catch (error: unknown) {
            handleError(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyCode = async () => {
        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address")
            return
        }

        if (!verificationCode || verificationCode.trim().length < 6) {
            toast.error("Please enter a valid verification code")
            return
        }

        setIsCodeLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: verificationCode,
                type: "signup"
            })

            if (error) {
                handleError(error)
                return
            }

            toast.success("Email verified successfully!")
            // Redirect to dashboard or login page
            router.push("/login?success=verification_complete")
        } catch (error: unknown) {
            handleError(error)
        } finally {
            setIsCodeLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <Toaster position="top-center" closeButton richColors />
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isSuccess ? (
                            <div className="text-center space-y-4">
                                <p className="text-green-600 font-medium">
                                    Verification email sent successfully!
                                </p>
                                <p>
                                    Please check your inbox and follow the link to verify your email address.
                                </p>
                                <p className="text-sm text-muted-foreground mt-4">
                                    Don&apos;t see the email? Check your spam folder or request another verification email.
                                </p>

                                <div className="mt-6 pt-6 border-t border-border">
                                    <p className="font-medium mb-3">Alternatively, enter the verification code manually:</p>
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Verification Code</Label>
                                        <Input
                                            id="code"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Enter 6-digit code"
                                            disabled={isCodeLoading}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleVerifyCode}
                                        disabled={isCodeLoading}
                                        className="w-full mt-3"
                                    >
                                        {isCodeLoading ? "Verifying..." : "Verify Code"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Tabs defaultValue="email" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="email">Email Link</TabsTrigger>
                                    <TabsTrigger value="code">Verification Code</TabsTrigger>
                                </TabsList>
                                <TabsContent value="email" className="space-y-4">
                                    <p>
                                        Your email address needs to be verified before you can sign in.
                                    </p>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleResendVerification}
                                        disabled={isLoading}
                                        className="w-full mt-2"
                                    >
                                        {isLoading ? "Sending..." : "Send Verification Email"}
                                    </Button>
                                </TabsContent>
                                <TabsContent value="code" className="space-y-4">
                                    <p>
                                        Enter the verification code that was sent to your email.
                                    </p>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email2">Email</Label>
                                        <Input
                                            id="email2"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            disabled={isCodeLoading}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="verificationCode">Verification Code</Label>
                                        <Input
                                            id="verificationCode"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Enter 6-digit code"
                                            disabled={isCodeLoading}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleVerifyCode}
                                        disabled={isCodeLoading}
                                        className="w-full mt-2"
                                    >
                                        {isCodeLoading ? "Verifying..." : "Verify Code"}
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/login")}
                            className="w-full"
                        >
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
                <div className="text-center text-xs text-muted-foreground mt-4">
                    Already verified your email? <button onClick={() => router.push("/login")} className="underline underline-offset-4">Sign in</button>
                </div>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailContent />
        </Suspense>
    )
}