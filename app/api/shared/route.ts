import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// In-memory state for shared data (in production, use a database)
const sharedState = new Map<string, unknown>();

// Store all active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const key = searchParams.get("key");

	if (!key) {
		return NextResponse.json(
			{ error: "Key parameter is required" },
			{ status: 400 },
		);
	}

	const value = sharedState.get(key);
	return NextResponse.json({ key, value: value ?? null });
}

export async function POST(request: NextRequest) {
	try {
		const { key, value } = await request.json();

		if (typeof key !== "string") {
			return NextResponse.json(
				{ error: "Key must be a string" },
				{ status: 400 },
			);
		}

		// Update the shared state
		sharedState.set(key, value);

		// Broadcast the state change to all connected clients
		broadcastStateChange(key, value);

		return NextResponse.json({ success: true, key, value });
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}
}

function broadcastStateChange(key: string, value: unknown) {
	const data = JSON.stringify({ key, value });

	// Send to all connected clients
	connections.forEach((controller) => {
		try {
			controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
		} catch {
			// Remove broken connections
			connections.delete(controller);
		}
	});
}

// Export the connections set so it can be used by the SSE endpoint
export { connections };
