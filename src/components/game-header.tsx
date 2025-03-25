import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function GameHeader() {
    return (
        <CardHeader>
            <CardTitle className="text-center text-3xl">Multiplayer Clicker Game</CardTitle>
            <CardDescription className="text-center">
                Click as fast as you can to climb the leaderboard! All scores update in real-time.
            </CardDescription>
        </CardHeader>
    );
} 