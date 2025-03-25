"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MousePointerClick, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerStatsProps {
    username: string;
    clickCount: number;
    rank: number;
    loading: boolean;
    onClickButton: () => Promise<void>;
}

export default function PlayerStats({
    username,
    clickCount,
    rank,
    loading,
    onClickButton
}: PlayerStatsProps) {
    const [clickRate, setClickRate] = useState(0);
    const clickTimestamps = useRef<number[]>([]);
    const clickRateTimerRef = useRef<number | null>(null);
    const animateRef = useRef(false);
    const [isButtonAnimating, setIsButtonAnimating] = useState(false);

    // Calculate click rate
    useEffect(() => {
        const calculateClickRate = () => {
            const now = performance.now();
            // Filter timestamps from the last second
            const oneSecondAgo = now - 1000;
            const recentClicks = clickTimestamps.current.filter(t => t > oneSecondAgo);

            // Update click rate
            setClickRate(recentClicks.length);

            // Clean up old timestamps (only keep last 5 seconds worth)
            clickTimestamps.current = clickTimestamps.current.filter(t => t > now - 5000);

            // Schedule next calculation
            clickRateTimerRef.current = window.setTimeout(calculateClickRate, 100);
        };

        // Start calculation
        calculateClickRate();

        // Cleanup timeout on unmount
        return () => {
            if (clickRateTimerRef.current !== null) {
                clearTimeout(clickRateTimerRef.current);
                clickRateTimerRef.current = null;
            }
        };
    }, []);

    // Handle click with animation
    const handleClick = async () => {
        // Record timestamp for click rate calculation
        clickTimestamps.current.push(performance.now());

        // Animate button
        setIsButtonAnimating(true);
        setTimeout(() => setIsButtonAnimating(false), 150);

        await onClickButton();
    };

    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Player Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {username}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="text-4xl font-bold text-center tabular-nums mb-2 tracking-tight">
                        {clickCount}
                    </div>
                    <p className="text-center text-muted-foreground text-sm">Total Clicks</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-3 rounded-lg flex flex-col items-center">
                        <div className="flex items-center justify-center text-amber-500 mb-1">
                            <Trophy className="h-4 w-4 mr-1" />
                            <span className="font-semibold text-lg">#{rank || '—'}</span>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Rank</p>
                    </div>

                    <div className="bg-muted p-3 rounded-lg flex flex-col items-center">
                        <div className="flex items-center justify-center text-blue-500 mb-1">
                            <MousePointerClick className="h-4 w-4 mr-1" />
                            <span className="font-semibold text-lg">{clickRate}/s</span>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Click Rate</p>
                    </div>
                </div>

                <Button
                    onClick={handleClick}
                    size="lg"
                    className={cn(
                        "w-full h-16 text-lg font-bold shadow-sm transition-all",
                        isButtonAnimating ? "scale-95 bg-primary-foreground text-primary translate-y-0.5" : ""
                    )}
                >
                    Click Me!
                </Button>
            </CardContent>
        </Card>
    );
} 