"use client";
import React from "react";
import { getRealtimeToggleService } from "../lib/realtimeToggleService";

type UseRealtimeToggleReturn = {
	isToggled: boolean;
	isLoading: boolean;
	isOptimistic: boolean;
	connectionStatus:
		| "connecting"
		| "connected"
		| "disconnected"
		| "error"
		| "offline";
	isOnline: boolean;
	lastError?: string;
	reconnectAttempts: number;
	toggle: () => Promise<void>;
};

export function useRealtimeToggle(): UseRealtimeToggleReturn {
	const [isToggled, setIsToggled] = React.useState(false);
	const [isLoading, setIsLoading] = React.useState(true);
	const [isOptimistic, setIsOptimistic] = React.useState(false);
	const [connectionStatus, setConnectionStatus] = React.useState<
		"connecting" | "connected" | "disconnected" | "error" | "offline"
	>("disconnected");
	const [isOnline, setIsOnline] = React.useState(true);
	const [lastError, setLastError] = React.useState<string | undefined>();
	const [reconnectAttempts, setReconnectAttempts] = React.useState(0);

	const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
	const pendingRequestRef = React.useRef<AbortController | null>(null);

	// init on mount
	React.useEffect(() => {
		const service = getRealtimeToggleService();

		service
			.fetchInitialState()
			.then((state) => {
				setIsToggled(state.isToggled);
				setIsLoading(false);
			})
			.catch((error) => {
				console.error("Failed to fetch initial state:", error);
				setLastError("Failed to load initial state");
				setIsLoading(false);
			});

		const unsubscribeToggle = service.subscribe((state) => {
			setIsToggled(state.isToggled);
			setIsOptimistic(false); // clear optimistic state when server confirms
		});

		const unsubscribeStatus = service.subscribeToStatus((serviceState) => {
			setConnectionStatus(serviceState.connectionStatus);
			setIsOnline(serviceState.isOnline);
			setLastError(serviceState.lastError);
			setReconnectAttempts(serviceState.reconnectAttempts);
		});

		// cleanup on unmount
		return () => {
			unsubscribeToggle();
			unsubscribeStatus();
		};
	}, []);

	// cleanup pending on unmount
	React.useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
			if (pendingRequestRef.current) {
				pendingRequestRef.current.abort();
			}
		};
	}, []);

	const toggle = React.useCallback(async () => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		if (pendingRequestRef.current) {
			pendingRequestRef.current.abort();
		}

		if (!isOnline) {
			setLastError("Cannot toggle while offline");
			return;
		}

		// show new state immediately
		const newState = !isToggled;
		setIsToggled(newState);
		setIsOptimistic(true);

		debounceTimeoutRef.current = setTimeout(async () => {
			try {
				// new abort controller for this request
				const abortController = new AbortController();
				pendingRequestRef.current = abortController;

				const response = await fetch("/api/toggle", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ isToggled: newState }),
					signal: abortController.signal,
				});

				if (!response.ok) {
					throw new Error(`HTTP error status: ${response.status}`);
				}

				// clear optimistic state, real state will come via SSE
				setIsOptimistic(false);
				setLastError(undefined);
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					// request was cancelled, ignore
					return;
				}

				console.error("Failed to toggle state:", error);

				// rollback optimistic update on error
				setIsToggled(!newState);
				setIsOptimistic(false);
				setLastError(
					`Failed to update: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			} finally {
				pendingRequestRef.current = null;
			}
		}, 300);
	}, [isToggled, isOnline]);

	return {
		isToggled,
		isLoading,
		isOptimistic,
		connectionStatus,
		isOnline,
		lastError,
		reconnectAttempts,
		toggle,
	};
}
