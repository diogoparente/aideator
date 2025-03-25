"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getAuthenticatedUser, getAllProfiles } from "@/lib/supabase/client";
import { useSupabase } from "@/lib/supabase/provider";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Leaderboard } from "@/components/leaderboard";
import PlayerStats from "@/components/player-stats";
import { updateClickAction } from "@/app/actions";

// Define types
interface UserProfile {
    id: string;
    username?: string;
}

interface ClickRecord {
    id: string;
    qty: number;
}

interface RankedPlayer {
    id: string;
    qty: number;
    username: string;
    rank: number;
}

export default function GameContainer() {
    const [user, setUser] = useState<User | null>(null);
    const [profilesData, setProfilesData] = useState<UserProfile[]>([]);
    const [clicksData, setClicksData] = useState<ClickRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clickCount, setClickCount] = useState(0);
    const [allPlayers, setAllPlayers] = useState<RankedPlayer[]>([]);
    const processingRef = useRef(false);
    const supabase = useSupabase();
    const updateQueue = useRef<ClickRecord[]>([]);

    // Get current user
    useEffect(() => {
        async function getUser() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error) {
                    console.warn("Authentication warning:", error.message);
                    // Continue but in a limited state
                }

                setUser(user);

                // If user isn't logged in, show a helpful message but not as an error
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

        processingRef.current = false;
    }, []);

    // Fetch clicks data and subscribe to real-time updates
    useEffect(() => {
        async function fetchClicks() {
            // Only fetch data if user is logged in
            if (!user?.id) {
                setClicksData([]);
                setClickCount(0);
                return;
            }

            try {
                const { data, error } = await supabase
                    .schema('public')
                    .from('clicks')
                    .select('id, qty, user_id');

                if (error) throw error;
                setClicksData(data || []);

                // Set user's click count if available
                const userClick = data?.find(click => click.user_id === user.id);
                if (userClick) {
                    setClickCount(userClick.qty || 0);
                }
            } catch (error) {
                toast.error("Please log in to play", {
                    description: "Unable to fetch click data"
                });
            }
        }

        fetchClicks();

        // Create a single channel for all real-time updates
        const channel = supabase
            .channel('game-updates')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'clicks' },
                (payload) => {
                    if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
                        // Queue the update instead of immediately updating state
                        updateQueue.current.push(payload.new as ClickRecord);

                        // Process the queue on next animation frame for efficiency
                        requestAnimationFrame(processUpdateQueue);
                    }
                })
            .subscribe();

        // Clean up subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase, processUpdateQueue]);

    // Process real-time click data updates with requestAnimationFrame for smooth animations
    useEffect(() => {
        if (!clicksData || !profilesData.length) {
            return;
        }

        // Use requestAnimationFrame for smooth updates
        const rafId = requestAnimationFrame(() => {
            try {
                // Create a map of user IDs to click counts for O(1) lookups
                const clickMap = new Map<string, number>();
                clicksData.forEach((click: ClickRecord) => {
                    clickMap.set(click.id, click.qty || 0);
                });

                // Update current user's click count if available
                if (user?.id) {
                    const userClicks = clickMap.get(user.id) || 0;
                    setClickCount(userClicks);
                }

                // Combine profiles with click data
                const combinedData = profilesData.map(profile => {
                    const clicks = clickMap.get(profile.id) || 0;

                    return {
                        id: profile.id,
                        qty: clicks,
                        username: profile.username || 'Anonymous Player',
                        rank: 0 // Will be calculated next
                    };
                });

                // Directly compute and assign ranks in a single pass for better performance
                const sortedData = [...combinedData]
                    .sort((a, b) => b.qty - a.qty)
                    .map((player, index) => ({
                        ...player,
                        rank: index + 1
                    }));

                setAllPlayers(sortedData);
            } catch (error) {
                console.error("Error processing click data:", error);
            }
        });

        return () => cancelAnimationFrame(rafId);
    }, [clicksData, profilesData, user]);

    // Handle click updates from the player stats component
    const handleClickUpdate = useCallback(async (newCount: number) => {
        if (user?.id) {
            try {
                const result = await updateClickAction(user.id, user.id, newCount);

                if (!result.success) {
                    console.error("Error updating click count:", result.error);
                    toast.error("Failed to update score", {
                        description: result.error || "Please try again"
                    });
                    return;
                }

                // Update local state with the confirmed count from the server
                if (result.newCount) {
                    setClickCount(result.newCount);
                }
            } catch (error) {
                console.error("Error updating click count:", error);
                toast.error("Failed to update score", {
                    description: error instanceof Error ? error.message : "Please try again",
                });
            }
        } else {
            toast.error("Authentication required", {
                description: "Please log in to play the game",
            });
        }
    }, [user]);

    // Find user's rank
    const userRank = useMemo(() => {
        if (!user?.id || !allPlayers.length) return 0;
        const userPlayer = allPlayers.find(player => player.id === user.id);
        return userPlayer?.rank || 0;
    }, [user, allPlayers]);

    // Get username
    const username = useMemo(() => {
        if (!user?.id || !profilesData.length) return "Anonymous Player";
        const userProfile = profilesData.find(profile => profile.id === user.id);
        return userProfile?.username || user.email || "Anonymous Player";
    }, [user, profilesData]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col h-full">
                <PlayerStats
                    user_id={user?.id}
                    clickCount={clickCount}
                    rank={userRank}
                    username={username}
                    loading={isLoading}
                    onUpdateClickAction={handleClickUpdate}
                />
            </div>
            <div className="md:col-span-2 flex flex-col h-full">
                <Leaderboard
                    allPlayers={allPlayers}
                    isLoading={isLoading}
                    currentUser={user}
                />
            </div>
        </div>
    );
} 
