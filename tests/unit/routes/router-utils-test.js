import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Route from '@ember/routing/route';
import { attributableActions } from 'ember-component-routes/-private/router-utils';

module('Unit | router-utils', function(hooks) {
  setupTest(hooks);

  hooks.afterEach(function() {
    this.owner.application.unregister('route:foo');
  });

  // #attributableActions

  test('#attributableActions returns bound custom actions', function(assert) {
    this.owner.application.register('route:foo', Route.extend({
      actions: {
        custom() {
          return this;
        }
      }
    }));

    const route = this.owner.lookup('route:foo');

    assert.ok(attributableActions(route).hasOwnProperty('custom'));
    assert.equal(attributableActions(route).custom(), route);
  });

  test('#attributableActions excludes default hooks', function(assert) {
    this.owner.application.register('route:foo', Route.extend());

    const route = this.owner.lookup('route:foo');

    assert.equal(Object.keys(attributableActions(route)).length, 0);
  });

});
