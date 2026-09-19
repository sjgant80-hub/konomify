# CLAUDE.md · konomify

Instructions for any agent working in this repository.

## What this is

The **mouth**: one command that runs a build through the whole tract — grade + prove
(acg-assessor via proof-of-play) → gate → graft (organ manifest for `niceassos-mesh`) → card
(fallkard-forge). It adds no new organ; it connects existing ones. Read `SPEC.md` first.

## Invariants you must preserve

1. **The gate is honest.** A build that is not admissible gets `konomified:false`, `organ:null`,
   `card:null`. There must be no code path that mints an organ or card for a build that did not
   pass. If one appears, that is a critical bug — this tool's whole point is that it does not
   badge-farm.
2. **Reflective, not generative.** konomify reads the injected proof and reflects it. It computes
   no verdict of its own and must never be able to overrule the benchmark.
3. **Injected stages.** `prove`/`forge`/`renderCard` are parameters. Keep konomify ignorant of
   their internals so it stays testable without siblings and swappable.
4. **Deterministic.** Same repo + same proof ⇒ same organ. Timestamps stay optional metadata.
5. **Additive.** konomify emits new artifacts; it never mutates the repo it eats.
6. **Zero runtime dependencies.** Node standard library only.
7. **Eats its own cooking.** konomify must stay admissible under acg-assessor. A change that
   reddens `npm test` or drops the badge does not ship.

## How to run

```bash
npm test
node konomify.mjs <repo> --base ..
```

CI runs `npm test` on every push.

## Seam

Estate-facing (organ/ring/mesh/konomi vocabulary is fine here). Do **not** introduce the project's private internal taxonomy or notation. Engineering
and the estate's own surface vocabulary only.
