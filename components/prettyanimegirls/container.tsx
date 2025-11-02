import Image from "next/image";

export function Container() {
	return (
		<div className="absolute top-0 left-0 w-screen h-screen flex flex-col justify-center items-center p-4 pointer-events-none">
			{/* Top-center image - slides in from top */}
			<Image
				src="/1.jpg"
				alt="Top center"
				width={1280}
				height={720}
				className="absolute top-8 left-1/2 transform -translate-x-1/2 object-contain opacity-30 z-0 max-w-160 max-h-96 animate-in slide-in-from-top duration-500"
			/>

			{/* Left-center image - slides in from left */}
			<Image
				src="/2.png"
				alt="Left center"
				width={720}
				height={1280}
				className="absolute left-8 top-1/2 transform -translate-y-1/2 object-contain opacity-30 z-0 max-w-96 max-h-160 animate-in slide-in-from-left duration-500"
			/>

			{/* Right-center image - slides in from right */}
			<Image
				src="/4.png"
				alt="Right center"
				width={720}
				height={1280}
				className="absolute right-8 top-1/2 transform -translate-y-1/2 object-contain opacity-30 z-0 max-w-96 max-h-160 animate-in slide-in-from-right duration-500"
			/>

			{/* Bottom-center image - slides in from bottom */}
			<Image
				src="/3.png"
				alt="Bottom center"
				width={720}
				height={1280}
				className="absolute bottom-8 left-1/2 transform -translate-x-1/2 object-contain opacity-30 z-0 max-w-160 max-h-96 animate-in slide-in-from-bottom duration-500"
			/>
		</div>
	);
}
