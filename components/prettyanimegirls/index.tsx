"use client";
import { useState } from "react";
import Button from "../ui/Button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Container } from "./container";

export function Goon({hide}: {hide?: boolean}) {
    const [open, setOpen] = useState(true);
    if (hide) return null;
    return (
        <>
        <Button onClick={() => {setOpen(!open)}}>
            {open ? <EyeOffIcon /> : <EyeIcon />}
            {open ? "Quick! My Parents are coming!" : "Phew. They left!"}
        </Button>
        {open && <Container>
            
        </Container>}
        </>
    );
}