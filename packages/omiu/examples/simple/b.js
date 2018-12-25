(function () {
  'use strict';

  /**
   * omi v4.1.7  http://omijs.org
   * Omi === Preact + Scoped CSS + Store System + Native Support in 3kb javascript.
   * By dntzhang https://github.com/dntzhang
   * Github: https://github.com/Tencent/omi
   * MIT Licensed.
   */

  /** Virtual DOM Node */
  function VNode() {}

  function getGlobal() {
    if (typeof global !== 'object' || !global || global.Math !== Math || global.Array !== Array) {
      return self || window || global || function () {
        return this;
      }();
    }
    return global;
  }

  /** Global options
   *	@public
   *	@namespace options {Object}
   */
  var options = {
    store: null,
    root: getGlobal()
  };

  var stack = [];
  var EMPTY_CHILDREN = [];

  function h(nodeName, attributes) {
    var children = EMPTY_CHILDREN,
        lastSimple,
        child,
        simple,
        i;
    for (i = arguments.length; i-- > 2;) {
      stack.push(arguments[i]);
    }
    if (attributes && attributes.children != null) {
      if (!stack.length) stack.push(attributes.children);
      delete attributes.children;
    }
    while (stack.length) {
      if ((child = stack.pop()) && child.pop !== undefined) {
        for (i = child.length; i--;) {
          stack.push(child[i]);
        }
      } else {
        if (typeof child === 'boolean') child = null;

        if (simple = typeof nodeName !== 'function') {
          if (child == null) child = '';else if (typeof child === 'number') child = String(child);else if (typeof child !== 'string') simple = false;
        }

        if (simple && lastSimple) {
          children[children.length - 1] += child;
        } else if (children === EMPTY_CHILDREN) {
          children = [child];
        } else {
          children.push(child);
        }

        lastSimple = simple;
      }
    }

    var p = new VNode();
    p.nodeName = nodeName;
    p.children = children;
    p.attributes = attributes == null ? undefined : attributes;
    p.key = attributes == null ? undefined : attributes.key;

    // if a "vnode hook" is defined, pass every created VNode to it
    if (options.vnode !== undefined) options.vnode(p);

    return p;
  }

  /**
   * @license
   * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
   */
  (function () {
    if (
    // No Reflect, no classes, no need for shim because native custom elements
    // require ES2015 classes or Reflect.
    window.Reflect === undefined || window.customElements === undefined ||
    // The webcomponentsjs custom elements polyfill doesn't require
    // ES2015-compatible construction (`super()` or `Reflect.construct`).
    window.customElements.hasOwnProperty('polyfillWrapFlushCallback')) {
      return;
    }
    var BuiltInHTMLElement = HTMLElement;
    window.HTMLElement = function HTMLElement() {
      return Reflect.construct(BuiltInHTMLElement, [], this.constructor);
    };
    HTMLElement.prototype = BuiltInHTMLElement.prototype;
    HTMLElement.prototype.constructor = HTMLElement;
    Object.setPrototypeOf(HTMLElement, BuiltInHTMLElement);
  })();

  function cssToDom(css) {
    var node = document.createElement('style');
    node.textContent = css;
    return node;
  }

  function npn(str) {
    return str.replace(/-(\w)/g, function ($, $1) {
      return $1.toUpperCase();
    });
  }

  function extend(obj, props) {
    for (var i in props) {
      obj[i] = props[i];
    }return obj;
  }

  /** Invoke or update a ref, depending on whether it is a function or object ref.
   *  @param {object|function} [ref=null]
   *  @param {any} [value]
   */
  function applyRef(ref, value) {
    if (ref != null) {
      if (typeof ref == 'function') ref(value);else ref.current = value;
    }
  }

  /**
   * Call a function asynchronously, as soon as possible. Makes
   * use of HTML Promise to schedule the callback if available,
   * otherwise falling back to `setTimeout` (mainly for IE<11).
   * @type {(callback: function) => void}
   */
  var defer = typeof Promise == 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function nProps(props) {
    if (!props || isArray(props)) return {};
    var result = {};
    Object.keys(props).forEach(function (key) {
      result[key] = props[key].value;
    });
    return result;
  }

  // DOM properties that should NOT have "px" added when numeric
  var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

  /**
   * Check if two nodes are equivalent.
   *
   * @param {Node} node			DOM Node to compare
   * @param {VNode} vnode			Virtual DOM node to compare
   * @param {boolean} [hydrating=false]	If true, ignores component constructors when comparing.
   * @private
   */
  function isSameNodeType(node, vnode, hydrating) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      return node.splitText !== undefined;
    }
    if (typeof vnode.nodeName === 'string') {
      return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
    }
    return hydrating || node._componentConstructor === vnode.nodeName;
  }

  /**
   * Check if an Element has a given nodeName, case-insensitively.
   *
   * @param {Element} node	A DOM Element to inspect the name of.
   * @param {String} nodeName	Unnormalized name to compare against.
   */
  function isNamedNode(node, nodeName) {
    return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
  }

  /**
   * Create an element with the given nodeName.
   * @param {string} nodeName The DOM node to create
   * @param {boolean} [isSvg=false] If `true`, creates an element within the SVG
   *  namespace.
   * @returns {Element} The created DOM node
   */
  function createNode(nodeName, isSvg) {
    /** @type {Element} */
    var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
    node.normalizedNodeName = nodeName;
    return node;
  }

  /**
   * Remove a child node from its parent if attached.
   * @param {Node} node The node to remove
   */
  function removeNode(node) {
    var parentNode = node.parentNode;
    if (parentNode) parentNode.removeChild(node);
  }

  /**
   * Set a named attribute on the given Node, with special behavior for some names
   * and event handlers. If `value` is `null`, the attribute/handler will be
   * removed.
   * @param {Element} node An element to mutate
   * @param {string} name The name/key to set, such as an event or attribute name
   * @param {*} old The last value that was set for this name/node pair
   * @param {*} value An attribute value, such as a function to be used as an
   *  event handler
   * @param {boolean} isSvg Are we currently diffing inside an svg?
   * @private
   */
  function setAccessor(node, name, old, value, isSvg) {
    if (name === 'className') name = 'class';

    if (name === 'key') {
      // ignore
    } else if (name === 'ref') {
      applyRef(old, null);
      applyRef(value, node);
    } else if (name === 'class' && !isSvg) {
      node.className = value || '';
    } else if (name === 'style') {
      if (!value || typeof value === 'string' || typeof old === 'string') {
        node.style.cssText = value || '';
      }
      if (value && typeof value === 'object') {
        if (typeof old !== 'string') {
          for (var i in old) {
            if (!(i in value)) node.style[i] = '';
          }
        }
        for (var i in value) {
          node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? value[i] + 'px' : value[i];
        }
      }
    } else if (name === 'dangerouslySetInnerHTML') {
      if (value) node.innerHTML = value.__html || '';
    } else if (name[0] == 'o' && name[1] == 'n') {
      var useCapture = name !== (name = name.replace(/Capture$/, ''));
      name = name.toLowerCase().substring(2);
      if (value) {
        if (!old) {
          node.addEventListener(name, eventProxy, useCapture);
          if (name == 'tap') {
            node.addEventListener('touchstart', touchStart, useCapture);
            node.addEventListener('touchstart', touchEnd, useCapture);
          }
        }
      } else {
        node.removeEventListener(name, eventProxy, useCapture);
        if (name == 'tap') {
          node.removeEventListener('touchstart', touchStart, useCapture);
          node.removeEventListener('touchstart', touchEnd, useCapture);
        }
      }
  (node._listeners || (node._listeners = {}))[name] = value;
    } else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
      // Attempt to set a DOM property to the given value.
      // IE & FF throw for certain property-value combinations.
      try {
        node[name] = value == null ? '' : value;
      } catch (e) {}
      if ((value == null || value === false) && name != 'spellcheck') node.removeAttribute(name);
    } else {
      var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
      // spellcheck is treated differently than all other boolean values and
      // should not be removed when the value is `false`. See:
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-spellcheck
      if (value == null || value === false) {
        if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());else node.removeAttribute(name);
      } else if (typeof value === 'string') {
        if (ns) {
          node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);
        } else {
          node.setAttribute(name, value);
        }
      }
    }
  }

  /**
   * Proxy an event to hooked event handlers
   * @param {Event} e The event object from the browser
   * @private
   */
  function eventProxy(e) {
    return this._listeners[e.type](options.event && options.event(e) || e);
  }

  function touchStart(e) {
    this.___touchX = e.touches[0].pageX;
    this.___touchY = e.touches[0].pageY;
    this.___scrollTop = document.body.scrollTop;
  }

  function touchEnd(e) {
    if (Math.abs(e.changedTouches[0].pageX - this.___touchX) < 30 && Math.abs(e.changedTouches[0].pageY - this.___touchY) < 30 && Math.abs(document.body.scrollTop - this.___scrollTop) < 30) {
      this.dispatchEvent(new CustomEvent('tap', { detail: e }));
    }
  }

  /** Diff recursion count, used to track the end of the diff cycle. */
  var diffLevel = 0;

  /** Global flag indicating if the diff is currently within an SVG */
  var isSvgMode = false;

  /** Global flag indicating if the diff is performing hydration */
  var hydrating = false;

  /** Apply differences in a given vnode (and it's deep children) to a real DOM Node.
   *	@param {Element} [dom=null]		A DOM node to mutate into the shape of the `vnode`
   *	@param {VNode} vnode			A VNode (with descendants forming a tree) representing the desired DOM structure
   *	@returns {Element} dom			The created/mutated element
   *	@private
   */
  function diff(dom, vnode, context, mountAll, parent, componentRoot) {
    // diffLevel having been 0 here indicates initial entry into the diff (not a subdiff)
    var ret;
    if (!diffLevel++) {
      // when first starting the diff, check if we're diffing an SVG or within an SVG
      isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

      // hydration is indicated by the existing element to be diffed not having a prop cache
      hydrating = dom != null && !('__omiattr_' in dom);
    }
    if (isArray(vnode)) {
      ret = [];
      var parentNode = null;
      if (isArray(dom)) {
        var domLength = dom.length;
        var vnodeLength = vnode.length;
        var maxLength = domLength >= vnodeLength ? domLength : vnodeLength;
        parentNode = dom[0].parentNode;
        for (var i = 0; i < maxLength; i++) {
          var ele = idiff(dom[i], vnode[i], context, mountAll, componentRoot);
          ret.push(ele);
          if (i > domLength - 1) {
            parentNode.appendChild(ele);
          }
        }
      } else {
        vnode.forEach(function (item) {
          var ele = idiff(dom, item, context, mountAll, componentRoot);
          ret.push(ele);
          parent && parent.appendChild(ele);
        });
      }
    } else {
      if (isArray(dom)) {
        ret = idiff(dom[0], vnode, context, mountAll, componentRoot);
      } else {
        ret = idiff(dom, vnode, context, mountAll, componentRoot);
      }
      // append the element if its a new parent
      if (parent && ret.parentNode !== parent) parent.appendChild(ret);
    }

    // diffLevel being reduced to 0 means we're exiting the diff
    if (! --diffLevel) {
      hydrating = false;
      // invoke queued componentDidMount lifecycle methods
    }

    return ret;
  }

  /** Internals of `diff()`, separated to allow bypassing diffLevel / mount flushing. */
  function idiff(dom, vnode, context, mountAll, componentRoot) {
    if (dom && vnode && dom.props) {
      dom.props.children = vnode.children;
    }
    var out = dom,
        prevSvgMode = isSvgMode;

    // empty values (null, undefined, booleans) render as empty Text nodes
    if (vnode == null || typeof vnode === 'boolean') vnode = '';

    // Fast case: Strings & Numbers create/update Text nodes.
    if (typeof vnode === 'string' || typeof vnode === 'number') {
      // update if it's already a Text node:
      if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
        /* istanbul ignore if */ /* Browser quirk that can't be covered: https://github.com/developit/preact/commit/fd4f21f5c45dfd75151bd27b4c217d8003aa5eb9 */
        if (dom.nodeValue != vnode) {
          dom.nodeValue = vnode;
        }
      } else {
        // it wasn't a Text node: replace it with one and recycle the old Element
        out = document.createTextNode(vnode);
        if (dom) {
          if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
          recollectNodeTree(dom, true);
        }
      }

      out['__omiattr_'] = true;

      return out;
    }

    // If the VNode represents a Component, perform a component diff:
    var vnodeName = vnode.nodeName;

    // Tracks entering and exiting SVG namespace when descending through the tree.
    isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;

    // If there's no existing element or it's the wrong type, create a new one:
    vnodeName = String(vnodeName);
    if (!dom || !isNamedNode(dom, vnodeName)) {
      out = createNode(vnodeName, isSvgMode);

      if (dom) {
        // move children into the replacement node
        while (dom.firstChild) {
          out.appendChild(dom.firstChild);
        } // if the previous Element was mounted into the DOM, replace it inline
        if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

        // recycle the old element (skips non-Element node types)
        recollectNodeTree(dom, true);
      }
    }

    var fc = out.firstChild,
        props = out['__omiattr_'],
        vchildren = vnode.children;

    if (props == null) {
      props = out['__omiattr_'] = {};
      for (var a = out.attributes, i = a.length; i--;) {
        props[a[i].name] = a[i].value;
      }
    }

    // Optimization: fast-path for elements containing a single TextNode:
    if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
      if (fc.nodeValue != vchildren[0]) {
        fc.nodeValue = vchildren[0];
      }
    }
    // otherwise, if there are existing or new children, diff them:
    else if (vchildren && vchildren.length || fc != null) {
        if (!(out.constructor.is == 'WeElement' && out.constructor.noSlot)) {
          innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
        }
      }

    // Apply attributes/props from VNode to the DOM Element:
    diffAttributes(out, vnode.attributes, props, vnode.children);
    if (out.props) {
      out.props.children = vnode.children;
    }
    // restore previous SVG mode: (in case we're exiting an SVG namespace)
    isSvgMode = prevSvgMode;

    return out;
  }

  /** Apply child and attribute changes between a VNode and a DOM Node to the DOM.
   *	@param {Element} dom			Element whose children should be compared & mutated
   *	@param {Array} vchildren		Array of VNodes to compare to `dom.childNodes`
   *	@param {Object} context			Implicitly descendant context object (from most recent `getChildContext()`)
   *	@param {Boolean} mountAll
   *	@param {Boolean} isHydrating	If `true`, consumes externally created elements similar to hydration
   */
  function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
    var originalChildren = dom.childNodes,
        children = [],
        keyed = {},
        keyedLen = 0,
        min = 0,
        len = originalChildren.length,
        childrenLen = 0,
        vlen = vchildren ? vchildren.length : 0,
        j,
        c,
        f,
        vchild,
        child;

    // Build up a map of keyed children and an Array of unkeyed children:
    if (len !== 0) {
      for (var i = 0; i < len; i++) {
        var _child = originalChildren[i],
            props = _child['__omiattr_'],
            key = vlen && props ? _child._component ? _child._component.__key : props.key : null;
        if (key != null) {
          keyedLen++;
          keyed[key] = _child;
        } else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
          children[childrenLen++] = _child;
        }
      }
    }

    if (vlen !== 0) {
      for (var i = 0; i < vlen; i++) {
        vchild = vchildren[i];
        child = null;

        // attempt to find a node based on key matching
        var key = vchild.key;
        if (key != null) {
          if (keyedLen && keyed[key] !== undefined) {
            child = keyed[key];
            keyed[key] = undefined;
            keyedLen--;
          }
        }
        // attempt to pluck a node of the same type from the existing children
        else if (!child && min < childrenLen) {
            for (j = min; j < childrenLen; j++) {
              if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
                child = c;
                children[j] = undefined;
                if (j === childrenLen - 1) childrenLen--;
                if (j === min) min++;
                break;
              }
            }
          }

        // morph the matched/found/created DOM child to match vchild (deep)
        child = idiff(child, vchild, context, mountAll);

        f = originalChildren[i];
        if (child && child !== dom && child !== f) {
          if (f == null) {
            dom.appendChild(child);
          } else if (child === f.nextSibling) {
            removeNode(f);
          } else {
            dom.insertBefore(child, f);
          }
        }
      }
    }

    // remove unused keyed children:
    if (keyedLen) {
      for (var i in keyed) {
        if (keyed[i] !== undefined) recollectNodeTree(keyed[i], false);
      }
    }

    // remove orphaned unkeyed children:
    while (min <= childrenLen) {
      if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
    }
  }

  /** Recursively recycle (or just unmount) a node and its descendants.
   *	@param {Node} node						DOM node to start unmount/removal from
   *	@param {Boolean} [unmountOnly=false]	If `true`, only triggers unmount lifecycle, skips removal
   */
  function recollectNodeTree(node, unmountOnly) {
    // If the node's VNode had a ref function, invoke it with null here.
    // (this is part of the React spec, and smart for unsetting references)
    if (node['__omiattr_'] != null && node['__omiattr_'].ref) node['__omiattr_'].ref(null);

    if (unmountOnly === false || node['__omiattr_'] == null) {
      removeNode(node);
    }

    removeChildren(node);
  }

  /** Recollect/unmount all children.
   *	- we use .lastChild here because it causes less reflow than .firstChild
   *	- it's also cheaper than accessing the .childNodes Live NodeList
   */
  function removeChildren(node) {
    node = node.lastChild;
    while (node) {
      var next = node.previousSibling;
      recollectNodeTree(node, true);
      node = next;
    }
  }

  /** Apply differences in attributes from a VNode to the given DOM Element.
   *	@param {Element} dom		Element with attributes to diff `attrs` against
   *	@param {Object} attrs		The desired end-state key-value attribute pairs
   *	@param {Object} old			Current/previous attributes (from previous VNode or element's prop cache)
   */
  function diffAttributes(dom, attrs, old, children) {
    var name;
    var update = false;
    var isWeElement = dom.update;
    // remove attributes no longer present on the vnode by setting them to undefined
    for (name in old) {
      if (!(attrs && attrs[name] != null) && old[name] != null) {
        setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
        if (isWeElement) {
          delete dom.props[name];
          update = true;
        }
      }
    }

    // add new & update changed attributes
    for (name in attrs) {
      //diable when using store system?
      //!dom.store &&
      if (isWeElement && typeof attrs[name] === 'object') {
        dom.props[npn(name)] = attrs[name];
        update = true;
      } else if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
        setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
        if (isWeElement) {
          dom.props[npn(name)] = attrs[name];
          update = true;
        }
      }
    }

    if (isWeElement && dom.parentNode) {
      if (update || children.length > 0) {
        dom.receiveProps(dom.props, dom.data);
        dom.update();
      }
    }
  }

  /*!
   * https://github.com/Palindrom/JSONPatcherProxy
   * (c) 2017 Starcounter
   * MIT license
   */

  /** Class representing a JS Object observer  */
  var JSONPatcherProxy = function () {
    /**
     * Deep clones your object and returns a new object.
     */
    function deepClone(obj) {
      switch (typeof obj) {
        case 'object':
          return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
        case 'undefined':
          return null; //this is how JSON.stringify behaves for array items
        default:
          return obj; //no need to clone primitives
      }
    }
    JSONPatcherProxy.deepClone = deepClone;

    function escapePathComponent(str) {
      if (str.indexOf('/') == -1 && str.indexOf('~') == -1) return str;
      return str.replace(/~/g, '~0').replace(/\//g, '~1');
    }
    JSONPatcherProxy.escapePathComponent = escapePathComponent;

    /**
     * Walk up the parenthood tree to get the path
     * @param {JSONPatcherProxy} instance
     * @param {Object} obj the object you need to find its path
     */
    function findObjectPath(instance, obj) {
      var pathComponents = [];
      var parentAndPath = instance.parenthoodMap.get(obj);
      while (parentAndPath && parentAndPath.path) {
        // because we're walking up-tree, we need to use the array as a stack
        pathComponents.unshift(parentAndPath.path);
        parentAndPath = instance.parenthoodMap.get(parentAndPath.parent);
      }
      if (pathComponents.length) {
        var path = pathComponents.join('/');
        return '/' + path;
      }
      return '';
    }
    /**
     * A callback to be used as th proxy set trap callback.
     * It updates parenthood map if needed, proxifies nested newly-added objects, calls default callbacks with the changes occurred.
     * @param {JSONPatcherProxy} instance JSONPatcherProxy instance
     * @param {Object} target the affected object
     * @param {String} key the effect property's name
     * @param {Any} newValue the value being set
     */
    function setTrap(instance, target, key, newValue) {
      var parentPath = findObjectPath(instance, target);

      var destinationPropKey = parentPath + '/' + escapePathComponent(key);

      if (instance.proxifiedObjectsMap.has(newValue)) {
        var newValueOriginalObject = instance.proxifiedObjectsMap.get(newValue);

        instance.parenthoodMap.set(newValueOriginalObject.originalObject, {
          parent: target,
          path: key
        });
      }
      /*
          mark already proxified values as inherited.
          rationale: proxy.arr.shift()
          will emit
          {op: replace, path: '/arr/1', value: arr_2}
          {op: remove, path: '/arr/2'}
           by default, the second operation would revoke the proxy, and this renders arr revoked.
          That's why we need to remember the proxies that are inherited.
        */
      var revokableInstance = instance.proxifiedObjectsMap.get(newValue);
      /*
      Why do we need to check instance.isProxifyingTreeNow?
       We need to make sure we mark revokables as inherited ONLY when we're observing,
      because throughout the first proxification, a sub-object is proxified and then assigned to
      its parent object. This assignment of a pre-proxified object can fool us into thinking
      that it's a proxified object moved around, while in fact it's the first assignment ever.
       Checking isProxifyingTreeNow ensures this is not happening in the first proxification,
      but in fact is is a proxified object moved around the tree
      */
      if (revokableInstance && !instance.isProxifyingTreeNow) {
        revokableInstance.inherited = true;
      }

      // if the new value is an object, make sure to watch it
      if (newValue && typeof newValue == 'object' && !instance.proxifiedObjectsMap.has(newValue)) {
        instance.parenthoodMap.set(newValue, {
          parent: target,
          path: key
        });
        newValue = instance._proxifyObjectTreeRecursively(target, newValue, key);
      }
      // let's start with this operation, and may or may not update it later
      var operation = {
        op: 'remove',
        path: destinationPropKey
      };
      if (typeof newValue == 'undefined') {
        // applying De Morgan's laws would be a tad faster, but less readable
        if (!Array.isArray(target) && !target.hasOwnProperty(key)) {
          // `undefined` is being set to an already undefined value, keep silent
          return Reflect.set(target, key, newValue);
        }
        // when array element is set to `undefined`, should generate replace to `null`
        if (Array.isArray(target)) {
  operation.op = 'replace', operation.value = null;
        }
        var oldValue = instance.proxifiedObjectsMap.get(target[key]);
        // was the deleted a proxified object?
        if (oldValue) {
          instance.parenthoodMap.delete(target[key]);
          instance.disableTrapsForProxy(oldValue);
          instance.proxifiedObjectsMap.delete(oldValue);
        }
      } else {
        if (Array.isArray(target) && !Number.isInteger(+key.toString())) {
          /* array props (as opposed to indices) don't emit any patches, to avoid needless `length` patches */
          if (key != 'length') {
            console.warn('JSONPatcherProxy noticed a non-integer prop was set for an array. This will not emit a patch');
          }
          return Reflect.set(target, key, newValue);
        }
        operation.op = 'add';
        if (target.hasOwnProperty(key)) {
          if (typeof target[key] !== 'undefined' || Array.isArray(target)) {
            operation.op = 'replace'; // setting `undefined` array elements is a `replace` op
          }
        }
        operation.value = newValue;
      }
      operation.oldValue = target[key];
      var reflectionResult = Reflect.set(target, key, newValue);
      instance.defaultCallback(operation);
      return reflectionResult;
    }
    /**
     * A callback to be used as th proxy delete trap callback.
     * It updates parenthood map if needed, calls default callbacks with the changes occurred.
     * @param {JSONPatcherProxy} instance JSONPatcherProxy instance
     * @param {Object} target the effected object
     * @param {String} key the effected property's name
     */
    function deleteTrap(instance, target, key) {
      if (typeof target[key] !== 'undefined') {
        var parentPath = findObjectPath(instance, target);
        var destinationPropKey = parentPath + '/' + escapePathComponent(key);

        var revokableProxyInstance = instance.proxifiedObjectsMap.get(target[key]);

        if (revokableProxyInstance) {
          if (revokableProxyInstance.inherited) {
            /*
              this is an inherited proxy (an already proxified object that was moved around),
              we shouldn't revoke it, because even though it was removed from path1, it is still used in path2.
              And we know that because we mark moved proxies with `inherited` flag when we move them
               it is a good idea to remove this flag if we come across it here, in deleteProperty trap.
              We DO want to revoke the proxy if it was removed again.
            */
            revokableProxyInstance.inherited = false;
          } else {
            instance.parenthoodMap.delete(revokableProxyInstance.originalObject);
            instance.disableTrapsForProxy(revokableProxyInstance);
            instance.proxifiedObjectsMap.delete(target[key]);
          }
        }
        var reflectionResult = Reflect.deleteProperty(target, key);

        instance.defaultCallback({
          op: 'remove',
          path: destinationPropKey
        });

        return reflectionResult;
      }
    }
    /* pre-define resume and pause functions to enhance constructors performance */
    function resume() {
      var _this = this;

      this.defaultCallback = function (operation) {
        _this.isRecording && _this.patches.push(operation);
        _this.userCallback && _this.userCallback(operation);
      };
      this.isObserving = true;
    }
    function pause() {
      this.defaultCallback = function () {};
      this.isObserving = false;
    }
    /**
     * Creates an instance of JSONPatcherProxy around your object of interest `root`.
     * @param {Object|Array} root - the object you want to wrap
     * @param {Boolean} [showDetachedWarning = true] - whether to log a warning when a detached sub-object is modified @see {@link https://github.com/Palindrom/JSONPatcherProxy#detached-objects}
     * @returns {JSONPatcherProxy}
     * @constructor
     */
    function JSONPatcherProxy(root, showDetachedWarning) {
      this.isProxifyingTreeNow = false;
      this.isObserving = false;
      this.proxifiedObjectsMap = new Map();
      this.parenthoodMap = new Map();
      // default to true
      if (typeof showDetachedWarning !== 'boolean') {
        showDetachedWarning = true;
      }

      this.showDetachedWarning = showDetachedWarning;
      this.originalObject = root;
      this.cachedProxy = null;
      this.isRecording = false;
      this.userCallback;
      /**
       * @memberof JSONPatcherProxy
       * Restores callback back to the original one provided to `observe`.
       */
      this.resume = resume.bind(this);
      /**
       * @memberof JSONPatcherProxy
       * Replaces your callback with a noop function.
       */
      this.pause = pause.bind(this);
    }

    JSONPatcherProxy.prototype.generateProxyAtPath = function (parent, obj, path) {
      var _this2 = this;

      if (!obj) {
        return obj;
      }
      var traps = {
        set: function set(target, key, value, receiver) {
          return setTrap(_this2, target, key, value, receiver);
        },
        deleteProperty: function deleteProperty(target, key) {
          return deleteTrap(_this2, target, key);
        }
      };
      var revocableInstance = Proxy.revocable(obj, traps);
      // cache traps object to disable them later.
      revocableInstance.trapsInstance = traps;
      revocableInstance.originalObject = obj;

      /* keeping track of object's parent and path */

      this.parenthoodMap.set(obj, { parent: parent, path: path });

      /* keeping track of all the proxies to be able to revoke them later */
      this.proxifiedObjectsMap.set(revocableInstance.proxy, revocableInstance);
      return revocableInstance.proxy;
    };
    // grab tree's leaves one by one, encapsulate them into a proxy and return
    JSONPatcherProxy.prototype._proxifyObjectTreeRecursively = function (parent, root, path) {
      for (var key in root) {
        if (root.hasOwnProperty(key)) {
          if (root[key] instanceof Object) {
            root[key] = this._proxifyObjectTreeRecursively(root, root[key], escapePathComponent(key));
          }
        }
      }
      return this.generateProxyAtPath(parent, root, path);
    };
    // this function is for aesthetic purposes
    JSONPatcherProxy.prototype.proxifyObjectTree = function (root) {
      /*
      while proxyifying object tree,
      the proxyifying operation itself is being
      recorded, which in an unwanted behavior,
      that's why we disable recording through this
      initial process;
      */
      this.pause();
      this.isProxifyingTreeNow = true;
      var proxifiedObject = this._proxifyObjectTreeRecursively(undefined, root, '');
      /* OK you can record now */
      this.isProxifyingTreeNow = false;
      this.resume();
      return proxifiedObject;
    };
    /**
     * Turns a proxified object into a forward-proxy object; doesn't emit any patches anymore, like a normal object
     * @param {Proxy} proxy - The target proxy object
     */
    JSONPatcherProxy.prototype.disableTrapsForProxy = function (revokableProxyInstance) {
      if (this.showDetachedWarning) {
        var message = "You're accessing an object that is detached from the observedObject tree, see https://github.com/Palindrom/JSONPatcherProxy#detached-objects";

        revokableProxyInstance.trapsInstance.set = function (targetObject, propKey, newValue) {
          console.warn(message);
          return Reflect.set(targetObject, propKey, newValue);
        };
        revokableProxyInstance.trapsInstance.set = function (targetObject, propKey, newValue) {
          console.warn(message);
          return Reflect.set(targetObject, propKey, newValue);
        };
        revokableProxyInstance.trapsInstance.deleteProperty = function (targetObject, propKey) {
          return Reflect.deleteProperty(targetObject, propKey);
        };
      } else {
        delete revokableProxyInstance.trapsInstance.set;
        delete revokableProxyInstance.trapsInstance.get;
        delete revokableProxyInstance.trapsInstance.deleteProperty;
      }
    };
    /**
     * Proxifies the object that was passed in the constructor and returns a proxified mirror of it. Even though both parameters are options. You need to pass at least one of them.
     * @param {Boolean} [record] - whether to record object changes to a later-retrievable patches array.
     * @param {Function} [callback] - this will be synchronously called with every object change with a single `patch` as the only parameter.
     */
    JSONPatcherProxy.prototype.observe = function (record, callback) {
      if (!record && !callback) {
        throw new Error('You need to either record changes or pass a callback');
      }
      this.isRecording = record;
      this.userCallback = callback;
      /*
      I moved it here to remove it from `unobserve`,
      this will also make the constructor faster, why initiate
      the array before they decide to actually observe with recording?
      They might need to use only a callback.
      */
      if (record) this.patches = [];
      this.cachedProxy = this.proxifyObjectTree(this.originalObject);
      return this.cachedProxy;
    };
    /**
     * If the observed is set to record, it will synchronously return all the patches and empties patches array.
     */
    JSONPatcherProxy.prototype.generate = function () {
      if (!this.isRecording) {
        throw new Error('You should set record to true to get patches later');
      }
      return this.patches.splice(0, this.patches.length);
    };
    /**
     * Revokes all proxies rendering the observed object useless and good for garbage collection @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable}
     */
    JSONPatcherProxy.prototype.revoke = function () {
      this.proxifiedObjectsMap.forEach(function (el) {
        el.revoke();
      });
    };
    /**
     * Disables all proxies' traps, turning the observed object into a forward-proxy object, like a normal object that you can modify silently.
     */
    JSONPatcherProxy.prototype.disableTraps = function () {
      this.proxifiedObjectsMap.forEach(this.disableTrapsForProxy, this);
    };
    return JSONPatcherProxy;
  }();

  var callbacks = [];
  var nextTickCallback = [];

  function tick(fn, scope) {
    callbacks.push({ fn: fn, scope: scope });
  }

  function fireTick() {
    callbacks.forEach(function (item) {
      item.fn.call(item.scope);
    });

    nextTickCallback.forEach(function (nextItem) {
      nextItem.fn.call(nextItem.scope);
    });
    nextTickCallback.length = 0;
  }

  function nextTick(fn, scope) {
    nextTickCallback.push({ fn: fn, scope: scope });
  }

  function observe(target) {
    target.observe = true;
  }

  function proxyUpdate(ele) {
    var timeout = null;
    ele.data = new JSONPatcherProxy(ele.data).observe(false, function (info) {
      if (ele._willUpdate || info.op === 'replace' && info.oldValue === info.value) {
        return;
      }

      clearTimeout(timeout);

      timeout = setTimeout(function () {
        ele.update();
        fireTick();
      }, 0);
    });
  }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var id = 0;

  var WeElement = function (_HTMLElement) {
    _inherits(WeElement, _HTMLElement);

    function WeElement() {
      _classCallCheck(this, WeElement);

      var _this = _possibleConstructorReturn(this, _HTMLElement.call(this));

      _this.props = Object.assign(nProps(_this.constructor.props), _this.constructor.defaultProps);
      _this.__elementId = id++;
      _this.data = _this.constructor.data || {};
      return _this;
    }

    WeElement.prototype.connectedCallback = function connectedCallback() {
      if (!this.constructor.pure) {
        var p = this.parentNode;
        while (p && !this.store) {
          this.store = p.store;
          p = p.parentNode || p.host;
        }
        if (this.store) {
          this.store.instances.push(this);
        }
      }

      !this._isInstalled && this.install();
      var shadowRoot;
      if (!this.shadowRoot) {
        shadowRoot = this.attachShadow({
          mode: 'open'
        });
      } else {
        shadowRoot = this.shadowRoot;
        var fc;
        while (fc = shadowRoot.firstChild) {
          shadowRoot.removeChild(fc);
        }
      }

      this.css && shadowRoot.appendChild(cssToDom(this.css()));
      !this._isInstalled && this.beforeRender();
      options.afterInstall && options.afterInstall(this);
      if (this.constructor.observe) {
        proxyUpdate(this);
      }
      this.host = diff(null, this.render(this.props, this.data, this.store), {}, false, null, false);
      if (isArray(this.host)) {
        this.host.forEach(function (item) {
          shadowRoot.appendChild(item);
        });
      } else {
        shadowRoot.appendChild(this.host);
      }
      !this._isInstalled && this.installed();
      this._isInstalled = true;
    };

    WeElement.prototype.disconnectedCallback = function disconnectedCallback() {
      this.uninstall();
      if (this.store) {
        for (var i = 0, len = this.store.instances.length; i < len; i++) {
          if (this.store.instances[i] === this) {
            this.store.instances.splice(i, 1);
            break;
          }
        }
      }
    };

    WeElement.prototype.update = function update() {
      this._willUpdate = true;
      this.beforeUpdate();
      this.beforeRender();
      this.host = diff(this.host, this.render(this.props, this.data, this.store), null, null, this.shadowRoot);
      this.afterUpdate();
      this._willUpdate = false;
    };

    WeElement.prototype.fire = function fire(name, data) {
      this.dispatchEvent(new CustomEvent(name, { detail: data }));
    };

    WeElement.prototype.install = function install() {};

    WeElement.prototype.installed = function installed() {};

    WeElement.prototype.uninstall = function uninstall() {};

    WeElement.prototype.beforeUpdate = function beforeUpdate() {};

    WeElement.prototype.afterUpdate = function afterUpdate() {};

    WeElement.prototype.beforeRender = function beforeRender() {};

    WeElement.prototype.receiveProps = function receiveProps() {};

    return WeElement;
  }(HTMLElement);

  WeElement.is = 'WeElement';

  function render(vnode, parent, store) {
    parent = typeof parent === 'string' ? document.querySelector(parent) : parent;
    if (store) {
      store.instances = [];
      extendStoreUpate(store);
      var timeout = null;
      var patchs = {};
      store.data = new JSONPatcherProxy(store.data).observe(false, function (patch) {
        clearTimeout(timeout);
        if (patch.op === 'remove') {
          // fix arr splice
          var kv = getArrayPatch(patch.path, store);
          patchs[kv.k] = kv.v;
          timeout = setTimeout(function () {
            update(patchs, store);
            patchs = {};
          }, 0);
        } else {
          var key = fixPath(patch.path);
          patchs[key] = patch.value;
          timeout = setTimeout(function () {
            update(patchs, store);
            patchs = {};
          }, 0);
        }
      });
      parent.store = store;
    }
    return diff(null, vnode, {}, false, parent, false);
  }

  function update(patch, store) {
    store.update(patch);
  }

  function extendStoreUpate(store) {
    store.update = function (patch) {
      var _this = this;

      var updateAll = matchGlobalData(this.globalData, patch);

      if (Object.keys(patch).length > 0) {
        this.instances.forEach(function (instance) {
          if (updateAll || _this.updateAll || instance.constructor.updatePath && needUpdate(patch, instance.constructor.updatePath)) {
            instance.update();
          }
        });
        this.onChange && this.onChange(patch);
      }
    };
  }

  function matchGlobalData(globalData, diffResult) {
    if (!globalData) return false;
    for (var keyA in diffResult) {
      if (globalData.indexOf(keyA) > -1) {
        return true;
      }
      for (var i = 0, len = globalData.length; i < len; i++) {
        if (includePath(keyA, globalData[i])) {
          return true;
        }
      }
    }
    return false;
  }

  function needUpdate(diffResult, updatePath) {
    for (var keyA in diffResult) {
      if (updatePath[keyA]) {
        return true;
      }
      for (var keyB in updatePath) {
        if (includePath(keyA, keyB)) {
          return true;
        }
      }
    }
    return false;
  }

  function includePath(pathA, pathB) {
    if (pathA.indexOf(pathB) === 0) {
      var next = pathA.substr(pathB.length, 1);
      if (next === '[' || next === '.') {
        return true;
      }
    }
    return false;
  }

  function fixPath(path) {
    var mpPath = '';
    var arr = path.replace('/', '').split('/');
    arr.forEach(function (item, index) {
      if (index) {
        if (isNaN(Number(item))) {
          mpPath += '.' + item;
        } else {
          mpPath += '[' + item + ']';
        }
      } else {
        mpPath += item;
      }
    });
    return mpPath;
  }

  function getArrayPatch(path, store) {
    var arr = path.replace('/', '').split('/');
    var current = store.data[arr[0]];
    for (var i = 1, len = arr.length; i < len - 1; i++) {
      current = current[arr[i]];
    }
    return { k: fixArrPath(path), v: current };
  }

  function fixArrPath(path) {
    var mpPath = '';
    var arr = path.replace('/', '').split('/');
    var len = arr.length;
    arr.forEach(function (item, index) {
      if (index < len - 1) {
        if (index) {
          if (isNaN(Number(item))) {
            mpPath += '.' + item;
          } else {
            mpPath += '[' + item + ']';
          }
        } else {
          mpPath += item;
        }
      }
    });
    return mpPath;
  }

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function define(name, ctor) {
    if (ctor.is === 'WeElement') {
      customElements.define(name, ctor);
      if (ctor.data && !ctor.pure) {
        ctor.updatePath = getUpdatePath(ctor.data);
      }
    } else {
      var Element = function (_WeElement) {
        _inherits$1(Element, _WeElement);

        function Element() {
          var _temp, _this, _ret;

          _classCallCheck$1(this, Element);

          for (var _len = arguments.length, args = Array(_len), key = 0; key < _len; key++) {
            args[key] = arguments[key];
          }

          return _ret = (_temp = (_this = _possibleConstructorReturn$1(this, _WeElement.call.apply(_WeElement, [this].concat(args))), _this), _this._useId = 0, _this._useMap = {}, _temp), _possibleConstructorReturn$1(_this, _ret);
        }

        Element.prototype.render = function render(props, data) {
          return ctor.call(this, props, data);
        };

        Element.prototype.beforeRender = function beforeRender() {
          this._useId = 0;
        };

        Element.prototype.useCss = function useCss(css) {
          var style = this.shadowRoot.querySelector('style');
          style && this.shadowRoot.removeChild(style);
          this.shadowRoot.appendChild(cssToDom(css));
        };

        Element.prototype.useData = function useData(data) {
          return this.use({ data: data });
        };

        Element.prototype.use = function use(option) {
          var _this2 = this;

          this._useId++;
          var updater = function updater(newValue) {
            var item = _this2._useMap[updater.id];

            item.data = newValue;

            _this2.update();
            item.effect && item.effect();
          };

          updater.id = this._useId;
          if (!this._isInstalled) {
            this._useMap[this._useId] = option;
            return [option.data, updater];
          }

          return [this._useMap[this._useId].data, updater];
        };

        Element.prototype.installed = function installed() {
          this._isInstalled = true;
        };

        return Element;
      }(WeElement);

      customElements.define(name, Element);
    }
  }

  function getUpdatePath(data) {
    var result = {};
    dataToPath(data, result);
    return result;
  }

  function dataToPath(data, result) {
    Object.keys(data).forEach(function (key) {
      result[key] = true;
      var type = Object.prototype.toString.call(data[key]);
      if (type === '[object Object]') {
        _objToPath(data[key], key, result);
      } else if (type === '[object Array]') {
        _arrayToPath(data[key], key, result);
      }
    });
  }

  function _objToPath(data, path, result) {
    Object.keys(data).forEach(function (key) {
      result[path + '.' + key] = true;
      delete result[path];
      var type = Object.prototype.toString.call(data[key]);
      if (type === '[object Object]') {
        _objToPath(data[key], path + '.' + key, result);
      } else if (type === '[object Array]') {
        _arrayToPath(data[key], path + '.' + key, result);
      }
    });
  }

  function _arrayToPath(data, path, result) {
    data.forEach(function (item, index) {
      result[path + '[' + index + ']'] = true;
      delete result[path];
      var type = Object.prototype.toString.call(item);
      if (type === '[object Object]') {
        _objToPath(item, path + '[' + index + ']', result);
      } else if (type === '[object Array]') {
        _arrayToPath(item, path + '[' + index + ']', result);
      }
    });
  }

  function tag(name, pure) {
    return function (target) {
      target.pure = pure;
      define(name, target);
    };
  }

  /**
   * Clones the given VNode, optionally adding attributes/props and replacing its children.
   * @param {VNode} vnode		The virtual DOM element to clone
   * @param {Object} props	Attributes/props to add when cloning
   * @param {VNode} rest		Any additional arguments will be used as replacement children.
   */
  function cloneElement(vnode, props) {
    return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
  }

  function getHost(ele) {
    var p = ele.parentNode;
    while (p) {
      if (p.host) {
        return p.host;
      } else {
        p = p.parentNode;
      }
    }
  }

  function rpx(str) {
    return str.replace(/([1-9]\d*|0)(\.\d*)*rpx/g, function (a, b) {
      return window.innerWidth * Number(b) / 750 + 'px';
    });
  }

  var Component = WeElement;

  var omi = {
    tag: tag,
    WeElement: WeElement,
    Component: Component,
    render: render,
    h: h,
    createElement: h,
    options: options,
    define: define,
    observe: observe,
    cloneElement: cloneElement,
    getHost: getHost,
    rpx: rpx,
    tick: tick,
    nextTick: nextTick
  };

  options.root.Omi = omi;
  options.root.Omi.version = '4.1.7';
  //# sourceMappingURL=omi.esm.js.map

  var _css = "div{\r\n  color: rgba(0,0,0,.65);\r\n}\r\n* {\r\n  box-sizing: border-box;\r\n}\r\nul,li{\r\n  padding: 0;\r\n  margin: 0;\r\n}\r\n\r\nli{\r\n  display: inline-block;\r\n  min-width:32px;\r\n  height: 32px;\r\n  border: 1px solid #ccc;\r\n  vertical-align: middle;\r\n  line-height: 32px;\r\n  text-align: center;\r\n  margin: 0 3px 0 3px; \r\n  cursor: pointer;\r\n  border-radius: 3px;\r\n}\r\n\r\n.o-pager{\r\n  display: inline-block;\r\n}\r\n\r\nbutton{\r\n  width: 32px;\r\n  height: 32px;\r\n  appearance: none;\r\n  -webkit-appearance: none;\r\n  position: relative;\r\n  border: 1px solid #ccc;\r\n  background: none;\r\n  top:1px;\r\n  border-radius: 3px;\r\n  cursor: pointer;\r\n}\r\n\r\nbutton:disabled\r\n{ \r\n  border-color: #eee;\r\n  cursor: default;\r\n}\r\n\r\n.more:after{\r\n  content: '...';\r\n}\r\n\r\n.more{\r\n  border: none;\r\n  cursor: default;\r\n}\r\n\r\n.active{\r\n  border-color:#01DE6C;\r\n  color:rgb(4, 161, 80);\r\n}";

  var _class, _temp;

  function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$2(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  define('o-pagination', (_temp = _class = function (_WeElement) {
    _inherits$2(_class, _WeElement);

    function _class() {
      _classCallCheck$2(this, _class);

      return _possibleConstructorReturn$2(this, _WeElement.apply(this, arguments));
    }

    _class.prototype.css = function css() {
      return _css;
    };

    _class.prototype.install = function install() {
      this.data = Object.assign({
        total: 0,
        pageSize: 10,
        numDisplay: 5,
        currentPage: 0,
        numEdge: 3,
        linkTo: '#',
        prevText: 'Prev',
        nextText: 'Next',
        ellipseText: '...',
        prevShow: true,
        nextShow: true
      }, this.props);
      this.pageNum = Math.ceil(this.data.total / this.data.pageSize);
    };

    _class.prototype.receiveProps = function receiveProps(props, data) {
      data = Object.assign(data, props);
    };

    _class.prototype.beforeUpdate = function beforeUpdate() {
      this.pageNum = Math.ceil(this.data.total / this.data.pageSize);
    };

    _class.prototype.beforeRender = function beforeRender() {
      this.pageNum = Math.ceil(this.data.total / this.data.pageSize);
    };

    _class.prototype.goto = function goto(index) {
      this.data.currentPage = index;
      this.props.onChange(index);
      this.update();
    };

    _class.prototype.render = function render$$1() {
      var arr = [];
      var opt = this.data,
          interval = this.getInterval();

      if (interval[0] > 0 && opt.numEdge > 0) {
        var end = Math.min(opt.numEdge, interval[0]);
        for (var i = 0; i < end; i++) {
          arr.push(this.getItem(i, i + 1));
        }

        if (opt.numEdge < interval[0] && opt.ellipseText) {
          arr.push(Omi.h('li', { 'class': 'o-icon more btn-quicknext o-icon-more' }));
        }
      }

      for (var i = interval[0]; i < interval[1]; i++) {
        arr.push(this.getItem(i, i + 1));
      }

      if (interval[1] < this.pageNum && opt.numEdge > 0) {
        if (this.pageNum - opt.numEdge > interval[1] && opt.ellipseText) {
          arr.push(Omi.h('li', { 'class': 'o-icon more btn-quicknext o-icon-more' }));
        }
        var begin = Math.max(this.pageNum - opt.numEdge, interval[1]);
        for (var i = begin; i < this.pageNum; i++) {
          arr.push(this.getItem(i, i + 1));
        }
      }

      return Omi.h(
        'div',
        { 'class': 'o-pagination is-background' },
        opt.prevShow && this.getPrev(),
        ' ',
        Omi.h(
          'ul',
          { 'class': 'o-pager' },
          arr.map(function (p) {
            return p;
          })
        ),
        ' ',
        opt.nextShow && this.getNext()
      );
    };

    _class.prototype.getInterval = function getInterval() {
      var ne_half = Math.ceil(this.data.numDisplay / 2);
      var upper_limit = this.pageNum - this.data.numDisplay;
      var start = this.data.currentPage > ne_half ? Math.max(Math.min(this.data.currentPage - ne_half, upper_limit), 0) : 0;
      var end = this.data.currentPage > ne_half ? Math.min(this.data.currentPage + ne_half, this.pageNum) : Math.min(this.data.numDisplay, this.pageNum);
      return [start, end];
    };

    _class.prototype.getPrev = function getPrev() {
      var _this2 = this;

      if (this.data.currentPage === 0) {
        return Omi.h(
          'button',
          { type: 'button', 'class': 'btn-prev', disabled: 'disabled' },
          Omi.h(
            'svg',
            {
              viewBox: '64 64 896 896',
              'class': '',
              'data-icon': 'left',
              width: '1em',
              height: '1em',
              fill: 'currentColor',
              'aria-hidden': 'true'
            },
            Omi.h('path', { d: 'M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z' })
          )
        );
      }

      return Omi.h(
        'button',
        {
          type: 'button',
          'class': 'btn-prev',
          onclick: function onclick(e) {
            _this2.goto(_this2.data.currentPage - 1);
          }
        },
        Omi.h(
          'svg',
          {
            viewBox: '64 64 896 896',
            'class': '',
            'data-icon': 'left',
            width: '1em',
            height: '1em',
            fill: 'currentColor',
            'aria-hidden': 'true'
          },
          Omi.h('path', { d: 'M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z' })
        )
      );
    };

    _class.prototype.getNext = function getNext() {
      var _this3 = this;

      if (this.data.currentPage === this.pageNum - 1) {
        return Omi.h(
          'button',
          { type: 'button', 'class': 'btn-next', disabled: 'disabled' },
          Omi.h(
            'svg',
            {
              viewBox: '64 64 896 896',
              'class': '',
              'data-icon': 'right',
              width: '1em',
              height: '1em',
              fill: 'currentColor',
              'aria-hidden': 'true'
            },
            Omi.h('path', { d: 'M765.7 486.8L314.9 134.7A7.97 7.97 0 0 0 302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z' })
          )
        );
      }

      return Omi.h(
        'button',
        {
          type: 'button',
          'class': 'btn-next',
          onclick: function onclick(e) {
            _this3.goto(_this3.data.currentPage + 1);
          }
        },
        Omi.h(
          'svg',
          {
            viewBox: '64 64 896 896',
            'class': '',
            'data-icon': 'right',
            width: '1em',
            height: '1em',
            fill: 'currentColor',
            'aria-hidden': 'true'
          },
          Omi.h('path', { d: 'M765.7 486.8L314.9 134.7A7.97 7.97 0 0 0 302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z' })
        )
      );
    };

    _class.prototype.getItem = function getItem(pageIndex, text) {
      var _this4 = this;

      if (this.data.currentPage === pageIndex) {
        return Omi.h(
          'li',
          { 'class': 'number active' },
          text
        );
      }
      return Omi.h(
        'li',
        {
          'class': 'number',
          onclick: function onclick(e) {
            _this4.goto(pageIndex);
          }
        },
        text
      );
    };

    return _class;
  }(WeElement), _class.observe = true, _temp));

  var _css$1 = "span{\r\n  position: absolute;\r\n  border: 1px solid #ccc;\r\n  width: 32px;\r\n  height: 32px;\r\n  background-color: white;\r\n  cursor: pointer;\r\n  text-align: center;\r\n  line-height: 29px;\r\n}\r\n\r\n*{\r\n  box-sizing: border-box;\r\n}\r\n\r\n.decrease{\r\n  left: 1px;\r\n  border-radius: 3px 0px 0px 3px;\r\n}\r\n\r\n.increase{\r\n  right: 1px;\r\n  border-radius: 0px 3px 3px 0px;\r\n}\r\n\r\n.ctn{\r\n  position: relative;\r\n  width: 150px;\r\n}\r\n\r\n.input{\r\n  width: 100%;\r\n}\r\n\r\ninput{\r\n  width:100px;\r\n  height: 32px;\r\n  margin: 0 auto;\r\n  display: block;\r\n  text-align: center;\r\n  border: 1px solid #ccc;\r\n}\r\n";

  function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$3(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$3(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  define('o-adjustment', function (_WeElement) {
    _inherits$3(_class2, _WeElement);

    function _class2() {
      var _temp, _this, _ret;

      _classCallCheck$3(this, _class2);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$3(this, _WeElement.call.apply(_WeElement, [this].concat(args))), _this), _this.minus = function () {
        if (_this.data.mDisabled) return;
        _this.data.value -= _this.props.step;
        _this.data.mDisabled = _this.data.value <= _this.props.min;
        if (_this.data.mDisabled) {
          _this.data.value = _this.props.min;
        }

        _this.data.pDisabled = _this.data.value >= _this.props.max;
        _this.update();
        _this.props.onChange(_this.data.value);
      }, _this.plus = function () {
        if (_this.data.pDisabled) return;
        _this.data.value += _this.props.step;
        _this.data.pDisabled = _this.data.value >= _this.props.max;

        if (_this.data.pDisabled) {
          _this.data.value = _this.props.max;
        }
        _this.data.mDisabled = _this.data.value <= _this.props.min;

        _this.update();
        _this.props.onChange(_this.data.value);
      }, _temp), _possibleConstructorReturn$3(_this, _ret);
    }

    _class2.prototype.css = function css() {
      return _css$1;
    };

    _class2.prototype.install = function install() {
      this.data.value = this.props.value;
    };

    _class2.prototype.render = function render$$1(props, data) {
      return Omi.h(
        'div',
        { 'class': 'ctn' },
        Omi.h(
          'span',
          {
            role: 'button',
            'class': 'decrease' + (data.mDisabled ? ' is-disabled' : ''),
            onClick: this.minus
          },
          '-'
        ),
        Omi.h(
          'span',
          {
            role: 'button',
            'class': 'increase' + (data.pDisabled ? ' is-disabled' : ''),
            onClick: this.plus
          },
          '+'
        ),
        Omi.h(
          'div',
          { 'class': 'input' },
          Omi.h('input', {
            type: 'text',
            autocomplete: 'off',
            'aria-label': '\u63CF\u8FF0\u6587\u5B57',
            max: '10',
            min: '1',
            'class': 'o-input__inner',
            role: 'spinbutton',
            'aria-valuemax': '10',
            'aria-valuemin': '1',
            'aria-valuenow': '1',
            value: data.value,
            'aria-disabled': 'undefined'
          })
        )
      );
    };

    return _class2;
  }(WeElement));

  var _css$2 = ".o-btn{\r\n  height: 30px;\r\n  text-align: center;\r\n  text-decoration: none;\r\n  line-height: 30px;\r\n  font-size: 14px;\r\n  padding: 5px 10px;\r\n  box-sizing: border-box;\r\n  border-radius: 4px; \r\n}\r\n\r\n.primary{\r\n  background-color: #01DE6C;\r\n  color:white;\r\n}\r\n\r\n.default{\r\n  background-color: white;\r\n  color:black;\r\n}\r\n\r\n";

  function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$4(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$4(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  define('o-button', function (_WeElement) {
    _inherits$4(_class, _WeElement);

    function _class() {
      _classCallCheck$4(this, _class);

      return _possibleConstructorReturn$4(this, _WeElement.apply(this, arguments));
    }

    _class.prototype.css = function css() {
      return _css$2;
    };

    _class.prototype.render = function render$$1(props, data) {
      return Omi.h(
        'a',
        { href: 'javascript:;', 'class': 'o-btn ' + (props.type || 'default') },
        props.children[0]
      );
    };

    return _class;
  }(WeElement));

  var _css$3 = ".progress{\r\n  width: 100%;\r\n  height: 12px;\r\n  background-color: #01DE6C;\r\n  border-radius: 6px; \r\n}\r\n\r\n.inner{\r\n  height: 12px;\r\n  width: 60%;\r\n  background-color: white;\r\n  border-radius: 6px; \r\n}";

  var _class$1, _temp$1;

  function _classCallCheck$5(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$5(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$5(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  define('o-progress', (_temp$1 = _class$1 = function (_WeElement) {
    _inherits$5(_class, _WeElement);

    function _class() {
      _classCallCheck$5(this, _class);

      return _possibleConstructorReturn$5(this, _WeElement.apply(this, arguments));
    }

    _class.prototype.css = function css() {
      return _css$3;
    };

    _class.prototype.render = function render$$1(props) {
      return Omi.h(
        'div',
        { 'class': 'progress', style: 'background-color: ' + props.bgColor + ';' },
        Omi.h('div', { 'class': 'inner', style: 'width:' + props.value + '%;background-color: ' + props.innerColor + ';' })
      );
    };

    return _class;
  }(WeElement), _class$1.observe = true, _temp$1));

  var _css$4 = ".ctn{\r\n  font-size: 12px; \r\n  padding-top: 30px;\r\n}\r\n\r\n.item{\r\n  border-left: 1px solid #D9D9D9; \r\n  position: relative;\r\n  height: 50px;\r\n}\r\n\r\n.item:last-child{ \r\n  height: 35px;\r\n}\r\n\r\n.circle{\r\n  border-radius:50%;\r\n  background-color: #D9D9D9;\r\n  width: 6px;\r\n  height: 6px;\r\n  position: absolute;\r\n  top:-3px;\r\n  left:-3px;\r\n}\r\n\r\n.time{\r\n  color: #7C7C7C;\r\n  position: relative;\r\n  top: -8px;\r\n  right: -10px;\r\n}\r\n\r\n.des{\r\n  position: absolute;\r\n  left: 100px;\r\n  top: -8px;\r\n}";

  function _classCallCheck$6(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$6(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$6(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  define('o-timeline', function (_WeElement) {
    _inherits$6(_class, _WeElement);

    function _class() {
      _classCallCheck$6(this, _class);

      return _possibleConstructorReturn$6(this, _WeElement.apply(this, arguments));
    }

    _class.prototype.css = function css() {
      return _css$4;
    };

    _class.prototype.render = function render$$1(props) {
      return Omi.h(
        'div',
        { 'class': 'ctn' },
        Omi.h(
          'div',
          { 'class': 'item' },
          Omi.h('div', { 'class': 'circle' }),
          Omi.h(
            'div',
            { 'class': 'time' },
            Omi.h(
              'div',
              null,
              '2018.11.11'
            ),
            Omi.h(
              'div',
              null,
              '19:05:30'
            )
          ),
          Omi.h(
            'div',
            { 'class': 'des' },
            Omi.h(
              'div',
              null,
              '\u521B\u5EFA\u6D4B\u8BD5\u9879\u76EE'
            ),
            Omi.h(
              'div',
              null,
              '[\u725B\u987F\u503C\u53D6\u6D88\u89C4\u5219]'
            )
          )
        ),
        Omi.h(
          'div',
          { 'class': 'item' },
          Omi.h('div', { 'class': 'circle' }),
          Omi.h(
            'div',
            { 'class': 'time' },
            Omi.h(
              'div',
              null,
              '2018.11.11'
            ),
            Omi.h(
              'div',
              null,
              '19:05:30'
            )
          ),
          Omi.h(
            'div',
            { 'class': 'des' },
            Omi.h(
              'div',
              null,
              '\u521B\u5EFA\u6D4B\u8BD5\u9879\u76EE'
            ),
            Omi.h(
              'div',
              null,
              '[\u725B\u987F\u503C\u53D6\u6D88\u89C4\u5219]'
            )
          )
        ),
        Omi.h(
          'div',
          { 'class': 'item' },
          Omi.h('div', { 'class': 'circle' }),
          Omi.h(
            'div',
            { 'class': 'time' },
            Omi.h(
              'div',
              null,
              '2018.11.11'
            ),
            Omi.h(
              'div',
              null,
              '19:05:30'
            )
          ),
          Omi.h(
            'div',
            { 'class': 'des' },
            Omi.h(
              'div',
              null,
              '\u521B\u5EFA\u6D4B\u8BD5\u9879\u76EE'
            ),
            Omi.h(
              'div',
              null,
              '[\u725B\u987F\u503C\u53D6\u6D88\u89C4\u5219]'
            )
          )
        )
      );
    };

    return _class;
  }(WeElement));

  function _classCallCheck$7(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$7(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$7(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  define('my-app', function (_WeElement) {
    _inherits$7(_class2, _WeElement);

    function _class2() {
      var _temp, _this, _ret;

      _classCallCheck$7(this, _class2);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$7(this, _WeElement.call.apply(_WeElement, [this].concat(args))), _this), _this.onChange = function (v) {
        console.log('page' + v);
      }, _this.onAdjustmentChange = function (v) {
        console.log(v);
      }, _temp), _possibleConstructorReturn$7(_this, _ret);
    }

    _class2.prototype.render = function render$$1() {
      return Omi.h(
        'div',
        null,
        Omi.h('o-pagination', {
          total: 125,
          currentPage: 2,
          pageSize: 10,
          onChange: this.onChange
        }),
        Omi.h('br', null),
        Omi.h('o-adjustment', {
          onChange: this.onAdjustmentChange,
          min: 1,
          max: 10,
          step: 1,
          value: 2,
          label: '\u63CF\u8FF0\u6587\u5B57'
        }),
        Omi.h('br', null),
        Omi.h('o-progress', {
          bgColor: '#ccc',
          innerColor: '#01DE6C',
          value: 50
        }),
        Omi.h('br', null),
        Omi.h('o-timeline', null),
        Omi.h('br', null),
        Omi.h(
          'o-button',
          { type: 'primary' },
          '\u521B\u5EFA\u65B0\u9879\u76EE'
        ),
        Omi.h('br', null),
        Omi.h('br', null),
        Omi.h(
          'o-button',
          null,
          '\u7BA1\u7406\u9879\u76EE'
        )
      );
    };

    return _class2;
  }(WeElement));

  render(Omi.h('my-app', null), 'body');

}());
//# sourceMappingURL=b.js.map
