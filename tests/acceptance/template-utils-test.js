import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { templateNameFor } from 'ember-component-routes/-private/template-utils';

module('Acceptance | template utils', (hooks) => {
  setupApplicationTest(hooks);

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
