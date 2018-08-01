import Mixin from '@ember/object/mixin';
import { animate } from 'velocity-animate';

export default Mixin.create({

  didRenderComponent() {
    animate(this.element, { opacity: [1, 0] });
  },

  willTeardownComponent(toComponent, toRoute, teardown) {
    animate(this.element, { opacity: 0 })
      .then(teardown);

    return false;
  }

});
