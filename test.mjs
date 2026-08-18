#!/usr/bin/env node
// ═══ KONOMIFY TEST SUITE ═══
// The stages are injectable, so these tests use fake ones — no dependency on acg-assessor,
// proof-of-play, or fallkard-forge being present. The load-bearing test is the honest edge:
// a build that fails the gate gets NO organ and NO card. Waste is not grown into an organ.
// Usage: node test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { konomify, defaultRing, receiptHtml, witnessVerify, RINGS, MESH, KONOMIFY_VERSION } from './konomify.mjs';

// fake Proof-of-Play stages
const provePass = () => ({
  admissible: true, hash: 'feed1234', benchmark: { spec: 'assessor-v0.7' },
  verdict: { badge: true, core: '10/10', nonCore: '14/14', dominantTell: null },
});
const proveFail = () => ({
  admissible: false, hash: 'dead5678', benchmark: { spec: 'assessor-v0.7' },
  verdict: { badge: false, core: '4/10', nonCore: '9/14', dominantTell: 'UNOPENED' },
});
// fake fallkard stages
const renderCard = ({ seal }) => Buffer.from(`FAKE-PNG-${seal}`);
const forge = ({ build }) => ({ png: Buffer.from(`CARD:${build.length}`), manifest: { seal: 'card-seal-01' } });

test('an admitted build is konomified — organ + card, joined to the mesh', () => {
  const r = konomify('/good', { prove: provePass, forge, renderCard });
  assert.equal(r.v, KONOMIFY_VERSION);
  assert.equal(r.konomified, true);
  assert.equal(r.undercooked, null);
  assert.equal(r.organ.id, 'good');
  assert.equal(r.organ.mesh, MESH);
  assert.ok(RINGS.includes(r.organ.ring), 'organ lands on a real ring');
  assert.equal(r.organ.proof.core, '10/10');
  assert.equal(r.organ.proof.hash, 'feed1234');
  assert.ok(r.card && r.card.seal === 'card-seal-01', 'a card is minted');
});

test('THE honest edge: a build that fails the gate gets NO organ and NO card', () => {
  const r = konomify('/bad', { prove: proveFail, forge, renderCard });
  assert.equal(r.konomified, false);
  assert.equal(r.organ, null, 'waste is not grown into an organ');
  assert.equal(r.card, null, 'no card for a build that did not pass');
  assert.equal(r.undercooked.dominantTell, 'UNOPENED');
  assert.match(r.undercooked.message, /back to the pan/i);
  assert.match(r.undercooked.message, /UNOPENED/);
});

test('konomify never fabricates a pass — it only reflects the proof', () => {
  // even with the forge stages wired, a failing proof yields nothing forged
  const r = konomify('/bad', { prove: proveFail, forge, renderCard });
  assert.equal(r.konomified, false);
  assert.equal(r.card, null);
});

// fake witness (behavioural gut) stages
const verifyClean = () => ({ clean: true, score: 1, survived: [], source: 'x.mjs' });
const verifyDirty = () => ({ clean: false, score: 0.55, survived: [{ line: 9, mutation: '< → <=' }, { line: 12, mutation: '|| → &&' }], source: 'x.mjs' });
const verifySkip = () => ({ clean: true, skipped: true, source: null, reason: 'no "main" source declared' });

test('BEHAVIOUR gut: elite structure but surviving mutants → back to the pan (elite ≠ correct)', () => {
  const r = konomify('/theatre', { prove: provePass, verify: verifyDirty, forge, renderCard });
  assert.equal(r.konomified, false, 'a structurally-elite but test-theatre build is NOT konomified');
  assert.equal(r.organ, null, 'no organ for a build whose tests do not guard behaviour');
  assert.equal(r.card, null);
  assert.equal(r.undercooked.dominantTell, 'TEST-THEATRE');
  assert.match(r.undercooked.message, /2 mutant\(s\) survived/);
  assert.match(r.undercooked.message, /back to the pan/i);
});

