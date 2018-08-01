import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Component from '@ember/component';
import { ComponentRoute } from 'ember-component-routes';

module('Acceptance | query params', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    this.owner.application.register('component:target-component', Component.extend({
      elementId: 'target-component'
    }));
  });

  hooks.afterEach(function() {
    this.owner.application.unregister('component:target-component');
    this.owner.application.unregister('route:tests/parent/component-route');
  });

  const Route = ComponentRoute.extend({
    renderComponents() {
      this.renderComponent('target-component');
    }
  });

  test('queryParams are set as attributes on component', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', Route.extend({
      queryParams: {
        foo: {}
      }
    }));

    await visit(`/tests/parent/component-route?foo=bar`);

    const component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.params.foo'), 'bar');
  });

  test('queryParams respect `defaultValue` and its type', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', Route.extend({
      queryParams: {
        num: { defaultValue: 0 },
        str: { defaultValue: '' },
        bool: { defaultValue: false },
        arr: { defaultValue: [] }
      }
    }));

    await visit(`/tests/parent/component-route`);

    let component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(typeof component.get('route.params.num'), 'number');
    assert.equal(component.get('route.params.num'), 0);
    assert.equal(component.get('route.params.str'), '');
    assert.equal(component.get('route.params.bool'), false);
    assert.deepEqual(component.get('route.params.arr'), []);

    await visit(`/tests/parent/component-route?num=1&str=a&bool=true&arr=[5,6]`);

    component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(typeof component.get('route.params.num'), 'number');
    assert.equal(component.get('route.params.num'), 1);
    assert.equal(component.get('route.params.str'), 'a');
    assert.equal(component.get('route.params.bool'), true);
    assert.deepEqual(component.get('route.params.arr'), [5, 6]);
  });

  test('queryParams respects `as` option', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', Route.extend({
      queryParams: {
        page: {
          as: 'p'
        }
      }
    }));

    await visit(`/tests/parent/component-route?p=1`);

    const component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.params.page'), 1);
  });

  test('#attributes hook is called and query params updated on pure query params change', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', Route.extend({
      count: 0,

      queryParams: {
        foo: {}
      },

      attributes(model, { foo }) {
        this.count += 1;

        return { foo, count: this.count };
      }
    }));

    await visit(`/tests/parent/component-route`);

    let component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 1);
    assert.equal(component.get('route.foo'), undefined);

    await visit(`/tests/parent/component-route?foo=bar`);

    component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 2);
    assert.equal(component.get('route.foo'), 'bar');

    await visit(`/tests/parent/component-route`);

    component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 3);
    assert.equal(component.get('route.foo'), undefined);
  });

  test('#attributes hook is called only once on route entry with query params', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', Route.extend({
      count: 0,

      queryParams: {
        foo: {}
      },

      attributes() {
        this.count += 1;

        return { count: this.count };
      }
    }));

    await visit(`/tests/parent`);
    await visit(`/tests/parent/component-route?foo=bar`);

    const component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 1);
  });

  test('#attributes hook is not called when parent query params change', async function(assert) {
    this.owner.application.register('route:tests/parent', ComponentRoute.extend({
      queryParams: {
        foo: {}
      }
    }));

    this.owner.application.register('route:tests/parent/child/component-route', Route.extend({
      count: 0,

      queryParams: {
        baz: {}
      },

      attributes() {
        this.count += 1;

        return { count: this.count };
      }
    }));

    await visit(`/tests/parent/child/component-route?foo=1`);

    let component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 1);

    await visit(`/tests/parent/child/component-route?foo=2`);

    component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.equal(component.get('route.count'), 1);

    this.owner.application.unregister('route:tests/parent');
    this.owner.application.unregister('route:tests/parent/child/component-route');
  });

  test('#attributes hook is called when parent route is resolved, query params change, and active transition into child route', async function(assert) {
    let count = 0;

    this.owner.application.register('route:tests/parent/child', ComponentRoute.extend({
      queryParams: {
        foo: {}
      },

      attributes() {
        count += 1;

        return {};
      },

      renderComponents() {
        this.renderComponent('child-component');
      }
    }));

    this.owner.application.register(`component:child-component`, Component.extend({
      layoutName: 'tests/parent/child'
    }));

    this.owner.application.register('route:tests/parent/child/component-route', ComponentRoute.extend({
      queryParams: {
        baz: {}
      },

      renderComponents() {
        this.renderComponent('target-component', { into: 'child-component' })
      }
    }));

    await visit(`/tests/parent/child`);

    assert.equal(count, 1);

    await visit(`/tests/parent/child/component-route?foo=1`);

    assert.equal(count, 2);

    this.owner.application.unregister('route:tests/parent/child');
    this.owner.application.unregister('route:tests/parent/child/component-route');
    this.owner.application.unregister('component:child-component');
  });

});
