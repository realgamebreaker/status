import { ButtonRowBottom } from "@/components/ButtonRowBottom";
import { SharedToggle } from "@/components/SharedToggle";
import { TimeDisplay } from "@/components/TimeDisplay";
import { Heading } from "@/components/ui/Heading";

interface HomeProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
	const { cooked } = await searchParams;
	const safe = cooked === "false";
	return (
		<div className="flex flex-col min-h-screen items-center justify-between font-sans bg-[#13131C] gap-4 p-8">
			<Heading>Status</Heading>
			<div className="flex flex-col items-center">
				<SharedToggle />
				<TimeDisplay />
			</div>
			<ButtonRowBottom helpImAtWork={safe} />
		</div>
	);
}
