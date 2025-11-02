type SharedStateValue = unknown;

type SharedStateData = {
	[key: string]: SharedStateValue;
};

type ConnectionStatus =
	| "connecting"
	| "connected"
	| "disconnected"
	| "error"
	| "offline";

type ServiceState = {
	connectionStatus: ConnectionStatus;
	isOnline: boolean;
	lastError?: string;
	reconnectAttempts: number;
};

type StateListener<T = SharedStateValue> = (value: T, key: string) => void;
type StatusListener = (status: ServiceState) => void;

class SharedStateService {
	private static instance: SharedStateService | null = null;
	private eventSource: EventSource | null = null;
	private stateListeners = new Map<string, Set<StateListener>>();
	private statusListeners = new Set<StatusListener>();
	private currentState: SharedStateData = {};
	private connectionStatus: ConnectionStatus = "disconnected";
	private isOnline = true;
	private lastError?: string;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private isInitialized = false;
	private onlineCheckInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.setupOnlineDetection();
	}

	static getInstance(): SharedStateService {
		if (!SharedStateService.instance) {
			SharedStateService.instance = new SharedStateService();
		}
		return SharedStateService.instance;
	}

	private isBrowser(): boolean {
		return typeof window !== "undefined" && typeof EventSource !== "undefined";
	}

	private setupOnlineDetection() {
		if (!this.isBrowser()) return;

		this.isOnline = navigator.onLine;

		window.addEventListener("online", this.handleOnline.bind(this));
		window.addEventListener("offline", this.handleOffline.bind(this));

		this.onlineCheckInterval = setInterval(() => {
			this.checkConnectivity();
		}, 30000);
	}

	private handleOnline() {
		console.log("Network connection restored");
		this.isOnline = true;
		this.lastError = undefined;
		this.updateConnectionStatus("connecting");

		this.reconnectAttempts = 0;
		this.connect();
	}

	private handleOffline() {
		console.log("Network connection lost");
		this.isOnline = false;
		this.lastError = "Network connection lost";
		this.updateConnectionStatus("offline");

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}

	private async checkConnectivity() {
		if (!this.isBrowser()) return;

		try {
			const response = await fetch("/api/shared", {
				method: "HEAD",
				cache: "no-cache",
			});

			if (response.ok && !this.isOnline) {
				this.handleOnline();
			}
		} catch {
			if (this.isOnline) {
				this.handleOffline();
			}
		}
	}

	private updateConnectionStatus(status: ConnectionStatus) {
		if (this.connectionStatus !== status) {
			this.connectionStatus = status;
			this.notifyStatusListeners();
		}
	}

	private notifyStatusListeners() {
		const serviceState: ServiceState = {
			connectionStatus: this.connectionStatus,
			isOnline: this.isOnline,
			lastError: this.lastError,
			reconnectAttempts: this.reconnectAttempts,
		};

		this.statusListeners.forEach((listener) => {
			try {
				listener(serviceState);
			} catch (error) {
				console.error("Error in status listener:", error);
			}
		});
	}

	private notifyStateListeners(key: string, value: SharedStateValue) {
		const listeners = this.stateListeners.get(key);
		if (!listeners) return;

		listeners.forEach((listener) => {
			try {
				listener(value, key);
			} catch (error) {
				console.error("Error in state listener:", error);
			}
		});
	}

	private ensureInitialized() {
		if (!this.isInitialized && this.isBrowser()) {
			this.isInitialized = true;
			this.connect();
		}
	}

	private connect() {
		if (!this.isBrowser()) {
			console.warn("EventSource not available in this environment");
			return;
		}

		if (!this.isOnline) {
			console.warn("Cannot connect while offline");
			return;
		}

		if (this.eventSource?.readyState === EventSource.OPEN) {
			return;
		}

		this.updateConnectionStatus("connecting");

		try {
			this.eventSource = new EventSource("/api/shared/stream");

			this.eventSource.onopen = () => {
				this.updateConnectionStatus("connected");
				this.reconnectAttempts = 0;
				this.lastError = undefined;
				console.log("Shared state SSE connected");
			};

			this.eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.key && "value" in data) {
						this.currentState[data.key] = data.value;
						this.notifyStateListeners(data.key, data.value);
					}
				} catch (error) {
					console.error("Failed to parse shared state SSE data:", error);
					this.lastError = "Failed to parse server data";
					this.notifyStatusListeners();
				}
			};

			this.eventSource.onerror = (event) => {
				console.error("Shared state SSE connection error:", event);
				this.lastError = "Connection error occurred";
				this.updateConnectionStatus("error");
				this.handleReconnect();
			};
		} catch (error) {
			console.error("Failed to create shared state SSE connection:", error);
			this.lastError = `Failed to create connection: ${error}`;
			this.updateConnectionStatus("error");
			this.handleReconnect();
		}
	}

	private handleReconnect() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}

		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error("Max reconnection attempts reached");
			return;
		}

		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
		this.reconnectAttempts++;

		console.log(
			`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
		);

		this.reconnectTimeout = setTimeout(() => {
			this.connect();
		}, delay);
	}

	// Public API
	subscribe<T = SharedStateValue>(
		key: string,
		listener: StateListener<T>,
	): () => void {
		this.ensureInitialized();

		if (!this.stateListeners.has(key)) {
			this.stateListeners.set(key, new Set());
		}

		const listeners = this.stateListeners.get(key);
		if (!listeners) return () => {};

		listeners.add(listener as StateListener);

		// Immediately call with current state if available
		if (key in this.currentState) {
			listener(this.currentState[key] as T, key);
		}

		return () => {
			listeners.delete(listener as StateListener);
			if (listeners.size === 0) {
				this.stateListeners.delete(key);
			}
		};
	}

	subscribeToStatus(listener: StatusListener): () => void {
		this.statusListeners.add(listener);

		listener(this.getServiceState());

		return () => {
			this.statusListeners.delete(listener);
		};
	}

	async fetchInitialState(key: string): Promise<SharedStateValue> {
		this.ensureInitialized();

		try {
			const response = await fetch(
				`/api/shared?key=${encodeURIComponent(key)}`,
			);
			const data = await response.json();
			this.currentState[key] = data.value;
			return data.value;
		} catch (error) {
			console.error("Failed to fetch initial state:", error);
			throw error;
		}
	}

	async updateState(key: string, value: SharedStateValue): Promise<void> {
		try {
			const response = await fetch("/api/shared", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ key, value }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
		} catch (error) {
			console.error("Failed to update shared state:", error);
			throw error;
		}
	}

	getCurrentState(key: string): SharedStateValue {
		return this.currentState[key];
	}

	getServiceState(): ServiceState {
		return {
			connectionStatus: this.connectionStatus,
			isOnline: this.isOnline,
			lastError: this.lastError,
			reconnectAttempts: this.reconnectAttempts,
		};
	}

	getConnectionStatus(): boolean {
		if (!this.isBrowser()) {
			return false;
		}
		return this.connectionStatus === "connected";
	}

	destroy() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}
		if (this.onlineCheckInterval) {
			clearInterval(this.onlineCheckInterval);
		}

		if (this.isBrowser()) {
			window.removeEventListener("online", this.handleOnline.bind(this));
			window.removeEventListener("offline", this.handleOffline.bind(this));
		}

		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		this.stateListeners.clear();
		this.statusListeners.clear();
		this.updateConnectionStatus("disconnected");
		SharedStateService.instance = null;
	}
}

export const getSharedStateService = () => SharedStateService.getInstance();
