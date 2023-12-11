import { useEffect, useContext, useState, type MouseEventHandler, CSSProperties } from "react";
import { SeriesContext, Signal } from "../context/SeriesContext.tsx";
import { SignalsList } from "./SignalsList.tsx";
import { useTradingDays } from "../lib/hooks/useTradingDays.ts";
import { Stack } from "@mui/joy";

const buttonStyles: CSSProperties = { zIndex: 1, borderRadius: "50%", border: "1px solid black", cursor: "pointer", width: 16, height: 16, position: "absolute", left: -6, top: -6 };

type Props = {
    screenWidth: number;
}

  const fetchSignals = async (date?: string): Promise<Signal[]> => {
    if (typeof date !== "string" || !date.split("-")[0]?.startsWith("202")) return [];
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/signals?date=${date}`);
    if (response.status === 400) {
      return [];
    } else if (response.status === 404) {
      return [];
    }
    const data = await response.json();
    return data;
  }

export function Signals({ screenWidth }: Props) {
    const { latestTradingDay } = useTradingDays();
    const[latestSignals, setLatestSignals] = useState<Signal[]>([]);
    const isDesktop: boolean = screenWidth > 640;
    const { series } = useContext(SeriesContext);
    const [mouseDown, setMouseDown] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [position, setPosition] = useState<{ top: number, left: number }>({ top: isDesktop ? 48 : 72, left: screenWidth - 200 });

    const moveElement: MouseEventHandler<HTMLElement> = (e) => {
        if (mouseDown) {
            setPosition({ top: e.clientY, left: e.clientX });
        }
    }

    useEffect(() => {
        fetchSignals(latestTradingDay).then((data) => setLatestSignals(data));
    }, [latestTradingDay]);

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
            )}

            {mouseDown && <div
                onMouseMove={moveElement}
                onMouseUp={() => setMouseDown(false)}
                style={{ position: "absolute", width: "200vw", top: -100, left: -100, height: "200vh" }} />
            }
            {series.symbol ? (
                <>
                    <h4>Signals for {series.symbol}</h4>
                    <SignalsList type="symbol" signals={series.signals} expanded={expanded} />
                </>
            ) : (
                <>
                    <h4>Latest Signals</h4>
                    <SignalsList type="date" signals={latestSignals} expanded={expanded} />
                </>


            )}
        </Stack>
    )
}
