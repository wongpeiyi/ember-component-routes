import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  renderComponents() {
    this.renderComponent('animations-page.white-b', {
      into: 'animations-page',
      outlet: 'white'
    });
  }

});
