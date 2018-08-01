import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Component from '@ember/component';
import { ComponentRoute } from 'ember-component-routes';

module('Acceptance | attributes', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    this.owner.application.register('component:target-component', Component.extend({
      elementId: 'target-component'
    }));
  });

  hooks.afterEach(function() {
    this.owner.application.unregister('component:target-component');
  });

  const Route = ComponentRoute.extend({
    renderComponents() {
      this.renderComponent('target-component');
    }
  });

  // #attributes

  test('#attributes hook when defined sets attributes on component', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', Route.extend({
      attributes() {
        return { foo: 'bar' };
      }
    }));

    await visit(`/tests/parent/component-route`);

    const component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.foo'), 'bar');

    this.owner.application.unregister('route:tests/parent/component-route');
  });

  test('#attributes hook by default sets default attributes on component', async function(assert) {
    assert.expect(3);

    this.owner.application.register('route:tests/parent/params', Route.extend({
      model() {
        return { foo: 'bar' };
      },

      actions: {
        react() {
          assert.ok(true, 'action called');
        }
      }
    }));

    await visit(`/tests/parent/params/123`);

    const component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.model.foo'), 'bar');
    assert.equal(component.get('route.params.id'), '123');

    component.get('route.actions.react')();

    this.owner.application.unregister('route:tests/parent/params');
  });

  test('#attributes hook is called and component is rendered on every route entry', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', Route.extend({
      count: 0,

      attributes() {
        this.count += 1;

        return { count: this.count };
      }
    }));

    await visit(`/tests/parent/component-route`);

    let component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 1);

    await visit(`/tests`);
    await visit(`/tests/parent/component-route`);

    component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 2);

    this.owner.application.unregister('route:tests/parent/component-route');
  });

  // Positional params

  test('#attributes hook is called on positional params change', async function(assert) {
    this.owner.application.register('route:tests/parent/params', Route.extend({
      count: 0,

      attributes(model, { id }) {
        this.count += 1;

        return { id, count: this.count };
      }
    }));

    await visit(`/tests/parent/params/1`);

    let component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 1);
    assert.equal(component.get('route.id'), 1);

    await visit(`/tests/parent/params/2`);

    component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 2);
    assert.equal(component.get('route.id'), 2);

    this.owner.application.unregister('route:tests/parent/params');
  });
});
