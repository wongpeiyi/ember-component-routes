import Route from '@ember/routing/route';
import { getOwner } from '@ember/application';
import { assign } from '@ember/polyfills';

let _reopened;

export function initialize() {
  // Guard against multiple reopens during testing
  if (_reopened) return;
  _reopened = true;

  Route.reopen({

    /**
      Override to ensures method returns correct query params after a query
      params-only change (i.e. no actual route transition) as this was only
      updated in the controller in classic Ember.

      @method paramsFor
      @override
    */
    paramsFor(name) {
      const params = this._super(name);

      const route = getOwner(this).lookup(`route:${name}`);

      if (!route || !route._queryParamsDiff) {
        return params;
      }

      return assign(params, route._queryParamsDiff);
    }
  });
}

export default {
  name: 'ember-component-routes',
  initialize
};