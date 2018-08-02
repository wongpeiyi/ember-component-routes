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

/**
  Returns true if the route is resolved, i.e. has already been transitioned
  into, and not currently being transitioned into.

  Returns true if there is no currently active transition.

  @function routeIsResolved
  @param {Ember.Route} route
  @returns {Boolean}
*/
export function routeIsResolved(route) {
  const { activeTransition } = routerMicrolib(route);

  if (!activeTransition) {
    return true;
  }

  return !!activeTransition.handlerInfos
    .find((info) => (
      info.isResolved &&
      route === (
        info._handler ||
        info.handler // Ember < 2.4
      )
    ));
}

/**
  Returns the route's `routerMicrolib` (for compatibility).

  @function routerMicrolib
  @param {Ember.Route} route
*/
export function routerMicrolib(route) {
  const router = route._router ||
    route.router;  // < Ember 3.0

  return router._routerMicrolib ||
    router.router; // < Ember 2.13
}

/**
  Returns the route's `fullRouteName` (for compatibility).

  @function routeName
  @param {Ember.Route} route
*/
export function routeName(route) {
  return route.fullRouteName || route.routeName;
}
