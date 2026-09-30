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

test('Maali is revealed with approved copy and a safe new-tab title link', () => {
  const { context, modal } = setup();
  const maali = context.ventures[0];
  assert.equal(maali.name, 'Maali');
  assert.equal(maali.masked, undefined);
  assert.equal(maali.status, 'In beta');
  assert.equal(maali.desc, 'Every account. One clear view.');
  context.openModal(maali);
  const name = modal.querySelector('.pname');
  assert.equal(name.tagName, 'a');
  assert.equal(name.textContent, 'Maali');
  assert.equal(name.href, 'https://maali.ae');
  assert.equal(name.target, '_blank');
  assert.equal(name.rel, 'noopener noreferrer');
  assert.equal(modal.querySelector('.pfoot').textContent, 'maali.ae');
});

test('opening another venture after Maali removes the outgoing link', () => {
  const { context, modal } = setup();
  context.openModal(context.ventures[0]);
  for (const venture of context.ventures.slice(1)) {
    context.openModal(venture);
    const name = modal.querySelector('.pname');
    assert.equal(name.tagName, 'span');
    assert.equal(name.textContent, venture.name);
    assert.equal(name.href, undefined);
    assert.equal(name.target, undefined);
    assert.equal(name.rel, undefined);
    assert.equal(modal.querySelector('.pstatus').textContent, venture.status);
    assert.equal(modal.querySelector('.pdesc').textContent, venture.desc);
    assert.equal(modal.querySelector('.pfoot').textContent, venture.foot);
  }
});
