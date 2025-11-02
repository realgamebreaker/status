"use client";
import { SharedToggle } from "../SharedToggle";
import { SharedTextField } from "./SharedTextField";
import { useSharedState } from "../../hooks/useSharedState";
import Button from "../ui/Button";

export function SharedStateDemo() {
	// example of using the hook for a counter
	const {
		value: counter,
		setValue: setCounter,
		isOptimistic: counterOptimistic,
		connectionStatus,
	} = useSharedState<number>("counter", 0, { optimistic: true });

	return (
		<div className="min-h-screen bg-background text-foreground p-8">
			<div className="max-w-4xl mx-auto space-y-8">
				<header className="text-center space-y-2">
					<h1 className="text-4xl font-bold">Shared State Demo</h1>
					<p className="text-gray-400">
						Syncronized state between multiple users
					</p>
					<div className="text-sm">
						Connection:
						<span
							className={`ml-2 px-2 py-1 rounded ${
								connectionStatus === "connected"
									? "bg-green-900/20 text-green-400"
									: connectionStatus === "connecting"
										? "bg-yellow-900/20 text-yellow-400"
										: connectionStatus === "offline"
											? "bg-gray-900/20 text-gray-400"
											: "bg-red-900/20 text-red-400"
							}`}
						>
							{connectionStatus}
						</span>
					</div>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="rounded-lg p-6 space-y-4">
						<h2 className="text-xl font-semibold text-center">Shared Toggle</h2>
						<SharedToggle />
						<p className="text-sm text-gray-400 text-center">No Debounce</p>
					</div>

					<div className="rounded-lg p-2">
						<SharedTextField />
					</div>

					<div className="rounded-lg p-6 space-y-4">
						<h2 className="text-xl font-semibold text-center">
							Shared Counter
						</h2>
						<div className="text-center space-y-4">
							<div
								className={`text-3xl font-bold ${
									counterOptimistic ? "opacity-70" : "opacity-100"
								} transition-opacity`}
							>
								{counter}
							</div>
							<div className="space-y-2">
								<Button
									onClick={() => setCounter(counter + 1)}
									className="w-full"
								>
									+ Increment
								</Button>
								<Button
									onClick={() => setCounter(counter - 1)}
									className="w-full"
								>
									- Decrement
								</Button>
								<Button onClick={() => setCounter(0)} className="w-full">
									Reset
								</Button>
							</div>
						</div>
						<p className="text-sm text-gray-400 text-center">No Debounce</p>
					</div>
				</div>

				<div className="rounded-lg p-6">
					<h2 className="text-lg font-semibold mb-4">How to Use</h2>
					<div className="space-y-3 text-sm text-gray-300">
						<div>
							<code className="bg-gray-800 px-2 py-1 rounded">
								useSharedState&lt;T&gt;(key, defaultValue, options)
							</code>
						</div>
						<div className="ml-4 space-y-2">
							<div>
								• <strong>key:</strong> key for the shared state. must be unique
							</div>
							<div>
								• <strong>defaultValue:</strong> Initial value
							</div>
							<div>
								• <strong>options.debounceMs:</strong> Delay before syncing
								(default: 0)
							</div>
							<div>
								• <strong>options.optimistic:</strong> Show changes immediately
								(default: true)
							</div>
						</div>
						<div className="mt-4">
							<strong>Examples:</strong>
						</div>
						<div className="ml-4 space-y-1 font-mono text-xs bg-gray-800 p-3 rounded">
							<div>
								const &#123;value, setValue&#125; = useSharedState('toggle',
								false);
							</div>
							<div>
								const &#123;value, setValue&#125; = useSharedState('text', '',
								&#123;debounceMs: 2000&#125;);
							</div>
							<div>
								const &#123;value, setValue&#125; = useSharedState('counter',
								0);
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
