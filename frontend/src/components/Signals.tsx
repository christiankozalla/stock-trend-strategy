import { useContext, useState, type MouseEventHandler } from "react";
import { SeriesContext } from "../context/SeriesContext.tsx";
import { SignalsList } from "./SignalsList.tsx";
import { Stack } from "@mui/joy";

export function Signals() {
    const { series } = useContext(SeriesContext);
    const [mouseDown, setMouseDown] = useState(false);
    const [position, setPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });

    const moveElement: MouseEventHandler<HTMLElement> = (e) => {
        if (mouseDown) {
            setPosition({ top: e.clientY - 12, left: e.clientX - 12 });
        }
    }

    return (
        <Stack
            style={{ padding: "6px 12px", position: "absolute", left: position.left, top: position.top, backgroundColor: "white" }}
            onMouseUp={() => setMouseDown(false)}
            sx={{ boxShadow: "lg" }}
        >
            <div
                onMouseDown={() => setMouseDown(true)}
                style={{ zIndex: 1, borderRadius: "50%", border: "1px solid black", cursor: "pointer", width: 16, height: 16, position: "absolute", left: -6, top: -6 }}></div>
            {mouseDown && <div
                onMouseMove={moveElement}
                onMouseUp={() => setMouseDown(false)}
                style={{ position: "absolute", width: "200vw", top: -100, left: -100, height: "200vh" }}></div>}
            {series.symbol ? <h3>Signals for {series.symbol}</h3> : <h3>Choose a Symbol</h3>}
            <SignalsList type="symbol" signals={series.signals} />
        </Stack>
    )
}
