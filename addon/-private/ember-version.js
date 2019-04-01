// Returns Ember version in numeric form
// @ember/version is not available before new module imports

import Ember from 'ember';

/* eslint-disable-next-line ember/new-module-imports */
const [MAJOR, MINOR] = Ember.VERSION.split('.').slice(0, 2).map(Number);

export function versionAbove(condition) {
  const [major, minor] = condition.split('.').map(Number);

  return MAJOR > major || MAJOR === major && MINOR >= minor;
}
