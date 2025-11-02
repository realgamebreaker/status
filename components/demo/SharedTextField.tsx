"use client";
import React from "react";
import { useSharedState } from "../../hooks/useSharedState";

export function SharedTextField() {
	const {
		value: sharedText,
		setValue: setSharedText,
		isLoading,
		isOptimistic,
		connectionStatus,
		isOnline,
		lastError,
	} = useSharedState<string>("textField", "", {
		debounceMs: 2000, // 2 second debounce
		optimistic: true,
	});

	// Local state for immediate UI updates (before debounce)
	const [localText, setLocalText] = React.useState("");

	// Update local text when shared text changes (from other clients)
	React.useEffect(() => {
		if (!isOptimistic) {
			setLocalText(sharedText);
		}
	}, [sharedText, isOptimistic]);

	// Set initial local text when loading completes
	React.useEffect(() => {
		if (!isLoading && localText === "") {
			setLocalText(sharedText);
		}
	}, [isLoading, sharedText, localText]);

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newText = e.target.value;
		setLocalText(newText);
		setSharedText(newText); // This will be debounced by 2 seconds
	};

	if (isLoading) {
		return (
			<div className="w-full max-w-md mx-auto p-4">
				<div className="text-center text-gray-400">Loading shared text...</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-md mx-auto p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Shared Text Field</h3>

				{/* Status indicators */}
				<div className="flex items-center gap-2">
					{!isOnline && (
						<span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
							Offline
						</span>
					)}
					{connectionStatus === "connecting" && isOnline && (
						<span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
							Connecting...
						</span>
					)}
					{connectionStatus === "error" && isOnline && (
						<span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
							Error
						</span>
					)}
					{isOptimistic && (
						<span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
							Saving...
						</span>
					)}
					{connectionStatus === "connected" && !isOptimistic && isOnline && (
						<span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
							Synced
						</span>
					)}
				</div>
			</div>

			<textarea
				value={localText}
				onChange={handleTextChange}
				disabled={!isOnline}
				placeholder="Textfield"
				className={`
					w-full h-32 p-3 rounded-2xl border resize-none
					bg-background text-foreground border-gray-600
					focus:border-blue-500 focus:outline-none
					transition-all duration-200
					${!isOnline ? "opacity-50 cursor-not-allowed" : ""}
					${isOptimistic ? "border-blue-400" : ""}
				`}
			/>

			{lastError && (
				<div className="text-xs text-red-400 bg-red-900/10 px-3 py-2 rounded">
					{lastError}
				</div>
			)}

			<div className="text-xs text-gray-400 space-y-1">Debounce: 2s</div>
		</div>
	);
}
