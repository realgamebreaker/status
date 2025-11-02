"use client";
import { ArrowLeftRightIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { useRealtimeToggle } from "./useRealtimeToggle";

export function SwitchButton() {
	const {
		isToggled,
		isLoading,
		isOptimistic,
		connectionStatus,
		isOnline,
		lastError,
		toggle,
	} = useRealtimeToggle();

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center gap-4">
				<Heading small>Loading...</Heading>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center gap-4">
			{!isOnline && (
				<div className="text-sm text-red-400 bg-red-900/20 px-2 py-1 rounded">
					Offline
				</div>
			)}
			{connectionStatus === "connecting" && isOnline && (
				<div className="text-sm text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
					Connecting...
				</div>
			)}
			{connectionStatus === "error" && isOnline && (
				<div className="text-sm text-red-400 bg-red-900/20 px-2 py-1 rounded">
					Connection Error
				</div>
			)}
			{lastError && (
				<div className="text-xs text-red-400 bg-red-900/10 px-2 py-1 rounded max-w-xs text-center">
					{lastError}
				</div>
			)}

			<div className="relative h-6 w-12 flex items-center justify-center overflow-hidden">
				<div
					key={isToggled ? "on" : "off"}
					className={`transition-all duration-200 ease-in-out absolute left-0 right-0 mx-auto ${
						isOptimistic ? "opacity-70" : "opacity-100"
					}`}
					style={{ transitionProperty: "opacity, transform" }}
				>
					<Heading small>{isToggled ? "On" : "Off"}</Heading>
				</div>
			</div>

			<div
				className={`transition-opacity duration-200 ${
					isOptimistic ? "opacity-70" : "opacity-100"
				}`}
			>
				<Button onClick={toggle} disabled={!isOnline}>
					{" "}
					<span
						className={`transition-transform duration-300 ease-in-out inline-flex`}
						style={{
							transform: `rotate(${isToggled ? 180 : 0}deg)`,
						}}
					>
						<ArrowLeftRightIcon stroke="#13131C" />
					</span>
					Toggle
				</Button>
			</div>
		</div>
	);
}