test('BEHAVIOUR gut: passing both guts records the mutation score on the organ + receipt', () => {
  const r = konomify('/solid', { prove: provePass, verify: verifyClean, forge, renderCard });
  assert.equal(r.konomified, true);
  assert.equal(r.organ.behaviour.gate, 'witness');
  assert.equal(r.organ.behaviour.clean, true);
  assert.equal(r.organ.behaviour.score, 1);
  const html = receiptHtml({ repo: 'solid', ring: 'R6-resolution', core: '10/10', hash: 'abc', benchmark: 'assessor-v0.7', mutation: 1 });
  assert.match(html, /mutation gate/);
  assert.match(html, /witness/);
});

test('BEHAVIOUR gut: a skipped verify is recorded honestly, never fabricated as a pass', () => {
  const r = konomify('/nomains', { prove: provePass, verify: verifySkip });
  assert.equal(r.konomified, true, 'unable-to-verify does not block a structurally-admitted build');
  assert.equal(r.organ.behaviour.skipped, true, 'but the organ says so — no fabricated behavioural proof');
  assert.equal(r.organ.behaviour.clean, false, 'skipped is not clean');
});

test('BACKWARD COMPAT: with no verify stage the tract is structure-only (behaviour null)', () => {
  const r = konomify('/good', { prove: provePass, forge, renderCard });
  assert.equal(r.konomified, true);
  assert.equal(r.organ.behaviour, null);
});

test('the ring is deterministic and always on the spine', () => {
  const a = defaultRing('fallkard'), b = defaultRing('fallkard');
  assert.equal(a, b);
  assert.ok(a >= 0 && a < RINGS.length);
  assert.equal(konomify('/x', { prove: provePass }).organ.ring, RINGS[defaultRing('x')]);
});

test('a semantic ring override is honoured', () => {
  const r = konomify('/good', { prove: provePass, ring: 3 });
  assert.equal(r.organ.ring, RINGS[3]);
  // an out-of-range ring falls back to the deterministic default, never crashes
  const r2 = konomify('/good', { prove: provePass, ring: 99 });
  assert.equal(r2.organ.ring, RINGS[defaultRing('good')]);
});

test('without forge stages the organ is still emitted, the card is skipped', () => {
  const r = konomify('/good', { prove: provePass });
  assert.equal(r.konomified, true);
  assert.ok(r.organ);
  assert.equal(r.card, null);
});

test('the receipt certificate carries the real verdict and says it is reproducible', () => {
  const html = receiptHtml({ repo: 'fallkard', ring: 'R6-resolution', core: '10/10', hash: 'abc123', benchmark: 'assessor-v0.7' });
  assert.match(html, /fallkard/);
  assert.match(html, /R6-resolution/);
  assert.match(html, /abc123/);
  assert.match(html, /re-run the benchmark/i);
  assert.match(html, /<!doctype html>/i);
});

test('konomify refuses to run without a prove stage', () => {
  assert.throws(() => konomify('/good', {}), /prove/);
});

test('konomifying is deterministic — same repo + same proof, same organ', () => {
  const a = konomify('/good', { prove: provePass, forge, renderCard });
  const b = konomify('/good', { prove: provePass, forge, renderCard });
  assert.deepEqual(a.organ, b.organ);
});


// ─── the boundaries the mutation gate proved nothing was holding (estate bring-up) ───

test('AN EXPLICIT RING IS HONOURED AT BOTH ENDS OF THE LADDER, and nonsense falls back', () => {
  // ring 0 is a real ring. `>= 0` flipped to `> 0` silently rehomes every R0 organ.
  assert.equal(konomify('/x', { prove: provePass, ring: 0 }).organ.ring, 'R0-ground');
  assert.equal(konomify('/x', { prove: provePass, ring: 6 }).organ.ring, 'R6-resolution');
  const dflt = konomify('/x', { prove: provePass }).organ.ring;
  // one past the top is not a ring — it is a request for the default, said honestly
  assert.equal(konomify('/x', { prove: provePass, ring: 7 }).organ.ring, dflt, 'ring 7 was seated');
  assert.equal(konomify('/x', { prove: provePass, ring: -1 }).organ.ring, dflt);
  // a numeric STRING is config noise, not a ring — Number.isInteger is the guard that keeps
  // RINGS["3"] (undefined) off the organ
  assert.equal(konomify('/x', { prove: provePass, ring: '3' }).organ.ring, dflt, 'a string ring was seated');
  assert.ok(konomify('/x', { prove: provePass, ring: 7 }).organ.ring, 'the fallback ring came out empty');
});

