import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {

  this.route('rendering');
  this.route('attributes');
  this.route('query-params');
  this.route('component-hooks');

  this.route('animations', function() {
    this.route('fade-to-white');
    this.route('cross-fade-attempt');
    this.route('basic-cross-fade');
    this.route('route-dependent-1');
    this.route('route-dependent-3');
  });

  this.route('vs-classic');
  this.route('skeleton-loading');

  this.route('api-component-route', { path: 'api/component-route' });
  this.route('api-component', { path: 'api/component' });

  this.route('tests', function() {
    this.route('parent', function() {
      this.route('component-route');

      this.route('child', function() {
        this.route('component-route');
      });

      this.route('component-child', function() {
        this.route('component-route');

        this.route('component-grand-child', function() {
          this.route('component-route');
        });
      });

      this.route('params', { path: '/params/:id' });
    });

    this.route('multiple', function() {
      this.route('component-route');
    });
  });

});

export default Router;
