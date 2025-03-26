import { NextRequest } from "next/server";

// Store active SSE clients
const clients = new Set<ReadableStreamController<Uint8Array>>();

// Track the last progress value sent to each client
const lastProgressValues = new Map<
  ReadableStreamController<Uint8Array>,
  number
>();

// Minimum time between significant progress updates (in ms)
const THROTTLE_INTERVAL = 300;

// Throttle large jumps in progress
function getThrottledProgress(
  controller: ReadableStreamController<Uint8Array>,
  newProgress: number,
): number {
  const lastProgress = lastProgressValues.get(controller) || 0;

  // If this is a big jump (more than 10%), throttle it
  if (newProgress - lastProgress > 0.1) {
    // Increment by a maximum of 10% at a time
    return lastProgress + 0.1;
  }

  return newProgress;
}

// Helper function to send progress updates to all connected clients
export function sendProgressUpdate(progress: number, stage: string) {
  clients.forEach((controller) => {
    try {
      // Apply throttling to progress value
      const throttledProgress = getThrottledProgress(controller, progress);

      // Update the last progress value for this client
      lastProgressValues.set(controller, throttledProgress);

      const data = JSON.stringify({ progress: throttledProgress, stage });
      console.log(
        ` [Progress API] Sending update: ${stage} (${Math.round(throttledProgress * 100)}%)`,
      );

      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));

      // If we throttled the progress and it's not at 100% yet, schedule the next update
      if (throttledProgress < progress && throttledProgress < 1) {
        setTimeout(() => {
          // Only send the next update if the client is still connected
          if (clients.has(controller)) {
            sendProgressUpdate(progress, stage);
          }
        }, THROTTLE_INTERVAL);
      }
    } catch (error) {
      console.error("Error sending progress update:", error);
    }
  });
}

// SSE endpoint
export async function GET(req: NextRequest) {
  console.log("[Progress API] New SSE connection established");

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      console.log(`[Progress API] Client connected (total: ${clients.size})`);

      // Initialize progress for this client
      lastProgressValues.set(controller, 0);

      // Send initial progress
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ progress: 0, stage: "Connecting" })}\n\n`,
        ),
      );
    },
    cancel(controller) {
      clients.delete(controller);
      lastProgressValues.delete(controller);
      console.log(
        `[Progress API] Client disconnected (remaining: ${clients.size})`,
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
