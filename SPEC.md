# konomify · design specification

> Spec version: **konomify-v0.1** · tracks library `KONOMIFY_VERSION` 0.1.

konomify is **the mouth**. It is one command that runs a build through the whole digestive tract
and returns it *konomified* — graded, proven, grafted to the mesh, and carded — or honestly
rejected with a note on what is undercooked. It adds no new capability; it **connects** the ones
that already exist into a single tract.

## The tract

```
repo ──▶ 1. GRADE + PROVE ──▶ 2. GATE ──▶ 3. GRAFT ──▶ 4. CARD ──▶ konomified
              (assessor +        │           (organ       (fallkard
               proof-of-play)    │            manifest)    receipt)
                                 └── not admissible ──▶ back to the pan (no organ, no card)
```

1. **Grade + prove** — the injected `prove` stage (default: proof-of-play with acg-assessor as the
   benchmark) returns a Proof-of-Play carrying a reproducible verdict hash.
2. **The gate** — if the build is not admissible, konomify stops. It emits **no organ and no
   card**, and reports the dominant tell and core score. Waste is not grown into an organ. This is
   the honest edge: konomify digests, it does not badge-farm.
3. **Graft** — an admissible build gets an **organ manifest**: `{ id, ring, mesh, proof }`, placing
   it on one of the seven spine rings and on the `niceassos-mesh` channel so it can join the living
   mesh.
4. **Card** — an admissible build is minted as a **fallkard receipt card**: a self-contained HTML
   certificate (name, ring, benchmark, verdict hash) forged into a PNG whose art is generated from
   the verdict. Reproducible: re-run the benchmark and the hash matches, or the receipt is void.

## Injectable stages

konomify knows nothing about how grading, forging, or art work — it consumes stages:

- `prove(repoPath)` → a Proof-of-Play `{ admissible, hash, benchmark:{spec}, verdict:{core,nonCore,dominantTell} }`. **Required.**
- `forge(opts)` → `{ png, manifest }` — the card forge. Optional; absent ⇒ organ emitted, card skipped.
- `renderCard(opts)` → a PNG Buffer — the card art. Optional, paired with `forge`.

`defaultStages(base)` wires the real tools (proof-of-play → acg-assessor, fallkard-forge). Because
the stages are injected, konomify is fully testable with none of those siblings present.

## Rings

The seven spine rings: `R0-ground R1-perception R2-gate R3-heart R4-naming R5-observation
R6-resolution`. A build's ring defaults to a **deterministic** function of its name (stable, spreads
tools across the spine) and may be overridden with a semantic `ring`. An out-of-range override
falls back to the default rather than crashing.

## Invariants

1. **The gate is honest.** A build that is not admissible receives no organ and no card — ever.
   konomify cannot mint a pass the proof does not support.
2. **Deterministic.** Same repo + same proof ⇒ same organ (timestamp aside).
3. **Reflective, not generative.** konomify only reflects the injected proof; it computes no verdict
   of its own and cannot overrule the benchmark.
4. **Connects, does not accumulate.** It orchestrates existing tools; it introduces no new organ.
5. **Zero runtime dependencies.** Node standard library only; the real stages are its siblings.

## Verification

`node --test test.mjs` — 9 assertions against fake stages (no siblings needed), including the
load-bearing edge: a failing build gets no organ and no card. CI runs it on every push. konomify
passes its own gate — the mouth eats its own cooking.
