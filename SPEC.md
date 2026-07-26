# konomify · design specification

> Spec version: **konomify-v0.2** · tracks library `KONOMIFY_VERSION` 0.2.

konomify is **the mouth**. It is one command that runs a build through the whole digestive tract
and returns it *konomified* — graded, proven, grafted to the mesh, and carded — or honestly
rejected with a note on what is undercooked. It adds no new capability; it **connects** the ones
that already exist into a single tract.

## The tract

```
repo ─▶ 1. PROVE ─▶ 2. VERIFY ─▶ 3. GATE ─▶ 4. GRAFT ─▶ 5. CARD ─▶ konomified
         (assessor)   (witness)     │         (organ       (fallkard
          STRUCTURE    BEHAVIOUR    │          manifest)     receipt)
                                    ├── not admissible ─────▶ back to the pan (no organ, no card)
                                    └── mutant survived ────▶ back to the pan (TEST-THEATRE)
```

1. **Prove (structure)** — the injected `prove` stage (default: proof-of-play with acg-assessor as the
   benchmark) returns a Proof-of-Play carrying a reproducible verdict hash.
2. **Verify (behaviour)** — the injected `verify` stage (default: the witness mutation gate on the repo's
   `main` source, run against its own `npm test`) returns `{ clean, score, survived, source, skipped? }`.
   `elite ≠ correct`: this catches test-theatre that structure grading cannot see.
3. **The gate** — if the build is not admissible **or** a mutant survived, konomify stops. It emits **no
   organ and no card**, and reports the dominant tell (`UNOPENED…` for structure, `TEST-THEATRE` for
   behaviour) and the score. Waste is not grown into an organ. konomify digests, it does not badge-farm.
4. **Graft** — a build that passed **both guts** gets an **organ manifest**: `{ id, ring, mesh, proof,
   behaviour }`, placing it on one of the seven spine rings and on the `niceassos-mesh` channel. The
   `behaviour` block records the mutation score — or `skipped:true` when the source could not be found
   to mutate (never a fabricated pass).
5. **Card** — minted as a **fallkard receipt card**: a self-contained HTML certificate (name, ring,
   benchmark, mutation score, verdict hash) forged into a PNG. Reproducible: re-run and the hash matches,
   or the receipt is void.

## Injectable stages

konomify knows nothing about how grading, forging, or art work — it consumes stages:

- `prove(repoPath)` → a Proof-of-Play `{ admissible, hash, benchmark:{spec}, verdict:{core,nonCore,dominantTell} }`. **Required.**
- `verify(repoPath)` → `{ clean, score, survived, source, skipped? }` — the witness behavioural gut. Optional; absent ⇒ structure-only tract (backward compatible).
- `forge(opts)` → `{ png, manifest }` — the card forge. Optional; absent ⇒ organ emitted, card skipped.
- `renderCard(opts)` → a PNG Buffer — the card art. Optional, paired with `forge`.

`defaultStages(base)` wires the real tools (proof-of-play → acg-assessor, **witness**, fallkard-forge).
`witnessVerify(base)` builds the behavioural stage; if witness isn't present it returns `undefined` and the
tract degrades to structure-only rather than crashing. Because the stages are injected, konomify is fully
testable with none of those siblings present.

## Rings

The seven spine rings: `R0-ground R1-perception R2-gate R3-heart R4-naming R5-observation
R6-resolution`. A build's ring defaults to a **deterministic** function of its name (stable, spreads
tools across the spine) and may be overridden with a semantic `ring`. An out-of-range override
falls back to the default rather than crashing.

## Invariants

1. **The gate is honest.** A build that is not admissible **or** has a surviving mutant receives no
   organ and no card — ever. konomify cannot mint a pass the proofs do not support.
2. **`elite ≠ correct`.** Structure grading is necessary, not sufficient; the witness gut rejects
   test-theatre that the assessor cannot see. konomify never fabricates a behavioural pass — an
   un-verifiable source is recorded `skipped` (clean:false), not passed.
3. **Deterministic.** Same repo + same proofs ⇒ same organ (timestamp aside).
4. **Reflective, not generative.** konomify only reflects the injected proofs; it computes no verdict
   of its own and cannot overrule a benchmark.
5. **Connects, does not accumulate.** It orchestrates existing tools; it introduces no new organ.
6. **Zero runtime dependencies.** Node standard library only; the real stages are its siblings.

## Verification

`node --test test.mjs` — 13 assertions against fake stages (no siblings needed), including the
load-bearing edges: a failing build gets no organ and no card, and a structurally-elite build with a
surviving mutant goes back to the pan. CI runs it on every push. konomify passes its own gate — the
mouth eats its own cooking.
