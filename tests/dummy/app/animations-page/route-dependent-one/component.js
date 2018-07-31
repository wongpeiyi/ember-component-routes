import Component from '@ember/component';
import RouteDependent from 'dummy/mixins/route-dependent';

export default Component.extend(RouteDependent, {
  classNames: 'animation-box__frame animation-box__frame_one',
  elementId: 'route-dependent_one',
  name: 'one'
});
