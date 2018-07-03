# ember-component-routes

This is an experimental Ember CLI addon that enables routes to render components directly, via a `{{component-outlet}}`, thereby:

- Eliminating the need for controllers and top-level templates
- Simplifying query params and route actions behaviour
- Enabling component animations on render and teardown

... all while preserving classic routing functionality, so you can simply drop it into existing apps without having to rewrite everything first.

This was originally based on the [Routable Components RFC](https://github.com/ef4/rfcs/blob/routeable-components/active/0000-routeable-components.md), but rewritten upon its [closure](https://github.com/emberjs/rfcs/pull/38#issuecomment-355800759) to follow the new streamlined direction.

## Demo / Docs

For more info, see the [interactive docs site](), which uses ember-component-routes.

## Installation & Compatibility

```
ember install ember-component-routes
```

This addon is tested against the release, beta and canary channels, down till Ember LTS ~2.4.0

## Basic Usage

```js
// routes/post.js

import { ComponentRoute } from 'ember-component-routes';

export default ComponentRoute.extend({

  model(params) {
    return this.store.findRecord('post', params.id);
  },

  attributes(model, params, actions) {
    return { model, actions };
  },

  renderComponents() {
    this.renderComponent('post-page');
  },

  actions: {
    reload() {
      this.refresh();
    }
  }
});
```

Instead of the classic `{{outlet}}`, use:

```hbs
{{!-- templates/application.hbs --}}

{{component-outlet}}
```

When the route is entered, the `post-page` component will be rendered into the application template's `component-outlet`, with the result of the `attributes` hook available as `@route` on the component:

```hbs
{{!-- templates/components/post-page.hbs --}}

<h1>{{@route.model.title}}</h1>

<button onclick={{@route.actions.reload}}>Reload</button>
```
