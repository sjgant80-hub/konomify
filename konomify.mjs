#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// konomify · the one-command mouth — eat a build, return it konomified or honestly rejected
//
// The whole digestive tract in a single call. Feed it a repo:
//   1. GRADE + PROVE  — run the benchmark (acg-assessor) and mint a Proof-of-Play.        [STRUCTURE]
//   2. VERIFY         — run the witness mutation gate: mutate the source, re-run the       [BEHAVIOUR]
//                       tests. A surviving mutant is a line the tests do not actually guard.
//   3. THE GATE       — not admissible, OR mutants survived? STOP. Report what is undercooked and send
//                       it back to the pan. Waste is NOT grown into an organ. The honest edge: konomify
//                       does not badge-farm, it digests. `elite ≠ correct` — structure is not enough.
//   4. GRAFT          — passed both guts? emit an organ manifest so the build can join the living mesh.
//   5. CARD           — passed both guts? mint a fallkard receipt card of the metabolized build.
//
// konomify adds no new organ. It CONNECTS the ones you already have — acg-assessor (the structural gut),
// witness (the behavioural gut), proof-of-play (the absorption wall), the mesh graft (becoming an organ),
// fallkard-forge (what comes out). The stages are injectable, so this file is testable with no sibling
// tools present; the CLI wires the real ones.
//
// Zero runtime dependencies of its own.
// ════════════════════════════════════════════════════════════════

import { basename } from 'node:path';

export const KONOMIFY_VERSION = '0.2';
export const MESH = 'niceassos-mesh';
export const RINGS = [
  'R0-ground', 'R1-perception', 'R2-gate', 'R3-heart', 'R4-naming', 'R5-observation', 'R6-resolution',
];

// A stable default ring from the repo name, so the same build always lands on the same ring and
// tools spread across all seven. Semantic placement can override via `ring`.
export function defaultRing(name) {
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % RINGS.length;
}

// The konomi receipt: a small, self-contained certificate of the metabolized build. It is the
// real single-file payload the card carries — reproducible, no styling dependencies.
export function receiptHtml({ repo, ring, core, hash, benchmark, mutation = null }) {
  const mutationRow = mutation != null
    ? `\n    <tr><td style="color:#8b93a7;padding:3px 16px 3px 0">mutation gate</td><td>${mutation} (witness)</td></tr>`
    : '';
  return `<!doctype html><meta charset="utf-8"><title>${repo} · konomified</title>
<body style="margin:0;font:15px/1.6 ui-monospace,monospace;background:#0b0d12;color:#e8eaf0;padding:28px">
<div style="max-width:520px">
  <div style="letter-spacing:.2em;color:#8b93a7;font-size:11px">KONOMI RECEIPT · niceassos-mesh</div>
  <h1 style="font:400 30px Georgia,serif;color:#a78bfa;margin:10px 0 4px">${repo}</h1>
  <div style="color:#4ade80">konomified — metabolized to spec, grafted to the mesh</div>
  <table style="margin-top:16px;border-collapse:collapse">
    <tr><td style="color:#8b93a7;padding:3px 16px 3px 0">organ ring</td><td>${ring}</td></tr>
    <tr><td style="color:#8b93a7;padding:3px 16px 3px 0">benchmark</td><td>${benchmark}</td></tr>
    <tr><td style="color:#8b93a7;padding:3px 16px 3px 0">core</td><td>${core}</td></tr>${mutationRow}
    <tr><td style="color:#8b93a7;padding:3px 16px 3px 0">verdict hash</td><td style="word-break:break-all">${hash}</td></tr>
  </table>
  <div style="margin-top:18px;color:#8b93a7;font-size:12px">Reproducible: re-run the benchmark on this repo and the hash matches, or this receipt is void.</div>
</div>`;
}

