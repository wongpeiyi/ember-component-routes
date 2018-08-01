import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  renderComponents() {
    this.renderComponent('animations-page.route-dependent-one', {
      into: 'animations-page',
      outlet: 'route-dependent'
    });
  }

});
