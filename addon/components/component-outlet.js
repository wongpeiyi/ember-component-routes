import Component from '@ember/component';
import layout from '../templates/components/component-outlet';
import RenderTask from '../-private/render-task';
import { templateNameFor, targetObjectOf } from '../-private/template-utils';
import { A } from '@ember/array';
import { computed} from '@ember/object';
import { inject } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';
import { resolve } from 'rsvp';

const ComponentOutlet = Component.extend({
  layout,

  outletName: 'main',

  componentRouter: inject(),

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

    this.get('componentRouter').disconnectOutlet(this);
  },

  /**
    Enqueues a `renderTask` and chains it to the end of the `renderPromise`.

    @method renderComponent
    @public
    @param {String} routeName
    @param {String} componentName
    @param {Object} attributes
  */
  renderComponent(componentName, routeName, attributes) {
    const lastTask = this.get('renderTasks.lastObject');

    if (lastTask) {
      const lastRouteName = lastTask.get('routeName');
      const lastComponentName = lastTask.get('componentName');

      // Update attributes if only attributes changed and not already tearing down
      if (
        routeName === lastRouteName &&
        componentName === lastComponentName &&
        !lastTask.get('tearingdown')
      ) {
        lastTask.updateAttributes(attributes);

        return;
      }

      // Teardown component of parent route if transiting to child route since
      // parent route is not deactivated
      if (routeName.match(new RegExp(`^${lastRouteName}\\.`))) {
        this.teardownComponent(lastComponentName, lastRouteName);
      }
    }

    const task = RenderTask.create({
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
    Connects to the `component-router` to find matching route render tasks.

    @method connectToRouter
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
    After components are rendered, calls `registerHooks` on the matching
    `renderTask`.

    @method _registerHooks
    @private
  */
  _registerHooks() {
    for (let component of this.childViews) {
      const task = component.get('_renderTask');

      if (!task.get('registered')) {
        task.registerHooks(component);
      }
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
    this.get('renderTasks').pushObject(task);

    if (task.get('rendered')) {
      return;
    }

    this.set('renderPromise', (async () => {
      await this.get('renderPromise');

      await task.perform(this.get('renderTasks'));
    })());
  }
});

ComponentOutlet.reopenClass({
  positionalParams: ['outletName']
});

export default ComponentOutlet;
