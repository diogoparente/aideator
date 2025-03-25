import { toast } from 'sonner';

// Track when we last showed an auth error notification to prevent spam
let lastAuthErrorTime = 0;
const ERROR_COOLDOWN_MS = 5000; // Only show error once every 5 seconds

/**
 * Global error handler for authentication errors
 * This centralizes error handling logic for auth-related errors
 */
export const handleAuthError = (error: unknown): boolean => {
    // If no error, there's nothing to handle
    if (!error) return false;

    const now = Date.now();
    const shouldShowNotification = now - lastAuthErrorTime > ERROR_COOLDOWN_MS;

    // Check for specific auth errors first that we want to handle specially
    if (error instanceof Error) {
        // Invalid login credentials
        if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
            return true;
        }

        // Email rate limit exceeded
        if (error.message.includes("email rate limit exceeded")) {
            toast.error("Too many sign-up attempts with this email. Please try again later.");
            return true;
        }

        // Email not confirmed
        if (error.message.includes("Email not confirmed")) {
            toast.error("Email not confirmed. Please check your inbox for the verification email.");
            return true;
        }
    }

    // If it's an authentication session missing error
    if (error instanceof Error && error.name === 'AuthSessionMissingError') {
        if (shouldShowNotification) {
            lastAuthErrorTime = now;
            toast.error('Your session has expired. Please log in again.');

            // Clear any potentially corrupted session data
            if (typeof window !== 'undefined') {
                const cookies = document.cookie.split(';');
                for (const cookie of cookies) {
                    const cookieName = cookie.split('=')[0].trim();
                    if (cookieName.includes('supabase') || cookieName.includes('auth')) {
                        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    }
                }

                // Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
        }
        return true;
    }

    // Check for other auth-related errors
    if (error instanceof Error && (error.message && (
        error.message.includes('auth') ||
        error.message.includes('session') ||
        error.message.includes('token')
    ))
    ) {
        if (shouldShowNotification) {
            lastAuthErrorTime = now;
            toast.error('Authentication error. Please log in again.');

            // Redirect to login after a short delay
            if (typeof window !== 'undefined') {
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            }
        }
        return true;
    }

    return false;
};

/**
 * Generic error handler that can be used throughout the application
 */
export const handleError = (error: unknown, customMessage?: string): void => {
    console.error('Error:', error);

    // First check if it's an auth error
    if (handleAuthError(error)) {
        return;
    }

    // If not an auth error, show a generic or custom error message
    if (customMessage) {
        toast.error(customMessage);
    } else if (error instanceof Error) {
        toast.error(error.message);
    } else {
        toast.error('An unexpected error occurred');
    }
}; 