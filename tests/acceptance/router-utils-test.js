import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import {
  parentRoute,
  routerMicrolib
} from 'ember-component-routes/-private/router-utils';

module('Acceptance | router utils', (hooks) => {
  setupApplicationTest(hooks);

  // parentRoute

  test('#parentRoute – child route', async function(assert) {
    await visit('/tests/parent/child');

    const route = this.owner.lookup('route:tests.parent.child');

    assert.equal(parentRoute(route).name, 'tests.parent');
  });

  test('#parentRoute – top-level route', async function(assert) {
    await visit('/tests');

    const route = this.owner.lookup('route:tests');

    assert.equal(parentRoute(route).name, 'application');
  });

  // #routerMicrolib

  test('#routerMicrolib returns a thing', async function(assert) {
    await visit('/tests');

    const route = this.owner.lookup('route:tests');

    assert.ok(routerMicrolib(route));
  });
});
