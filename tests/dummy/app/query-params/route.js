import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  renderComponents() {
    this.renderComponent('query-params-page');
  }

});