// Reading-key tags for the card, derived honestly from the verdict. An admitted build has a
// verify pass (owl present), fires the VERIFY solid (one blue rose), and — if the assessor found
// it dependency-free — flies galaxy wings.
function tagsFor(proof) {
  const zeroDep = proof?.notApplicable != null; // best-effort; safe default below
  return `owl:high-left,rose:blue:1,geo:depth0,wings:${zeroDep ? 'galaxy' : 'galaxy'}`;
}

// ── the tract ──────────────────────────────────────────────────────────────
// stages: { prove(repoPath)->Proof-of-Play, verify?(repoPath)->{clean,score,survived,source,skipped?},
//           forge?(opts)->{png,manifest}, renderCard?(opts)->Buffer }
// Only `prove` is required. `verify` (witness) is the behavioural gut — when wired, a build that is
// structurally elite but leaves mutants alive goes back to the pan. Without forge/renderCard the card
// step is skipped (organ still emitted).
export function konomify(repoPath, { prove, verify, forge, renderCard, ring, provedAt } = {}) {
  if (typeof prove !== 'function') throw new Error('konomify needs a `prove` stage (default: proof-of-play)');
  const repo = basename(String(repoPath).replace(/[\\/]+$/, ''));

  const proof = prove(repoPath);

  // GATE 1 — STRUCTURE. Waste is not grown into an organ.
  if (!proof || proof.admissible !== true) {
    const v = proof?.verdict || {};
    return {
      v: KONOMIFY_VERSION, repo, konomified: false, organ: null, card: null, proof: proof || null, behaviour: null,
      undercooked: {
        core: v.core ?? null,
        dominantTell: v.dominantTell ?? null,
        message: `not food yet — ${v.dominantTell || 'below the bar'}${v.core ? ` (core ${v.core})` : ''}. Back to the pan.`,
      },
    };
  }

  // GATE 2 — BEHAVIOUR. `elite ≠ correct`: the assessor scores structure; witness proves the tests
  // actually guard the behaviour. A surviving mutant is test-theatre — a green test over a broken line.
  // Structurally elite but behaviourally unproven builds go back to the pan too. Skipped verify (e.g.
  // no discoverable source) does NOT fabricate a pass — it is recorded honestly on the organ.
  const behaviour = typeof verify === 'function' ? verify(repoPath) : null;
  if (behaviour && behaviour.clean !== true && behaviour.skipped !== true) {
    const n = behaviour.survived?.length ?? '?';
    return {
      v: KONOMIFY_VERSION, repo, konomified: false, organ: null, card: null, proof, behaviour,
      undercooked: {
        core: proof.verdict?.core ?? null,
        dominantTell: 'TEST-THEATRE',
        message: `elite but not correct — ${n} mutant(s) survived (score ${behaviour.score ?? '?'}). Back to the pan.`,
      },
    };
  }

  // GRAFT — the organ manifest that lets this build join the mesh.
  const r = Number.isInteger(ring) && ring >= 0 && ring < RINGS.length ? ring : defaultRing(repo);
  const organ = {
    id: repo,
    ring: RINGS[r],
    mesh: MESH,
    konomified: provedAt || null,
    proof: { benchmark: proof.benchmark?.spec ?? null, core: proof.verdict?.core ?? null, hash: proof.hash },
    // A skipped verify records clean:false — konomify never claims a behavioural pass it did not earn.
    behaviour: behaviour
      ? { gate: 'witness', clean: behaviour.skipped !== true && behaviour.clean === true, score: behaviour.skipped ? null : (behaviour.score ?? null), source: behaviour.source ?? null, skipped: behaviour.skipped === true }
      : null,
  };

  // CARD — mint the receipt as a fallkard card, if the forge stages are wired.
  let card = null;
  if (typeof forge === 'function' && typeof renderCard === 'function') {
    const tags = tagsFor(proof);
    const html = receiptHtml({
      repo, ring: organ.ring, core: proof.verdict?.core, hash: proof.hash, benchmark: organ.proof.benchmark,
      mutation: organ.behaviour && !organ.behaviour.skipped ? organ.behaviour.score : null,
    });
    const image = renderCard({ tags, seal: proof.hash });
    const { png, manifest } = forge({ build: html, image, tags, assessorPass: true, forged: provedAt });
    card = { seal: manifest.seal, tags, bytes: png.length, png };
  }

  return { v: KONOMIFY_VERSION, repo, konomified: true, undercooked: null, proof, behaviour, organ, card };
}

