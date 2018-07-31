import Controller from '@ember/controller';
import { match } from '@ember/object/computed';

export default Controller.extend({
  testing: match('currentRouteName', /^test/)
});
