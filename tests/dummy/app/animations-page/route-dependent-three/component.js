import Component from '@ember/component';
import RouteDependent from 'dummy/mixins/route-dependent';

export default Component.extend(RouteDependent, {
  classNames: 'animation-box__frame animation-box__frame_three',
  elementId: 'route-dependent_three',
  name: 'three'
});