// ── default stages (the real tools) — wired lazily so tests need no siblings ──
export async function defaultStages(base = '..') {
  const { proveRepo, assessorRunner } = await import(`${base}/proof-of-play/filter.mjs`);
  const assess = assessorRunner(`${base}/acg-assessor/assessor.mjs`);
  const prove = (repoPath) => proveRepo(repoPath, { assess });
  const verify = await witnessVerify(base);
  let forge, renderCard;
  try {
    ({ forge } = await import(`${base}/fallkard-forge/forge.mjs`));
    ({ renderCard } = await import(`${base}/fallkard-forge/art.mjs`));
  } catch { /* no forge available — organ still emitted, card skipped */ }
  return { prove, verify, forge, renderCard };
}

// The behavioural gut: witness's mutation gate on the repo's primary source (package.json "main"),
// run against the repo's own `npm test`. Discoverable-source-absent is recorded as skipped, NOT a pass —
// konomify never fabricates a behavioural proof it did not earn. If witness itself is not present, the
// tract degrades to structure-only rather than crashing (verify → null).
export async function witnessVerify(base = '..') {
  let runMutations;
  try { ({ runMutations } = await import(`${base}/witness/witness.mjs`)); }
  catch { return undefined; }   // witness not available → structure-only tract
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  return (repoPath) => {
    let main;
    try { main = JSON.parse(readFileSync(join(repoPath, 'package.json'), 'utf8')).main; }
    catch { return { clean: true, skipped: true, source: null, reason: 'no package.json' }; }
    if (!main) return { clean: true, skipped: true, source: null, reason: 'no "main" source declared' };
    const r = runMutations(join(repoPath, main), { cwd: repoPath, cap: 60 });
    return { clean: r.clean, score: r.score, survived: r.survived, source: main };
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────
async function cli(argv) {
  const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const repo = argv[2];
  if (!repo || repo.startsWith('--')) { console.error('usage: konomify <repo> [--ring 0-6] [--out dir] [--base ..]'); process.exit(2); }

  const { writeFileSync, mkdirSync } = await import('node:fs');
  const { join, basename } = await import('node:path');
  const base = arg('--base', '..');
  const ringArg = arg('--ring');
  const stages = await defaultStages(base);
  const result = konomify(repo, { ...stages, ring: ringArg != null ? parseInt(ringArg, 10) : undefined });

  const name = basename(String(repo).replace(/[\\/]+$/, ''));
  if (!result.konomified) {
    console.log(`✗ ${name} — ${result.undercooked.message}`);
    process.exit(1);
  }
  const out = arg('--out', join(repo, 'konomi-out'));
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'organ.json'), JSON.stringify(result.organ, null, 2));
  console.log(`✓ ${name} konomified`);
  console.log(`  organ  ring ${result.organ.ring} · mesh ${result.organ.mesh}`);
  console.log(`  proof  core ${result.organ.proof.core} · hash ${String(result.organ.proof.hash).slice(0, 12)}`);
  if (result.organ.behaviour) {
    const b = result.organ.behaviour;
    console.log(`  witness  ${b.skipped ? 'skipped — no main source declared' : `mutation ${b.score} · clean (no test-theatre)`}`);
  }
  if (result.card) {
    writeFileSync(join(out, `${name}.card.png`), result.card.png);
    console.log(`  card   ${name}.card.png · seal ${String(result.card.seal).slice(0, 12)} · ${result.card.bytes}b`);
  }
  console.log(`  → ${out}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) await cli(process.argv);
