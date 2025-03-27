import { NextRequest, NextResponse } from "next/server";

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
  newProgress: number
): number {
  const lastProgress = lastProgressValues.get(controller) || 0;

  // If this is a big jump (more than 10%), throttle it
  if (newProgress - lastProgress > 0.1) {
    // Increment by a maximum of 10% at a time
    return lastProgress + 0.1;
  }

  return newProgress;
}

// Helper function to safely send data to a client
function safelySendToClient(
  controller: ReadableStreamController<Uint8Array>,
  data: string
): boolean {
  try {
    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
    return true;
  } catch (error) {
    console.error("Error sending data to client:", error);
    // If we get an invalid state error, remove this client
    if (error instanceof Error && error.message.includes("Invalid state")) {
      clients.delete(controller);
      lastProgressValues.delete(controller);
    }
    return false;
  }
}

// Helper function to close a client connection
function closeClientConnection(
  controller: ReadableStreamController<Uint8Array>
) {
  try {
    // Send a final message indicating completion
    safelySendToClient(
      controller,
      JSON.stringify({ progress: 1, stage: "Complete", done: true })
    );

    // Clean up this client
    clients.delete(controller);
    lastProgressValues.delete(controller);

    // Close the controller
    controller.close();
  } catch (error) {
    console.error("Error closing client connection:", error);
  }
}

// Helper function to send progress updates to all connected clients
export function sendProgressUpdate(progress: number, stage: string) {
  const completedClients = new Set<ReadableStreamController<Uint8Array>>();

  clients.forEach((controller) => {
    // Skip if this client has already been marked for cleanup
    if (completedClients.has(controller)) return;

    try {
      // Apply throttling to progress value
      const throttledProgress = getThrottledProgress(controller, progress);

      // Update the last progress value for this client
      lastProgressValues.set(controller, throttledProgress);

      const data = JSON.stringify({ progress: throttledProgress, stage });
      console.log(
        ` [Progress API] Sending update: ${stage} (${Math.round(
          throttledProgress * 100
        )}%)`
      );

      // If we're at 100% progress, mark this client for completion
      if (progress >= 1) {
        completedClients.add(controller);
        closeClientConnection(controller);
        return;
      }

      // Send the update
      const sendSuccessful = safelySendToClient(controller, data);

      // If sending failed, don't schedule any more updates for this client
      if (!sendSuccessful) return;

      // If we throttled the progress and it's not at 100% yet, schedule the next update
      if (throttledProgress < progress && throttledProgress < 1) {
        setTimeout(() => {
          // Only send the next update if the client is still connected and not completed
          if (clients.has(controller) && !completedClients.has(controller)) {
            sendProgressUpdate(progress, stage);
          }
        }, THROTTLE_INTERVAL);
      }
    } catch (error) {
      console.error("Error sending progress update:", error);
      // If we encounter an error, mark this client for cleanup
      completedClients.add(controller);
    }
  });

  // Clean up any completed clients
  completedClients.forEach((controller) => {
    if (clients.has(controller)) {
      closeClientConnection(controller);
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
      safelySendToClient(
        controller,
        JSON.stringify({
          progress: 0,
          stage: "Initializing...",
        })
      );
    },
    cancel(controller) {
      clients.delete(controller);
      lastProgressValues.delete(controller);
      console.log(
        `[Progress API] Client disconnected (remaining: ${clients.size})`
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

// Ping endpoint for keep-alive
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
