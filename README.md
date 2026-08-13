# konomify

**▶ Live: https://sjgant80-hub.github.io/konomify/** — feed it a build and watch the two guts decide. The tract on that page is this repo's real `konomify`, inlined verbatim.

> The one-command **mouth**. Feed it a build; it returns it *konomified* — graded, proven, grafted
> to the mesh, and carded — or honestly rejected with a note on what's undercooked.

konomify adds no new organ. It **connects** the ones you already have into a single tract:
**acg-assessor** (the *structural* gut) → **witness** (the *behavioural* gut) → **proof-of-play** (the
absorption wall) → the **mesh graft** (becoming an organ) → **fallkard-forge** (what comes out). Pass
and you join the living mesh with a card; fail and you go back to the pan. It does not badge-farm — it
digests.

### Two guts, because `elite ≠ correct`

The assessor scores **structure** — tests exist, it's versioned, no smells. But a repo can be 10/10 elite
and still wrong: a test that stays green when the behaviour it names breaks (*test-theatre*). So konomify
runs a **second gut** — [`witness`](https://sjgant80-hub.github.io/witness/) mutates the source and re-runs
the tests. A surviving mutant is a line the tests do not actually guard. **A structurally-elite build with
a live mutant goes back to the pan too** — and the mutation score is stamped onto the organ and the card,
so "konomified" now means *behaviourally* verified, not just badged.

**Non-masking (v0.3):** the behavioural gut gates **every** source module, not just `main` — because a
clean module can mask a broken one (a green aggregate hiding a runaway part). One un-witnessed sub-module
fails the whole composite. Test it or baseline it; a build is only as sound as its weakest part.

## Use

```bash
konomify <repo>            # run the whole tract
konomify <repo> --ring 6   # place the organ on a specific ring
```

```
✓ fallkard konomified
  organ  ring R6-resolution · mesh niceassos-mesh
  proof  core 10/10 · hash b3caeb571cd7
  witness  mutation 1.0 · clean (no test-theatre)
  card   fallkard.card.png · seal 48c928b2a9fb

✗ kcc-mint-api — not food yet — ECHOED (core 3/8). Back to the pan.
✗ fallsieve — elite but not correct — 9 mutant(s) survived (score 0.55). Back to the pan.
```

Emits `konomi-out/organ.json` (the mesh manifest) and a fallkard receipt card — **only** for
builds that pass. A build that fails the gate gets neither.

## What it guarantees

- **The gate is honest** — a build that doesn't pass gets no organ and no card, ever.
- **Two guts** — structure (acg-assessor) *and* behaviour (witness). Elite structure over test-theatre is rejected.
- **Never fabricates a behavioural pass** — if the source can't be found to mutate, `verify` is recorded as *skipped* (clean:false), not silently passed.
- **Reflective, not generative** — konomify only reflects the proofs; it can't overrule a benchmark.
- **Deterministic** — same repo + same proofs ⇒ same organ.
- **Connects, doesn't accumulate** — it wires existing tools; it introduces no new organ.

## Test

```bash
npm test   # 13 assertions, incl. the honest edge (a failing build gets no organ/card) and the
           # behavioural gut (elite structure + a live mutant → back to the pan)
```

Zero runtime dependencies · MIT · single-file library + CLI. konomify passes its own gate.
