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
