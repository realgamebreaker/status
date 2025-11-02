type ToggleState = {
	isToggled: boolean;
};

type ConnectionStatus =
	| "connecting"
	| "connected"
	| "disconnected"
	| "error"
	| "offline";

type ServiceState = {
	toggleState: ToggleState;
	connectionStatus: ConnectionStatus;
	isOnline: boolean;
	lastError?: string;
	reconnectAttempts: number;
};

type Listener = (state: ToggleState) => void;
type StatusListener = (status: ServiceState) => void;

class RealtimeToggleService {
	private static instance: RealtimeToggleService | null = null;
	private eventSource: EventSource | null = null;
	private listeners = new Set<Listener>();
	private statusListeners = new Set<StatusListener>();
	private currentState: ToggleState = { isToggled: false };
	private connectionStatus: ConnectionStatus = "disconnected";
	private isOnline = true;
	private lastError?: string;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private isInitialized = false;
	private onlineCheckInterval: NodeJS.Timeout | null = null;

	private constructor() {
		// wait for browser
		this.setupOnlineDetection();
	}

	static getInstance(): RealtimeToggleService {
		if (!RealtimeToggleService.instance) {
			RealtimeToggleService.instance = new RealtimeToggleService();
		}
		return RealtimeToggleService.instance;
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

		// close existing connection
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		// clear any pending reconnection
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
	}

	private async checkConnectivity() {
		if (!this.isBrowser()) return;

		try {
			const response = await fetch("/api/toggle", {
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
			toggleState: this.currentState,
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

	private ensureInitialized() {
		if (!this.isInitialized && this.isBrowser()) {
			this.isInitialized = true;
			this.connect();
		}
	}

	private connect() {
		if (!this.isBrowser()) {
			console.warn("EventSource not available");
			return;
		}

		if (!this.isOnline) {
			console.warn("Cannot connect while offline");
			return;
		}

		if (this.eventSource?.readyState === EventSource.OPEN) {
			return; // already connected
		}

		this.updateConnectionStatus("connecting");

		try {
			this.eventSource = new EventSource("/api/toggle/stream");

			this.eventSource.onopen = () => {
				this.updateConnectionStatus("connected");
				this.reconnectAttempts = 0;
				this.lastError = undefined;
				console.log("SSE connected");
			};

			this.eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if ("isToggled" in data) {
						this.currentState = { isToggled: data.isToggled };
						this.notifyListeners();
					}
				} catch (error) {
					console.error("Failed to parse SSE data:", error);
					this.lastError = "Failed to parse server data";
					this.notifyStatusListeners();
				}
			};

			this.eventSource.onerror = (event) => {
				console.error("SSE connection error:", event);
				this.lastError = "Connection error occurred";
				this.updateConnectionStatus("error");
				this.handleReconnect();
			};
		} catch (error) {
			console.error("Failed to create SSE connection:", error);
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

		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000); // exponential backoff. gets longer each attempt
		this.reconnectAttempts++;

		console.log(
			`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
		);

		this.reconnectTimeout = setTimeout(() => {
			this.connect();
		}, delay);
	}

	private notifyListeners() {
		this.listeners.forEach((listener) => {
			try {
				listener(this.currentState);
			} catch (error) {
				console.error("Error in listener:", error);
			}
		});
	}

	// Public API
	subscribe(listener: Listener): () => void {
		this.ensureInitialized(); // initialize connection when first subscriber is added

		this.listeners.add(listener);

		// immediately call with current state
		listener(this.currentState);

		// return unsubscribe function
		return () => {
			this.listeners.delete(listener);
		};
	}

	async fetchInitialState(): Promise<ToggleState> {
		this.ensureInitialized();

		try {
			const response = await fetch("/api/toggle");
			const data = await response.json();
			this.currentState = { isToggled: data.isToggled };
			return this.currentState;
		} catch (error) {
			console.error("Failed to fetch initial state:", error);
			throw error;
		}
	}

	getCurrentState(): ToggleState {
		return { ...this.currentState };
	}

	getConnectionStatus(): boolean {
		if (!this.isBrowser()) {
			return false;
		}
		return this.connectionStatus === "connected";
	}

	getServiceState(): ServiceState {
		return {
			toggleState: this.currentState,
			connectionStatus: this.connectionStatus,
			isOnline: this.isOnline,
			lastError: this.lastError,
			reconnectAttempts: this.reconnectAttempts,
		};
	}

	// subscribe to state changes
	subscribeToStatus(listener: StatusListener): () => void {
		this.statusListeners.add(listener);

		listener(this.getServiceState());

		return () => {
			this.statusListeners.delete(listener);
		};
	}

	// clean up
	destroy() {
		// clear intervals
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}
		if (this.onlineCheckInterval) {
			clearInterval(this.onlineCheckInterval);
		}

		// remove event listeners
		if (this.isBrowser()) {
			window.removeEventListener("online", this.handleOnline.bind(this));
			window.removeEventListener("offline", this.handleOffline.bind(this));
		}

		// close connection
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}

		// clear state
		this.listeners.clear();
		this.statusListeners.clear();
		this.updateConnectionStatus("disconnected");
		RealtimeToggleService.instance = null;
	}
}

// getter function 
// fuck ssr issues
export const getRealtimeToggleService = () =>
	RealtimeToggleService.getInstance();
