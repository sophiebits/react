/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMultiChild
 * @typechecks static-only
 */

"use strict";

var ReactComponent = require('ReactComponent');
var ReactMultiChildUpdateTypes = require('ReactMultiChildUpdateTypes');

var invariant = require('invariant');

/**
 * Given a `curChild` and `newChild`, determines if `curChild` should be
 * updated as opposed to being destroyed or replaced.
 *
 * @param {?ReactComponent} curChild
 * @param {?ReactComponent} newChild
 * @return {boolean} True if `curChild` should be updated with `newChild`.
 * @protected
 */
function shouldUpdateChild(curChild, newChild) {
  return curChild && newChild && curChild.constructor === newChild.constructor;
}

/**
 * Updating children of a component may trigger recursive updates. The depth is
 * used to batch recursive updates to render markup more efficiently.
 *
 * @type {number}
 * @private
 */
var updateDepth = 0;

/**
 * Queue of update configuration objects.
 *
 * Each object has a `type` property that is in `ReactMultiChildUpdateTypes`.
 *
 * @type {array<object>}
 * @private
 */
var updateQueue = [];

/**
 * Queue of markup to be rendered.
 *
 * @type {array<string>}
 * @private
 */
var markupQueue = [];

/**
 * Enqueues markup to be rendered and inserted at a supplied index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} markup Markup that renders into an element.
 * @param {number} toIndex Destination index.
 * @private
 */
function enqueueMarkup(parentID, markup, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
    markupIndex: markupQueue.push(markup) - 1,
    fromIndex: null,
    textContent: null,
    toIndex: toIndex
  });
}

/**
 * Enqueues moving an existing element to another index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Source index of the existing element.
 * @param {number} toIndex Destination index of the element.
 * @private
 */
function enqueueMove(parentID, fromIndex, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: toIndex
  });
}

/**
 * Enqueues removing an element at an index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Index of the element to remove.
 * @private
 */
function enqueueRemove(parentID, fromIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.REMOVE_NODE,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: null
  });
}

/**
 * Enqueues setting the text content.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} textContent Text content to set.
 * @private
 */
function enqueueTextContent(parentID, textContent) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
    markupIndex: null,
    textContent: textContent,
    fromIndex: null,
    toIndex: null
  });
}

/**
 * Processes any enqueued updates.
 *
 * @private
 */
function processQueue() {
  if (updateQueue.length) {
    ReactComponent.DOMIDOperations.dangerouslyProcessChildrenUpdates(
      updateQueue,
      markupQueue
    );
    clearQueue();
  }
}

/**
 * Clears any enqueued updates.
 *
 * @private
 */
function clearQueue() {
  updateQueue.length = 0;
  markupQueue.length = 0;
}

/**
 * Generates a "mount image" for each of the supplied children. In the case
 * of `ReactNativeComponent`, a mount image is a string of markup.
 *
 * @param {ReactComponent} component Parent component.
 * @param {string} nodeID Parent DOM node ID.
 * @param {string} idPrefix ID prefix for component children.
 * @param {?object} children As returned by `flattenChildren`.
 * @return {array} An array of mounted representations.
 * @internal
 */
function mountChildren(
    component,
    nodeID,
    idPrefix,
    children,
    transaction) {
  var mountImages = [];
  var index = 0;
  for (var name in children) {
    var child = children[name];
    if (children.hasOwnProperty(name) && child) {
      var rootID = idPrefix + name;
      var mountImage = child.mountComponent(rootID, transaction);
      child._mountIndex = index;
      mountImages.push(mountImage);
      index++;
    }
  }
  component._renderedChildren = children;
  return mountImages;
}

/**
 * Sets the text content, assuming that the component's root node is empty.
 *
 * @param {ReactComponent} component Parent component.
 * @param {string} nextContent String of content.
 * @internal
 */
function updateTextContent(component, nextContent) {
  updateDepth++;
  try {
    var prevChildren = component._renderedChildren;
    for (var name in prevChildren) {
      invariant(
        false,
        "ReactMultiChild: All children should be removed before " +
        "updateTextContent is called; found child %s.",
        name
      );
    }
    // Set new text content.
    setTextContent(component._rootNodeID, nextContent);
  } catch (error) {
    updateDepth--;
    updateDepth || clearQueue();
    throw error;
  }
  updateDepth--;
  updateDepth || processQueue();
}

/**
 * Updates the rendered children with new children.
 *
 * @param {ReactComponent} component Parent component.
 * @param {string} nodeID Parent DOM node ID.
 * @param {string} idPrefix ID prefix for component children.
 * @param {?object} nextChildren As returned by `flattenChildren`.
 * @param {ReactReconcileTransaction} transaction
 * @internal
 */
function updateChildren(
    component,
    nodeID,
    idPrefix,
    nextChildren,
    transaction) {
  updateDepth++;
  try {
    _updateChildren(
      component,
      nodeID,
      idPrefix,
      nextChildren,
      transaction
    );
  } catch (error) {
    updateDepth--;
    updateDepth || clearQueue();
    throw error;
  }
  updateDepth--;
  updateDepth || processQueue();
}

/**
 * Improve performance by isolating this hot code path from the try/catch
 * block in `updateChildren`.
 *
 * @param {ReactComponent} component Parent component.
 * @param {string} nodeID Parent DOM node ID.
 * @param {string} idPrefix ID prefix for component children.
 * @param {?object} nextChildren As returned by `flattenChildren`.
 * @param {ReactReconcileTransaction} transaction
 * @final
 * @protected
 */
