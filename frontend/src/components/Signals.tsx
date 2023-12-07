import { useContext, useState, type MouseEventHandler, CSSProperties } from "react";
import { SeriesContext } from "../context/SeriesContext.tsx";
import { SignalsList } from "./SignalsList.tsx";
import { Stack } from "@mui/joy";

const buttonStyles: CSSProperties = { zIndex: 1, borderRadius: "50%", border: "1px solid black", cursor: "pointer", width: 16, height: 16, position: "absolute", left: -6, top: -6 };

export function Signals() {
    const innerWidth = window.innerWidth;
    const isDesktop: boolean = innerWidth > 640;
    const { series } = useContext(SeriesContext);
    const [mouseDown, setMouseDown] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [position, setPosition] = useState<{ top: number, left: number }>({ top: isDesktop ? 48 : 72, left: innerWidth - 200 });

    const moveElement: MouseEventHandler<HTMLElement> = (e) => {
        if (mouseDown) {
            setPosition({ top: e.clientY, left: e.clientX });
        }
    }

    return (
        <Stack
            style={{ padding: "6px 12px", position: "absolute", left: position.left, top: position.top, backgroundColor: "white" }}
            onMouseUp={() => setMouseDown(false)}
            sx={{ boxShadow: "lg" }}
        >
            {isDesktop ? (
                <div
                    onMouseDown={() => setMouseDown(true)}
                    style={buttonStyles}
                />
            ) : (
                <button
                    style={{ ...buttonStyles, backgroundColor: "white" }}
                    onClick={() => setExpanded((prev) => !prev)}
                >{expanded ? "X" : "I"}</button>
            )
            }

            {mouseDown && <div
                onMouseMove={moveElement}
                onMouseUp={() => setMouseDown(false)}
                style={{ position: "absolute", width: "200vw", top: -100, left: -100, height: "200vh" }}
            />
            }
            {series.symbol ? <h4>Signals for {series.symbol}</h4> : <h4>Choose a Symbol</h4>}
            <SignalsList type="symbol" signals={series.signals} expanded={expanded} />
        </Stack>
    )
}
