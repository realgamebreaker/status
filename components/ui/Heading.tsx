interface HeadingProps {
    children?: React.ReactNode;
    small?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export const Heading = ({ children, small, className, style }: HeadingProps) => {
    return (
        <h1 className={`font-heading text-foreground text-center ${small ? "text-2xl" : "text-4xl"} ${className}`} style={style}>
            {children}
        </h1>
    );
};