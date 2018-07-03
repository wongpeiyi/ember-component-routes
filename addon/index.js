import Route from '@ember/routing/route';
import ComponentRouteMixin from './mixins/component-route';
import ComponentOutlet from './components/component-outlet';
import ComponentRouter from './services/component-router';

const ComponentRoute = Route.extend(ComponentRouteMixin);

export {
  ComponentRoute,
  ComponentRouteMixin,
  ComponentOutlet,
  ComponentRouter
};
