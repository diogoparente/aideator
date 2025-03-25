import Leaderboard from "@/components/leaderboard";
import PlayerStats from "@/components/player-stats";
import ConnectionStatus from "@/components/connection-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClickerGame } from "@/hooks/use-clicker-game";

export default function GameContainer() {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col h-full">
                <PlayerStats
                    clickCount={clickCount}
                    rank={userRank}
                    username={username}
                    loading={isLoading}
                    onClickButton={handleClickUpdate}
                />
            </div>
            <div className="md:col-span-2 flex flex-col h-full">
                <Leaderboard
                    players={allPlayers.map(player => ({
                        id: player.id,
                        username: player.username,
                        clicks: player.qty,
                        rank: player.rank
                    }))}
                    currentUserId={user?.id || null}
                    loading={isLoading}
                />
            </div>

            {/* Connection Status */}
            <div className="md:col-span-3">
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
