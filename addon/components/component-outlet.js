import Component from '@ember/component';
import layout from '../templates/components/component-outlet';
import RenderTask from '../-private/render-task';
import { templateNameFor, targetObjectOf } from '../-private/template-utils';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';
import { resolve } from 'rsvp';

const ComponentOutlet = Component.extend({
  layout,

  outletName: 'main',

  componentRouter: service(),

  /**
    Template name for the component or template containing this
    component-outlet. Used to determine which component-outlet to render into.

    @property {Ember.ComputedProperty} _parentTemplateName
    @private
  */
  _parentTemplateName: computed(function() {
    return templateNameFor(targetObjectOf(this));
  }),

  init() {
    this._super(...arguments);

    this.setProperties({
      /**
        `renderTasks` is a series of tasks by the component-router to render
        components in this component-outlet.

        Multiple `renderTasks` can be in a `rendered` state at once, e.g. if
        the previous task has a non-blocking animation out and the current
        task is animating in.

        @typedef {Ember.Object} RenderTask
        @property {String} componentName Name of component to render
        @property {Object} attributes POJO to pass to component
        @property {String} into Name of parent template or component containing
          the component-outlet to render into
        @property {String} outlet Name of the component-outlet to render into
      */
      renderTasks: A(),

      /**
        The above `renderTasks` are chained into a  single promise, such that
        a `renderTask` must resolve its teardown before the next can render.

        @typedef {Promise}
      */
      renderPromise: resolve()
    });
  },

  didInsertElement() {
    this._super(...arguments);

    scheduleOnce('afterRender', this, '_connectToRouter'); // Ember < 2.10
  },

  didRender() {
    this._super(...arguments);

    this._registerHooks();
  },

  willDestroyElement() {
    this._super(...arguments);

    this._disconnectFromRouter();
  },

  /**
    Called by the component-router when there is a matching render.

    @method renderComponent
    @public
    @param {String} routeName
    @param {String} componentName
    @param {Object} attributes
  */
  renderComponent(componentName, routeName, attributes) {
    if (this._updateLastTask(componentName, routeName, attributes)) {
      return;
    }

    this._teardownLastTaskIfParentRoute(routeName);

    const task = new RenderTask({
      componentName,
      routeName,
      attributes
    });

    this._enqueueTask(task);
  },

  /**
    Resolves the teardown promise on any matching `renderTasks`. This allows
    the next `renderTask` to render subsequently.

    @method teardownComponent
    @public
    @param {String} componentName
    @param {String} routeName
  */
  teardownComponent(componentName, routeName) {
    this.get('renderTasks')
      .filter((task) => (
        task.componentName === componentName && task.routeName === routeName
      ))
      .forEach((task) => task.resolveTeardown());
  },

  /**
    Connects to the component-router to find matching route render tasks.

    @method _connectToRouter
    @private
  */
  _connectToRouter() {
    this.get('componentRouter').connectOutlet(
      this,
      this.get('_parentTemplateName'),
      this.get('outletName')
    );
  },

  /**
    Disconnects from the component-router.

    @method _disconnectFromRouter
    @private
  */
  _disconnectFromRouter() {
    this.get('componentRouter').disconnectOutlet(this);
  },

  /**
    After components are rendered, calls #registerHooks on the matching
    `renderTask`.

    @method _registerHooks
    @private
  */
  _registerHooks() {
    for (let component of this.childViews) {
      const task = component.get('_renderTask');

      if (!task.registered) {
        task.registerHooks(component);
      }
    }
  },

  /**
    Updates the last `renderTask` in queue instead of enqueuing a new one if
    it has the same properties and is not already tearing down.

    @method _updateLastTask
    @private
    @param {String} componentName
    @param {String} routeName
    @param {Object} attributes
  */
  _updateLastTask(componentName, routeName, attributes) {
    const lastTask = this.get('renderTasks.lastObject');

    if (
      lastTask &&
      !lastTask.tearingdown &&
      routeName === lastTask.routeName &&
      componentName === lastTask.componentName
    ) {
      lastTask.updateAttributes(attributes);

      return true;
    }
  },

  /**
    Teardown last `renderTask` if is from a parent route of the new task, since
    the route is not deactivated.

    @method _teardownLastTaskIfParentRoute
    @private
    @param {String} parentRouteName
  */
  _teardownLastTaskIfParentRoute(parentRouteName) {
    const lastTask = this.get('renderTasks.lastObject');

    if (!lastTask) {
      return;
    }

    if (parentRouteName.match(new RegExp(`^${lastTask.routeName}\\.`))) {
      this.teardownComponent(lastTask.componentName, lastTask.routeName);
    }
  },

  /**
    Enqueues a `renderTask` by chaining its #perform method to the end of
    the `renderPromise`. After the task renders and is torn down, it is
    removed from `renderTasks`.

    @method _enqueueTask
    @private
    @param {String} componentName
    @param {String} routeName
  */
  _enqueueTask(task) {
    if (task.rendered) {
      return;
    }

    this.get('renderTasks').pushObject(task);

    const promise = new Promise((res) => (
      this.get('renderPromise')
        .then(() => task.perform(this.get('renderTasks')))
        .then(() => res())
    ));

    this.set('renderPromise', promise);
  }
});

ComponentOutlet.reopenClass({
  positionalParams: ['outletName']
});

export default ComponentOutlet;
