import type { DataProvider, LoadOutcome } from '../contracts.js';
/** Both cancellation and revision are required: providers may ignore AbortSignal. */
export function createLatestLoader<Query, Result>(provider: DataProvider<Query, Result>, assertResult: (result: Result, query: Query) => void = () => { }) {
  let revision = 0;
  let controller: AbortController | undefined;
  return {
    async load(query: Query): Promise<LoadOutcome<Result>> {
      const ownRevision = ++revision;
      controller?.abort();
      const own = new AbortController();
      controller = own;
      try {
        const value = await provider.load(query, own.signal);
        if (own.signal.aborted || ownRevision !== revision)
          return { status: 'discarded' };
        assertResult(value, query);
        return { status: 'ready', value };
      }
      catch (error) {
        if (own.signal.aborted || ownRevision !== revision)
          return { status: 'discarded' };
        return { status: 'error', error: error instanceof Error ? error : new Error('Provider failed.') };
      }
    },
    cancel() { ++revision; controller?.abort(); },
  };
}
