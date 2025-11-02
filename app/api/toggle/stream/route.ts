import { connections } from "../route";

export async function GET() {
	const stream = new ReadableStream({
		start(controller) {
			// add connection
			connections.add(controller);

			// init
			controller.enqueue(
				new TextEncoder().encode('data: {"connected": true}\n\n'),
			);
		},
		cancel(controller) {
			// cleanup
			connections.delete(controller);
		},
	});

	// SSE headers
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
