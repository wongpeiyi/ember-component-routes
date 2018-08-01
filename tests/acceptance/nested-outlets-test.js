import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Component from '@ember/component';
import { ComponentRoute } from 'ember-component-routes';

module('Acceptance | nested outlets', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    this.owner.application.register('component:target-component', Component.extend({
      elementId: 'target-component'
    }));
  });

  hooks.afterEach(function() {
    this.owner.application.unregister('component:target-component');
  });

  test('when parent and child render the same components, tearing down the child should keep the render', async function(assert) {
    this.owner.application.register('route:tests/parent/child', ComponentRoute.extend({
      attributes() {
        return { foo: 1 };
      },

      renderComponents() {
        this.renderComponent('target-component');
      }
    }));

    this.owner.application.register('route:tests/parent/child/component-route', ComponentRoute.extend({
      attributes() {
        return { foo: 2 };
      },

      renderComponents() {
        this.renderComponent('target-component', { into: 'tests/parent' });
      }
    }));

    await visit(`/tests/parent/child/component-route`);

    let el = this.element.querySelector('.parent__component-outlet > #target-component');
    let component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.ok(el, 'target component is rendered');
    assert.equal(component.get('route.foo'), 2);

    await visit(`/tests/parent/child`);

    el = this.element.querySelector('.parent__component-outlet > #target-component');
    component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.ok(el, 'target component is still rendered');
    assert.equal(component.get('route.foo'), 1);

    this.owner.application.unregister('route:tests/parent/child');
    this.owner.application.unregister('route:tests/parent/child/component-route');
  });

});
