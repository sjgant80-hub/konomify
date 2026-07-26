#!/usr/bin/env node
// ═══ KONOMIFY TEST SUITE ═══
// The stages are injectable, so these tests use fake ones — no dependency on acg-assessor,
// proof-of-play, or fallkard-forge being present. The load-bearing test is the honest edge:
// a build that fails the gate gets NO organ and NO card. Waste is not grown into an organ.
// Usage: node test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { konomify, defaultRing, receiptHtml, RINGS, MESH, KONOMIFY_VERSION } from './konomify.mjs';

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
