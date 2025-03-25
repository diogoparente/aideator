'use client';

import { useClickerGame } from "@/hooks/use-clicker-game";
import PlayerStats from "@/components/player-stats";
import Leaderboard from "@/components/leaderboard";
import ConnectionStatus from "@/components/connection-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ClickerGamePage() {
  const {
    user,
    clickCount,
    userRank,
    username,
    isLoading,
    connectionStatus,
    allPlayers,
    handleClickUpdate
  } = useClickerGame();

  const formattedPlayers = allPlayers.map(player => ({
    id: player.id,
    username: player.username || 'Anonymous',
    clicks: player.qty,
    rank: player.rank
  }));

  return (
    <div className="container max-w-6xl py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clicker Game</h1>
        <p className="text-muted-foreground">
          Click as fast as you can to climb the leaderboard!
        </p>
      </div>

      <Separator />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Player Stats */}
        <div className="md:col-span-1">
          <PlayerStats
            username={username}
            clickCount={clickCount}
            rank={userRank}
            loading={isLoading}
            onClickButton={handleClickUpdate}
          />
        </div>

        {/* Leaderboard */}
        <div className="md:col-span-2">
          <Leaderboard
            players={formattedPlayers}
            currentUserId={user?.id || null}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Game Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Game Rules */}
        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              1. Click the button as many times as you can
            </p>
            <p>
              2. Each click adds to your total score
            </p>
            <p>
              3. Your score is saved in real-time
            </p>
            <p>
              4. Players are ranked by their total clicks
            </p>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionStatus status={connectionStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 