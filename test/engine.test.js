// Run with: node --test test/
const test = require('node:test');
const assert = require('node:assert');
const E = require('../src/engine.js');

const cfg = (over = {}) => ({
  n: 60, mix: { bubble: 50, insertion: 0, selection: 50 }, vr: 0, fz: 0, ft: 'movable',
  dirs: { bubble: 1, insertion: 1, selection: 1 }, ctrl: false, ...over,
});
const runToEnd = (c) => { const s = E.Sim(c); while (!s.done) s.tick(5000); return s; };

for (const mix of [{ bubble: 1 }, { insertion: 1 }, { selection: 1 }, { bubble: 1, selection: 1 }, { insertion: 1, selection: 1 }]) {
  test(`fully sorts with no damage: ${Object.keys(mix).join('+')}`, () => {
    const s = runToEnd(cfg({ mix }));
    assert.strictEqual(E.sortedness(s.arr), 1);
  });
}

test('inversion count never increases (single sort direction)', () => {
  const s = runToEnd(cfg({ fz: 3 }));
  assert.strictEqual(s.dipsI, 0);
});

test('clustering returns near chance once sorted', () => {
  const s = runToEnd(cfg({ n: 100 }));
  assert.ok(Math.abs(E.aggregation(s.arr) - s.chance) < 0.2);
});
