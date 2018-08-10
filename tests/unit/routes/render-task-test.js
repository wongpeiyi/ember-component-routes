import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { A } from '@ember/array';
import RenderTask from 'ember-component-routes/-private/render-task';

module('Unit | render-task', function(hooks) {
  setupTest(hooks);

  // #registerHooks

  test('#registerHooks binds hooks', function(assert) {
    assert.expect(6);

    const task = RenderTask.create();

    const component = {
      didRenderComponent() {
        assert.ok(true, 'didRenderComponent bound');
        assert.equal(this, component);
      },

      willTeardownComponent() {
        assert.ok(true, 'willTeardownComponent bound');
        assert.equal(this, component);
      },

      didUpdateRouteAttrs() {
        assert.ok(true, 'didUpdateRouteAttrs bound');
        assert.equal(this, component);
      }
    };

    task.registerHooks(component);

    task.didRenderComponent();
    task.willTeardownComponent();
    task.didUpdateRouteAttrs();
  });

  test('#registerHooks sets `registered` flag', function(assert) {
    const task = RenderTask.create();

    task.registerHooks({});

    assert.ok(task.get('registered'));
  });

  test('#registerHooks resolves `registerPromise`', async function(assert) {
    assert.expect(1);

    const task = RenderTask.create();

    task.registerHooks({});

    await task.registerPromise;

    assert.ok(true, 'registerPromise resolved');

  });

  // #perform

  test('#perform calls hooks in order', function(assert) {
    assert.expect(9);

    const task = RenderTask.create();
    let step = 0;

    task.registerPromise.then(() => {
      step += 1;
      assert.equal(step, 1, `Resolve step 1`);
      assert.ok(true, 'registerPromise resolved');
    });

    task.didRenderComponent = () => {
      step += 1;
      assert.equal(step, 2, `Resolve step 2`);
      assert.ok(true, 'didRenderComponent resolved');
    };

    task.willTeardownComponent = () => {
      step += 1;
      assert.equal(step, 3, `Resolve step 3`);
      assert.ok(true, 'willTeardownComponent resolved');
      assert.ok(task.get('tearingdown'));
    };

    task.perform([task]).then(() => {
      assert.notOk(task.get('rendered'));
    });

    assert.ok(task.get('rendered'));

    task.resolveRegister();
    task.resolveTeardown();
  });

  test('#perform doesnt teardown until manually called if `willTeardownComponent` returns false', async function(assert) {
    assert.expect(2);

    const task = RenderTask.create();

    let teardownFn;

    task.didRenderComponent = () => {}
    task.willTeardownComponent = (componentName, routeName, teardown) => {
      teardownFn = teardown;

      return false;
    };

    task.resolveRegister();
    task.resolveTeardown();

    await task.perform([task]);

    assert.ok(task.get('rendered'));

    teardownFn();

    assert.notOk(task.get('rendered'));
  });

  test('#perform passes previous / next task properties in hooks', async function(assert) {
    assert.expect(4);

    const tasks = A([1, 2, 3].map((i) => {
      const task = RenderTask.create({
        componentName: `component${i}`,
        routeName: `route${i}`
      });

      task.didRenderComponent = () => {};
      task.willTeardownComponent = () => {};

      return task;
    }));

    tasks[1].didRenderComponent = (componentName, routeName) => {
      assert.equal(componentName, 'component1');
      assert.equal(routeName, 'route1');
    }

    tasks[1].willTeardownComponent = (componentName, routeName) => {
      assert.equal(componentName, 'component3');
      assert.equal(routeName, 'route3');
    };

    tasks[0].resolveRegister();
    tasks[0].resolveTeardown();

    await tasks[0].perform(tasks);

    tasks[1].resolveRegister();
    tasks[1].resolveTeardown();

    await tasks[1].perform(tasks);
  });


  // #updateAttributes

  test('#updateAttributes sets `attributes` and calls hook after registerPromise is resolved', function(assert) {
    assert.expect(2);

    const task = RenderTask.create();

    task.didUpdateRouteAttrs = () => {
      assert.ok(true, 'didUpdateRouteAttrs called');
    }

    task.updateAttributes({ foo: 'bar' }).then(() => {
      assert.equal(task.get('attributes.foo'), 'bar');
    });

    task.resolveRegister();
  });

});
