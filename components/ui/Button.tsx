"use client";

interface ButtonProps {
    children?: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
}

const Button = ({ children, onClick, disabled, className }: ButtonProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`p-2 px-4 border rounded-2xl bg-foreground text-background text-center hover:bg-foreground/60 transition-all duration-200 select-none flex gap-2 justify-center items-center active:scale-90 ${
				disabled ? "opacity-50 cursor-not-allowed" : ""
			} ${className}`}
		>
			{children}
		</button>
	);
};

export default Button;
