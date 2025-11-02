"use client";
import React from "react";
import { getSharedStateService } from "../lib/sharedStateService";

type UseSharedStateOptions = {
	debounceMs?: number;
	optimistic?: boolean;
};

type UseSharedStateReturn<T> = {
	value: T;
	setValue: (newValue: T) => Promise<void>;
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
};

export function useSharedState<T>(
	key: string,
	defaultValue: T,
	options: UseSharedStateOptions = {},
): UseSharedStateReturn<T> {
	const { debounceMs = 0, optimistic = true } = options;

	const [value, setValue] = React.useState<T>(defaultValue);
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

	// Initialize service and subscriptions
	React.useEffect(() => {
		const service = getSharedStateService();

		// Fetch initial state
		service
			.fetchInitialState(key)
			.then((initialValue) => {
				setValue((initialValue as T) ?? defaultValue);
				setIsLoading(false);
			})
			.catch((error) => {
				console.error(`Failed to fetch initial state for key '${key}':`, error);
				setLastError(`Failed to load initial state`);
				setValue(defaultValue);
				setIsLoading(false);
			});

		// Subscribe to state updates for this key
		const unsubscribeState = service.subscribe<T>(key, (newValue) => {
			setValue(newValue);
			setIsOptimistic(false); // Clear optimistic state when server confirms
		});

		// Subscribe to service status updates
		const unsubscribeStatus = service.subscribeToStatus((serviceState) => {
			setConnectionStatus(serviceState.connectionStatus);
			setIsOnline(serviceState.isOnline);
			setLastError(serviceState.lastError);
			setReconnectAttempts(serviceState.reconnectAttempts);
		});

		// Cleanup subscriptions
		return () => {
			unsubscribeState();
			unsubscribeStatus();
		};
	}, [key, defaultValue]);

	// Cleanup pending operations on unmount
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

	const updateValue = React.useCallback(
		async (newValue: T) => {
			// Clear any pending debounced request
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}

			// Cancel any pending request
			if (pendingRequestRef.current) {
				pendingRequestRef.current.abort();
			}

			// Don't allow updates if offline
			if (!isOnline) {
				setLastError("Cannot update while offline");
				return;
			}

			// Optimistic update if enabled
			if (optimistic) {
				setValue(newValue);
				setIsOptimistic(true);
			}

			const executeUpdate = async () => {
				try {
					// Create new abort controller for this request
					const abortController = new AbortController();
					pendingRequestRef.current = abortController;

					const service = getSharedStateService();
					await service.updateState(key, newValue);

					// Clear optimistic state - real state will come via SSE
					setIsOptimistic(false);
					setLastError(undefined);
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						// Request was cancelled, ignore
						return;
					}

					console.error(
						`Failed to update shared state for key '${key}':`,
						error,
					);

					// Rollback optimistic update on error if optimistic was used
					if (optimistic) {
						setValue(value); // Revert to previous value
						setIsOptimistic(false);
					}

					setLastError(
						`Failed to update: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				} finally {
					pendingRequestRef.current = null;
				}
			};

			// Execute update with debouncing if specified
			if (debounceMs > 0) {
				debounceTimeoutRef.current = setTimeout(executeUpdate, debounceMs);
			} else {
				await executeUpdate();
			}
		},
		[key, value, isOnline, optimistic, debounceMs],
	);

	return {
		value,
		setValue: updateValue,
		isLoading,
		isOptimistic,
		connectionStatus,
		isOnline,
		lastError,
		reconnectAttempts,
	};
}
