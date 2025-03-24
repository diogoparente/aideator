"use client";

import { useState, useEffect } from "react";
import { createClient, getUserProfile, getAllProfiles } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Define a type for our click record
type ClickRecord = {
  id: string;
  qty: number;
  created_at?: string;
};

// Define a type for player data
type PlayerData = {
  id: string;
  qty: number;
  username?: string;
  rank: number;
};

// Define a type for profile data
type ProfileData = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  [key: string]: any;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [profilesData, setProfilesData] = useState<ProfileData[]>([]);
  const supabase = createClient();

  // Initialize authentication
  useEffect(() => {
    async function fetchUser() {
      const userData = await getAuthenticatedUser();
      if (userData) {
        setUser(userData);
      } else {
        toast.error("Not authenticated", {
          description: "You need to be logged in to track clicks."
        });
      }
      setIsLoading(false);
    }
    fetchUser();
  }, []);

  // Fetch profiles data once
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const profiles = await getAllProfiles();
        setProfilesData(profiles || []);
        console.log("Profiles data:", profiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    }

    fetchProfiles();
  }, []);

  // Fetch clicks data and combine with profiles data
  useEffect(() => {
    if (!profilesData.length) return;

    async function fetchAndCombineData() {
      try {
        console.log("Fetching initial click data for all users...");

        // Create a dummy click record for all profiles 
        // This ensures everyone appears on the leaderboard with 0 clicks initially
        // The actual values will be updated via Realtime
        const initialPlayersData = profilesData.map((profile) => ({
          id: profile.id,
          qty: user?.id === profile.id ? clickCount : 0,
          username: profile.username || 'Anonymous Player',
          rank: 0 // Will be calculated later
        }));

        console.log("Initial players data:", initialPlayersData);

        // Sort by click count and assign initial ranks
        const sortedData = initialPlayersData
          .sort((a, b) => b.qty - a.qty)
          .map((player, index) => ({
            ...player,
            rank: index + 1
          }));

        setAllPlayers(sortedData);

        // Fetch the current user's click data
        if (user && user.id) {
          const { data, error } = await supabase
            .from('clicks')
            .select('qty')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setClickCount(data.qty || 0);
          }
        }
      } catch (error) {
        console.error("Error setting up initial data:", error);
        toast.error("Failed to initialize leaderboard data");
      }
    }
    // Fetch all users' click data
    const fetchAllClicks = async () => {
      try {
        const { data: allClicks, error } = await supabase
          .from('clicks')
          .select('*');

        if (error) throw error;

        // Combine profiles with their click data
        const combinedData = profilesData.map(profile => {
          const userClicks = allClicks?.find(click => click.id === profile.id);
          return {
            id: profile.id,
            qty: userClicks?.qty || 0,
            username: profile.username || 'Anonymous Player',
            rank: 0
          };
        });

        // Sort and assign ranks
        const sortedData = combinedData
          .sort((a, b) => b.qty - a.qty)
          .map((player, index) => ({
            ...player,
            rank: index + 1
          }));

        setAllPlayers(sortedData);

        // Update current user's click count if available
        if (user && user.id) {
          const userClick = allClicks?.find(click => click.id === user.id);
          if (userClick) {
            setClickCount(userClick.qty || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching all clicks:", error);
        toast.error("Failed to load click data for all users");
      }
    };

    fetchAllClicks();
  }, [profilesData, user, supabase]);

  // Setup realtime subscription for all players
  useEffect(() => {
    console.log("Setting up realtime subscription...");

    // Create a channel for realtime updates
    const channel = supabase
      .channel('clicks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'appointmint',
          table: 'clicks',
        },
        async (payload) => {
          console.log("Click event received:", payload);

          // Extract the updated click data
          const clickRecord = payload.new as ClickRecord;

          // Find the corresponding profile
          const profile = profilesData.find(p => p.id === clickRecord.id);

          if (profile) {
            // Update the player in the allPlayers state
            setAllPlayers(prevPlayers => {
              // Create a new array with the updated player data
              const updatedPlayers = prevPlayers.map(player =>
                player.id === clickRecord.id
                  ? { ...player, qty: clickRecord.qty }
                  : player
              );

              // Sort and reassign ranks
              return updatedPlayers
                .sort((a, b) => b.qty - a.qty)
                .map((player, index) => ({
                  ...player,
                  rank: index + 1
                }));
            });

            // Update current user's click count if needed
            if (user && user.id === clickRecord.id) {
              setClickCount(clickRecord.qty || 0);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profilesData, supabase, user]);

  // Fetch current user's click data
  useEffect(() => {
    if (!user || !user.id) return;

    async function fetchClicks() {
      try {
        const userId = user!.id;
        const { data, error } = await supabase
          .from('clicks')
          .select('qty')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setClickCount(data.qty || 0);
        } else {
          // Initialize click record if it doesn't exist - but only for the current user
          // This follows the RLS policy that only allows users to insert their own records
          const { error: insertError } = await supabase
            .from('clicks')
            .insert({ id: userId, qty: 0 });

          if (insertError) {
            console.error("Error creating click record:", insertError);
          } else {
            console.log("Created click record for current user");
            setClickCount(0);
          }
        }
      } catch (error) {
        console.error("Error fetching clicks:", error);
        toast.error("Failed to load click data");
      }
    }

    fetchClicks();
  }, [user, supabase]);

  const handleClick = async () => {
    if (!user || !user.id) {
      toast.error("Authentication required", {
        description: "Please log in to play"
      });
      return;
    }

    const newCount = clickCount + 1;

    try {
      console.log("Updating click count for user:", user.id, "to:", newCount);
      const { data, error } = await supabase
        .from('clicks')
        .update({ qty: newCount })
        .eq('id', user.id)
        .select();

      if (error) {
        throw error;
      }

      console.log("Click update response:", data);

      // Local state update (Realtime will handle the final state)
      setClickCount(newCount);

      toast.success("Click registered!", {
        description: `Your score: ${newCount}`
      });
    } catch (error) {
      console.error("Error updating clicks:", error);
      toast.error("Failed to update click count");
    }
  };

  // Find current user's rank
  const userRank = user && allPlayers.find(player => player.id === user.id)?.rank || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-center text-3xl">Multiplayer Clicker Game</CardTitle>
          <CardDescription className="text-center">
            Click as fast as you can to climb the leaderboard! All scores update in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {user && (
            <div className="text-center mb-6 w-full">
              <p className="text-lg font-medium">Your Stats</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your Score</p>
                  <p className="text-4xl font-bold">{clickCount}</p>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="text-4xl font-bold">#{userRank}</p>
                </div>
              </div>
              <Button
                onClick={handleClick}
                size="lg"
                className="w-full py-8 text-xl"
              >
                CLICK TO SCORE
              </Button>
            </div>
          )}

          {!user && !isLoading && (
            <p className="text-md text-red-500 my-6">
              You need to be logged in to play
            </p>
          )}

          {isLoading && (
            <p className="text-md text-blue-500 my-6">
              Loading game data...
            </p>
          )}

          <div className="w-full mt-8">
            <h3 className="text-xl font-bold mb-4">Leaderboard</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlayers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      No players yet. Be the first to play!
                    </TableCell>
                  </TableRow>
                )}

                {allPlayers.map((player) => (
                  <TableRow
                    key={player.id}
                    className={user && player.id === user.id ?
                      "bg-primary/20 font-medium" : undefined}
                  >
                    <TableCell className="font-bold">
                      {player.rank === 1 ? "🥇" :
                        player.rank === 2 ? "🥈" :
                          player.rank === 3 ? "🥉" : `#${player.rank}`}
                    </TableCell>
                    <TableCell>{player.username}</TableCell>
                    <TableCell className="text-right">{player.qty.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>All scores update in real-time. Keep clicking to climb the ranks!</p>
        </CardFooter>
      </Card>
    </div>
  );
}