function _updateChildren(
    component,
    nodeID,
    idPrefix,
    nextChildren,
    transaction) {
  var prevChildren = component._renderedChildren;
  if (!nextChildren && !prevChildren) {
    return;
  }
  var name;
  // `nextIndex` will increment for each child in `nextChildren`, but
  // `lastIndex` will be the last index visited in `prevChildren`.
  var lastIndex = 0;
  var nextIndex = 0;
  for (name in nextChildren) {
    if (!nextChildren.hasOwnProperty(name)) {
      continue;
    }
    var prevChild = prevChildren && prevChildren[name];
    var nextChild = nextChildren[name];
    if (shouldUpdateChild(prevChild, nextChild)) {
      moveChild(nodeID, prevChild, nextIndex, lastIndex);
      lastIndex = Math.max(prevChild._mountIndex, lastIndex);
      prevChild.receiveProps(nextChild.props, transaction);
      prevChild._mountIndex = nextIndex;
    } else {
      if (prevChild) {
        // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
        lastIndex = Math.max(prevChild._mountIndex, lastIndex);
        _unmountChildByName(component, nodeID, prevChild, name);
      }
      if (nextChild) {
        _mountChildByNameAtIndex(
          component,
          nodeID,
          idPrefix,
          nextChild,
          name,
          nextIndex,
          transaction
        );
      }
    }
    if (nextChild) {
      nextIndex++;
    }
  }
  // Remove children that are no longer present.
  for (name in prevChildren) {
    if (prevChildren.hasOwnProperty(name) &&
        prevChildren[name] &&
        !(nextChildren && nextChildren[name])) {
      _unmountChildByName(component, nodeID, prevChildren[name], name);
    }
  }
}

/**
 * Unmounts all rendered children. This should be used to clean up children
 * when this component is unmounted.
 *
 * @param {ReactComponent} component Parent component.
 * @internal
 */
function unmountChildren(component) {
  var renderedChildren = component._renderedChildren;
  for (var name in renderedChildren) {
    var renderedChild = renderedChildren[name];
    if (renderedChild && renderedChild.unmountComponent) {
      renderedChild.unmountComponent();
    }
  }
  component._renderedChildren = null;
}

/**
 * Moves a child component to the supplied index.
 *
 * @param {string} nodeID Parent DOM node ID.
 * @param {ReactComponent} child Component to move.
 * @param {number} toIndex Destination index of the element.
 * @param {number} lastIndex Last index visited of the siblings of `child`.
 * @protected
 */
function moveChild(nodeID, child, toIndex, lastIndex) {
  // If the index of `child` is less than `lastIndex`, then it needs to
  // be moved. Otherwise, we do not need to move it because a child will be
  // inserted or moved before `child`.
  if (child._mountIndex < lastIndex) {
    enqueueMove(nodeID, child._mountIndex, toIndex);
  }
}

/**
 * Creates a child component.
 *
 * @param {string} nodeID Parent DOM node ID.
 * @param {ReactComponent} child Component to create.
 * @param {string} mountImage Markup to insert.
 * @protected
 */
function createChild(nodeID, child, mountImage) {
  enqueueMarkup(nodeID, mountImage, child._mountIndex);
}

/**
 * Removes a child component.
 *
 * @param {string} nodeID Parent DOM node ID.
 * @param {ReactComponent} child Child to remove.
 * @protected
 */
function removeChild(nodeID, child) {
  enqueueRemove(nodeID, child._mountIndex);
}

/**
 * Sets this text content string.
 *
 * @param {string} nodeID Parent DOM node ID.
 * @param {string} textContent Text content to set.
 * @protected
 */
function setTextContent(nodeID, textContent) {
  enqueueTextContent(nodeID, textContent);
}

/**
 * Mounts a child with the supplied name.
 *
 * NOTE: This is part of `updateChildren` and is here for readability.
 *
 * @param {ReactComponent} component Parent component.
 * @param {string} nodeID Parent DOM node ID.
 * @param {string} idPrefix ID prefix for component children.
 * @param {ReactComponent} child Component to mount.
 * @param {string} name Name of the child.
 * @param {number} index Index at which to insert the child.
 * @param {ReactReconcileTransaction} transaction
 * @private
 */
function _mountChildByNameAtIndex(
    component,
    nodeID,
    idPrefix,
    child,
    name,
    index,
    transaction) {
  // Inlined for performance, see `ReactInstanceHandles.createReactID`.
  var rootID = idPrefix + name;
  var mountImage = child.mountComponent(rootID, transaction);
  child._mountIndex = index;
  createChild(nodeID, child, mountImage);
  component._renderedChildren = component._renderedChildren || {};
  component._renderedChildren[name] = child;
}

/**
 * Unmounts a rendered child by name.
 *
 * NOTE: This is part of `updateChildren` and is here for readability.
 *
 * @param {ReactComponent} component Parent component.
 * @param {string} nodeID Parent DOM node ID.
 * @param {ReactComponent} child Component to unmount.
 * @param {string} name Name of the child in `component._renderedChildren`.
 * @private
 */
function _unmountChildByName(component, nodeID, child, name) {
  if (ReactComponent.isValidComponent(child)) {
    removeChild(nodeID, child);
    child._mountIndex = null;
    child.unmountComponent();
    delete component._renderedChildren[name];
  }
}

/**
 * ReactMultiChild contains utilities for reconciling multiple children.
 *
 * @internal
 */
var ReactMultiChild = {
  mountChildren: mountChildren,
  updateChildren: updateChildren,
  updateTextContent: updateTextContent,
  unmountChildren: unmountChildren
};

module.exports = ReactMultiChild;
