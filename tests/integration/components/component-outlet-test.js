import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Component from '@ember/component';
import { next } from '@ember/runloop';

module('Integration | Component | component-outlet', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.subject = () => {
      const viewRegistry = this.owner.lookup('-view-registry:main');

      return viewRegistry[Object.keys(viewRegistry)[0]];
    };
  });

  // _connectToRouter

  test('connects to router on insert with self, parent template name and outlet name', async function(assert) {
    assert.expect(3);

    const context = this;
    const componentRouter = this.owner.lookup('service:component-router');

    componentRouter.connectOutlet = (componentOutlet, into, outletName) => {
      assert.equal(componentOutlet, context.subject());
      assert.equal(into, 'application');
      assert.equal(outletName, 'main');
    };

    await render(hbs`
      {{component-outlet _parentTemplateName='application'}}
    `);
  });

  // _disconnectFromRouter

  test('disconnects from router on destroy', async function(assert) {
    assert.expect(1);

    const componentRouter = this.owner.lookup('service:component-router');

    componentRouter.disconnectOutlet = () => {
      assert.ok(true, 'disconnected');
    }

    await render(hbs`
      {{#if destroy}}
        {{component-outlet _parentTemplateName='application'}}
      {{/if}}
    `);

    this.set('destroy', true);
  });

  module('rendering', function(hooks) {
    hooks.beforeEach(async function() {
      this.owner.application.register('component:x-foo', Component.extend({
        elementId: 'foo'
      }));

      await render(hbs`
        {{component-outlet _parentTemplateName='application'}}
      `);
    });

    hooks.afterEach(function() {
      this.owner.application.unregister('component:x-foo');
    });

    // renderComponent

    test('enqueues a task and renders a component', async function(assert) {
      assert.expect(4);

      const subject = this.subject();

      subject.renderComponent('x-foo', 'index', {});

      assert.equal(subject.get('renderTasks.length'), 1);

      const [task] = subject.get('renderTasks');

      await task.registerPromise;

      assert.ok(task.get('rendered'), 'task is performed');
      assert.ok(task.get('registered'), 'task is registered');
      assert.ok(this.element.querySelector('#foo'), 'component is rendered');
    });

    test('renders components in order of queued tasks', async function(assert) {
      assert.expect(11);

      this.owner.application.register('component:x-bar', Component.extend({
        elementId: 'bar'
      }));

      const subject = this.subject();

      subject.renderComponent('x-foo', 'index', {});
      subject.renderComponent('x-bar', 'index', {});

      assert.equal(subject.get('renderTasks.length'), 2);

      const [task1, task2] = subject.get('renderTasks');

      await task1.registerPromise;

      assert.ok(task1.get('rendered'), 'task1 is performed');
      assert.ok(task1.get('registered'), 'task1 is registered');
      assert.ok(this.element.querySelector('#foo'), 'component x-foo is rendered');

      assert.notOk(task2.get('rendered'), 'task2 is not yet performed');
      assert.notOk(task2.get('registered'), 'task2 is not yet registered');
      assert.notOk(this.element.querySelector('#bar'), 'component x-bar is not rendered');

      task1.resolveTeardown();

      await task2.registerPromise;

      assert.notOk(this.element.querySelector('#foo'), 'component x-foo is unrendered');

      assert.ok(task2.get('rendered'), 'task2 is performed');
      assert.ok(task2.get('registered'), 'task2 is registered');
      assert.ok(this.element.querySelector('#bar'), 'component x-bar is rendered');

      this.owner.application.unregister('component:x-bar');
    });

    // _updateLastTask

    test(`updates last task's attributes only if tasks properties are same`, async function(assert) {
      assert.expect(4);

      const subject = this.subject();

      subject.renderComponent('x-foo', 'index', { count: 1 });

      assert.equal(subject.get('renderTasks.length'), 1);

      const [task] = subject.get('renderTasks');

      assert.equal(task.get('attributes.count'), 1);

      await task.registerPromise;

      task.didUpdateRouteAttrs = () => {
        assert.equal(task.get('attributes.count'), 2);
      };

      subject.renderComponent('x-foo', 'index', { count: 2 });

      assert.equal(subject.get('renderTasks.length'), 1);
    });

    test(`does not update last task's attributes if called by different routes`, async function(assert) {
      assert.expect(1);

      const subject = this.subject();

      subject.renderComponent('x-foo', 'index', { count: 1 });

      const [task] = subject.get('renderTasks');

      await task.registerPromise;

      subject.renderComponent('x-foo', 'another-route', { count: 2 });

      assert.equal(subject.get('renderTasks.length'), 2);

      this.owner.application.unregister('component:x-foo');
    });

    test(`does not update last task's attributes if begun tearing down`, async function(assert) {
      assert.expect(1);

      this.owner.application.register('component:x-foo', Component.extend({
        elementId: 'foo'
      }));

      const subject = this.subject();

      subject.renderComponent('x-foo', 'index', { count: 1 });

      const [task] = subject.get('renderTasks');

      await task.registerPromise;

      task.resolveTeardown();

      subject.renderComponent('x-foo', 'another-route', { count: 2 });

      assert.equal(subject.get('renderTasks.length'), 2);
    });

    // _teardownLastTaskIfParentRoute

    test(`tears down last task if last task is called by a parent route of current task's calling route`, async function(assert) {
      assert.expect(4);

      this.owner.application.register('component:x-bar', Component.extend({
        elementId: 'bar'
      }));

      const subject = this.subject();

      subject.renderComponent('x-foo', 'foo', {});

      const [task1] = subject.get('renderTasks');

      await task1.registerPromise;

      subject.renderComponent('x-bar', 'foo.index', {});

      assert.equal(subject.get('renderTasks.length'), 2);

      const task2 = subject.get('renderTasks.lastObject');

      await task2.registerPromise;

      assert.ok(task1.get('tearingdown'), 'task1 is tearing down');
      assert.notOk(this.element.querySelector('#foo'), 'foo is unrendered');
      assert.ok(this.element.querySelector('#bar'), 'bar is rendered');

      this.owner.application.unregister('component:x-bar');
    });

    // teardownComponent

    test('tears down a rendered component', async function(assert) {
      assert.expect(3);

      const subject = this.subject();

      subject.renderComponent('x-foo', 'index', {});

      const [task] = subject.get('renderTasks');

      await task.registerPromise;

      assert.ok(this.element.querySelector('#foo'), 'component is rendered');

      subject.teardownComponent('x-foo', 'index');

      await subject.get('renderPromise');

      assert.ok(task.get('tearingdown'), 'task is tearing down');

      next(() => {
        assert.notOk(this.element.querySelector('#foo'), 'component is unrendered');
      });
    });
  });

});