"use client";

import { useState, useEffect } from "react";
import { useSharedState } from "@/hooks/useSharedState";
import { TimePicker } from "./TimePicker";
import Button from "./ui/Button";
import { Clock } from "lucide-react";

interface TargetTime {
	hours: number;
	minutes: number;
	timestamp?: number; // When this target was set
}

export function TimeDisplay() {
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const { value: targetTime, setValue: setTargetTime } =
	useSharedState<TargetTime | null>("target-time", null);

	useEffect(() => {
		if (!targetTime) return;

		const now = new Date();
		const currentHours = now.getHours();
		const currentMinutes = now.getMinutes();

		// check if reached
		if (
			currentHours === targetTime.hours &&
			currentMinutes === targetTime.minutes
		) {
			setTargetTime(null);
		}
	}, [targetTime, setTargetTime]);

	const handleTimeSet = (hours: number, minutes: number) => {
		setTargetTime({
			hours,
			minutes,
			timestamp: Date.now(),
		});
		setIsPickerOpen(false);
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	const formatTargetTime = (target: TargetTime) => {
		return `${target.hours.toString().padStart(2, "0")}:${target.minutes.toString().padStart(2, "0")}`;
	};

	const getTimeUntilTarget = (target: TargetTime) => {
		const now = new Date();
		const targetDate = new Date();
		targetDate.setHours(target.hours, target.minutes, 0, 0);

		// If target time is earlier today, assume it's for tomorrow
		if (targetDate <= now) {
			targetDate.setDate(targetDate.getDate() + 1);
		}

		const diff = targetDate.getTime() - now.getTime();
		const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
		const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (hoursLeft > 0) {
			return `${hoursLeft}h ${minutesLeft}m remaining`;
		} else {
			return `${minutesLeft}m remaining`;
		}
	};

	return (
		<div className="flex flex-col items-center space-y-4 p-6">
			{targetTime ? (
				<div className="text-center">
					<p className="text-sm text-gray-400 mb-1">Target Time</p>
					<p className="text-2xl font-mono font-bold">
						{formatTargetTime(targetTime)}
					</p>
					<p className="text-xs text-gray-500 mt-1">
						{getTimeUntilTarget(targetTime)}
					</p>
				</div>
			) : (
				<div className="text-center">
					<p className="text-sm text-gray-500 mb-2">No target time set</p>
				</div>
			)}

			<div className="flex gap-4">
				{!targetTime && (
					<Button onClick={() => setIsPickerOpen(true)}>Set Target Time</Button>
				)}
				{targetTime && (
					<Button onClick={() => setTargetTime(null)}>Clear Time</Button>
				)}
			</div>

			<TimePicker
				isOpen={isPickerOpen}
				onClose={() => setIsPickerOpen(false)}
				onTimeSet={handleTimeSet}
				initialTime={
					targetTime
						? { hours: targetTime.hours, minutes: targetTime.minutes }
						: undefined
				}
			/>
		</div>
	);
}
