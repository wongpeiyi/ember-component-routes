import LinkComponent from '@ember/routing/link-component';
import { inject as service } from '@ember/service';

const LinkActionResetScroll = {
  router: service(),

  init() {
    this._super(...arguments);

    if (this.resetScroll !== false) {
      this.on(this.eventName, this, 'queueResetPosition');
    }
  },

  willDestroyElement() {
    this._super(...arguments);

    this.off(this.eventName, this, 'queueResetPosition');
  },

  queueResetPosition() {
    const router = this.router._router;

    router.one('didTransition', () => {
      const routeName = router.currentRouteName.replace(/\.index$/, '');

      if (this.targetRouteName === routeName) {
        window.scrollTo(0, 0);
      }
    });
  }
};

export function initialize() {
  LinkComponent.reopen(LinkActionResetScroll);
}

export default {
  initialize,
  after: 'allow-link-action'
};
