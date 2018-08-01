import Mixin from '@ember/object/mixin';
import { animate } from 'velocity-animate';

export default Mixin.create({
  classNames: 'page',

  async didRenderComponent(fromComponent) {
    if (!fromComponent) {
      this._scrollToAnchor();

      return;
    }

    await animate(this.element, {
      opacity: [1, 0.33],
      translateX: [0, '-33%']
    }, {
      duration: 300,
      easing: 'ease-out-circ'
    });

    this._scrollToAnchor();
  },

  willTeardownComponent(toComponent, toRoute, teardown) {
    animate(this.element, {
      opacity: 0,
    }, {
      duration: 150,
      easing: 'ease-in-circ'
    })
    .then(teardown);

    return false;
  },

  didUpdateRouteAttrs() {
    this._scrollToAnchor();
  },

  _scrollToAnchor() {
    const anchor = this.get('route.anchor');

    if (!anchor) {
      return;
    }

    const heading = this.element.querySelector(`#${anchor}`);

    if (heading) {
      animate(heading, 'scroll');
    }
  }
});
