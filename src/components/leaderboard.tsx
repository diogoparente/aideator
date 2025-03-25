"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CircleUser, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the types for players data
interface RankedPlayer {
    id: string;
    username: string;
    clicks: number;
    rank: number;
}

interface LeaderboardProps {
    players: RankedPlayer[];
    currentUserId: string | null;
    loading: boolean;
}

export default function Leaderboard({ players, currentUserId, loading }: LeaderboardProps) {
    // Render loading state
    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1 flex-1">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-5 w-12" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    // Helper function to get badge color based on rank
    const getRankColor = (rank: number) => {
        if (rank === 1) return "text-yellow-500";
        if (rank === 2) return "text-gray-400";
        if (rank === 3) return "text-amber-700";
        return "text-slate-600";
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="px-6 pb-2 text-sm text-muted-foreground flex justify-between">
                    <span>Player</span>
                    <span>Clicks</span>
                </div>
                <div className="max-h-[350px] overflow-y-auto px-6 space-y-3 pb-6">
                    {players.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No players yet. Be the first!
                        </div>
                    ) : (
                        players.map((player) => (
                            <div
                                key={player.id}
                                className={cn(
                                    "flex items-center py-2 px-3 rounded-lg",
                                    player.id === currentUserId ? "bg-muted" : "",
                                    player.rank <= 3 ? "border border-muted-foreground/20" : ""
                                )}
                            >
                                <div className={cn("flex items-center justify-center h-7 w-7 text-sm font-medium rounded-full mr-3", getRankColor(player.rank))}>
                                    {player.rank <= 3 ? (
                                        <Trophy className="h-4 w-4" />
                                    ) : (
                                        player.rank
                                    )}
                                </div>

                                <div className="flex items-center flex-1 min-w-0">
                                    <CircleUser className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <div className="truncate">
                                        <span className="font-medium">{player.username}</span>
                                    </div>
                                </div>

                                <div className="font-mono text-right tabular-nums">
                                    {player.clicks.toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 