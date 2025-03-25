"use client"

import { useEffect, useState } from 'react'
import { handleAuthError } from '@/lib/error-handler'

interface ErrorBoundaryProps {
    children: React.ReactNode
}

// Flag to prevent multiple redirects to login page
let isRedirecting = false;
// Track last error to prevent repeated notifications
let lastErrorMessage = '';
let lastErrorTime = 0;
const ERROR_COOLDOWN_MS = 5000;

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        // Handler for unhandled promise rejections (async errors)
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled Promise rejection:', event.reason)
            setHasError(true)

            const now = Date.now();
            const isSameError = lastErrorMessage === event.reason?.message;
            const isWithinCooldown = now - lastErrorTime < ERROR_COOLDOWN_MS;

            // Only handle the error if it's new or outside cooldown period
            if (!isSameError || !isWithinCooldown) {
                lastErrorMessage = event.reason?.message || '';
                lastErrorTime = now;

                // Check if it's an auth error
                if (event.reason?.name === 'AuthSessionMissingError') {
                    // Prevent the default error from showing in console
                    event.preventDefault()

                    // Handle auth error but don't redirect if already redirecting
                    if (!isRedirecting) {
                        isRedirecting = true;
                        handleAuthError(event.reason)
                        // Reset redirecting flag after timeout
                        setTimeout(() => {
                            isRedirecting = false;
                        }, 10000); // 10 seconds should be enough for redirection to complete
                    }
                }
            } else if (isSameError && isWithinCooldown) {
                // Silently handle repeated errors within cooldown
                event.preventDefault();
            }
        }

        // Handler for regular JS errors
        const handleError = (event: ErrorEvent) => {
            console.error('Error:', event.error)
            setHasError(true)

            const now = Date.now();
            const isSameError = lastErrorMessage === event.error?.message;
            const isWithinCooldown = now - lastErrorTime < ERROR_COOLDOWN_MS;

            // Only handle the error if it's new or outside cooldown period
            if (!isSameError || !isWithinCooldown) {
                lastErrorMessage = event.error?.message || '';
                lastErrorTime = now;

                // Check if it's an auth error
                if (event.error?.name === 'AuthSessionMissingError') {
                    // Prevent the default error from showing in console
                    event.preventDefault()

                    // Handle auth error but don't redirect if already redirecting
                    if (!isRedirecting) {
                        isRedirecting = true;
                        handleAuthError(event.error)
                        // Reset redirecting flag after timeout
                        setTimeout(() => {
                            isRedirecting = false;
                        }, 10000);
                    }
                }
            } else if (isSameError && isWithinCooldown) {
                // Silently handle repeated errors within cooldown
                event.preventDefault();
            }
        }

        // Add event listeners for errors
        window.addEventListener('unhandledrejection', handleUnhandledRejection)
        window.addEventListener('error', handleError)

        // Clean up
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
            window.removeEventListener('error', handleError)
        }
    }, [])

    // If there was an error, display a friendly message
    if (hasError) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-4">
                <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
                <p className="mb-4 text-center">
                    We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
                </p>
                <button
                    className="rounded bg-primary px-4 py-2 text-white"
                    onClick={() => window.location.reload()}
                >
                    Refresh Page
                </button>
            </div>
        )
    }

    // Otherwise, render children normally
    return <>{children}</>
} 