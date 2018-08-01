import Mixin from '@ember/object/mixin';
import { animate } from 'velocity-animate';

export default Mixin.create({

  didRenderComponent(fromComponent) {
    if (!fromComponent) {
      return;
    }

    const start = this._isBefore(fromComponent) ? '-100%' : '100%';

    animate(this.element, { translateX: [0, start] });
  },

  willTeardownComponent(toComponent, toRoute, teardown) {
    if (!toComponent) {
      return;
    }

    const end = this._isBefore(toComponent) ? '-100%' : '100%';

    animate(this.element, { translateX: end })
      .then(teardown);

    return false;
  },

  _isBefore(componentName) {
    return this.toString().match('-two') && componentName.match('-three') ||
           this.toString().match('-one') && componentName.match('-two');
  }

});
