/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServer
 */

'use strict';

var ReactDOMServerRendering = require('ReactDOMServerRendering');
var ReactDefaultInjection = require('ReactDefaultInjection');
var ReactServerRendering = require('ReactServerRendering');
var ReactVersion = require('ReactVersion');

ReactDefaultInjection.inject();

var ReactDOMServer = {
  renderToString: ReactDOMServerRendering.renderToString,
  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
  version: ReactVersion,
};

module.exports = ReactDOMServer;
