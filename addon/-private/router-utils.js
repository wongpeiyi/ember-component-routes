import { bind } from '@ember/runloop';

/**
  Returns the immediate parent route for a route.

  @function parentRoute
  @param {Ember.Route} route
  @returns {Ember.Route} Parent route
*/
export function parentRoute(route) {
  const { handlerInfos } = routerMicrolib(route).state;

  for (let [index, handlerInfo] of handlerInfos.entries()) {
    if (route === handlerInfo.handler) {
      return handlerInfos[Math.max(0, index - 1)];
    }
  }
}

const DEFAULT_ROUTE_ACTIONS = [
  '_super',
  'queryParamsDidChange',
  'finalizeQueryParamChange',
  'didTransition',
  'willTransition',
  'loading',
  'error'
];

/**
  Returns the route's `actions` hash (without the route's default actions)
  that are intended to be called by rendered components.

  @function attributableActions
  @param {Ember.Route} route
  @returns {Object} Actions hash
*/
export function attributableActions(route) {
  let actions = {};

  for (let key in route.actions) {
    if (!DEFAULT_ROUTE_ACTIONS.includes(key)) {
      actions[key] = bind(route, route.actions[key]);
    }
  }

  return actions;
}

export function routerMicrolib(route) {
  const router = route._router ||
    route.router;  // < Ember 3.0

  return router._routerMicrolib ||
    router.router; // < Ember 2.13
}