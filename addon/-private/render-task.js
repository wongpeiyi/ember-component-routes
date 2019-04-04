import Ember from 'ember';
import { set } from '@ember/object';
import { bind, run as emberRun } from '@ember/runloop';
import { Promise, resolve } from 'rsvp';
import { versionAbove } from 'ember-component-routes/-private/ember-version';

// Wrap in runloop for < Ember 2.16 and in testing mode
const run = versionAbove('2.16') ?
  (fn) => fn() :
  (fn) => Ember.testing ? emberRun(fn) : fn();

export default class RenderTask {

  /**
    Sets up deferred promises and their respective resolve methods
    for registering and tearing down.

    @method init
    @override
  */
  constructor({ componentName, routeName, attributes }) {
    this.registered = false;
    this.tearingdown = false;

    this.componentName = componentName;
    this.routeName = routeName;

    set(this, 'rendered', false);
    set(this, 'attributes', attributes);

    this.registerPromise = new Promise((res) => this.resolveRegister = res);
    this.teardownPromise = new Promise((res) => this.resolveTeardown = res);
  }

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
      bind(component, 'didRenderComponent') : () => {};

    this.willTeardownComponent = component.willTeardownComponent ?
      bind(component, 'willTeardownComponent') : () => {};

    this.didUpdateRouteAttrs = component.didUpdateRouteAttrs ?
      bind(component, 'didUpdateRouteAttrs') : () => {};

    this.registered = true;

    this.resolveRegister();
  }

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
  perform(tasks) {
    run(() => set(this, 'rendered', true));

    return this.registerPromise
      .then(() => this._awaitDidRenderComponent(tasks))
      .then(() => this._awaitComponentTeardown(tasks))
      .then(() => this._awaitWillTeardownComponent(tasks))
      .then((shouldTeardownNow) => {
        if (shouldTeardownNow !== false) {
          run(() => this._teardown());
        }
      });
  }

  /**
    Sets new attributes on the task and triggers the `didUpdateRouteAttrs`
    hook on the component.

    @method updateAttributes
    @param {Object} attributes
    @public
  */
  updateAttributes(attributes) {
    return this.registerPromise
      .then(() => {
        run(() => set(this, 'attributes', attributes));

        this.didUpdateRouteAttrs();
      });
  }

  /**
    After component is registered, await completion of #didRenderComponent

    @method _awaitDidRenderComponent
    @param {Array} tasks
    @private
  */
  _awaitDidRenderComponent(tasks) {
    const prevTask = tasks[tasks.indexOf(this) - 1];
    const { componentName, routeName } = prevTask || {};

    return resolve(this.didRenderComponent(componentName, routeName));
  }

  /**
    After component is rendered, await teardown

    @method _awaitComponentTeardown
    @param {Array} tasks
    @private
  */
  _awaitComponentTeardown(tasks) {
    this._removePreviousUnrenderedTasks(tasks);

    return this.teardownPromise;
  }

  /**
    After component is slated for teardown, await #willTeardownComponent

    @method _awaitWillTeardownComponent
    @param {Array} tasks
    @private
  */
  _awaitWillTeardownComponent(tasks) {
    run(() => this.tearingdown = true);

    const nextTask = tasks[tasks.indexOf(this) + 1];
    const { componentName, routeName } = nextTask || {};

    return resolve(this.willTeardownComponent(
      componentName, routeName, bind(this, this._teardown)
    ));
  }

  /**
    Removes the task from the component outlet's template, tearing it down.

    @method _teardown
    @private
  */
  _teardown() {
    set(this, 'rendered', false);
  }

  /**
    Removes stale (previous tasks that are no longer rendered) tasks.

    @method _removePreviousUnrenderedTasks
    @param {Array} tasks
    @private
  */
  _removePreviousUnrenderedTasks(tasks) {
    for (let i = tasks.indexOf(this); i--;) {
      const task = tasks[i];

      if (!task.rendered) {
        run(() => tasks.removeObject(task));
      }
    }
  }
}
