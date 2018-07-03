import Ember from 'ember';
import EmberObject from '@ember/object';
import { VERSION } from '@ember/version';
import { bind, run as emberRun } from '@ember/runloop';
import { Promise, resolve } from 'rsvp';

const version = +VERSION.replace(/\.\d+$/, '');

// Wrap in runloop for < Ember 2.16 and in testing mode
const run = version >= 2.16 ?
  (fn) => fn() :
  (fn) => Ember.testing ? emberRun(fn) : fn();

export default EmberObject.extend({

  /**
    Sets up deferred promises and their respective resolve methods
    for registering and tearing down.

    @method init
    @override
  */
  init() {
    this._super(...arguments);

    this.registerPromise = new Promise((res) => this.resolveRegister = res);
    this.teardownPromise = new Promise((res) => this.resolveTeardown = res);
  },

  /**
    Called when the component-outlet #didRender, to connect two new
    component hooks: #didRenderComponent and #willTeardownComponent.

    #didRenderComponent is called when the component is rendered, and must
    resolve before the component can be torn down.

    #willTeardownComponent must resolve before the component is destroyed,
    and before the next component can be rendered into the component-outlet.

    @method registerHooks
    @param {Ember.Component} component
    @public
  */
  registerHooks(component) {
    this.didRenderComponent = component.didRenderComponent ?
      bind(component, 'didRenderComponent') : resolve;

    this.willTeardownComponent = component.willTeardownComponent ?
      bind(component, 'willTeardownComponent') : resolve;

    this.didUpdateRouteAttrs = component.didUpdateRouteAttrs ?
      bind(component, 'didUpdateRouteAttrs') : () => {};

    this.set('registered', true);

    this.resolveRegister();
  },

  /**
    When the component-outlet's `renderPromise` resolves to this task, the
    component is rendered into the DOM.

    The task waits for the component hooks to be registered, and then
    resolves #didRenderComponent.

    The task then awaits a teardown command by the component-outlet, then
    resolves #willTeardownComponent, before removing it from the DOM.

    @method perform
    @param {Array} tasks
    @public
  */
  async perform(tasks) {
    let componentName;
    let routeName;

    run(() => this.set('rendered', true));

    await this.registerPromise;

    const prevTask = tasks[tasks.indexOf(this) - 1];
    ({ componentName, routeName } = prevTask || {});

    await this.didRenderComponent(componentName, routeName);

    this._removePreviousUnrenderedTasks(tasks);

    await this.teardownPromise;

    run(() => this.set('tearingdown', true));

    const nextTask = tasks[tasks.indexOf(this) + 1];
    ({ componentName, routeName } = nextTask || {});

    const shouldTeardownNow = await this.willTeardownComponent(
      componentName, routeName, bind(this, this._teardown)
    );

    if (shouldTeardownNow !== false) {
      run(() => this._teardown());
    }
  },

  /**
    Sets new attributes on the task and triggers the `didUpdateRouteAttrs`
    hook on the component.

    @method updateAttributes
    @param {Object} attributes
    @public
  */
  async updateAttributes(attributes) {
    await this.registerPromise;

    this.set('attributes', attributes);

    this.didUpdateRouteAttrs();
  },

  /**
    Removes the task from the component outlet's template, tearing it down.

    @method _teardown
    @private
  */
  _teardown() {
    this.set('rendered', false);
  },

  /**
    Removes stale (previous tasks that are no longer rendered) tasks.

    @method _removePreviousUnrenderedTasks
    @param {Array} tasks
    @private
  */
  _removePreviousUnrenderedTasks(tasks) {
    for (let i = tasks.indexOf(this); i--;) {
      const task = tasks[i];

      if (!task.get('rendered')) {
        run(() => tasks.removeObject(task));
      }
    }
  }
});
