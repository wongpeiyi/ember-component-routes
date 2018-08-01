import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { ComponentRoute } from 'ember-component-routes';

module('Unit | Route | component-route', function(hooks) {
  setupTest(hooks);

  hooks.afterEach(function() {
    this.owner.application.unregister('route:foo');
  });

  const Route = ComponentRoute.extend({
    renderComponents() {}
  });

  // #setup

  test('#setup sets `currentAttributes` as result of attributes hook', function(assert) {
    this.owner.application.register('route:foo', Route.extend({
      attributes() {
        return { foo: 'bar' };
      }
    }));

    const route = this.owner.lookup('route:foo');

    route.setup();

    assert.equal(route.currentAttributes.foo, 'bar');
  });

  test('#setup calls #renderComponents', function(assert) {
    assert.expect(1);

    this.owner.application.register('route:foo', Route.extend({
      renderComponents() {
        assert.ok(true, 'renderComponents called');
      }
    }));

    const route = this.owner.lookup('route:foo');

    route.setup();
  });

  // #attributes

  test('attributes hook receives handler context as first argument', function(assert) {
    assert.expect(1);

    this.owner.application.register('route:foo', Route.extend({
      attributes(model) {
        assert.equal(model.foo, 'bar');
      }
    }));

    const route = this.owner.lookup('route:foo');

    route.context = { foo: 'bar' };

    route.setup();
  });

  test('attributes hook receives result of #paramsFor as second argument', function(assert) {
    assert.expect(1);

    this.owner.application.register('route:foo', Route.extend({
      attributes(model, params) {
        assert.equal(params.foo, 'bar');
      }
    }));

    const route = this.owner.lookup('route:foo');

    route.paramsFor = () => ({ foo: 'bar' });

    route.setup();
  });

  test('attributes hook receives bound custom actions as third argument', function(assert) {
    assert.expect(3);

    this.owner.application.register('route:foo', Route.extend({
      attributes(model, params, actions) {
        assert.equal(Object.keys(actions).length, 2);
        assert.equal(actions.foo(), 'bar');
        assert.equal(actions.baz(), this, 'context is bound');
      },

      actions: {
        foo() {
          return 'bar';
        },

        baz() {
          return this;
        }
      }
    }));

    const route = this.owner.lookup('route:foo');

    route.setup();
  });

  // queryParams

  module('queryParams', function() {
    const RouteWithQp = Route.extend({
      queryParams: {
        page: {
          defaultValue: 1
        }
      }
    });

    test('queryParams have defaultValue option', function(assert) {
      this.owner.application.register('route:foo', RouteWithQp);

      const route = this.owner.lookup('route:foo');

      const { qps } = route.get('_qp');

      assert.equal(qps[0].prop, 'page');
      assert.equal(qps[0].defaultValue, 1);
      assert.equal(qps[0].serializedDefaultValue, '1');
      assert.equal(qps[0].undecoratedDefaultValue, 1);
    });

    test('#_cacheQueryParamsDiff caches changed queryParams', function(assert) {
      this.owner.application.register('route:foo', RouteWithQp);

      const route = this.owner.lookup('route:foo');

      route._cacheQueryParamsDiff({ page: 2 }, {});

      assert.deepEqual(route._queryParamsDiff, { page: 2 });

      route._cacheQueryParamsDiff({ page: 3 }, {});

      assert.deepEqual(route._queryParamsDiff, { page: 3 });
    });

    test('#_cacheQueryParamsDiff caches removed queryParams', function(assert) {
      this.owner.application.register('route:foo', RouteWithQp);

      const route = this.owner.lookup('route:foo');

      route._cacheQueryParamsDiff({ page: 2 }, {});

      assert.deepEqual(route._queryParamsDiff, { page: 2 });

      route._cacheQueryParamsDiff({ }, { page: undefined});

      assert.deepEqual(route._queryParamsDiff, { page: 1 });
    });
  });

});
