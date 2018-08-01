import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  renderComponents() {
    this.renderComponent('animations-page.attempt-b', {
      into: 'animations-page',
      outlet: 'attempt'
    });
  }

});
