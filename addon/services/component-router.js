import Service from '@ember/service';
import { A } from "@ember/array"
import { typeOf } from '@ember/utils';
import { assign } from '@ember/polyfills';

export default Service.extend({

  init() {
    this._super(...arguments);

    this.setProperties({
      /**
        `renderQueue` is a set of unique render tasks, which will render a
        component in a component-outlet when there is a matching `connection`.

        @typedef {Object} Render
        @property {String} routeName Route that called the render
        @property {String} componentName Name of component to render
        @property {Object} attributes POJO to pass to component
        @property {String} into Name of parent template or component containing
          the component-outlet to render into
        @property {String} outlet Name of the component-outlet to render into
      */
      renderQueue: A(),

      /**
        `connections` is a set of unique connections from component-outlets.

        @typedef {Object} Connection
        @property {Ember.Component} componentOutlet component-outlet reference
        @property {String} into Name of parent template or component containing
          the component-outlet
        @property {String} outlet name of component-outlet
      */
      connections: A(),

      /**
        `appAttributes` is the attributes hash from the application route if it
        is a ComponentRoute. It is merged into the attributes hash passed to all
        rendered components.
      */
      appAttributes: {}
    });
  },

  /**
    Queues a render task in the `renderQueue` array, then finds any matching
    connections and triggers a render in each component-outlet.

    Render tasks are unique for each [routeName, into, outlet]

    Called via a component-route's #renderComponent method.

    @method queueRender
    @public
    @param {String} routeName Route that called the render
    @param {String} componentName Name of component to render
    @param {Object} attributes POJO to pass to component
    @param {String} into Name of template or component containing the
      component-outlet to render into
    @param {String} outlet Name of the component-outlet to render into
  */
  queueRender(routeName, componentName, attributes, into, outlet) {
    into = into.replace(/\./g, '/');

    const existing = this.get('renderQueue').find((task) => (
      task.routeName === routeName &&
      task.into === into &&
      task.outlet === outlet
    ));

    if (existing) {
      this.get('renderQueue').removeObject(existing);
    }

    const render = { routeName, componentName, attributes, into, outlet };

    this.get('renderQueue').pushObject(render);

    this._renderIntoAllConnections(render);
  },

  /**
    Connects a component-outlet, then finds the last matching render task and
    triggers a render into the connected component-outlet.

    Connections are unique for each component-outlet instance.

    Called when a component-outlet is inserted into the DOM.

    @method connectOutlet
    @public
    @param {Ember.Component} componentOutlet reference
    @param {String} into Name of template or component containing the
      component-outlet
    @param {String} outlet Name of component-outlet
  */
  connectOutlet(componentOutlet, into, outlet) {
    into = into.replace(/\./g, '/');

    const existing = this.get('connections').findBy('componentOutlet', componentOutlet);

    if (existing) {
      this.get('connections').removeObject(existing);
    }

    const connection = { componentOutlet, into, outlet };

    this.get('connections').pushObject(connection);

    this._renderLastIntoConnection(connection);
  },

  /**
    Disconnects a component-outlet.

    Called when component-outlet is destroyed.

    @method disconnectOutlet
    @public
    @param {Ember.Component} componentOutlet reference
  */
  disconnectOutlet(componentOutlet) {
    const connection = this.get('connections').findBy('componentOutlet', componentOutlet);

    this.get('connections').removeObject(connection);
  },

  /**
    Tears down components rendered by the specified route, and removes all
    render tasks by that route from the `renderQueue`. The next existing
    render task (if any) is found and rendered for all component-outlets
    whose connections are torn down in this way.

    Called when a component-route is deactivated.

    @method removeRendersBy
    @public
    @param {String} routeName
  */
  removeRendersBy(routeName) {
    const renders = this.get('renderQueue').filterBy('routeName', routeName);

    const torndownConnections = A();

    renders.forEach((render) => {
      this._connectionsForRender(render).forEach((connection) => {
        if (connection.componentOutlet) {
          connection.componentOutlet.teardownComponent(render.componentName, routeName);

          torndownConnections.addObject(connection);
        }
      });
    });

    this.get('renderQueue').removeObjects(renders);

    torndownConnections.forEach((connection) => {
      this._renderLastIntoConnection(connection);
    });
  },

  /**
    Updates `appAttributes` and re-renders all rendered connections to update
    their attributes.

    @method updateAppAttributes
    @public
    @param {Object} attributes
  */
  updateAppAttributes(attributes) {
    this.set('appAttributes', attributes);

    this.get('connections').forEach((connection) => {
      this._renderLastIntoConnection(connection);
    });
  },

  /**
    Performs a render task on all matching connections.

    @method _renderIntoAllConnections
    @private
    @param {Render} render
  */
  _renderIntoAllConnections(render) {
    this._connectionsForRender(render).forEach((connection) => {
      this._renderInto(connection, render);
    });
  },

  /**
    Performs the last render task in the `renderQueue` on a connection.

    @method _renderLastIntoConnection
    @private
    @param {Connection} connection
  */
  _renderLastIntoConnection(connection) {
    const render = this._lastRenderForConnection(connection);

    if (render) {
      this._renderInto(connection, render);
    }
  },

  /**
    Finds matching connections for a render task in the `renderQueue`.

    @method _connectionsForRender
    @private
    @param {Render} render
    @returns {Array} Array of matching connection objects
  */
  _connectionsForRender(render) {
    return this.get('connections').filter((connection) => (
      connection.into === render.into && connection.outlet === render.outlet
    ));
  },

  /**
    Finds the last matching render task for a connection.

    @method _lastRenderForConnection
    @private
    @param {Connection} connection
    @returns {Render} Last matching render task
  */
  _lastRenderForConnection(connection) {
    for (let i = this.get('renderQueue.length'); i--;) {
      const render = this.get('renderQueue')[i];

      if (connection.into === render.into && connection.outlet === render.outlet) {
        return render;
      }
    }
  },

  /**
    Performs a render into a connection.

    Merges `appAttributes` if `attributes` is a POJO.

    @method _renderInto
    @private
    @param {Connection} connection
    @param {Render} render
  */
  _renderInto(connection, render) {
    const { componentName, routeName, attributes } = render;

    if (typeOf(attributes) === 'object') {
      assign(attributes, this.get('appAttributes'));
    }

    connection.componentOutlet.renderComponent(componentName, routeName, attributes);
  },

});
