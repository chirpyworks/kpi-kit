import { createLatestLoader, validateMetricDataset } from '../src/kit/core/index.js';

/** Your authorized API must return MetricDataset, not arbitrary raw rows. */
export const metricLoader = createLatestLoader({
  async load(url: string, signal: AbortSignal) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('Metric endpoint unavailable');
    return validateMetricDataset(await response.json());
  },
});

// const result = await metricLoader.load('/api/metrics');
// if (result.status === 'ready') setDataset(result.value);
// Cleanup: metricLoader.cancel();
