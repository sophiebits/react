/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_MODDED_TYPE} from 'shared/ReactSymbols';

import {Pure} from 'shared/ReactModTags';
import warningWithoutStack from 'shared/warningWithoutStack';

export default function pure<Props>(
  render: (props: Props) => React$Node,
  compare?: (oldProps: Props, newProps: Props) => boolean,
) {
  if (__DEV__) {
    if (typeof render !== 'function') {
      warningWithoutStack(
        false,
        'pure: The first argument must be a function component. Instead ' +
          'received: %s',
        render === null ? 'null' : typeof render,
      );
    } else {
      const prototype = render.prototype;
      if (prototype && prototype.isReactComponent) {
        warningWithoutStack(
          false,
          'pure: The first argument must be a function component. Classes ' +
            'are not supported. Use React.PureComponent instead.',
        );
      }
    }
  }
  return {
    $$typeof: REACT_MODDED_TYPE,
    flags: 0,
    render,
    compare: compare === undefined ? null : compare,
  };
}
