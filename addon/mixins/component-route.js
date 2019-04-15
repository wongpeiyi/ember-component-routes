import Mixin from '@ember/object/mixin';
import { A as emberA } from '@ember/array';
import { computed } from '@ember/object';
import { assign } from '@ember/polyfills';
import { inject as service } from '@ember/service';
import { once } from '@ember/runloop';
import { typeOf } from '@ember/utils';
import {
  routeName,
  attributableActions,
  parentRouteName,
  routeIsResolved
} from '../-private/router-utils';

export default Mixin.create({
  componentRouter: service(),

  /*
    #renderTemplate is now a no-op by default except on the application route.
    However, it can still be defined to explicitly render a template.

    @method renderTemplate
    @override
  */
  renderTemplate() {
    if (routeName(this) === 'application') {
      return this._super();
    }
  },

  /**
    Calls #refreshAttributes to compute `currentAttributes` and render the
    specified component when the route is entered.

    @method setup
    @override
  */
  setup() {
    this._super(...arguments);

    this.refreshAttributes();
  },

  /**
    When deactivating, clears any stray render tasks that are still
    queued in the component-router.

    @method deactivate
    @override
  */
  deactivate() {
    this.get('componentRouter').removeRendersBy(routeName(this));

    return this._super(...arguments);
  },

  /**
    Re-computes `currentAttributes` using the attributes hook, then begins
    the render process.

    If this is the application route, nothing is rendered, but `appAttributes`
    is updated on the component-router.

    @method refreshAttributes
    @public
  */
  refreshAttributes() {
    this.currentAttributes = this.attributes(
      this.context,
      this.paramsFor(routeName(this)),
      attributableActions(this)
    );

    if (routeName(this) === 'application') {
      this.get('componentRouter').updateAppAttributes(this.currentAttributes);
    } else {
      this.renderComponents();
    }
  },

  /**
    A hook to be implemented to determine the attributes that will be set
    on the component. Analogous to Ember.Route#setupController

    Defaults to including the route's model and its non-default actions.

    @method attributes
    @public
    @param {Object} model Result of the route's model hook
    @param {Object} params Route's positional params and query params
    @param {Object} actions POJO of the route's non-default actions as closures
    @returns {Object} Attributes hash that will be set on the component
 */
  attributes(model, params, actions) {
    return { model, params, actions };
  },

  /**
    A hook that can be overridden to specify which components to render.
    Analogous to Ember.Route#renderTemplate

    @method renderComponents
    @public
  */
  renderComponents() {
    this.renderComponent(routeName(this));
  },

  /**
    Queues a render task in the component-router, which will run with the
    route's `currentAttributes` when the targetted component-outlet connects.

    Analogous to Ember.Route#render. `into` and `outlet` options behave the
    same way as in Ember.Route#render

    @method renderComponent
    @public
    @param {String} componentName Name of component to render
    @param {Object} [opts={}] Options
    @param {String} [opts.into] Name of template or component containing the
      component-outlet to render into. Defaults to this route's parent
      template
    @param {String} [opts.outlet] Name of the component-outlet to render into.
      Defaults to 'main'
  */
  renderComponent(componentName, opts = {}) {
    const into = opts.into || parentRouteName(this);
    const outlet = opts.outlet || 'main';

    this.get('componentRouter').queueRender(
      routeName(this), componentName, this.currentAttributes, into, outlet
    );
  },

  /**
    A hook triggered when only query params change after the route has been
    entered. This does not fire on actual route transitions, or when
    positional params change.

    By default this recomputes the `currentAttributes`.

    @method queryParamsDidOnlyChange
    @public
  */
  queryParamsDidOnlyChange() {
    this.refreshAttributes();
  },

  /**
    Query params cache.

    Overrides Ember.Route#_qp to sets up query params' default values using
    the route definition instead of the controller.

    @property {Ember.ComputedProperty} _qp
    @private
  */
  _qp: computed(function() {
    const qpMeta = this._super(...arguments);

    qpMeta.qps = qpMeta.qps.map((qp) => {
      let { prop, urlKey, type } = qp;

      const defaultValue = copyDefaultValue(
        this.get('queryParams')[prop].defaultValue
      );

      if (type === "undefined") {
        type = typeOf(defaultValue);
      }

      const serializedDefaultValue = this.serializeQueryParam(
        defaultValue, urlKey, type
      );

      return assign({}, qp, {
        type,
        defaultValue,
        serializedDefaultValue,
        undecoratedDefaultValue: defaultValue,
      });
    });

    return qpMeta;
  }),

  /**
    Deserializes and caches `_queryParamsDiff` when query params change.

    This is used to ensure #paramsFor returns the correct query params after
    a query params-only change.

    @method _cacheQueryParamsDiff
    @private
    @param {Object} changed
    @param {Object} removed
  */
  _cacheQueryParamsDiff(changed, removed) {
    const diff = this.get('_qp').qps.reduce((hash, qp) => {
      const { prop, urlKey, type, defaultValue } = qp;

      if (changed.hasOwnProperty(urlKey)) {
        hash[prop] = this.deserializeQueryParam(changed[urlKey], urlKey, type);
      }

      if (removed.hasOwnProperty(urlKey)) {
        hash[prop] = defaultValue;
      }

      return hash;
    }, {});

    this._queryParamsDiff = assign({}, this._queryParamsDiff, diff);
  },

  actions: {
    /**
      Triggers the #queryParamsDidOnlyChange hook if query params defined on
      this route were changed. The route must also be already resolved in
      the current active transition (i.e. setup hook will not be called).

      @method queryParamsDidChange
      @override
    */
    queryParamsDidChange(changed, totalPresent, removed) {
      this._cacheQueryParamsDiff(changed, removed);

      // Some query param defined on this route was changed
      const routeQpsChanged = this.get('_qp').qps.find(({ urlKey }) => (
        changed.hasOwnProperty(urlKey) || removed.hasOwnProperty(urlKey)
      ));

      if (routeQpsChanged && routeIsResolved(this)) {
        once(this, 'queryParamsDidOnlyChange');
      }

      return this._super(...arguments);
    }
  }
});

function copyDefaultValue(value) {
  return Array.isArray(value) ? emberA(value.slice()) : value;
}
