import Controller from '@ember/controller';
import { match } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  router: service(),

  testing: match('router.currentRouteName', /^test/)
});
