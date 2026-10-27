const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const data = script.slice(0, script.indexOf('  const canvas'));
const interaction = script.slice(script.indexOf('  function openModal'), script.indexOf('  function closeModal'));

function setup() {
  const elements = new Map();
  const createElement = tagName => ({ tagName, style: {}, replaceWith(next) { elements.set('.pname', next); } });
  const modal = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, createElement('span'));
      return elements.get(selector);
    },
    classList: { add() {} },
  };
  const context = vm.createContext({ modal, document: { createElement } });
  vm.runInContext(data + interaction + '\nthis.ventures = VENTURES;', context);
  return { context, modal };
}

test('Z1 Incubator is on the orb with the ruled copy and no link (Sultan: "keep no link atm")', () => {
  const { context, modal } = setup();
  const z1i = context.ventures.find(v => v.name === 'Z1 Incubator');
  assert.ok(z1i, 'Z1 Incubator is in VENTURES');
  assert.equal(z1i.masked, undefined);
  assert.equal(z1i.status, 'Invite only');
  assert.equal(z1i.desc, 'An office of founders. Eight weeks to show proof.');
  assert.equal(z1i.url, undefined);
  assert.equal(z1i.color, '#ffb648');
  context.openModal(z1i);
  const name = modal.querySelector('.pname');
  assert.equal(name.tagName, 'span');
  assert.equal(name.textContent, 'Z1 Incubator');
  assert.equal(name.href, undefined);
  assert.equal(modal.querySelector('.pstatus').textContent, 'Invite only');
  assert.equal(modal.querySelector('.pfoot').textContent, 'Z1i - an invite-only challenge.');
});

test('every orbit is its own ring, inside the outermost one the page already had', () => {
  const { context } = setup();
  const rf = context.ventures.map(v => v.rf);
  assert.equal(new Set(rf).size, rf.length);
  assert.ok(Math.max(...rf) <= 0.47);
});
