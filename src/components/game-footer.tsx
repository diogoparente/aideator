'use client';

import { useEffect, useState, useRef } from 'react';
import { CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function GameFooter() {
    const [fps, setFps] = useState(0);
    const [latency, setLatency] = useState(0);
    const [clickRate, setClickRate] = useState(0);
    const clickTimestamps = useRef<number[]>([]);
    const rafIdRef = useRef<number | null>(null);
    const lastMeasurementTime = useRef<number>(0);

    // Performance monitoring with optimized measuring
    useEffect(() => {
        let frameCount = 0;
        let lastFrameTime = performance.now();
        let lastClickTime = 0;

        // Monitor frames per second and other metrics
        function performanceMonitor(timestamp: number) {
            frameCount++;

            const elapsed = timestamp - lastFrameTime;

            // Update FPS once per second
            if (elapsed >= 1000) {
                setFps(Math.round((frameCount * 1000) / elapsed));
                frameCount = 0;
                lastFrameTime = timestamp;

                // Clean up old click timestamps (keep last 10 seconds)
                const tenSecondsAgo = timestamp - 10000;
                clickTimestamps.current = clickTimestamps.current.filter(t => t > tenSecondsAgo);
            }

            // Update click rate 10 times per second for smoother display
            if (timestamp - lastMeasurementTime.current > 100) {
                lastMeasurementTime.current = timestamp;

                // Calculate clicks in the last second
                const oneSecondAgo = timestamp - 1000;
                const recentClicks = clickTimestamps.current.filter(t => t > oneSecondAgo);
                setClickRate(recentClicks.length);
            }

            rafIdRef.current = requestAnimationFrame(performanceMonitor);
        }

        // Track clicks for rate calculation and latency
        function clickHandler() {
            const now = performance.now();
            clickTimestamps.current.push(now);

            // Measure network latency if we have a previous click
            if (lastClickTime > 0) {
                const clickLatency = now - lastClickTime;
                if (clickLatency < 1000) { // Ignore very long gaps between clicks
                    setLatency(prev => {
                        // Weighted average with more weight to recent measurements
                        return Math.round((prev * 0.7) + (clickLatency * 0.3));
                    });
                }
            }
            lastClickTime = now;
        }

        // Start monitoring
        rafIdRef.current = requestAnimationFrame(performanceMonitor);
        document.addEventListener('click', clickHandler);

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
            document.removeEventListener('click', clickHandler);
        };
    }, []);

    // Format latency for display
    const latencyClass = latency > 200 ? 'text-red-500' :
        latency > 100 ? 'text-yellow-500' :
            'text-green-500';

    // Format FPS for display
    const fpsClass = fps < 30 ? 'text-red-500' :
        fps < 50 ? 'text-yellow-500' :
            'text-green-500';

    return (
        <CardFooter className="flex justify-between text-sm text-muted-foreground pt-2">
            <div className="flex space-x-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>FPS: <span className={fpsClass}>{fps}</span></div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            Frames per second - measures UI smoothness
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>Latency: <span className={latencyClass}>{latency}ms</span></div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            Estimated click processing time
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>Click rate: <span className="text-blue-500">{clickRate}/s</span></div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            Current clicks per second
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div>Real-time multiplayer powered by Supabase</div>
        </CardFooter>
    );
} 