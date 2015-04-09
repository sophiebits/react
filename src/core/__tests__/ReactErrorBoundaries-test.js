/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;

describe('ReactErrorBoundaries', function() {

  beforeEach(function() {
    React = require('React');
  });

  it('catches errors from children', function() {
    var log = [];

    var Box = React.createClass({
      render: function() {
        log.push('Box render');
        return (
          <div>
            <Inquisitive ref={(x) => { log.push('Inquisitive ref ' + x); }} />
            <Angry />
          </div>
        );
      },
      renderError: function(e) {
        log.push('Box renderError');
        return <div>Error: {e.message}</div>;
      },
      componentDidMount: function() {
        log.push('Box componentDidMount');
      },
      componentWillUnmount: function() {
        log.push('Box componentWillUnmount');
      }
    });

    var Inquisitive = React.createClass({
      render: function() {
        log.push('Inquisitive render');
        return <div>What is love?</div>;
      },
      componentDidMount: function() {
        log.push('Inquisitive componentDidMount');
      },
      componentWillUnmount: function() {
        log.push('Inquisitive componentWillUnmount');
      }
    });

    var Angry = React.createClass({
      render: function() {
        log.push('Angry render');
        throw new Error('Please, do not render me.');
      },
      componentDidMount: function() {
        log.push('Angry componentDidMount');
      },
      componentWillUnmount: function() {
        log.push('Angry componentWillUnmount');
      }
    });

    var container = document.createElement('div');
    React.render(<Box />, container);
    expect(container.textContent).toBe('Error: Please, do not render me.');
    expect(log).toEqual([
      'Box render',
      'Inquisitive render',
      'Angry render',
      'Box componentWillUnmount',
      'Inquisitive ref null',
      'Inquisitive componentWillUnmount',
      'Angry componentWillUnmount',
      'Box renderError'
    ]);
  });

});
