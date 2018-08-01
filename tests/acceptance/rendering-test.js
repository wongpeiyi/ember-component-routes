import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Component from '@ember/component';
import { ComponentRoute } from 'ember-component-routes';

module('Acceptance | rendering', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    this.owner.application.register('component:target-component', Component.extend({
      elementId: 'target-component'
    }));
  });

  hooks.afterEach(function() {
    this.owner.application.unregister('component:target-component');
  });

  async function _withComponentsContainingComponentOutlets({ owner }, names, yieldFn) {
    names.forEach((name) => {
      owner.application.register(`component:tests/${name}`, Component.extend({
        classNames: 'component-child',
        layoutName: 'tests/parent/child'
      }));

      owner.application.register(`route:tests/${name}`, ComponentRoute.extend());
    });

    await yieldFn();

    names.forEach((name) => {
      owner.application.unregister(`component:tests/${name}`);
      owner.application.unregister(`route:tests/${name}`);
    });
  }


  // #renderComponents (default)

  test('#renderComponents renders a component with default options', async function(assert) {
    this.owner.application.register('component:tests/parent/component-route', Component.extend({
      elementId: 'default-component'
    }));

    this.owner.application.register('route:tests/parent/component-route', ComponentRoute.extend());

    await visit(`/tests/parent/component-route`);

    const el = this.element.querySelector('.parent__component-outlet #default-component');

    assert.ok(el, 'default component is rendered into component-outlet');

    const component = this.owner.lookup('-view-registry:main')['default-component'];

    assert.ok(component.get('route'), 'component has attributes');

    this.owner.application.unregister('component:tests/parent/component-route');
    this.owner.application.unregister('route:tests/parent/component-route');
  });

  test('#renderComponents renders a component into deeply nested component-routes with default options', async function(assert) {
    this.owner.application.register('route:tests/parent/component-child/component-grand-child/component-route', ComponentRoute.extend({
      renderComponents() {
        this.renderComponent('target-component');
      }
    }));

    await _withComponentsContainingComponentOutlets(this,
      ['parent/component-child', 'parent/component-child/component-grand-child'],
      async () => {
        await visit(`/tests/parent/component-child/component-grand-child/component-route`);

        const el = this.element.querySelector('.parent__component-outlet .component-child .component-child .child__component-outlet #target-component');

        assert.ok(el, 'target component is rendered into nested component-routes');

        const component = this.owner.lookup('-view-registry:main')['target-component'];

        assert.ok(component.get('route'), 'component has attributes');
      }
    );

    this.owner.application.unregister('route:tests/parent/component-child/component-grand-child/component-route');
  });

  test('#renderComponents renders into multiple outlets', async function(assert) {
    this.owner.application.register('component:multiple-component', Component.extend({
      classNames: 'multiple-component'
    }));

    this.owner.application.register('route:tests/multiple/component-route', ComponentRoute.extend({
      renderComponents() {
        this.renderComponent('multiple-component');
      }
    }));

    await visit(`/tests/multiple/component-route`);

    const els = this.element.querySelectorAll('.multiple__component-outlet .multiple-component');

    assert.equal(els.length, 2, 'components are rendered into multiple component-outlet');

    this.owner.application.unregister('component:multiple-component');
    this.owner.application.unregister('route:tests/multiple/component-route');
  });


  // #renderComponents – into (default)

  test('#renderComponents default `into` identifies parent non-component template (child)', async function(assert) {
    this.owner.application.register('route:tests/parent/child/component-route', ComponentRoute.extend({
      renderComponents() {
        this.renderComponent('target-component');
      }
    }));

    await visit(`/tests/parent/child/component-route`);

    const el = this.element.querySelector('.parent__classic-outlet .child__component-outlet #target-component');

    assert.ok(el, 'target component is rendered into nested child component-outlet');

    const component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.ok(component.get('route'), 'component has attributes');

    this.owner.application.unregister('route:tests/parent/child/component-route');
  });

  test('#renderComponents default `into` identifies parent component (component-child)', async function(assert) {
    this.owner.application.register('route:tests/parent/component-child/component-route', ComponentRoute.extend({
      renderComponents() {
        this.renderComponent('target-component');
      }
    }));

    await _withComponentsContainingComponentOutlets(this,
      ['parent/component-child'],
      async () => {
        await visit(`/tests/parent/component-child/component-route`);

        const el = this.element.querySelector('.parent__component-outlet .component-child .child__component-outlet #target-component');

        assert.ok(el, 'target component is rendered into nested child component-outlet');

        const component = this.owner.lookup('-view-registry:main')['target-component'];

        assert.ok(component.get('route'), 'component has attributes');
      }
    );

    this.owner.application.unregister('route:tests/parent/component-child/component-route');
  });


  // #renderComponents – into (custom)

  module('#renderComponents `into` targets a non-component template (parent)', function() {
    async function performTest(assert) {
      await visit(`/tests/parent/child/component-route`);

      const el = this.element.querySelector('.parent__component-outlet > #target-component');

      assert.ok(el, 'target component is rendered into targetted parent component-outlet');

      const component = this.owner.lookup('-view-registry:main')['target-component'];

      assert.ok(component.get('route'), 'component has attributes');

      this.owner.application.unregister('route:tests/parent/child/component-route');
    }

    test('with periods in template name', async function(assert) {
      this.owner.application.register('route:tests/parent/child/component-route', ComponentRoute.extend({
        renderComponents() {
          this.renderComponent('target-component', { into: 'tests.parent' });
        }
      }));

      await performTest.call(this, assert);
    });

    test('with slashes in template name', async function(assert) {
      this.owner.application.register('route:tests/parent/child/component-route', ComponentRoute.extend({
        renderComponents() {
          this.renderComponent('target-component', { into: 'tests/parent' });
        }
      }));

      await performTest.call(this, assert);
    });
  });

  module('#renderComponents `into` targets a component (component-child)', function() {
    async function performTest(assert) {
      await _withComponentsContainingComponentOutlets(this,
        ['parent/component-child', 'parent/component-child/component-grand-child'],
        async () => {
          await visit(`/tests/parent/component-child/component-grand-child/component-route`);

          const el = this.element.querySelector('.parent__component-outlet > .component-child > .child > .child__component-outlet > #target-component');

          assert.ok(el, 'target component is rendered into nested component-routes');

          const component = this.owner.lookup('-view-registry:main')['target-component'];

          assert.ok(component.get('route'), 'component has attributes');
        }
      );

      this.owner.application.unregister('route:tests/parent/component-child/component-grand-child/component-route');
    }

    test('with periods in component name', async function(assert) {
      this.owner.application.register('route:tests/parent/component-child/component-grand-child/component-route', ComponentRoute.extend({
        renderComponents() {
          this.renderComponent('target-component', { into: 'tests.parent.component-child' });
        }
      }));

      await performTest.call(this, assert);
    });

    test('with slashes in component name', async function(assert) {
      this.owner.application.register('route:tests/parent/component-child/component-grand-child/component-route', ComponentRoute.extend({
        renderComponents() {
          this.renderComponent('target-component', { into: 'tests/parent/component-child' });
        }
      }));

      await performTest.call(this, assert);
    });
  });


  // #renderComponents – outlet (custom)

  test('#renderComponents `outlet` targets a component-outlet', async function(assert) {
    this.owner.application.register('route:tests/parent/component-route', ComponentRoute.extend({
      renderComponents() {
        this.renderComponent('target-component', { outlet: 'alt' });
      }
    }));

    await visit(`/tests/parent/component-route`);

    const el = this.element.querySelector('.parent__component-outlet_alt #target-component');

    assert.ok(el, 'target component is rendered into target component-outlet');

    const component = this.owner.lookup('-view-registry:main')['target-component'];

    assert.ok(component.get('route'), 'component has attributes');

    this.owner.application.unregister('route:tests/parent/component-route');

  });

});
