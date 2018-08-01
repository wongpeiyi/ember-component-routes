import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({
  queryParams: {
    anchor: {}
  },

  attributes(model, { anchor }) {
    return { anchor };
  }
});
