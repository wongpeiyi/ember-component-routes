import { moduleFor, test } from 'ember-qunit';
import { A } from "@ember/array"

moduleFor('service:component-router', 'Unit | Service | component router');

// queueRender

test('#queueRender adds a render task', function(assert) {
  const router = this.subject();

  router.queueRender('index', 'my-component', { foo: 'bar' }, 'parent', 'main');

  assert.deepEqual(
    router.get('renderQueue'),
    [{
      routeName: 'index',
      componentName: 'my-component',
      attributes: { foo: 'bar' },
      into: 'parent',
      outlet: 'main'
    }]
  );
});

test('#queueRender updates an existing render task', function(assert) {
  const router = this.subject();

  router.queueRender('index', 'old-component', { foo: 'bar' }, 'parent', 'main');

  assert.equal(router.get('renderQueue.length'), 1);

  router.queueRender('index', 'new-component', { foo: 'baz' }, 'parent', 'main');

  assert.deepEqual(
    router.get('renderQueue'),
    [{
      routeName: 'index',
      componentName: 'new-component',
      attributes: { foo: 'baz' },
      into: 'parent',
      outlet: 'main'
    }]
  );
});

test('#queueRender triggers the new render on all matching connections', function(assert) {
  assert.expect(2);

  const router = this.subject();

  const componentOutletAB = {
    renderComponent() {
      assert.ok(true, 'render called');
    }
  };
  const componentOutletC = {
    renderComponent() {
      assert.notOk(true, 'render should not be called');
    }

  };

  const a = {
    componentOutlet: componentOutletAB,
    into: 'parent',
    outlet: 'main'
  };
  const b = {
    componentOutlet: componentOutletAB,
    into: 'parent',
    outlet: 'main'
  };
  const c = {
    componentOutlet: componentOutletC,
    into: 'parent',
    outlet: 'other'
  };

  router.set('connections', A([a, b, c]));

  router.queueRender('foo', 'bar', {}, 'parent', 'main');
});

// connectOutlet

test('#connectOutlet adds a connection', function(assert) {
  const router = this.subject();
  const componentOutlet = {};

  router.connectOutlet(componentOutlet, 'parent', 'main');

  assert.deepEqual(
    router.get('connections'),
    [{ componentOutlet, into: 'parent', outlet: 'main' }]
  );
});

test('#connectOutlet updates an existing connection', function(assert) {
  const router = this.subject();
  const componentOutlet = {};

  router.set('connections', A([{ componentOutlet, into: 'parent', outlet: 'old' }]));

  assert.equal(router.get('connections.length'), 1);

  router.connectOutlet(componentOutlet, 'parent', 'new');

  assert.deepEqual(
    router.get('connections'),
    [{ componentOutlet, into: 'parent', outlet: 'new' }]
  );
});

test('#connectOutlet triggers last queued render on the new connection', function(assert) {
  assert.expect(1);

  const router = this.subject();

  const componentOutlet = {
    renderComponent(componentName, routeName) {
      assert.equal(routeName, 'b');
    }
  };

  router.set('renderQueue', A([{
    routeName: 'a',
    into: 'parent',
    outlet: 'main'
  }, {
    routeName: 'b',
    into: 'parent',
    outlet: 'main'
  }, {
    routeName: 'c',
    into: 'parent',
    outlet: 'other'
  }]));

  router.connectOutlet(componentOutlet, 'parent', 'main');
});

// disconnectOutlet

test('#disconnectOutlet removes matching connections', function(assert) {
  assert.expect(2);

  const router = this.subject();
  const componentOutlet = {};

  router.set('connections', A([{ componentOutlet, into: 'parent', outlet: 'main' }]));

  assert.equal(router.get('connections.length'), 1);

  router.disconnectOutlet(componentOutlet);

  assert.equal(router.get('connections.length'), 0);
});

test('#disconnectOutlet no-op if it cannot find a connection', function(assert) {
  const router = this.subject();
  const componentOutlet = {};

  router.set('connections', A([{ componentOutlet, into: 'parent', outlet: 'main' }]));

  assert.equal(router.get('connections.length'), 1);

  router.disconnectOutlet({});

  assert.equal(router.get('connections.length'), 1);
});

// removeRendersBy

test('#removeRendersBy removes stray render tasks by route name', function(assert) {
  const router = this.subject();

  router.set('renderQueue', A([{
    routeName: 'index',
    componentName: 'my-component',
    attributes: {},
    into: 'parent',
    outlet: 'main'
  }]));

  router.removeRendersBy('index');

  assert.equal(router.get('renderQueue.length'), 0);
});

test('#removeRendersBy removes and tears down existing rendered renders', function(assert) {
  assert.expect(2);

  const router = this.subject();

  const componentOutlet = {
    teardownComponent() {
      assert.ok(true, 'teardown called');
    }
  };

  router.setProperties({
    renderQueue: A([{
      routeName: 'index',
      componentName: 'my-component',
      attributes: {},
      into: 'parent',
      outlet: 'main'
    }]),
    connections: A([{
      componentOutlet,
      into: 'parent',
      outlet: 'main'
    }])
  });

  router.removeRendersBy('index');

  assert.equal(router.get('renderQueue.length'), 0);
});

test('#removeRendersBy triggers next render on torn down connections', function(assert) {
  assert.expect(3);

  const router = this.subject();

  const componentOutlet = {
    renderComponent(componentName, routeName) {
      assert.ok(true, 'render called');
      assert.equal(routeName, 'foo');
    },

    teardownComponent() {
      assert.ok(true, 'teardown called');
    }
  };

  router.setProperties({
    renderQueue: A([{
      routeName: 'foo',
      into: 'parent',
      outlet: 'main'
    }, {
      routeName: 'bar',
      into: 'parent',
      outlet: 'main'
    }]),
    connections: A([{
      componentOutlet,
      into: 'parent',
      outlet: 'main'
    }])
  });

  router.removeRendersBy('bar');
});

