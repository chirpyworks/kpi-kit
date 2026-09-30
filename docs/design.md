# Design direction

KPI Kit is a working source-kit studio, not a marketing landing page.

## Priorities

1. Navigate to a useful composition or reusable component.
2. Read scope, headline signals, primary comparison and supporting evidence.
3. Inspect options, source data and executable code without losing the preview.

Desktop uses a compact header, library sidebar, scrollable preview, optional inspector and status bar inside the viewport. Templates prioritize the composed dashboard and start with the inspector closed. The inspector becomes a non-modal drawer when a third column would compress the data canvas. Components keep their own selection and inspection mode. Panel contents own scrolling. At 1100 CSS px and below, Library / Preview / Inspector become tabs and the selected panel follows natural document flow. The design does not shrink an entire desktop dashboard onto a phone.

The visual system uses near-black navy space, distinct blue panel levels, fine blue edges and restrained cyan emphasis. Current-period data uses cyan; previous-period data is visibly dashed and muted. Teal, amber and red express explicit positive/warning/negative semantics. The light theme preserves the same hierarchy with pale blue surfaces. Numeric typography uses tabular figures. Tokens remain scoped under `--kk-*` in `src/kit/styles.css`.

Dashboard compositions have one domain each: revenue, customer acquisition, or workflow operations. The representative composition gives the primary time series roughly twice the width of its supporting channel/target column. Four independent KPI panels contain correctly scoped daily mini trends, followed by the dominant comparison, compact target context, detail records and an outcome composition. Dates govern every metric, trend, breakdown and table row. Isolated component examples display their fixed-scope status separately.

Reference-led styling does not add fake live connections, decorative maps or invented operational decisions. Each annotation derives from the synthetic records. A zero baseline and visible units take precedence over decoration. Missing observations are not connected or filled with zero. Signed bars share a zero baseline; a zero waterfall change has zero height. Dense cartesian plots may scroll internally on narrow devices to retain readable labels, while the document must not overflow horizontally.

## Verification boundary

The layout and interactions have source-level regression coverage. Actual screenshots and responsive browser acceptance must be obtained with a working browser runtime before claiming visual review. A successful TypeScript/SSR check does not prove rendered layout quality.

## React craft refinement

The template uses one shared two-to-one evidence grid: the trend and detail table share their edges, and channel/target context aligns with outcome composition. The analytical question is the subtitle, the leading KPI gets typographic priority, and source records use a readable 12px baseline. Sparkline color follows the metric's declared comparison polarity rather than card position. Goal attainment is a separate state surface with restrained semantic borders and fills.

SeriesChart's optional compact density leaves the plot uncovered and moves current/prior values, original dates and units into a dedicated inspection strip. Area/line and comparison controls change presentation only. Observations support pointer preview, retained click/touch selection, keyboard movement and a clear return to the latest observation. Data/axis geometry never animates. Surface entrances and hover responses are short and disabled by reduced-motion preferences. Both themes share the component anatomy; contrasting on-accent tokens are theme-specific.

This pass is implemented and source-tested. It is not a claim of rendered pixel acceptance.
