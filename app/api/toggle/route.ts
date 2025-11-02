import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// in memory state
let toggleState = false;

const connections = new Set<ReadableStreamDefaultController>();

export async function GET() {
	return NextResponse.json({ isToggled: toggleState });
}

export async function POST(request: NextRequest) {
	try {
		const { isToggled } = await request.json();

		if (typeof isToggled === "boolean") {
			toggleState = isToggled;

			broadcastStateChange(toggleState);

			return NextResponse.json({ success: true, isToggled: toggleState });
		}

		return NextResponse.json({ error: "Invalid data" }, { status: 400 });
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}
}

function broadcastStateChange(isToggled: boolean) {
	const data = JSON.stringify({ isToggled });

	connections.forEach((controller) => {
		try {
			controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
		} catch {
			// remove broken
			connections.delete(controller);
		}
	});
}

export { connections };
