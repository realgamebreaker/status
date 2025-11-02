import { ButtonRowBottom } from "@/components/ButtonRowBottom";
import { SwitchButton } from "@/components/SwitchButton";
import Button from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";

export default function Home() {
	return (
		<div className="flex flex-col min-h-screen items-center justify-between font-sans bg-[#13131C] gap-4 p-8">
      <Heading>Status</Heading>
      <SwitchButton />
      <ButtonRowBottom />
		</div>
	);
}
