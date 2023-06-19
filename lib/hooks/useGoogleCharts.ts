import useScript , { ScriptStatus  } from '@charlietango/use-script';
import { useEffect } from 'react';

/**
 * Initialize a Google Chart
 * @param {Function} loadCallback draws the chart
 * @param {google.LoadOptions} i.e. google.charts.load options
 * @param {string | number} Google Chart Version
 */
export function useGoogleCharts(
    loadCallback: () => void,
    props: google.LoadOptions,
    useEffectDeps: any[] = [],
    version: string | number = 'current',
) {
    const [ready, status] = useScript('https://www.gstatic.com/charts/loader.js');

    useEffect(() => {
      if (status === ScriptStatus.READY) {
        if (!window && !(window as any).google) {
          // shouldn't happen
          return;
        }
        google.charts.load(version, props);
        google.charts.setOnLoadCallback(loadCallback);
      }
    }, [status, ...useEffectDeps]);   
}