import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  renderComponents() {
    this.renderComponent('animations-page.cross-fade-b', {
      into: 'animations-page',
      outlet: 'cross-fade'
    });
  }

});
