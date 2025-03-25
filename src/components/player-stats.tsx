"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabase } from '@/lib/supabase/provider';
import { toast } from 'sonner';

interface PlayerStatsProps {
    user_id: string | undefined;
    clickCount: number;
    rank: number;
    username: string;
    loading: boolean;
    onUpdateClickAction: (newCount: number) => Promise<void>;
}

export default function PlayerStats({
    user_id,
    clickCount,
    rank,
    username,
    loading,
    onUpdateClickAction
}: PlayerStatsProps) {
    const [localClickCount, setLocalClickCount] = useState(clickCount);
    const [pendingClicks, setPendingClicks] = useState(0);
    const [processingClicks, setProcessingClicks] = useState(false);
    const [clickRatePerSecond, setClickRatePerSecond] = useState(0);
    const clickTimestamps = useRef<number[]>([]);
    const lastUpdateTime = useRef<number>(0);
    const animationFrame = useRef<number | null>(null);
    const supabase = useSupabase();

    // Update local click count when prop changes from server
    useEffect(() => {
        // Only update if the server value is higher (prevents UI flickering)
        if (clickCount > localClickCount) {
            setLocalClickCount(clickCount);
        }
    }, [clickCount, localClickCount]);

    // Function to update server with optimistic UI updates
    const updateServer = useCallback(async () => {
        if (!user_id || pendingClicks === 0 || processingClicks) return;

        try {
            setProcessingClicks(true);

            // Calculate new total
            const newTotal = localClickCount;
            lastUpdateTime.current = performance.now();

            // Call server action (optimistic update already applied to UI)
            await onUpdateClickAction(newTotal);

            // Reset pending clicks after successful update
            setPendingClicks(0);
        } catch (err) {
            console.error('Failed to update clicks:', err);
            toast.error("Failed to save your progress", {
                description: "Your clicks will be retried automatically."
            });
        } finally {
            setProcessingClicks(false);
        }
    }, [user_id, pendingClicks, processingClicks, localClickCount, onUpdateClickAction]);

    // Debounced server updates using RAF for smoother UI
    useEffect(() => {
        if (pendingClicks === 0) return;

        // Use requestAnimationFrame for better performance
        const scheduleUpdate = () => {
            // If we have accumulated clicks and not currently processing, update server
            if (pendingClicks > 0 && !processingClicks) {
                // If enough time has passed since last update
                const now = performance.now();
                if (now - lastUpdateTime.current > 100) { // Update every 100ms max
                    updateServer();
                } else {
                    // Schedule another check on next frame
                    animationFrame.current = requestAnimationFrame(scheduleUpdate);
                }
            } else {
                // Schedule another check on next frame
                animationFrame.current = requestAnimationFrame(scheduleUpdate);
            }
        };

        // Start the update cycle
        if (animationFrame.current === null) {
            animationFrame.current = requestAnimationFrame(scheduleUpdate);
        }

        return () => {
            if (animationFrame.current !== null) {
                cancelAnimationFrame(animationFrame.current);
                animationFrame.current = null;
            }
        };
    }, [pendingClicks, processingClicks, updateServer]);

    // Calculate click rate
    useEffect(() => {
        // Function to calculate click rate
        const calculateClickRate = () => {
            const now = performance.now();
            // Filter timestamps from the last second
            const oneSecondAgo = now - 1000;
            const recentClicks = clickTimestamps.current.filter(t => t > oneSecondAgo);

            // Update click rate
            setClickRatePerSecond(recentClicks.length);

            // Clean up old timestamps (only keep last 10 seconds worth)
            clickTimestamps.current = clickTimestamps.current.filter(t => t > now - 10000);

            // Schedule next calculation
            setTimeout(calculateClickRate, 100); // Update rate 10 times per second for smooth display
        };

        // Start calculation
        calculateClickRate();
    }, []);

    // Handle click with immediate local update
    const handleClick = useCallback(() => {
        if (!user_id) {
            toast("Login required", {
                description: 'Please log in to save your progress',
                action: {
                    label: "Continue Playing",
                    onClick: () => {
                        // Allow incrementing the local counter for a better UX
                        // even without being logged in
                        setLocalClickCount(prev => prev + 1);
                    }
                }
            });
            return;
        }

        // Record timestamp for click rate calculation
        clickTimestamps.current.push(performance.now());

        // Update local state immediately for responsiveness
        setLocalClickCount(prev => prev + 1);

        // Increment pending clicks for batched update
        setPendingClicks(prev => prev + 1);
    }, [user_id]);

    if (loading) {
        return (
            <Card className="w-full h-full">
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="space-y-4 flex-grow flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">{username || 'Anonymous Player'}</h3>
                        <div className="flex justify-between mt-2">
                            <p className="text-sm text-muted-foreground">Your Score:</p>
                            <p className="font-medium">{localClickCount}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-sm text-muted-foreground">Your Rank:</p>
                            <p className="font-medium">#{rank || '—'}</p>
                        </div>
                        <div className="flex justify-between mt-1">
                            <p className="text-sm text-muted-foreground">Click Rate:</p>
                            <p className="font-medium">{clickRatePerSecond}/s</p>
                        </div>
                        {pendingClicks > 0 && (
                            <div className="text-xs text-muted-foreground mt-2 text-right">
                                Saving {pendingClicks} click{pendingClicks !== 1 ? 's' : ''}...
                            </div>
                        )}
                    </div>
                    <Button
                        className="w-full h-16 text-lg font-bold mt-auto"
                        onClick={handleClick}
                        disabled={!user_id}
                    >
                        Click Me!
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
} 