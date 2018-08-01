import Component from '@ember/component';
import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import handlebars from 'highlight.js/lib/languages/handlebars';
import htmlbars from 'highlight.js/lib/languages/htmlbars';

hljs.registerLanguage('js', javascript);
hljs.registerLanguage('hbs', handlebars);
hljs.registerLanguage('htmlbars', htmlbars);

export default Component.extend({
  classNames: 'code-block',
  classNameBindings: 'numbers::code-block_no-line-numbers',

  numbers: true,

  didInsertElement() {
    this._super(...arguments);

    if (this.numbers) {
      this.addLineNumbers();
    }

    this.highlight();
  },

  highlight() {
    this.element.querySelectorAll('code').forEach((block) => (
      hljs.highlightBlock(block)
    ));
  },

  addLineNumbers() {
    const tags = this.element.querySelectorAll('.code-block__code pre code');

    let code;

    tags.forEach((tag) => code += tag.innerHTML);

    const lines = code.match(/\n/g).length;
    const arr = Array.apply(null, Array(lines)).map((_, i) => i + 1);

    this.element.querySelector('.code-block__numbers pre').innerHTML = arr.join('\n');
  }

});
