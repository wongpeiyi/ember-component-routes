import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import {
  targetObjectOf,
  templateNameFor
} from 'ember-component-routes/-private/template-utils';

module('Acceptance | template utils', (hooks) => {
  setupApplicationTest(hooks);

  test('#targetObjectOf child view of a controller', async function(assert) {
    await visit('/tests/parent');

    const { id } = this.element.querySelector('.parent__component-outlet');

    const view = this.owner.lookup('-view-registry:main')[id];
    const controller = this.owner.lookup('controller:tests/parent');

    assert.equal(targetObjectOf(view), controller);
  });

  test('#targetObjectOf child view of a component', async function(assert) {
    await visit('/');

    const { id } = this.element.querySelector('.side-bar a');

    const view = this.owner.lookup('-view-registry:main')[id];

    assert.ok(targetObjectOf(view).classNames.includes('side-bar'));
  });


  test('#templateNameFor component', async function(assert) {
    await visit('/tests/parent');

    const { id } = this.element.querySelector('.parent__component-outlet');

    const component = this.owner.lookup('-view-registry:main')[id];

    assert.equal(templateNameFor(component), 'component-outlet');
  });

  test('#templateNameFor controller', async function(assert) {
    await visit('/tests/parent');

    const controller = this.owner.lookup('controller:tests/parent');

    assert.equal(templateNameFor(controller), 'tests.parent');
  });
});
