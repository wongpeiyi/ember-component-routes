import Mixin from '@ember/object/mixin';
import { animate } from 'velocity-animate';

export default Mixin.create({

  didRenderComponent() {
    return animate(this.element, { opacity: [1, 0] });
  },

  willTeardownComponent() {
    return animate(this.element, { opacity: 0 });
  }

});
