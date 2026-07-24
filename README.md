# konomify

> The one-command **mouth**. Feed it a build; it returns it *konomified* — graded, proven, grafted
> to the mesh, and carded — or honestly rejected with a note on what's undercooked.

konomify adds no new organ. It **connects** the ones you already have into a single tract:
**acg-assessor** (the gut) → **proof-of-play** (the absorption wall) → the **mesh graft** (becoming
an organ) → **fallkard-forge** (what comes out). Pass and you join the living mesh with a card;
fail and you go back to the pan. It does not badge-farm — it digests.

## Use

```bash
konomify <repo>            # run the whole tract
konomify <repo> --ring 6   # place the organ on a specific ring
```

```
✓ fallkard konomified
  organ  ring R6-resolution · mesh niceassos-mesh
  proof  core 10/10 · hash b3caeb571cd7
  card   fallkard.card.png · seal 48c928b2a9fb

✗ kcc-mint-api — not food yet — ECHOED (core 3/8). Back to the pan.
```

Emits `konomi-out/organ.json` (the mesh manifest) and a fallkard receipt card — **only** for
builds that pass. A build that fails the gate gets neither.

## What it guarantees

- **The gate is honest** — a build that doesn't pass gets no organ and no card, ever.
- **Reflective, not generative** — konomify only reflects the proof; it can't overrule the benchmark.
- **Deterministic** — same repo + same proof ⇒ same organ.
- **Connects, doesn't accumulate** — it wires existing tools; it introduces no new organ.

## Test

```bash
npm test   # 9 assertions, incl. the honest edge: a failing build gets no organ and no card
```

Zero runtime dependencies · MIT · single-file library + CLI. konomify passes its own gate.
