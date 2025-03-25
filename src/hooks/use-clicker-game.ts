'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useSupabase } from "@/lib/supabase/provider";
import { toast } from "sonner";
import { updateClickAction } from "@/app/actions";

// Type definitions
export interface UserProfile {
    id: string;
    username?: string;
}

export interface ClickRecord {
    id: string;
    qty: number;
}

export interface RankedPlayer {
    id: string;
    qty: number;
    username: string;
    rank: number;
    scoreChange?: 'increase' | 'decrease' | 'none';
}

export function useClickerGame() {
    const [user, setUser] = useState<User | null>(null);
    const [profilesData, setProfilesData] = useState<UserProfile[]>([]);
    const [clicksData, setClicksData] = useState<ClickRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clickCount, setClickCount] = useState(0);
    const [allPlayers, setAllPlayers] = useState<RankedPlayer[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const processingRef = useRef(false);
    const updateQueue = useRef<ClickRecord[]>([]);
    const channelRef = useRef<ReturnType<typeof useSupabase.prototype.channel> | null>(null);
    const dataFreshness = useRef<number>(0);
    const supabase = useSupabase();
    const prevScores = useRef<Record<string, number>>({});

    // Get current user
    useEffect(() => {
        async function getUser() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error) {
                    console.warn("Authentication warning:", error.message);
                }

                setUser(user);

                if (!user) {
                    toast.info("Not logged in", {
                        description: "Log in to save your progress and compete on the leaderboard",
                        duration: 5000
                    });
                }
            } catch (error) {
                console.error("Authentication error:", error);
                toast.error("Authentication issue", {
                    description: "Unable to verify your login status"
                });
            }
        }
        getUser();
    }, [supabase]);

    // Initialize real-time connection when user is available
    useEffect(() => {
        if (!user?.id) return;
        supabase.realtime.setAuth(user.id);
    }, [user, supabase]);

    // Fetch profiles data
    useEffect(() => {
        async function fetchProfiles() {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .schema('public')
                    .from('profiles')
                    .select('id, username');

                if (error) throw error;
                setProfilesData(data || []);
            } catch (error) {
                toast.error("Failed to load player data", {
                    description: "Unable to fetch player profiles"
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfiles();
    }, [supabase]);

    // Process update queue efficiently
    const processUpdateQueue = useCallback(() => {
        if (processingRef.current || updateQueue.current.length === 0) return;

        processingRef.current = true;

        // Take the latest updates only (skip intermediate states)
        const latestUpdates = new Map<string, ClickRecord>();

        // Get only the latest update for each player
        updateQueue.current.forEach(update => {
            latestUpdates.set(update.id, update);
        });

        // Clear the queue
        updateQueue.current = [];

        // Update clicks data with latest values
        setClicksData(currentData => {
            const newData = [...currentData];

            Array.from(latestUpdates.values()).forEach(update => {
                const index = newData.findIndex(click => click.id === update.id);
                if (index >= 0) {
                    newData[index] = update;
                } else {
                    newData.push(update);
                }
            });

            return newData;
        });

        // Update timestamp of last data refresh
        dataFreshness.current = Date.now();
        processingRef.current = false;
    }, []);

    // Set up real-time subscription
    useEffect(() => {
        const cleanup = () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };

        async function fetchClicksAndSubscribe() {
            if (!user?.id) {
                setClicksData([]);
                setClickCount(0);
                return;
            }

            try {
                const { data, error } = await supabase
                    .schema('public')
                    .from('clicks')
                    .select('id, qty');

                if (error) throw error;
                setClicksData(data || []);
                dataFreshness.current = Date.now();

                // Set user's click count if available
                const userClick = data?.find(click => click.id === user.id);
                if (userClick) {
                    setClickCount(userClick.qty || 0);
                }

                // Setup channel
                cleanup();

                const channel = supabase
                    .channel('game-updates', {
                        config: {
                            broadcast: { self: true },
                            presence: { key: '' }
                        }
                    })
                    .on('postgres_changes',
                        { event: '*', schema: 'public', table: 'clicks' },
                        (payload) => {
                            if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
                                updateQueue.current.push(payload.new as ClickRecord);
                                requestAnimationFrame(processUpdateQueue);
                            }
                        }
                    )
                    .subscribe(status => {
                        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' ? 'error' : 'connecting');

                        if (status === 'CHANNEL_ERROR') {
                            console.warn('Supabase channel error');

                            // Fallback to periodic refresh if subscription fails
                            const refreshInterval = setInterval(() => {
                                if (Date.now() - dataFreshness.current > 3000) {
                                    fetchClicksAndSubscribe();
                                }
                            }, 3000);

                            return () => clearInterval(refreshInterval);
                        }
                    });

                channelRef.current = channel;

            } catch (error) {
                console.error("Error:", error);
                setConnectionStatus('error');
                toast.error("Connection issues", {
                    description: "Unable to connect to game server"
                });
            }
        }

        fetchClicksAndSubscribe();
        return cleanup;
    }, [user, supabase, processUpdateQueue]);

    // Process scores to create ranked player list
    useEffect(() => {
        if (!clicksData || !profilesData.length) return;

        requestAnimationFrame(() => {
            try {
                // Save previous scores for animation
                const newPrevScores: Record<string, number> = {};

                allPlayers.forEach(player => {
                    newPrevScores[player.id] = player.qty;
                });

                // Map user IDs to click counts
                const clickMap = new Map<string, number>();
                clicksData.forEach((click) => {
                    clickMap.set(click.id, click.qty || 0);
                });

                // Update current user's click count
                if (user?.id) {
                    const userClicks = clickMap.get(user.id) || 0;
                    setClickCount(userClicks);
                }

                // Combine profiles with click data
                const combinedData = profilesData.map(profile => {
                    const clicks = clickMap.get(profile.id) || 0;
                    const prevScore = prevScores.current[profile.id] || 0;

                    // Determine if score changed
                    let scoreChange: 'increase' | 'decrease' | 'none' = 'none';
                    if (clicks > prevScore) scoreChange = 'increase';
                    else if (clicks < prevScore) scoreChange = 'decrease';

                    return {
                        id: profile.id,
                        qty: clicks,
                        username: profile.username || 'Anonymous Player',
                        rank: 0,
                        scoreChange
                    };
                });

                // Sort and assign ranks
                const sortedData = [...combinedData]
                    .sort((a, b) => b.qty - a.qty)
                    .map((player, index) => ({
                        ...player,
                        rank: index + 1
                    }));

                setAllPlayers(sortedData);
                prevScores.current = newPrevScores;
            } catch (error) {
                console.error("Error processing data:", error);
            }
        });
    }, [clicksData, profilesData, user, allPlayers]);

    // Handle click updates
    const handleClickUpdate = useCallback(async () => {
        if (!user?.id) {
            toast.error("Authentication required", {
                description: "Please log in to play the game",
            });
            return;
        }

        try {
            // Optimistic update
            setClickCount(prev => prev + 1);

            const result = await updateClickAction(user.id, user.id, clickCount + 1);

            if (!result.success) {
                console.error("Error updating click count:", result.error);
                toast.error("Failed to update score", {
                    description: result.error || "Please try again"
                });

                // Revert to server state on error
                if (result.newCount !== undefined) {
                    setClickCount(result.newCount);
                }
                return;
            }

            // Sync with confirmed server value if needed
            if (result.newCount !== undefined && result.newCount !== clickCount + 1) {
                setClickCount(result.newCount);
            }
        } catch (error) {
            console.error("Error updating click count:", error);
            toast.error("Failed to update score", {
                description: error instanceof Error ? error.message : "Please try again",
            });
        }
    }, [user, clickCount]);

    // Calculate user rank and get username
    const userRank = useMemo(() => {
        if (!user?.id || !allPlayers.length) return 0;
        const userPlayer = allPlayers.find(player => player.id === user.id);
        return userPlayer?.rank || 0;
    }, [user, allPlayers]);

    const username = useMemo(() => {
        if (!user?.id || !profilesData.length) return "Anonymous Player";
        const userProfile = profilesData.find(profile => profile.id === user.id);
        return userProfile?.username || user.email?.split('@')[0] || "Anonymous Player";
    }, [user, profilesData]);

    return {
        user,
        clickCount,
        userRank,
        username,
        allPlayers,
        isLoading,
        connectionStatus,
        handleClickUpdate
    };
} 