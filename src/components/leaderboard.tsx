"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useSupabase } from "@/lib/supabase/provider";
import { Card, CardContent } from "@/components/ui/card";

type PlayerData = {
    id: string;
    qty: number;
    username?: string;
    rank: number;
};

interface LeaderboardProps {
    allPlayers: PlayerData[];
    isLoading: boolean;
    currentUser?: User | null;
}

export function Leaderboard({ allPlayers, isLoading, currentUser }: LeaderboardProps) {
    const [prevScores, setPrevScores] = useState<Record<string, number>>({});
    const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});
    const [localPlayers, setLocalPlayers] = useState<PlayerData[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING');
    const animatingCells = useRef<Record<string, boolean>>({});
    const channelRef = useRef<ReturnType<typeof useSupabase.prototype.channel> | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = useSupabase();

    // Initialize local state from props
    useEffect(() => {
        setLocalPlayers(allPlayers);
    }, [allPlayers]);

    // Create a robust subscription with retry logic
    useEffect(() => {
        // Cleanup function to be used in multiple places
        const cleanupChannel = () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };

        // Function to establish subscription
        const setupSubscription = () => {
            // Clean up any existing channel first
            cleanupChannel();

            // Create a unique channel ID
            const channelId = `real-time-clicks-${Date.now()}`;

            try {
                // Set connection status
                setConnectionStatus('CONNECTING');

                // Create channel with explicit broadcast options
                const channel = supabase
                    .channel(channelId, {
                        config: {
                            broadcast: { self: true }
                        }
                    })
                    .on('postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'clicks'
                        },
                        (payload) => {
                            // Process real-time updates immediately
                            if (payload.new && typeof payload.new === 'object' && 'id' in payload.new && 'qty' in payload.new) {
                                const updatedPlayerId = payload.new.id as string;
                                const updatedQty = payload.new.qty as number;

                                // Update local state
                                setLocalPlayers(currentPlayers => {
                                    if (!currentPlayers || currentPlayers.length === 0) return allPlayers;

                                    // Find if the player exists in our local data
                                    const playerExists = currentPlayers.some(p => p.id === updatedPlayerId);
                                    let updatedPlayers = [...currentPlayers];

                                    if (playerExists) {
                                        // Update existing player
                                        updatedPlayers = currentPlayers.map(player => {
                                            if (player.id === updatedPlayerId) {
                                                // Mark for animation if score increased
                                                if (updatedQty > (player.qty || 0)) {
                                                    animatingCells.current[updatedPlayerId] = true;
                                                    setTimeout(() => {
                                                        animatingCells.current[updatedPlayerId] = false;
                                                    }, 1000);
                                                }

                                                // Update the player's quantity
                                                return { ...player, qty: updatedQty };
                                            }
                                            return player;
                                        });
                                    } else if (updatedPlayerId) {
                                        // Add new player if they don't exist
                                        const existingPlayer = allPlayers.find(p => p.id === updatedPlayerId);
                                        if (existingPlayer) {
                                            updatedPlayers.push({
                                                ...existingPlayer,
                                                qty: updatedQty
                                            });
                                        }
                                    }

                                    // Sort and reassign ranks
                                    return [...updatedPlayers]
                                        .sort((a, b) => b.qty - a.qty)
                                        .map((player, index) => ({
                                            ...player,
                                            rank: index + 1
                                        }));
                                });
                            }
                        })
                    .subscribe((status) => {
                        setConnectionStatus(status);

                        if (status === 'SUBSCRIBED') {
                            console.log('Successfully subscribed to real-time updates');
                        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                            console.log(`Subscription status: ${status}. Will retry connection...`);

                            // Schedule retry with exponential backoff (would implement if needed)
                            // For now, just a simple 3-second retry
                            retryTimeoutRef.current = setTimeout(() => {
                                console.log('Attempting to reconnect...');
                                setupSubscription();
                            }, 3000);
                        }
                    });

                // Store reference to current channel
                channelRef.current = channel;
            } catch (error) {
                console.error('Error setting up real-time subscription:', error);
                setConnectionStatus('ERROR');

                // Schedule retry
                retryTimeoutRef.current = setTimeout(() => {
                    setupSubscription();
                }, 3000);
            }
        };

        // Initial setup
        setupSubscription();

        // Clean up function
        return cleanupChannel;
    }, [supabase, allPlayers]);

    // Track score and rank changes to animate
    useEffect(() => {
        const newScores: Record<string, number> = {};
        const newRanks: Record<string, number> = {};

        localPlayers.forEach(player => {
            const prevScore = prevScores[player.id] || 0;
            newScores[player.id] = player.qty;
            newRanks[player.id] = player.rank;

            // Mark for animation if score increased (this is now handled in the subscription)
            if (player.qty > prevScore && !animatingCells.current[player.id]) {
                animatingCells.current[player.id] = true;
                // Reset animation flag after animation completes
                setTimeout(() => {
                    animatingCells.current[player.id] = false;
                }, 1000);
            }
        });

        setPrevScores(newScores);
        setPrevRanks(newRanks);
    }, [localPlayers]);

    const getRankChange = (playerId: string, currentRank: number) => {
        if (!prevRanks[playerId]) return null;

        const prevRank = prevRanks[playerId];
        if (currentRank < prevRank) {
            return <ArrowUp className="inline ml-1 text-green-500" size={14} />;
        } else if (currentRank > prevRank) {
            return <ArrowDown className="inline ml-1 text-red-500" size={14} />;
        }
        return null;
    };

    // Use localPlayers for rendering instead of allPlayers from props
    const displayPlayers = localPlayers.length > 0 ? localPlayers : allPlayers;

    return (
        <Card className="w-full h-full overflow-hidden">
            <CardContent className="p-0 h-full">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-xl font-bold">Leaderboard (Real-time Updates)</h3>
                    {connectionStatus !== 'SUBSCRIBED' && (
                        <div className="text-xs text-muted-foreground">
                            {connectionStatus === 'CONNECTING' ? 'Connecting...' :
                                connectionStatus === 'CLOSED' ? 'Reconnecting...' :
                                    connectionStatus === 'CHANNEL_ERROR' ? 'Connection error' : ''}
                        </div>
                    )}
                </div>

                <div className="max-h-[500px] overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-3 bg-muted/50 p-3 font-medium text-sm">
                        <div className="w-16">Rank</div>
                        <div>Player</div>
                        <div className="text-right">Score</div>
                    </div>

                    {/* Player List */}
                    <div className="divide-y">
                        {displayPlayers.length === 0 && (
                            <div className="p-6 text-center">
                                {isLoading ? 'Loading leaderboard data...' : 'No players yet. Be the first to play!'}
                            </div>
                        )}

                        {displayPlayers.map((player) => (
                            <div
                                key={player.id}
                                className={`grid grid-cols-3 p-3 transition-colors duration-300 
                                    ${currentUser && player.id === currentUser.id ? "bg-primary/20 font-medium" : undefined}`}
                            >
                                <div className="font-bold">
                                    {player.rank === 1 ? "🥇" :
                                        player.rank === 2 ? "🥈" :
                                            player.rank === 3 ? "🥉" : `#${player.rank}`}
                                    {getRankChange(player.id, player.rank)}
                                </div>
                                <div>{player.username}</div>
                                <div
                                    className={`text-right transition-all duration-300 
                                        ${animatingCells.current[player.id] ? 'text-green-500 scale-110' : ''}`}
                                >
                                    {player.qty}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 