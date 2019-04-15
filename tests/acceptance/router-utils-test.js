import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import EmberRoute from '@ember/routing/route';
import {
  parentRouteName,
  routeIsResolved,
  routerMicrolib
} from 'ember-component-routes/-private/router-utils';

module('Acceptance | router utils', (hooks) => {
  setupApplicationTest(hooks);

  // parentRouteName

  test('#parentRouteName – child route', async function(assert) {
    await visit('/tests/parent/child');

    const route = this.owner.lookup('route:tests.parent.child');

    assert.equal(parentRouteName(route), 'tests.parent');
  });

  test('#parentRouteName – top-level route', async function(assert) {
    await visit('/tests');

    const route = this.owner.lookup('route:tests');

    assert.equal(parentRouteName(route), 'application');
  });

  // #routeIsResolved

  test('#routeIsResolved', async function(assert) {
    const { owner } = this;

    owner.application.register('route:tests/parent', EmberRoute.extend({
      beforeModel() {
        const parentRoute = owner.lookup('route:tests');

        assert.ok(routeIsResolved(parentRoute), 'parent route already resolved');
        assert.notOk(routeIsResolved(this), 'this route not resolved');
      },

      actions: {
        didTransition() {
          const parentRoute = owner.lookup('route:tests');

          assert.ok(routeIsResolved(parentRoute), 'parent route still resolved');
          assert.ok(routeIsResolved(this), 'route becomes resolved');
        }
      }
    }));

    await visit('/tests');
    await visit('/tests/parent');

    owner.application.unregister('route:tests/parent');
  });

  // #routerMicrolib

  test('#routerMicrolib returns a thing', async function(assert) {
    await visit('/tests');

    const route = this.owner.lookup('route:tests');

    assert.ok(routerMicrolib(route));
  });
});