test('a prove stage that returns nothing leaves proof as NULL on the refusal, never undefined', () => {
  const r = konomify('/x', { prove: () => undefined });
  assert.equal(r.konomified, false);
  assert.strictEqual(r.proof, null, 'a missing proof came out as ' + String(r.proof));
  assert.match(r.undercooked.message, /below the bar/, 'a refusal with no tell lost its fallback wording');
});

test('the organ timestamp is the one given, and NULL — not undefined — when none was', () => {
  assert.strictEqual(konomify('/x', { prove: provePass }).organ.konomified, null);
  assert.equal(konomify('/x', { prove: provePass, provedAt: '2026-08-18' }).organ.konomified, '2026-08-18');
});

test('HALF A FORGE MINTS NO CARD — forge without renderCard, and the reverse, both skip cleanly', () => {
  // `&&` flipped to `||` calls the half that is missing and the whole konomify throws on the repo
  // that dared not to have fallkard installed.
  const only1 = konomify('/x', { prove: provePass, forge });
  assert.equal(only1.konomified, true);
  assert.strictEqual(only1.card, null, 'a card was minted with no renderer');
  const only2 = konomify('/x', { prove: provePass, renderCard });
  assert.equal(only2.konomified, true);
  assert.strictEqual(only2.card, null, 'a card was minted with no forge');
});

// ─── witnessVerify: the module-discovery filter, proven by what the stub was handed ───

test('THE GATE IS POINTED AT EXACTLY THE BEHAVIOURAL MODULES — no tests, no helpers, no strays', async () => {
  const { unlinkSync, existsSync, readFileSync } = await import('node:fs');
  const LOG = new URL('./fixtures/base/witness/log.txt', import.meta.url);
  if (existsSync(LOG)) unlinkSync(LOG);
  const verify = await witnessVerify('./fixtures/base');
  const r = verify(new URL('./fixtures/repo', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  assert.equal(r.clean, true);
  // worst-of wins: main scored 0.9, extra 0.6 — the composite must carry the weakest number
  assert.equal(r.score, 0.6, 'the composite score was not the weakest module');
  const gated = readFileSync(LOG, 'utf8').trim().split(/\r?\n/);
  assert.deepEqual(gated, ['main.mjs', 'extra.mjs'],
    'the filter handed the gate the wrong files: ' + gated.join(', '));
});

// ─── the CLI: argument parsing is behaviour too ───

test('the CLI with no repo, or a flag where the repo should be, prints usage and exits 2', async () => {
  const { spawnSync } = await import('node:child_process');
  for (const args of [[], ['--ring']]) {
    const r = spawnSync(process.execPath, ['konomify.mjs', ...args], { encoding: 'utf8' });
    assert.equal(r.status, 2, 'argv ' + JSON.stringify(args) + ' exited ' + r.status);
    assert.match(r.stderr, /usage: konomify/);
  }
});

test('EVERY FLAG READS THE VALUE AFTER IT — ring lands on the organ, out lands on disk', async () => {
  // `argv[i + 1]` flipped to `argv[i - 1]` makes every flag read the token BEFORE it: the ring
  // becomes a path, the output lands in the base tree, and nothing anywhere says why.
  const { spawnSync } = await import('node:child_process');
  const { readFileSync, rmSync, existsSync } = await import('node:fs');
  const OUT = new URL('./fixtures/out', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  rmSync(OUT, { recursive: true, force: true });
  const r = spawnSync(process.execPath,
    ['konomify.mjs', './fixtures/repo', '--base', './fixtures/base', '--out', OUT, '--ring', '5'],
    { encoding: 'utf8' });
  assert.equal(r.status, 0, 'the CLI failed: ' + r.stderr.slice(0, 200) + r.stdout.slice(0, 200));
  assert.ok(existsSync(OUT + '/organ.json'), 'the organ did not land where --out said');
  const organ = JSON.parse(readFileSync(OUT + '/organ.json', 'utf8'));
  assert.equal(organ.ring, 'R5-observation', '--ring 5 produced ' + organ.ring);
  rmSync(OUT, { recursive: true, force: true });
});
