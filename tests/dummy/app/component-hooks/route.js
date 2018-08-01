import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  renderComponents() {
    this.renderComponent('component-hooks-page');
  }

});
