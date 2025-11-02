"use client";
import {
	Loader2,
	SettingsIcon,
	XIcon,
} from "lucide-react";
import React from "react";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	drawerTriggerClassname,
} from "./ui/drawer";

export function ButtonRowBottom() {
	const [isKilling, setIsKilling] = React.useState(false);

	const killServer = async () => {
		try {
			setIsKilling(true);
			const response = await fetch("/api/kill", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();

			if (data.success) {
				console.log("server killed");
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			} else {
				console.error("Failed to kill server:", data.message);
				alert(`Failed to kill server: ${data.message}`);
			}
		} catch (error) {
			console.error("Error killing server:", error);
			alert("Error communicating with server");
		}
	};

	return (
		<div className="w-full flex justify-center items-center gap-4">
			<Drawer>
				<DrawerTrigger className={drawerTriggerClassname}>
					{" "}
					<XIcon />
					Kill Server
				</DrawerTrigger>
				<DrawerContent className="h-max">
					<DrawerHeader>
						<DrawerTitle className="font-heading text-3xl">
							Kill Server?
						</DrawerTitle>
						<DrawerDescription>
							This will shut down the server process. You will have to restart
							it manually.
						</DrawerDescription>
					</DrawerHeader>
					<DrawerFooter className="gap-4">
						<button
							type="button"
							onClick={killServer}
							className="flex gap-2 p-2 px-6 rounded-2xl max-w-fit mx-auto bg-red-400 font-bold hover:bg-red-400/50 transition-all duration-200"
						>
							{" "}
							{isKilling ? <Loader2 className="animate-spin" /> : null} Kill
							Server
						</button>
						<DrawerClose
							className={`${drawerTriggerClassname} max-w-fit mx-auto`}
						>
							No. Take me back.
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
			<Drawer>
				<DrawerTrigger className={drawerTriggerClassname}>
					{" "}
					<SettingsIcon></SettingsIcon> Config
				</DrawerTrigger>
				<DrawerContent className="h-max">
					<DrawerHeader>
						<DrawerTitle className="font-heading text-3xl">
							Settings
						</DrawerTitle>
						<DrawerDescription>No settings here yet.</DrawerDescription>
					</DrawerHeader>
					<DrawerFooter>
						<DrawerClose
							className={`${drawerTriggerClassname} max-w-fit mx-auto`}
						>
							Close
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
