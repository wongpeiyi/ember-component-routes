import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { later } from '@ember/runloop';

function anim(ms) {
  let resolveFn;

  const promise = new Promise((res) => resolveFn = res);

  later(resolveFn, ms);

  return promise;
}

module('Acceptance | animations', function(hooks) {
  setupApplicationTest(hooks);

  test('fade to white', async function(assert) {
    const outgoing = () => this.element.querySelector('#fade-to-white_a');
    const incoming = () => this.element.querySelector('#fade-to-white_b');

    await visit(`/animations`);

    assert.ok(outgoing(), 'outgoing is rendered');

    await anim(400);

    await visit(`/animations/fade-to-white`);

    assert.ok(outgoing().parentElement.classList.contains('velocity-animating'), 'outgoing animates out');

    await anim(500);

    assert.notOk(outgoing(), 'outgoing is torn down');
    assert.ok(incoming(), 'incoming is rendered');
    assert.ok(incoming().parentElement.classList.contains('velocity-animating'), 'incoming animates in');

    await anim(500);

    assert.notOk(incoming().parentElement.classList.contains('velocity-animating'), 'incoming finishes animating');
  });

  test('cross-fade attempt', async function(assert) {
    const outgoing = () => this.element.querySelector('#attempt_a');
    const incoming = () => this.element.querySelector('#attempt_b');

    await visit(`/animations`);

    assert.ok(outgoing(), 'outgoing is rendered');

    await anim(400);

    await visit(`/animations/cross-fade-attempt`);

    assert.notOk(outgoing(), 'outgoing is torn down immediately');
    assert.ok(incoming(), 'incoming is rendered');
    assert.ok(incoming().parentElement.classList.contains('velocity-animating'), 'incoming animates in');

    await anim(500);

    assert.notOk(incoming().parentElement.classList.contains('velocity-animating'), 'incoming finishes animating');
  });

  test('cross-fade', async function(assert) {
    const outgoing = () => this.element.querySelector('#cross-fade_a');
    const incoming = () => this.element.querySelector('#cross-fade_b');

    await visit(`/animations`);

    assert.ok(outgoing(), 'outgoing is rendered');

    await anim(400);

    await visit(`/animations/basic-cross-fade`);

    assert.ok(incoming(), 'incoming is rendered');
    assert.ok(incoming().parentElement.classList.contains('velocity-animating'), 'incoming animates in');
    assert.ok(outgoing().parentElement.classList.contains('velocity-animating'), 'outgoing animates out');

    await anim(500);

    assert.notOk(outgoing(), 'outgoing is torn down');
    assert.notOk(incoming().parentElement.classList.contains('velocity-animating'), 'incoming finishes animating');
  });

  test('route-dependent', async function(assert) {
    const one = () => this.element.querySelector('#route-dependent_one');
    const two = () => this.element.querySelector('#route-dependent_two');
    const three = () => this.element.querySelector('#route-dependent_three');

    await visit(`/animations`);

    assert.ok(two(), 'two is rendered');

    // Slide left to 1

    await visit(`/animations/route-dependent-1`);
    await anim(100);

    assert.ok(one(), 'one is rendered');
    assert.ok(one().classList.contains('velocity-animating'), 'one animates in');
    assert.ok(two().classList.contains('velocity-animating'), 'two animates out');
    assert.ok(one().getAttribute('style').match(/translateX\(-\d/), 'one slides from left');
    assert.ok(two().getAttribute('style').match(/translateX\(\d/), 'two slides right');

    await anim(400);

    assert.notOk(two(), 'two is torn down');
    assert.notOk(one().classList.contains('velocity-animating'), 'one finishes animating');

    // Slide back right to 2

    await visit(`/animations`);
    await anim(100);

    assert.ok(two(), 'two is rendered');
    assert.ok(two().classList.contains('velocity-animating'), 'two animates in');
    assert.ok(one().classList.contains('velocity-animating'), 'one animates out');
    assert.ok(two().getAttribute('style').match(/translateX\(\d/), 'two slides from right');
    assert.ok(one().getAttribute('style').match(/translateX\(-\d/), 'one slides left');

    await anim(400);

    assert.notOk(one(), 'one is torn down');
    assert.notOk(two().classList.contains('velocity-animating'), 'two finishes animating');

    // Slide right to 3

    await visit(`/animations/route-dependent-3`);
    await anim(100);

    assert.ok(three(), 'three is rendered');
    assert.ok(three().classList.contains('velocity-animating'), 'three animates in');
    assert.ok(two().classList.contains('velocity-animating'), 'two animates out');
    assert.ok(three().getAttribute('style').match(/translateX\(\d/), 'three slides from right');
    assert.ok(two().getAttribute('style').match(/translateX\(-\d/), 'two slides left');

    await anim(400);

    assert.notOk(two(), 'two is torn down');
    assert.notOk(three().classList.contains('velocity-animating'), 'three finishes animating');
  });
});
