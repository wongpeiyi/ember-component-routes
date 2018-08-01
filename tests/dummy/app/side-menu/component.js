import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { assign } from '@ember/polyfills';

export default Component.extend({
  tagName: 'aside',
  classNames: 'side-bar',

  router: service(),

  onRoute: computed('router.currentRouteName', function() {
    const routes = this.get('router.currentRouteName').split('.');

    return routes.reduce((hash, route, i) => (
      assign(hash, {
        [routes.slice(0, i + 1).join('.')]: true
      })
    ), {});
  })
});
