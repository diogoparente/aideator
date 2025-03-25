'use client';

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatusType = "connecting" | "connected" | "error";

interface ConnectionStatusProps {
    status: ConnectionStatusType;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
    return (
        <div className={cn("flex items-center gap-2", status === "error" && "text-red-500")}>
            <StatusIcon status={status} />
            <div>
                <p className="font-medium">{getStatusTitle(status)}</p>
                <p className="text-sm text-muted-foreground">{getStatusDescription(status)}</p>
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: ConnectionStatusType }) {
    if (status === "connecting") {
        return <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />;
    }

    if (status === "connected") {
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
    }

    return <AlertCircle className="h-8 w-8 text-red-500" />;
}

function getStatusTitle(status: ConnectionStatusType): string {
    switch (status) {
        case "connecting":
            return "Connecting to server...";
        case "connected":
            return "Connected";
        case "error":
            return "Connection Error";
    }
}

function getStatusDescription(status: ConnectionStatusType): string {
    switch (status) {
        case "connecting":
            return "Establishing real-time connection to the game server.";
        case "connected":
            return "Real-time updates are enabled. Your clicks are being saved.";
        case "error":
            return "Unable to establish real-time connection. Please try refreshing the page.";
    }
} 