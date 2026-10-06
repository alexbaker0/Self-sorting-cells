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
