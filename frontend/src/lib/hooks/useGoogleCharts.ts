import useScript , { ScriptStatus } from '@charlietango/use-script';
import { useEffect } from 'react';

declare global {
  interface Window {
      google: any
  }
}

/**
 * Initialize a Google Chart
 * @param {Function} loadCallback draws the chart
 * @param {google.LoadSettings} i.e. google.charts.load options
 * @param {string | number} Google Chart Version
 */
export function useGoogleCharts(
    loadCallback: () => void,
    // @ts-ignore - google is attatched to window, type info can be found here: https://github.com/GoogleWebComponents/google-chart/blob/main/loader.ts#L62
    props: google.LoadSettings,
    useEffectDeps: any[] = [],
    version: string | number = 'current',
) {
    const [_ready, status] = useScript('https://www.gstatic.com/charts/loader.js');

    useEffect(() => {
      if (status === ScriptStatus.READY) {
        if (!window && !(window as any).google) {
          // shouldn't happen
          return;
        }
        window.google.charts.load(version, props);
        window.google.charts.setOnLoadCallback(loadCallback);
      }
    }, [status, ...useEffectDeps]);   
}