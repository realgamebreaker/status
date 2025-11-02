import { connections } from "../route";

export async function GET() {
	// Create a readable stream for Server-Sent Events
	const stream = new ReadableStream({
		start(controller) {
			// Add this connection to our set
			connections.add(controller);

			// Send initial connection message
			controller.enqueue(
				new TextEncoder().encode('data: {"connected": true}\n\n'),
			);
		},
		cancel(controller) {
			// This runs when the client disconnects
			connections.delete(controller);
		},
	});

	// Return the stream with proper SSE headers
	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Cache-Control",
		},
	});
}
