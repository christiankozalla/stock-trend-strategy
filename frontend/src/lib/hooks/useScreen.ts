import { useEffect, useState } from "react";

let resizeObserver: ResizeObserver;

export function useScreen() {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.borderBoxSize) {
            setScreenWidth(entry.borderBoxSize[0].inlineSize);
          }
        }
      });
    }
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, []);

  return {
    screenWidth,
  }
}