import { getOwner } from '@ember/application';

/**
  Returns the target object (parent component or controller) of a view (for
  compatibility).

  @function targetObjectOf
  @param {(Ember.View}
  @returns {(Ember.Component|Ember.Controller)} Parent object
*/
export function targetObjectOf(obj) {
  let parent = obj._target || obj._targetObject;

  if (parent) {
    return parent;
  }

  // < Ember 2.4
  parent = obj.parentView;

  return parent.get('controller') || parent;
}

/**
  Returns the template name for a component, or controller. This is the same
  name used in `renderTemplate` or `renderComponent`.

  @function templateNameFor
  @param {(Ember.Component|Ember.Controller)}
  @returns {String} Template name
*/
export function templateNameFor(obj) {
  const key = obj._debugContainerKey;

  if (/^component:/.test(key)) {
    return nameForComponent(obj);
  } else {
    return templateNameForController(obj);
  }
}

/**
  Returns the template name for a component.

  @function nameForComponent
  @param {Ember.Component}
  @returns {String} Template name
*/
export function nameForComponent(component) {
  return component._debugContainerKey.replace(/^component:/, '');
}

/**
  Returns the template name for a controller.

  Recursively searches rendered outlets to find a matching outlet and its
  rendered template name. Returns null if no match is found.

  @function templateNameForController
  @param {Ember.Controller}
  @returns {String} Template name
*/
export function templateNameForController(controller) {
  const container = getOwner(controller);
  const rootOutlet = _applicationOutlet(container);
  const outlet = _findOutlet(controller, rootOutlet);

  return outlet ? _nameForOutlet(outlet) : null;
}

/**
  Gets the root application outlet in the application instance's container.

  @function _applicationOutlet
  @param {Ember.Container}
  @returns {Object} outletState
*/
export function _applicationOutlet(container) {
  const router = container.lookup('router:main');
  const rootView = router._toplevelView;
  const { outletState } = (
    rootView.ref ||
    rootView // < Ember 3.0
  );

  return outletState.outlets ?
    outletState.outlets.main :
    outletState.main; // < Ember 2.10
}

/**
  Recursive function that returns the outlet if it matches the specified
  controller, or continues recursing through the child outlets to find
  a matching outlet. Returns undefined if no match is found.

  @function _findOutlet
  @param {Ember.Controller}
  @param {Object} outletState
  @returns {Object} outletState
*/
export function _findOutlet(controller, outletState) {
  const { outlets, render } = outletState;

  if (render.controller === controller) {
    return outletState;
  }

  for (let key in outlets) {
    const result = _findOutlet(controller, outlets[key]);

    if (result) {
      return result;
    }
  }
}

/**
  Returns template name currently rendered in a given outlet.

  @function _nameForOutlet
  @param {Object} outletState
  @returns {String} Template name
*/
export function _nameForOutlet(outletState) {
  return outletState.render.name;
}
