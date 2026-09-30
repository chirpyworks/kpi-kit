# Design direction

KPI Kit is designed around analytical hierarchy, not a grid of equally weighted cards.

The workbench reads in this order:

**scope → headline signals → primary trend/comparison → detailed evidence → data state**

The visual system uses a warm neutral canvas, dark ink, and one restrained orange data accent. Status colors are semantic. Numeric typography uses tabular figures where available.

The large overview intentionally gives the primary KPI and main analysis more visual mass than supporting metrics. On narrow screens, hierarchy is reconstructed rather than merely scaled down.

Data meaning overrides decoration: target status precedes historical improvement, missing intervals remain missing, and visualization form follows the comparison task.

`src/kit/styles.css` contains scoped `--kk-*` tokens so consumers can change the visual language without rewriting the contracts.
