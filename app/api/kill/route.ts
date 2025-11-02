import { NextResponse } from "next/server";

export async function POST() {
	try {
			const response = NextResponse.json({
				success: true,
				message: "Killing server",
			});

			setTimeout(() => {
				process.exit(0);
			}, 500);

			return response;
	} catch (error) {
		console.error("Failed to kill server:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to kill server",
			},
			{ status: 500 },
		);
	}
}
