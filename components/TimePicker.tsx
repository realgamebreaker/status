"use client";

import { useState } from "react";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import Button from "./ui/Button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerProps {
	isOpen: boolean;
	onClose: () => void;
	onTimeSet: (hours: number, minutes: number) => void;
	initialTime?: { hours: number; minutes: number };
}

interface AnimationState {
	isAnimating: boolean;
	direction: "up" | "down";
	currentValue: number;
	nextValue: number;
}

const AnimatedNumber = ({
	animation,
	value,
}: {
	animation: AnimationState;
	value: number;
}) => {
	return (
		<div className="relative h-16 w-16 flex items-center justify-center overflow-hidden">
			{animation.isAnimating ? (
				<>
					{/* Current number sliding out */}
					<div
						className={`absolute text-4xl font-bold text-foreground font-heading transition-all duration-150 ease-out ${
							animation.direction === "up"
								? "animate-[slide-out-down_150ms_ease-out_forwards]"
								: "animate-[slide-out-up_150ms_ease-out_forwards]"
						}`}
					>
						{animation.currentValue.toString().padStart(2, "0")}
					</div>
					{/* Next number sliding in */}
					<div
						className={`absolute text-4xl font-bold text-foreground font-heading transition-all duration-150 ease-out ${
							animation.direction === "up"
								? "animate-[slide-in-up_150ms_ease-out_forwards]"
								: "animate-[slide-in-down_150ms_ease-out_forwards]"
						}`}
					>
						{animation.nextValue.toString().padStart(2, "0")}
					</div>
				</>
			) : (
				<div className="text-4xl font-bold text-foreground font-heading">
					{value.toString().padStart(2, "0")}
				</div>
			)}
		</div>
	);
};

export function TimePicker({
	isOpen,
	onClose,
	onTimeSet,
	initialTime,
}: TimePickerProps) {
	const [selectedHours, setSelectedHours] = useState(
		initialTime?.hours ?? new Date().getHours(),
	);
	const [selectedMinutes, setSelectedMinutes] = useState(
		initialTime?.minutes ?? new Date().getMinutes(),
	);
	const [hoursAnimation, setHoursAnimation] = useState<AnimationState>({
		isAnimating: false,
		direction: "up",
		currentValue: selectedHours,
		nextValue: selectedHours,
	});
	const [minutesAnimation, setMinutesAnimation] = useState<AnimationState>({
		isAnimating: false,
		direction: "up",
		currentValue: selectedMinutes,
		nextValue: selectedMinutes,
	});

	const animateChange = (
		current: number,
		next: number,
		direction: "up" | "down",
		setAnimation: React.Dispatch<React.SetStateAction<AnimationState>>,
		setValue: React.Dispatch<React.SetStateAction<number>>,
	) => {
		setAnimation({
			isAnimating: true,
			direction,
			currentValue: current,
			nextValue: next,
		});

		setTimeout(() => {
			setValue(next);
			setAnimation((prev) => ({
				...prev,
				isAnimating: false,
				currentValue: next,
			}));
		}, 150);
	};

	const incrementHours = () => {
		const next = (selectedHours + 1) % 24;
		animateChange(
			selectedHours,
			next,
			"up",
			setHoursAnimation,
			setSelectedHours,
		);
	};

	const decrementHours = () => {
		const next = (selectedHours - 1 + 24) % 24;
		animateChange(
			selectedHours,
			next,
			"down",
			setHoursAnimation,
			setSelectedHours,
		);
	};

	const incrementMinutes = () => {
		const next = (selectedMinutes + 1) % 60;
		animateChange(
			selectedMinutes,
			next,
			"up",
			setMinutesAnimation,
			setSelectedMinutes,
		);
	};

	const decrementMinutes = () => {
		const next = (selectedMinutes - 1 + 60) % 60;
		animateChange(
			selectedMinutes,
			next,
			"down",
			setMinutesAnimation,
			setSelectedMinutes,
		);
	};

	const handleConfirm = () => {
		onTimeSet(selectedHours, selectedMinutes);
		onClose();
	};

	return (
		<Drawer open={isOpen} onOpenChange={onClose}>
			<DrawerContent>
				<div className="mx-auto w-full max-w-sm">
					<DrawerHeader>
						<DrawerTitle>Set Target Time</DrawerTitle>
						<DrawerDescription>
							Select the time you want to set as your target
						</DrawerDescription>
					</DrawerHeader>

					<div className="p-4 pb-0">
						<div className="flex items-center justify-center space-x-4">
							{/* Hours Picker */}
							<div className="flex flex-col items-center">
								<div className="text-sm font-medium text-muted-foreground mb-4 font-heading">
									Hours
								</div>

								{/* Up Arrow */}
								<button
									type="button"
									onClick={incrementHours}
									className="p-2 hover:bg-muted rounded-full transition-colors"
								>
									<ChevronUp className="w-6 h-6 text-muted-foreground" />
								</button>

								{/* Selected Hour Display */}
								<AnimatedNumber
									animation={hoursAnimation}
									value={selectedHours}
								/>

								{/* Down Arrow */}
								<button
									type="button"
									onClick={decrementHours}
									className="p-2 hover:bg-muted rounded-full transition-colors"
								>
									<ChevronDown className="w-6 h-6 text-muted-foreground" />
								</button>
							</div>

							{/* Separator */}
							<div className="text-4xl font-bold text-muted-foreground self-center font-heading">
								:
							</div>

							{/* Minutes Picker */}
							<div className="flex flex-col items-center">
								<div className="text-sm font-medium text-muted-foreground mb-4 font-heading">
									Minutes
								</div>

								{/* Up Arrow */}
								<button
									type="button"
									onClick={incrementMinutes}
									className="p-2 hover:bg-muted rounded-full transition-colors"
								>
									<ChevronUp className="w-6 h-6 text-muted-foreground" />
								</button>

								{/* Selected Minute Display */}
								<AnimatedNumber
									animation={minutesAnimation}
									value={selectedMinutes}
								/>

								{/* Down Arrow */}
								<button
									type="button"
									onClick={decrementMinutes}
									className="p-2 hover:bg-muted rounded-full transition-colors"
								>
									<ChevronDown className="w-6 h-6 text-muted-foreground" />
								</button>
							</div>
						</div>

						{/* Selected time display */}
						<div className="mt-6 text-center">
							<div className="text-2xl font-bold text-foreground font-heading transition-all duration-300">
								{selectedHours.toString().padStart(2, "0")}:
								{selectedMinutes.toString().padStart(2, "0")}
							</div>
						</div>
					</div>

					<DrawerFooter>
						<div className="flex space-x-2">
							<Button onClick={handleConfirm}>Set Time</Button>
							<DrawerClose asChild>
								<button
									type="button"
									className="flex-1 px-4 py-2 text-muted-foreground border border-border rounded hover:bg-muted transition-colors font-heading"
								>
									Cancel
								</button>
							</DrawerClose>
						</div>
					</DrawerFooter>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
