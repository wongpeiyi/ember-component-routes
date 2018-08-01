import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  renderComponents() {
    this.renderComponent('animations-page');

    this.renderComponent('animations-page/white-a', {
      into: 'animations-page',
      outlet: 'white'
    });

    this.renderComponent('animations-page/attempt-a', {
      into: 'animations-page',
      outlet: 'attempt'
    });

    this.renderComponent('animations-page/cross-fade-a', {
      into: 'animations-page',
      outlet: 'cross-fade'
    });

    this.renderComponent('animations-page/route-dependent-two', {
      into: 'animations-page',
      outlet: 'route-dependent'
    });
  }

});
