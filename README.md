# Self-Sorting Cells

An interactive replication of the cell-view sorting experiments in
Zhang, Goldstein & Levin (2024), *Classical sorting algorithms as a model of morphogenesis*
([arXiv:2401.05375](https://arxiv.org/abs/2401.05375)).

Every element of an array is an agent running its own local rule (Bubble, Insertion or Selection).
The page lets you explore:

- **Algotype clustering**: cells running the same rule clump together mid-sort, though no cell can see another's rule.
- **Damage**: frozen cells that cannot act (movable) or cannot act or be moved (immovable).
- **Conflicting goals**: algotypes sorting in opposite directions.
- **Duplicate values**, and a **tags-only control** (same colours, every cell runs Bubble).
- Two progress measures: adjacent-pair sortedness (dips) vs inversion count (never increases with one sort direction).

## Run it

It is a static site with no build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Tests

```sh
node --test
```

## Layout

| Path | What it is |
|---|---|
| `index.html` | Page markup |
| `src/engine.js` | Simulation logic (no DOM). Works in the browser (`window.SortEngine`) and Node (`require`). |
| `src/app.js` | UI: controls, canvas drawing, batch runs |
| `src/styles.css` | Styles and light/dark theme tokens |
| `test/engine.test.js` | Engine tests (Node's built-in test runner) |