test('#removeRendersBy no-op if no matching route name', function(assert) {
  const router = this.subject();

  router.set('renderQueue', A([{
    routeName: 'index',
    componentName: 'my-component',
    attributes: {},
    into: 'parent',
    outlet: 'main'
  }]));

  router.removeRendersBy('foo');

  assert.equal(router.get('renderQueue.length'), 1);
});

// updateAppAttributes

test('#updateAppAttributes sets on route and re-updates attributes', function(assert) {
  assert.expect(1);

  const router = this.subject();

  const componentOutlet = {
    renderComponent(componentName, routeName, attributes) {
      assert.equal(attributes.foo, 'bar', 'attributes updated');
    }
  };

  router.set('renderQueue', A([{
    routeName: 'index',
    componentName: 'my-component',
    attributes: {},
    into: 'parent',
    outlet: 'main'
  }]));

  router.set('connections', A([{
    componentOutlet,
    into: 'parent',
    outlet: 'main'
  }]));

  router.updateAppAttributes({ foo: 'bar' });
});

// _renderIntoAllConnections

test('#_renderIntoAllConnections triggers render on all matching connections', function(assert) {
  assert.expect(2);

  const router = this.subject();

  const componentOutletAB = {
    renderComponent() {
      assert.ok(true, 'render called');
    }
  };
  const componentOutletC = {
    renderComponent() {
      assert.notOk(true, 'render should not be called');
    }
  };

  const a = {
    componentOutlet: componentOutletAB,
    into: 'parent',
    outlet: 'main'
  };
  const b = {
    componentOutlet: componentOutletAB,
    into: 'parent',
    outlet: 'main'
  };
  const c = {
    componentOutlet: componentOutletC,
    into: 'parent',
    outlet: 'other'
  };

  router.set('connections', A([a, b, c]));

  router._renderIntoAllConnections({ into: 'parent', outlet: 'main' });
});

// _renderLastIntoConnection

test('#_renderLastIntoConnection triggers last matching render on connection', function(assert) {
  assert.expect(1);

  const router = this.subject();

  const componentOutlet = {
    renderComponent(componentName, routeName) {
      assert.equal(routeName, 'b');
    }
  };

  router.set('renderQueue', A([{
    routeName: 'a',
    into: 'parent',
    outlet: 'main'
  }, {
    routeName: 'b',
    into: 'parent',
    outlet: 'main'
  }, {
    routeName: 'c',
    into: 'parent',
    outlet: 'other'
  }]));

  router._renderLastIntoConnection({ componentOutlet, into: 'parent', outlet: 'main' });
});

// _connectionsForRender

test('#_connectionsForRender finds matching connections by { into, outlet }', function(assert) {
  const router = this.subject();

  const a = {
    into: 'parent',
    outlet: 'main'
  };
  const b = {
    into: 'parent',
    outlet: 'other'
  };
  const c = {
    into: 'foo',
    outlet: 'main'
  };

  router.set('connections', A([a, b, c]));

  assert.deepEqual(router._connectionsForRender({ into: 'parent', outlet: 'main' }), [a]);
  assert.deepEqual(router._connectionsForRender({ into: 'foo', outlet: 'main' }), [c]);
});

// _lastRenderForConnection

test('#_lastRenderForConnection finds last matching render by { into, outlet }', function(assert) {
  const router = this.subject();

  router.set('renderQueue', A([{
    componentName: 'foo',
    into: 'parent',
    outlet: 'main'
  }, {
    componentName: 'bar',
    into: 'parent',
    outlet: 'main'
  }, {
    componentName: 'baz',
    into: 'parent',
    outlet: 'other'
  }]));

  assert.equal(
    router._lastRenderForConnection({ into: 'parent', outlet: 'main' }).componentName,
    'bar'
  );
});

// _renderInto

test('#_renderInto performs a render on a connection', function(assert) {
  assert.expect(3);

  const router = this.subject();

  const componentOutlet = {
    renderComponent(componentName, routeName, attributes) {
      assert.equal(componentName, 'foo');
      assert.equal(routeName, 'index');
      assert.equal(attributes.foo, 'bar');
    }
  };

  const connection = { componentOutlet };

  const render = {
    componentName: 'foo',
    routeName: 'index',
    attributes: { foo: 'bar' }
  }

  router._renderInto(connection, render);
});

test('#_renderInto merges `appAttributes` if `attributes` is a POJO', function(assert) {
  assert.expect(1);

  const router = this.subject();

  router.set('appAttributes', { foo: 'baz' });

  const componentOutlet = {
    renderComponent(componentName, routeName, attributes) {
      assert.equal(attributes.foo, 'baz');
    }
  };

  const connection = { componentOutlet };

  const render = {
    componentName: 'foo',
    routeName: 'index',
    attributes: { foo: 'bar' }
  }

  router._renderInto(connection, render);
});

test('#_renderInto ignores `appAttributes` if `attributes` is not a POJO', function(assert) {
  assert.expect(1);

  const router = this.subject();

  router.set('appAttributes', { foo: 'baz' });

  const componentOutlet = {
    renderComponent(componentName, routeName, attributes) {
      assert.equal(attributes, 'something');
    }
  };

  const connection = { componentOutlet };

  const render = {
    componentName: 'foo',
    routeName: 'index',
    attributes: 'something'
  }

  router._renderInto(connection, render);
});
