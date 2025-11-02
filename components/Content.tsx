"use client";

import { SharedToggle } from "./SharedToggle";
import { TimeDisplay } from "./TimeDisplay";
import { useSharedState } from "@/hooks/useSharedState";

export function Content() {
	const { value: isToggled } = useSharedState<boolean>("toggle", false);

	return (
		<div className="flex flex-col items-center gap-6">
			<SharedToggle />
			{isToggled && <TimeDisplay />}
		</div>
	);
}
