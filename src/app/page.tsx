import { Card } from "@/components/ui/card";
import { GameHeader } from "@/components/game-header";
import { GameFooter } from "@/components/game-footer";
import GameContainer from "@/components/game-container";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="max-w-6xl w-full">
        <div className="grid gap-6">

          <Card className="w-full">
            <GameHeader />
            <GameContainer />
            <GameFooter />
          </Card>

          <div className="text-sm text-center text-muted-foreground mt-8">
            <p>This game demonstrates real-time database updates with optimistic UI updates for maximum performance.</p>
            <p>The performance metrics in the footer help you monitor the game's responsiveness.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
