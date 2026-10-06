# Self-Sorting Cells — notes for Claude Code

Static site, vanilla JS, no build step and no dependencies. Keep it that way unless asked.

## Architecture
- `src/engine.js`: pure simulation. Exports `makeArray, act, Sim, sortedness, inversions, aggregation, chanceOf`.
  Wrapped in an IIFE that sets `window.SortEngine` in the browser and `module.exports` in Node. Never touch the DOM here.
- `src/app.js`: reads controls (`readCfg`), drives `Sim.tick(k)` from requestAnimationFrame, draws canvases, runs batches.
- `src/styles.css`: colour tokens on `:root`, redefined for dark mode. Canvas colours are read from these tokens at draw time.

## Model conventions
- Parallelism is approximated: each round, every cell acts once in random order. A run ends when a full round changes nothing.
- Selection cells keep `ideal` (target index). A parked cell (ideal >= own index) wakes up if any cell to its left should come after it.
- Sortedness = share of adjacent pairs in order (paper-style). Inversion progress = 1 - inversions/initialInversions.
- Aggregation (clustering) = share of adjacent pairs with the same colour tag. In control mode tags differ from behaviour types.

## Checks before committing
- `node --test` must pass.
- Open `index.html` and confirm there are no console errors.

## Scientific context
- Replicates Zhang, Goldstein & Levin 2024, "Classical sorting algorithms as a model of morphogenesis" (arXiv:2401.05375), part of Michael Levin's argument that simple systems show competencies not written into their rules ("free lunches" from his Platonic space idea).
- Paper's key results: chimeric arrays cluster by algotype mid-sort (peaks ~0.65–0.72 vs ~0.5 chance), then return to ~0.5 when sorted; clustering can persist with duplicate values; opposite-direction algotypes reach a stable mixed equilibrium; frozen cells reduce accuracy; "delayed gratification" reportedly increases with frozen cells.
- Our replication: swap counts and clustering peaks match closely (Bubble ~2,500 swaps, Selection ~1,240, Bubble+Selection peak ~0.73). The tags-only control removes the clustering, so the effect comes from the rules interacting, not from the metric.
- Key finding of ours: every swap exchanges an out-of-order pair, so the inversion count never increases (with a single sort direction). "Delayed gratification" appears only with the paper's adjacent-pair sortedness metric, so it depends on how progress is measured.
- Our version does NOT reproduce the delayed-gratification-vs-frozen-cells trend. Possible reasons: we approximate parallel threads with random-order rounds, and the paper's DG definition is ambiguous.
- Purpose: exploring whether such behaviour is just emergence (Deutsch's view) or something more (Levin's view). Keep the app scientifically honest and include controls when adding experiments.
