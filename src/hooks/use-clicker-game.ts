'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useSupabase } from "@/lib/supabase/provider";
import { toast } from "sonner";
import { updateClickAction } from "@/app/actions";
import { handleError } from "@/lib/error-handler";
import { refreshSession } from "@/lib/supabase/client";

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
    const reconnectAttempts = useRef<number>(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = useSupabase();
    const prevScores = useRef<Record<string, number>>({});

    // Get current user
    useEffect(() => {
        async function getUser() {
            try {
                // Try to refresh the session first
                try {
                    console.log("Automatically refreshing session on mount");
                    const { error } = await refreshSession();
                    if (error) {
                        console.warn("Session refresh warning:", error.message);
                    } else {
                        console.log("Session refreshed successfully on mount");
                    }
                } catch (refreshError) {
                    console.error("Error refreshing session on mount:", refreshError);
                }

                // Now try to get the user
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
                } else {
                    console.log("User authenticated:", user.id);
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
            } catch (error: unknown) {
                handleError(error);
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

    // Clean up function for subscriptions and intervals
    const cleanupResources = useCallback(() => {
        // Clean up channel
        if (channelRef.current) {
            try {
                supabase.removeChannel(channelRef.current);
            } catch (error) {
                console.warn("Error removing channel:", error);
            }
            channelRef.current = null;
        }

        // Clean up reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Clean up polling interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, [supabase]);

    // Fetch click data
    const fetchClickData = useCallback(async () => {
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

            return true;
        } catch (error) {
            console.error("Error fetching click data:", error);
            return false;
        }
    }, [supabase, user]);

    // Start polling mechanism as a fallback
    const startPolling = useCallback(() => {
        // Clear any existing polling interval first
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(() => {
            if (Date.now() - dataFreshness.current > 3000) {
                fetchClickData();
            }
        }, 3000);
    }, [fetchClickData]);

    // Setup real-time subscription with exponential backoff reconnection
    const setupRealtimeSubscription = useCallback(async () => {
        if (!user?.id) return;

        // Clean up existing resources first
        cleanupResources();

        // Set status to connecting
        setConnectionStatus('connecting');

        try {
            // First, fetch initial data
            const fetchSuccess = await fetchClickData();
            if (!fetchSuccess) {
                throw new Error("Failed to fetch initial data");
            }

            // Create a channel with proper configuration
            const channel = supabase
                .channel('clicker-game', {
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
                    console.log(`Subscription status: ${status}`);

                    if (status === 'SUBSCRIBED') {
                        setConnectionStatus('connected');
                        reconnectAttempts.current = 0; // Reset reconnect attempts on success
                    } else if (status === 'CHANNEL_ERROR') {
                        console.warn('Supabase channel error occurred');
                        setConnectionStatus('error');

                        // Implement exponential backoff for reconnection
                        if (reconnectAttempts.current < maxReconnectAttempts) {
                            const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                            console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

                            reconnectTimeoutRef.current = setTimeout(() => {
                                reconnectAttempts.current++;
                                setupRealtimeSubscription();
                            }, backoffTime);
                        } else {
                            console.warn(`Max reconnection attempts (${maxReconnectAttempts}) reached, falling back to polling`);
                            startPolling();
                        }
                    } else if (status === 'TIMED_OUT') {
                        // Handle timeout specifically - this often happens when the server is slow to respond
                        console.warn('Subscription timed out, attempting to reconnect');
                        setConnectionStatus('connecting');

                        // Use a shorter timeout for timeouts vs errors
                        reconnectTimeoutRef.current = setTimeout(() => {
                            setupRealtimeSubscription();
                        }, 2000);
                    }
                });

            // Store the channel reference
            channelRef.current = channel;

        } catch (error) {
            console.error("Error setting up real-time subscription:", error);
            setConnectionStatus('error');
            startPolling(); // Start polling as fallback
        }
    }, [user, supabase, fetchClickData, startPolling, cleanupResources, processUpdateQueue]);

    // Set up real-time subscription
    useEffect(() => {
        // Only setup subscription if we have a user
        if (user?.id) {
            setupRealtimeSubscription();
        }

        // Cleanup function
        return cleanupResources;
    }, [user, setupRealtimeSubscription, cleanupResources]);

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

                // Update current user's click count if available
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

        // Get current click count to use throughout this function call
        // This prevents race conditions with rapid clicks
        const currentCount = clickCount;

        try {
            // Re-verify authentication before proceeding
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

            console.log("Auth check before click:", {
                hasCurrentUser: !!currentUser,
                currentUserId: currentUser?.id,
                cachedUserId: user?.id,
                authError: authError?.message
            });

            // Try to continue even without current user (for debugging)
            const effectiveUserId = currentUser?.id || user.id;

            // Optimistic update (use atomically incremented value)
            setClickCount(prevCount => prevCount + 1);

            // Log attempt before action
            console.log(`Attempting to update clicks for user: ${effectiveUserId} (count: ${currentCount + 1})`);

            const result = await updateClickAction(effectiveUserId, effectiveUserId, currentCount + 1);

            console.log("Update result:", result);

            if (!result.success) {
                console.error("Error updating click count:", result.error);

                // Special handling for auth errors
                if (result.error?.includes('Authentication required') || result.error?.includes('User ID mismatch')) {
                    toast.error("Authentication issue", {
                        description: "Trying to refresh your session...",
                    });

                    // Force refresh auth session
                    const { error: refreshError } = await refreshSession();

                    if (refreshError) {
                        console.error("Session refresh failed:", refreshError);
                        toast.error("Session refresh failed", {
                            description: "Please try logging out and back in",
                        });
                    } else {
                        // Try again after refresh
                        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
                        if (refreshedUser) {
                            console.log("Session refreshed, retrying with user:", refreshedUser.id);
                            const retryResult = await updateClickAction(refreshedUser.id, refreshedUser.id, currentCount + 1);

                            if (retryResult.success) {
                                console.log("Retry successful:", retryResult);
                                if (retryResult.newCount !== undefined) {
                                    setClickCount(retryResult.newCount);
                                }
                                return;
                            } else {
                                console.error("Retry failed:", retryResult.error);
                            }
                        }
                    }
                }

                // Generic error handling
                toast.error("Failed to update score", {
                    description: result.error || "Please try again"
                });

                // Revert to server state on error
                if (result.newCount !== undefined) {
                    setClickCount(result.newCount);
                }
                return;
            }

            // Sync with confirmed server value if needed - but only if it's greater than our current local state
            if (result.newCount !== undefined && result.newCount > clickCount) {
                setClickCount(result.newCount);
            }
        } catch (error) {
            console.error("Error updating click count:", error);
            toast.error("Failed to update score", {
                description: error instanceof Error ? error.message : "Please try again",
            });
        }
    }, [user, clickCount, supabase]);

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