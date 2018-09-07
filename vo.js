/*
 * Vo JavaScript Library
 * Version: 1.0.0
 * Author: Yuemiao Zheng
 * Date: 2017.08.12
 */
!function(global, factory) {
 'use strict';
 if (typeof module === 'object' && typeof module.exports === 'object') {
  if (!global.document) throw new Error('Vo requires a window with a document');
  module.exports = factory(global);
 } else if (typeof define === 'function' && define.amd) {
  define('vo', function() { return factory(global); });
 } else global.Vo = global.$ = factory(global);
}(typeof window !== 'undefined' ? window : this, function(window, undefined) {
 //Core and Event;
 'use strict';
 var Vo = function(selector, context) { return new Vo.fn.init(selector, context); },
  _Vo = window.Vo,
  document = window.document,
  hasDuplicate, baseHasDuplicate = true,
  idRe = /^#([\w\-]*)$/,
  classNameRe = /^\.([\w\-]+)$/,
  tagNameRe = /^[\w\-]+$/,
  quickRe = /^[^<]*(<(.|\s)+>)[^>]*$|^#([\w\-]+)$/,
  rootNodeRe = /^(?:body|html)$/i,
  ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
  readyRe = /complete|loaded|interactive/,
  emptyArray = [],
  emptyObject = {},
  slice = emptyArray.slice,
  windowData = {},
  methodAttributes = ['html', 'text', 'val', 'data', 'css', 'width', 'height', 'offset'],
  specialEvents = {},
  focusinSupported = 'onfocusin' in window,
  focus = { focus: 'focusin', blur: 'focusout' },
  hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' },
  eventMethods = {
   preventDefault: 'isDefaultPrevented',
   stopImmediatePropagation: 'isImmediatePropagationStopped',
   stopPropagation: 'isPropagationStopped'
  },
  returnTrue = function() { return true; },
  returnFalse = function() { return false; },
  adjacencyOperators = {
   appendTo: 'append',
   prependTo: 'prepend',
   insertBefore: 'before',
   insertAfter: 'after',
   replaceAll: 'replaceWith'
  },
  allEvents = ['focusin', 'focusout', 'focus', 'blur', 'load', 'resize', 'scroll', 'unload', 'change',
   'select', 'error', 'keydown', 'keypress', 'keyup', 'click', 'dblclick', 'mousedown', 'mouseup',
   'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'
  ];
 [0, 0].sort(sortOrder);
 baseHasDuplicate = !hasDuplicate;
 Vo.fn = Vo.prototype;
 Vo.extend = Vo.fn.extend = function() {
  var target = arguments[0] || {},
   option, name, i = 1,
   length = arguments.length,
   deep = false;
  if (typeof target === 'boolean') {
   deep = target;
   target = arguments[1] || {};
  }
  if (length == 1) {
   target = this;
   i = 0;
  }
  for (; i < length; i++) {
   if ((option = arguments[i]) != null) {
    for (name in option) {
     if (target == option[name]) continue;
     if (deep && typeof option[name] === 'object' && target[name]) Vo.extend(target[name],
      option[name]);
     else if (option[name] != undefined) target[name] = option[name];
    }
   }
  }
  return target;
 };
 Vo.extend({
  Vo: function(selector, context) { return new Vo(selector, context); },
  find: function(selector, context) {
   var result;
   return (Vo.isDocument(context) && idRe.test(selector)) ? ((result = context
    .getElementById(RegExp.$1)) ? [result] : []) : (context.nodeType !== 1 && context
    .nodeType !== 9) ? [] : Vo.makeArray(classNameRe.test(selector) ? context
    .getElementsByClassName(RegExp.$1) : tagNameRe.test(selector) ? context
    .getElementsByTagName(selector) : context.querySelectorAll(selector));
  },
  each: function(obj, callback) {
   var name, length, i = 0;
   if (Vo.isArrayLike(obj)) {
    length = obj.length;
    for (; i < length; i++)
     if (callback.call(obj[i], i, obj[i]) === false) break;
   } else {
    for (name in obj)
     if (callback.call(obj[name], name, obj[name]) === false) break;
   }
   return obj;
  },
  map: function(obj, callback) {
   var length, value, i = 0,
    ret = [];
   if (Vo.isArrayLike(obj)) {
    length = obj.length;
    for (; i < length; i++) {
     value = callback(obj[i], i);
     if (value != null) ret[ret.length] = value;
    }
   } else {
    for (i in obj) {
     value = callback(obj[i], i);
     if (value != null) ret[ret.length] = value;
    }
   }
   return emptyArray.concat.apply([], ret);
  },
  grep: function(obj, callback) { return emptyArray.filter.call(obj, callback); },
  isArrayLike: function(obj) {
   var length = !!obj && 'length' in obj && obj.length;
   return Vo.isFunction(obj) || Vo.isWindow(obj) ? false : Vo.isArray(obj) || length === 0 ||
    typeof length === 'number' && length > 0 && (length - 1) in obj;
  },
  isArray: Array.isArray,
  isString: function(obj) { return Vo.type(obj) === 'string'; },
  isFunction: function(obj) { return Vo.type(obj) === 'function'; },
  isNumeric: function(obj) {
   return (typeof obj === 'number' || typeof obj === 'string') && !isNaN(obj - parseFloat(obj));
  },
  isWindow: function(obj) { return obj !== null && obj !== undefined && obj === obj.window; },
  isDocument: function(obj) { return obj !== null && obj !== undefined && obj.nodeType === 9; },
  isEmptyObject: function(obj) { return Object.keys(obj).length === 0; },
  isPlainObject: function(obj) {
   return obj && Vo.type(obj) === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
  },
  isXMLDoc: function(obj) {
   var documentElement = (obj ? obj.ownerDocument || obj : 0).documentElement;
   return documentElement ? documentElement.nodeName !== 'HTML' : false;
  },
  isVo: function(obj) { return obj instanceof Vo; },
  type: function(obj) {
   var types = /(?:^\[object\s(.*?)\]$)/;
   return emptyObject.toString.call(obj).replace(types, '$1').toLowerCase();
  },
  contains: function(parent, child) { return !!(parent.compareDocumentPosition(child) & 16); },
  inArray: function(obj, arr, i) { return emptyArray.indexOf.call(arr, obj, i); },
  makeArray: function(arr) {
   return arr != null && (arr.length == null || typeof arr === 'string' ||
    typeof arr === 'function' || Vo.isWindow(arr)) ? [arr] : slice.call(arr);
  },
  merge: function(target, arr) {
   var l, i = target.length,
    j = 0;
   if (typeof arr.length === 'number')
    for (l = arr.length; j < l; j++) target[i++] = arr[j];
   else
    while (arr[j] !== undefined) target[i++] = arr[j++];
   target.length = i;
   return target;
  },
  uniqueSort: function(arr) {
   if (!Vo.isArray(arr)) return;
   var elem, duplicates = [],
    i = 1,
    j = 0;
   hasDuplicate = baseHasDuplicate;
   arr.sort(sortOrder);
   if (hasDuplicate) {
    for (; (elem = arr[i]); i++)
     if (elem === arr[i - 1]) j = duplicates.push(i);
    while (j--) arr.splice(duplicates[j], 1);
   }
   return arr;
  },
  trim: function(str) { return str === null ? '' : String.prototype.trim.call(str); },
  camelCase: function(str, dasherize) {
   return dasherize ? str.replace(/([a-z\d])([A-Z])/g, '$1-$2').replace(/[\_]/g, '-').toLowerCase() :
    str.replace(/[\-\_][^\-\_]/g, function(match) { return match.charAt(1).toUpperCase(); });
  },
  parseJSON: JSON.parse,
  parseHTML: function(data, context, keepScripts) {
   if (!data || typeof data !== 'string') return null;
   if (typeof context === 'boolean') {
    keepScripts = context;
    context = undefined;
   }
   var scripts, html = buildFragment([data], context);
   if (keepScripts) {
    scripts = Vo.map(html, function(elem) {
     return Vo.nodeName(elem, 'script') ? elem.innerHTML : null;
    }).join('');
    setTimeout(function() { Vo.globalEval(scripts); }, 0);
   } else html = Vo.grep(html, function(elem) { return !Vo.nodeName(elem, 'script'); });
   return html;
  },
  parseXML: function(data) {
   if (!data || typeof data !== 'string') return null;
   var xml, tmp;
   try {
    tmp = new DOMParser();
    xml = tmp.parseFromString(Vo.trim(data), 'text/xml');
   } catch (e) { xml = undefined; }
   return xml;
  },
  htmlPrefilter: function(html) {
   var htmlTagRe = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/ig;
   return html.replace(htmlTagRe, '<$1></$2>');
  },
  escapeSelector: function(selector) {
   var cssEscapeRe = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g;
   return (selector + '').replace(cssEscapeRe, function(match, chartCodePoint) {
    return chartCodePoint ? (match === '\0' ? '\uFFFD' : match.slice(0, -1) + '\\' +
     match.charCodeAt(match.length - 1).toString(16) + ' ') : '\\' + match;
   });
  },
  nodeName: function(elem, name) {
   return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  },
  isHidden: function(elem) {
   return curCSS(elem, 'display') === 'none' || !Vo.contains(elem.ownerDocument, elem);
  },
  css: function(elem, name, force) {
   return /^(width|height)$/.test(name) ? Vo.cssHooks[name].get(elem) + 'px' : curCSS(elem, name, force);
  },
  cssHooks: {},
  cssNumber: {
   'column-count': true,
   'columns': true,
   'font-weight': true,
   'line-height': true,
   'opacity': true,
   'z-index': true,
   'zoom': true,
   'widows': true,
   'orphans': true,
   'fill-opacity': true,
   'order': true,
   'flex-grow': true,
   'flex-shrink': true
  },
  propFix: {
   'tabindex': 'tabIndex',
   'readonly': 'readOnly',
   'for': 'htmlFor',
   'class': 'className',
   'maxlength': 'maxLength',
   'cellspacing': 'cellSpacing',
   'cellpadding': 'cellPadding',
   'rowspan': 'rowSpan',
   'colspan': 'colSpan',
   'usemap': 'useMap',
   'frameborder': 'frameBorder',
   'contenteditable': 'contentEditable'
  },
  expando: 'Vo' + uniqueId(),
  uuid: 0,
  cache: {},
  noData: { 'embed': true, 'object': true, 'applet': true },
  data: function(elem, name, data) {
   if (elem.nodeName && Vo.noData[elem.nodeName.toLowerCase()]) return;
   elem = Vo.isWindow(elem) ? windowData : elem;
   var thisCache, id = elem[Vo.expando],
    cache = Vo.cache;
   if (!name && !id) return null;
   if (!id) id = ++Vo.uuid;
   if (typeof name === 'object') {
    elem[Vo.expando] = id;
    thisCache = cache[id] = Vo.extend(true, {}, name);
   } else if (cache[id]) thisCache = cache[id];
   else if (typeof data === 'undefined') thisCache = emptyObject;
   else thisCache = cache[id] = {};
   if (data !== undefined) {
    elem[Vo.expando] = id;
    thisCache[name] = data;
   }
   return typeof name === 'string' ? thisCache[name] : thisCache;
  },
  removeData: function(elem, name) {
   if (elem.nodeName && Vo.noData[elem.nodeName.toLowerCase()]) return;
   elem = Vo.isWindow(elem) ? windowData : elem;
   var id = elem[Vo.expando],
    cache = Vo.cache,
    thisCache = cache[id];
   if (name) {
    if (thisCache) {
     delete thisCache[name];
     if (Vo.isEmptyObject(thisCache)) Vo.removeData(elem);
    }
   } else {
    try { delete elem[Vo.expando]; } catch (e) {
     if (elem.removeAttribute) elem.removeAttribute(Vo.expando);
    }
    delete cache[id];
   }
  },
  hasData: function(elem) {
   var id = elem[Vo.expando],
    data = id && Vo.cache[id];
   return data ? !Vo.isEmptyObject(data) : false;
  },
  guid: 1,
  event: { add: add, remove: remove },
  Event: function(type, props) {
   if (!Vo.isString(type)) {
    props = type;
    type = props.type;
   }
   var name, event = document.createEvent(specialEvents[type] || 'Events'),
    bubbles = true;
   if (props) {
    for (name in props) {
     if (name === 'bubbles') bubbles = !!props[name];
     else event[name] = props[name];
    }
   }
   event.initEvent(type, bubbles, true);
   return fix(event);
  },
  proxy: function(fn, context) {
   var args = (2 in arguments) && slice.call(arguments, 2);
   if (Vo.isFunction(fn)) {
    var proxyFn = function() {
     return fn.apply(context, args ? args.concat(Vo.makeArray(arguments)) : arguments);
    };
    proxyFn.guid = guid(fn);
    return proxyFn;
   } else if (Vo.isString(context)) {
    if (args) {
     args.unshift(fn[context], fn);
     return Vo.proxy.apply(null, args);
    } else return Vo.proxy(fn[context], fn);
   } else Vo.error('Type error, expected function');
  },
  eval: eval,
  globalEval: function(data) {
   var rnotwhite = /\S/;
   if (data && rnotwhite.test(data)) {
    (window.execScript || function(data) {
     window['eval'].call(window, data);
    })(data);
   }
  },
  now: function() { return +(new Date()); },
  error: function(msg) { throw new Error(msg); },
  noop: function() {},
  noConflict: function(deep) {
   if (window.$ === Vo) window.$ = _Vo;
   if (deep && window.Vo === Vo) window.Vo = _Vo;
   return Vo;
  }
 });
 Vo.unique = Vo.uniqueSort;
 Vo.fn.extend({
  constructor: Vo,
  vo: '1.0.0',
  length: 0,
  selector: '',
  forEach: emptyArray.forEach,
  reduce: emptyArray.reduce,
  push: emptyArray.push,
  sort: emptyArray.sort,
  splice: emptyArray.splice,
  indexOf: emptyArray.indexOf,
  init: function(selector, context) {
   var match, elem, ret, name;
   selector = selector || document;
   if (selector.nodeType) {
    this[0] = selector;
    this.length = 1;
    this.context = selector;
    return this;
   }
   if (typeof selector === 'string') {
    selector = Vo.trim(selector);
    match = quickRe.exec(selector);
    if (match && (match[1] || !context)) {
     if (match[1]) {
      if (Vo.isPlainObject(context)) {
       ret = buildFragment([match[1]]);
       for (name in context) {
        if (Vo.inArray(name, methodAttributes) > -1) Vo(ret)[name](context[name]);
        else Vo(ret)[name in ret ? 'prop' : 'attr'](name, context[name]);
       }
      } else ret = buildFragment([match[1]], context);
      selector = ret;
     } else {
      elem = document.getElementById(match[3]);
      if (elem && elem.id != match[3]) return Vo(document).find(selector);
      ret = Vo(elem || []);
      ret.context = document;
      ret.selector = selector;
      return ret;
     }
    } else return Vo(context).find(selector);
   } else if (typeof selector === 'function') return Vo(document).ready(selector);
   if (selector.selector && selector.context) {
    this.selector = selector.selector;
    this.context = selector.context;
   }
   return this.setArray(Vo.isArray(selector) ? selector : Vo.makeArray(selector));
  },
  each: function(fn) { return fn === undefined ? this : Vo.each(this, fn); },
  map: function(fn) {
   return fn === undefined ? this : this.pushStack(Vo.map(this, function(item, i) {
    return fn.call(item, i, item);
   }));
  },
  size: function() { return this.length; },
  toArray: function() { return Vo.makeArray(this); },
  get: function(index) {
   return index === undefined ? this.toArray() : this[index >= 0 ? index : index + this.length];
  },
  slice: function() { return this.pushStack(slice.apply(this, arguments)); },
  eq: function(index) {
   return index === undefined ? this : index === -1 ? this.slice(index) : this.slice(index, +index + 1);
  },
  gt: function(index) {
   return index === undefined ? this : this.slice(++index + (index >= 0 ? 0 : this.length));
  },
  lt: function(index) {
   return index === undefined ? this : this.slice(0, +index + (index >= 0 ? 0 : this.length));
  },
  first: function() { return this.eq(0); },
  last: function() { return this.eq(-1); },
  odd: function() { return this.filter(function(i) { return i % 2 > 0; }); },
  even: function() { return this.filter(function(i) { return i % 2 === 0; }); },
  add: function(selector, context) {
   if (selector === undefined) return this;
   var set = typeof selector === 'string' ? Vo(selector, context) :
    Vo.makeArray(selector && selector.nodeType ? [selector] : selector),
    all = Vo.merge(this.get(), set);
   return this.pushStack(isDisconnected(set[0]) || isDisconnected(all[0]) ? all : Vo.uniqueSort(all));
  },
  andSelf: function(selector) {
   return this.add(!selector ? this.prevObject : this.prevObject.filter(selector));
  },
  end: function() { return this.prevObject || Vo([]); },
  is: function(selector) { return !!selector && this.filter(selector).length > 0; },
  find: function(selector) {
   if (!selector) return this;
   var self = this;
   return self.pushStack(Vo.uniqueSort(Vo.isString(selector) ? Vo.map(self, function(item, i) {
    return Vo.find(selector, item);
   }) : Vo(selector).filter(function(j, elem) {
    return emptyArray.some.call(self, function(el) { return Vo.contains(el, elem); });
   }).get()), selector);
  },
  filter: function(selector) {
   if (!selector) return this;
   return this.pushStack(Vo.uniqueSort(Vo.grep(this, function(item, i) {
    return Vo.isFunction(selector) ? selector.call(item, i, item) :
     Vo.inArray(item, Vo(selector).get()) > -1;
   })));
  },
  not: function(selector) {
   if (!selector) return this;
   return this.pushStack(Vo.uniqueSort(Vo.grep(this, function(item, i) {
    return Vo.isFunction(selector) ? !selector.call(item, i, item) :
     Vo.inArray(item, Vo(selector).get()) === -1;
   })));
  },
  has: function(selector) {
   if (!selector) return this;
   return this.pushStack(Vo.uniqueSort(Vo.grep(this, function(item, i) {
    return emptyArray.some.call(Vo(selector).get(), function(elem) {
     return Vo.contains(item, elem);
    });
   })));
  },
  prev: function(selector) {
   var node;
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.previousElementSibling;
    return !selector ? node : Vo(node).filter(selector).get();
   })));
  },
  next: function(selector) {
   var node;
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.nextElementSibling;
    return !selector ? node : Vo(node).filter(selector).get();
   })));
  },
  parent: function(selector) {
   var node;
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.parentElement;
    return !selector ? node : Vo(node).filter(selector).get();
   })));
  },
  offsetParent: function() {
   var node;
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.offsetParent || document.documentElement;
    while (node && !rootNodeRe.test(node.nodeName) && Vo(node).css('position') === 'static')
     node = node.offsetParent;
    return node;
   })));
  },
  child: function(index) {
   index = +index || 0;
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    return item.children[index + (index >= 0 ? 0 : item.children.length)];
   })));
  },
  children: function(selector) {
   var nodes;
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    nodes = item.children;
    return !selector ? Vo.makeArray(nodes) : Vo(nodes).filter(selector).get();
   })));
  },
  contents: function() {
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    return item.contentDocument || Vo.makeArray(item.childNodes);
   })));
  },
  siblings: function(selector) {
   var nodes;
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    nodes = Vo(item.parentElement.children).not(item);
    return !selector ? nodes.get() : nodes.filter(selector).get();
   })));
  },
  index: function(selector) {
   if (!selector || typeof selector === 'string') return Vo.inArray(this.get(0), selector ?
    Vo(selector) : this.parent().children());
   return Vo.inArray(selector && Vo.isVo(selector) ? selector.get(0) : selector, this);
  },
  prevAll: function(selector) {
   var node, ret = [];
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.previousElementSibling;
    while (node) {
     ret[ret.length] = node;
     node = node.previousElementSibling;
    }
    return !selector ? ret : Vo(ret).filter(selector).get();
   })));
  },
  nextAll: function(selector) {
   var node, ret = [];
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.nextElementSibling;
    while (node) {
     ret[ret.length] = node;
     node = node.nextElementSibling;
    }
    return !selector ? ret : Vo(ret).filter(selector).get();
   })));
  },
  parents: function(selector) {
   var node, ret = [];
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.parentElement;
    while (node) {
     if (node === item.ownerDocument) break;
     ret[ret.length] = node;
     node = node.parentElement;
    }
    return !selector ? ret : Vo(ret).filter(selector).get();
   })));
  },
  prevUntil: function(selector, filter) {
   var node, ret = [];
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.previousElementSibling;
    while (node) {
     if (Vo.inArray(node, Vo(selector).get()) > -1) break;
     ret[ret.length] = node;
     node = node.previousElementSibling;
    }
    return !filter ? ret : Vo(ret).filter(filter).get();
   })));
  },
  nextUntil: function(selector, filter) {
   var node, ret = [];
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.nextElementSibling;
    while (node) {
     if (Vo.inArray(node, Vo(selector).get()) > -1) break;
     ret[ret.length] = node;
     node = node.nextElementSibling;
    }
    return !filter ? ret : Vo(ret).filter(filter).get();
   })));
  },
  parentsUntil: function(selector, filter) {
   var node, ret = [];
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    node = item.parentElement;
    while (node) {
     if (node === item.ownerDocument || Vo.inArray(node, Vo(selector).get()) > -1) break;
     ret[ret.length] = node;
     node = node.parentElement;
    }
    return !filter ? ret : Vo(ret).filter(filter).get();
   })));
  },
  closest: function(selector, context) {
   if (!selector) return this;
   var ret = [];
   return this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    while (item) {
     if (item === item.ownerDocument || context && Vo.inArray(item, Vo(context).get()) > -1) break;
     if (Vo.inArray(item, Vo(selector).get()) > -1) {
      ret[ret.length] = item;
      break;
     }
     item = item.parentElement;
    }
    return ret;
   })));
  },
  clone: function(deep) {
   var ret = this.pushStack(Vo.uniqueSort(Vo.map(this, function(item, i) {
    return item.cloneNode(true);
   })));
   if (deep) {
    cloneEvents(this, ret);
    cloneEvents(this.find('*'), ret.find('*'));
   }
   return ret;
  },
  css: function(property, value) {
   if (arguments.length < 2) {
    var self = this.get(0);
    if (!self) return;
    if (Vo.isString(property)) return Vo.css(self, property);
    else if (Vo.isArray(property)) {
     var props = {};
     Vo.each(property, function(_, prop) { props[prop] = Vo.css(self, prop); });
     return props;
    }
   }
   var key, css = '';
   this.each(function() {
    if (Vo.isString(property)) {
     if (!value && value !== 0) this.style.removeProperty(Vo.camelCase(property, true));
     else css = Vo.camelCase(property, true) + ':' + addPx(property, value);
    } else if (Vo.isPlainObject(property)) {
     for (key in property) {
      if (!property[key] && property[key] !== 0) this.style.removeProperty(Vo.camelCase(key, true));
      else css += Vo.camelCase(key, true) + ':' + addPx(key, property[key]) + ';';
     }
    }
   });
   return this.each(function(index, item) {
    return Vo.isFunction(value) ? Vo(item).css(property, value.call(item, index,
     Vo.css(item, property))) : item.style.cssText += ';' + css;
   });
  },
  attr: function(name, value) {
   var result, key;
   return (typeof name === 'string' && value === undefined) ? (0 in this && this.get(0)
     .nodeType === 1 && (result = this.get(0).getAttribute(name)) !== null ? result : undefined) :
    this.each(function(index, item) {
     if (item.nodeType !== 1) return;
     if (Vo.isPlainObject(name))
      for (key in name) setAttr(item, key, name[key]);
     else setAttr(item, name, access(item, value, index, item.getAttribute(name)));
    });
  },
  prop: function(name, value) {
   var key;
   name = Vo.propFix[name] || name;
   return (typeof name === 'string' && value === undefined) ? (this.get(0) && this.get(0)[name]) :
    this.each(function(index, item) {
     if (Vo.isPlainObject(name))
      for (key in name) item[Vo.propFix[key] || key] = name[key];
     else item[name] = access(item, value, index, item[name]);
    });
  },
  data: function(name, value) {
   return (typeof name === 'string' && value === undefined) ? (this.get(0) && (Vo.data(this.get(0),
     name) || this.get(0).getAttribute('data-' + Vo.camelCase(name, true))) || undefined) :
    this.each(function(index, item) {
     if (Vo.isPlainObject(name)) Vo.data(item, name);
     else Vo.data(item, name, access(item, value, index, Vo.data(item, name)));
    });
  },
  removeAttr: function(name) {
   return this.each(function(i, item) {
    if (item.nodeType === 1) Vo.each(name.split(/\s+/), function(_, attr) { setAttr(item, attr); });
   });
  },
  removeProp: function(name) {
   name = Vo.propFix[name] || name;
   return this.each(function() { delete this[name]; });
  },
  removeData: function(name) {
   return this.each(function(i, item) {
    if (!!Vo.data(item, name)) Vo.removeData(item, name);
    else Vo.each((name || '').split(/\s+/), function(_, data) { Vo.removeData(item, data); });
   });
  },
  hasClass: function(classes) {
   return !classes ? false : emptyArray.some.call(this, function(item) {
    return classes.split(/\s+/).every(function(klass) { return item.classList.contains(klass); });
   });
  },
  toggleClass: function(classes, when) {
   return !classes ? this : this.each(function(index, item) {
    return Vo.each(access(item, classes, index, item.className).split(/\s+/), function(_, klass) {
     var toggle = when === undefined ? 'toggle' : !!when ? 'add' : 'remove';
     item.classList[toggle](klass || undefined);
    });
   });
  },
  html: function(html) {
   return 0 in arguments ? this.each(function(index, item) {
    var originHtml = item.innerHTML;
    Vo(item).empty().append(access(item, html, index, originHtml));
   }) : (0 in this ? this.get(0).innerHTML : null);
  },
  val: function(value) {
   return 0 in arguments ? this.each(function(index, item) {
    var values, val = access(item, value === null ? '' : value, index, item.value);
    if (item.type === 'checkbox') item.checked = indexOfValues(item, val) > -1;
    else if (item.multiple) Vo('option', item).each(function(idx) {
     values = access(this, value === null ? '' : value, idx, this.value);
     this.selected = indexOfValues(this, values) > -1;
    });
    else item.value = val;
   }) : (0 in this && (this.get(0).multiple ? pluck(Vo('option', this.get(0))
    .filter(function() { return this.selected; }).get(), 'value') : this.get(0).value));
  },
  text: function(text) {
   return 0 in arguments ? this.each(function(index, item) {
    var newText = access(item, text, index, item.textContent);
    item.textContent = newText == null ? '' : '' + newText;
   }) : (0 in this ? pluck(this.get(), 'textContent').join('') : null);
  },
  wrapAll: function(html) {
   var node = this.get(0),
    elems = buildFragment(arguments),
    clone = elems[0].cloneNode(true);
   if (!html) return this;
   else if (Vo.isFunction(html)) return this.wrapAll(html.call(this));
   node.parentNode.insertBefore(clone, node);
   while (clone.firstChild) clone = clone.firstChild;
   return this.each(function() { clone.appendChild(this); });
  },
  wrapInner: function(html) {
   if (!html) return this;
   return Vo.isFunction(html) ? this.each(function(i) { Vo(this).wrapInner(html.call(this, i)); }) :
    this.each(function() { Vo(this).contents().wrapAll(html); });
  },
  wrap: function(html) {
   var clone, elems = buildFragment(arguments);
   if (!html) return this;
   return Vo.isFunction(html) ? this.each(function(i) { Vo(this).wrapAll(html.call(this, i)); }) :
    this.each(function() {
     clone = elems[0].cloneNode(true);
     this.parentNode.insertBefore(clone, this);
     while (clone.firstChild) clone = clone.firstChild;
     clone.appendChild(this);
    });
  },
  unwrap: function(selector) {
   return this.parent(selector).not('body').each(function() { Vo(this).replaceWith(this.childNodes); });
  },
  replaceWith: function(newContent) {
   if (!newContent) return this;
   return Vo.isFunction(newContent) ? this.each(function(i) {
    Vo(this).replaceWith(newContent.call(this, i));
   }) : this.after(newContent).remove();
  },
  remove: function(selector, detach) {
   var self = selector ? this.filter(selector) : this;
   if (!detach) self.find('*').andSelf().off().removeData();
   return self.each(function(i, item) {
    if (item.parentElement != null) item.parentElement.removeChild(item);
   });
  },
  empty: function(selector) {
   var self = selector ? this.filter(selector) : this;
   return self.find('*').off().removeData().end().prop('innerHTML', '');
  },
  detach: function(selector) { return this.remove(selector, true); },
  domManip: function(args, table, reverse, callback) {
   var clone = this.size() > 1,
    elems = buildFragment(args);
   if (reverse) elems.reverse();
   return this.each(function() {
    var obj = this;
    if (table && Vo.nodeName(this, 'table') && Vo.nodeName(elems[0], 'tr'))
     obj = this.getElementsByTagName('tbody')[0] || this.appendChild(document.createElement('tbody'));
    Vo.each(elems, function() { callback.apply(obj, [clone ? this.cloneNode(true) : this]); });
   });
  },
  pushStack: function(elems, selector) {
   var ret = Vo(elems);
   ret.prevObject = this;
   ret.context = this.context;
   if (Vo.isString(selector)) ret.selector = this.selector + ' ' + selector;
   return ret;
  },
  setArray: function(elems) {
   this.length = 0;
   emptyArray.push.apply(this, elems);
   return this;
  },
  position: function() {
   if (!this.length) return;
   var self = this.get(0),
    offsetParent = this.offsetParent(),
    offset = this.offset(),
    parentOffset = rootNodeRe.test(offsetParent.get(0).nodeName) ? { top: 0, left: 0 } :
    offsetParent.offset();
   offset.top -= parseFloat(Vo(self).css('margin-top')) || 0;
   offset.left -= parseFloat(Vo(self).css('margin-left')) || 0;
   parentOffset.top += parseFloat(Vo(offsetParent.get(0)).css('border-top-width')) || 0;
   parentOffset.left += parseFloat(Vo(offsetParent.get(0)).css('border-left-width')) || 0;
   return { top: offset.top - parentOffset.top, left: offset.left - parentOffset.left };
  },
  offset: function(coordinates) {
   if (coordinates) return this.each(function(index, item) {
    var self = Vo(item),
     coords = access(item, coordinates, index, self.offset()),
     parentOffset = self.offsetParent().offset(),
     props = { top: coords.top - parentOffset.top, left: coords.left - parentOffset.left };
    if (self.css('position') === 'static') props.position = 'relative';
    self.css(props);
   });
   if (!this.length) return null;
   if (document.documentElement !== this.get(0) && !Vo.contains(document
     .documentElement, this.get(0))) return { top: 0, left: 0 };
   var self = this.get(0).getBoundingClientRect();
   return {
    left: self.left + window.pageXOffset,
    top: self.top + window.pageYOffset,
    width: Math.round(self.width),
    height: Math.round(self.height)
   };
  },
  on: function(event, selector, data, callback, one) {
   var autoRemove, delegator, self = this;
   if (event && Vo.isPlainObject(event)) {
    Vo.each(event, function(type, fn) { self.on(type, selector, data, fn, one); });
    return self;
   }
   if (!Vo.isString(selector) && !Vo.isFunction(callback) && callback !== false) {
    callback = data;
    data = selector;
    selector = undefined;
   }
   if (callback === undefined || data === false) {
    callback = data;
    data = undefined;
   }
   if (callback === false) callback = returnFalse;
   return self.each(function(i, element) {
    if (one) autoRemove = function(e) {
     remove(element, e.type, callback);
     return callback.apply(this, arguments);
    };
    if (selector) delegator = function(e) {
     var evt, match = Vo(e.target).closest(selector, element).get(0);
     if (match && match !== element) {
      evt = Vo.extend(createProxy(e), { currentTarget: match, liveFired: element });
      return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
     }
    };
    add(element, event, callback, data, selector, delegator || autoRemove);
   });
  },
  off: function(event, selector, callback) {
   var self = this;
   if (event && Vo.isPlainObject(event)) {
    Vo.each(event, function(type, fn) { self.off(type, selector, fn); });
    return self;
   }
   if (!Vo.isString(selector) && !Vo.isFunction(callback) && callback !== false) {
    callback = selector;
    selector = undefined;
   }
   if (callback === false) callback = returnFalse;
   return self.each(function() { remove(this, event, callback, selector); });
  },
  bind: function(event, data, callback) { return this.on(event, data, callback); },
  unbind: function(event, callback) { return this.off(event, callback); },
  one: function(event, selector, data, callback) { return this.on(event, selector, data, callback, 1); },
  delegate: function(selector, event, callback) { return this.on(event, selector, callback); },
  undelegate: function(selector, event, callback) { return this.off(event, selector, callback); },
  trigger: function(event, data) {
   event = Vo.isString(event) || Vo.isPlainObject(event) ? Vo.Event(event) : fix(event);
   event._data = data;
   return this.each(function() {
    if (event.type in focus && Vo.isFunction(this[event.type])) this[event.type]();
    else if ('dispatchEvent' in this) this.dispatchEvent(event);
    else Vo(this).triggerHandler(event, data);
   });
  },
  triggerHandler: function(event, data) {
   var e, result;
   this.each(function(i, element) {
    e = createProxy(Vo.isString(event) ? Vo.Event(event) : event);
    e._data = data;
    e.target = element;
    Vo.each(findHandlers(element, event.type || event), function(i, handler) {
     result = handler.proxy(e);
     if (e.isImmediatePropagationStopped()) return false;
    });
   });
   return result;
  },
  toggle: function() {
   var fn = arguments,
    count = -1;
   return this.click(function(e) {
    count = fn.length - 1 === count ? 0 : ++count;
    e.preventDefault();
    return fn[count].apply(this, [e]) || false;
   });
  },
  hover: function(over, out) { return this.mouseenter(over).mouseleave(out || over); },
  ready: function(callback) {
   if (readyRe.test(document.readyState) && document.body) callback.call(document, Vo);
   else Vo(document).one('DOMContentLoaded', function() { callback.call(this, Vo); });
   return this;
  }
 });
 Vo.fn.addBack = Vo.fn.andSelf;
 Vo.each(['click', 'mousedown', 'mouseup', 'mousemove'], function(_, name) {
  specialEvents[name] = 'MouseEvents';
 });
 Vo.each(['add', 'remove'], function(toggle, name) {
  Vo.fn[name + 'Class'] = function(classes) {
   return !classes && toggle ? this.attr('class', '') : this.toggleClass(classes, !toggle);
  };
 });
 Vo.each(['append', 'prepend', 'before', 'after'], function(i, operator) {
  Vo.fn[operator] = function(html) {
   return Vo.isFunction(html) ? this.each(function(index) {
    Vo(this)[operator](html.call(this, index, i < 2 ? Vo(this).html() : undefined));
   }) : this.domManip(arguments, i < 2 ? true : false, i % 2 ? true : false, function(elem) {
    var self = i < 2 && this.nodeType === 1 ? this : this.parentElement,
     target = i % 2 ? this[i > 1 ? 'nextSibling' : 'firstChild'] : i ? this : undefined;
    return self[i ? 'insertBefore' : 'appendChild'](elem, target);
   });
  };
 });
 Vo.each(adjacencyOperators, function(name, original) {
  Vo.fn[name] = function(selector) {
   var elems, ret = [],
    insert = Vo(selector);
   for (var i = 0, len = insert.length; i < len; i++) {
    elems = (i > 0 ? this.clone(true) : this).get();
    Vo(insert.get(i))[original](elems);
    ret = ret.concat(elems);
   }
   return this.pushStack(Vo.uniqueSort(ret));
  };
 });
 Vo.each(['width', 'height'], function(h, name) {
  var size = !h ? 'Width' : 'Height',
   which = !h ? ['Left', 'Right'] : ['Top', 'Bottom'],
   getOuterSize = function(elem, inner, outer) {
    var padding = 0,
     border = 0,
     margin = 0;
    Vo.each(which, function() {
     padding += parseFloat(curCSS(elem, 'padding' + this, true)) || 0;
     border += parseFloat(curCSS(elem, 'border' + this + 'Width', true)) || 0;
     margin += parseFloat(curCSS(elem, 'margin' + this, true)) || 0;
    });
    return padding + (inner ? border : 0) + (inner && outer ? margin : 0);
   };
  Vo.fn[name] = function(value) {
   if (!this.length) return;
   if (!value) {
    var html = document.documentElement;
    return Vo.isWindow(this.get(0)) ? html['client' + size] : Vo.isDocument(this.get(0)) ?
     html['scroll' + size] : Vo.cssHooks[name].get(this.get(0));
   } else return this.each(function(index) {
    Vo(this).css(name, access(this, value, index, Vo(this)[name]()));
   });
  };
  Vo.fn['inner' + size] = function() {
   if (!this.length) return;
   return Vo(this)[name]() + (Vo.isWindow(this.get(0)) || Vo.isDocument(this.get(0)) ? 0 :
    getOuterSize(this.get(0)));
  };
  Vo.fn['outer' + size] = function(deep) {
   if (!this.length) return;
   return Vo(this)[name]() + (Vo.isWindow(this.get(0)) || Vo.isDocument(this.get(0)) ? 0 :
    getOuterSize(this.get(0), true, deep));
  };
  Vo.cssHooks[name] = {
   get: function(elem) {
    var val, props = { position: 'absolute', visibility: 'hidden', display: 'block' },
     getWidthOrHeight = function() {
      val = name === 'width' ? elem.offsetWidth : elem.offsetHeight;
      val = val > 0 ? val - getOuterSize(elem, true) : parseFloat(curCSS(elem, name));
      return val;
     };
    if (!Vo.isHidden(elem)) getWidthOrHeight();
    else swap(elem, props, getWidthOrHeight);
    return Math.max(0, val);
   }
  };
 });
 Vo.each(['Left', 'Top'], function(i, name) {
  var method = 'scroll' + name;
  Vo.fn[method] = function(value) {
   if (!this.length) return;
   var self = Vo.isDocument(this.get(0)) ? document.documentElement : this.get(0),
    win = method in self;
   return value === undefined ? (win ? self[method] : self[i ? 'pageYOffset' : 'pageXOffset']) :
    this.each(win ? function() { this[method] = value; } : function() {
     this.scrollTo(i ? this.scrollX : value, i ? value : this.scrollY);
    });
  };
 });
 Vo.each(['live', 'die'], function(i, type) {
  Vo.fn[type] = function(event, callback) {
   return !this.selector ? this[i ? 'unbind' : 'bind'](event, callback) :
    Vo(document.body)[i ? 'undelegate' : 'delegate'](this.selector, event, callback);
  };
 });
 Vo.each(allEvents, function(_, event) {
  Vo.fn[event] = function(callback) {
   return callback ? this.bind(event, callback) : this.trigger(event);
  };
 });

 function buildFragment(obj, context) {
  var doc, table, div, ret = [];
  context = Vo.isVo(context) ? context.get(0) : context;
  doc = (context && context.nodeType ? context.ownerDocument || context : document);
  for (var i = 0, len = obj.length; i < len; i++) {
   if (typeof obj[i] === 'string') {
    table = '';
    if (!obj[i].indexOf('<thead') || !obj[i].indexOf('<tbody')) {
     table = 'thead';
     obj[i] = '<table>' + obj[i] + '</table>';
    } else if (!obj[i].indexOf('<tr')) {
     table = 'tr';
     obj[i] = '<table>' + obj[i] + '</table>';
    } else if (!obj[i].indexOf('<td') || !obj[i].indexOf('<th')) {
     table = 'td';
     obj[i] = '<table><tbody><tr>' + obj[i] + '</tr></tbody></table>';
    }
    div = doc.createElement('div');
    div.innerHTML = obj[i];
    if (table) {
     div = div.firstChild;
     if (table !== 'thead') div = div.firstChild;
     if (table === 'td') div = div.firstChild;
    }
    for (var j = 0, leng = div.childNodes.length; j < leng; j++) ret[ret.length] = div.childNodes[j];
   } else if (Vo.isVo(obj[i]) || obj[i].length && !obj[i].nodeType) {
    for (var k = 0, length = obj[i].length; k < length; k++) ret[ret.length] = obj[i][k];
   } else if (obj[i] !== null) ret[ret.length] = obj[i].nodeType ? obj[i] :
    doc.createTextNode(obj[i].toString());
  }
  return ret;
 }

 function uniqueId() { return Math.random().toString(16).substring(2); }

 function sortOrder(a, b) {
  if (a === b) { hasDuplicate = true; return 0; }
  if (!a.compareDocumentPosition || !b.compareDocumentPosition)
   return a.compareDocumentPosition ? -1 : 1;
  return a.compareDocumentPosition(b) & 4 ? -1 : 1;
 }

 function curCSS(elem, name, force) {
  var ret, view = elem.ownerDocument.defaultView || window;
  if (!force && elem.style && elem.style[name]) ret = elem.style[name];
  else if (view && view.getComputedStyle) {
   name = Vo.camelCase(name, true);
   ret = view.getComputedStyle(elem, null).getPropertyValue(name);
  }
  return ret;
 }

 function swap(elem, options, callback) {
  var name, old = {};
  for (name in options) {
   old[name] = elem.style[name];
   elem.style[name] = options[name];
  }
  callback.call(elem);
  for (name in options) elem.style[name] = old[name];
 }

 function cloneEvents(orig, ret) {
  var i = 0;
  ret.each(function() {
   if (this.nodeName !== (orig[i] && orig[i].nodeName)) return;
   var oldData = Vo.data(orig[i++]),
    curData = Vo.data(this, oldData),
    events = oldData && oldData.events;
   if (events) {
    delete curData.events;
    for (var j = 0, length = events.length; j < length; j++)
     Vo(this).on(events[j].e, events[j].sel, events[j].fn);
   }
  });
 }

 function isDisconnected(node) {
  return !node || !node.parentElement || node.parentElement.nodeType === 11;
 }

 function addPx(name, value) {
  return (typeof value === 'number' && !Vo.cssNumber[Vo.camelCase(name, true)]) ? value + 'px' : value;
 }

 function setAttr(node, name, value) {
  return value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
 }

 function access(elem, arg, index, value) {
  return Vo.isFunction(arg) ? arg.call(elem, index, value) : arg;
 }

 function indexOfValues(elem, val) { return Vo.inArray(elem.value, Vo.isArray(val) ? val : [val]); }

 function pluck(obj, key) { return Vo.map(obj, function(elem) { return elem[key]; }); }

 function add(element, events, fn, data, selector, delegator, capture) {
  var set = Vo.data(element, 'events') || Vo.data(element, 'events', []);
  Vo.each(events.split(/\s+/), function(_, event) {
   if (event === 'ready') return Vo(document).ready(fn);
   var handler = parse(event);
   handler.fn = fn;
   handler.sel = selector;
   if (handler.e in hover) fn = function(e) {
    var related = e.relatedTarget;
    if (!related || (related !== this && !Vo.contains(this, related)))
     return handler.fn.apply(this, arguments);
   };
   handler.del = delegator;
   var callback = delegator || fn;
   handler.proxy = function(e) {
    e = fix(e);
    if (e.isImmediatePropagationStopped()) return;
    e.data = data;
    var result = callback.apply(element, e._data === undefined ? [e] : [e].concat(e._data));
    if (result === false) {
     e.preventDefault();
     e.stopPropagation();
    }
    return result;
   };
   handler.i = set.length;
   set[set.length] = handler;
   if ('addEventListener' in element) element.addEventListener(realEvent(handler.e),
    handler.proxy, eventCapture(handler, capture));
  });
 }

 function remove(element, events, fn, selector, capture) {
  Vo.each((events || '').split(/\s+/), function(_, event) {
   Vo.each(findHandlers(element, event, fn, selector), function(_, handler) {
    delete Vo.data(element, 'events')[handler.i];
    if ('removeEventListener' in element) element.removeEventListener(realEvent(handler.e),
     handler.proxy, eventCapture(handler, capture));
   });
  });
 }

 function realEvent(type) { return hover[type] || (focusinSupported && focus[type]) || type; }

 function eventCapture(handler, captureSetting) {
  return handler.del && (!focusinSupported && (handler.e in focus)) || !!captureSetting;
 }

 function findHandlers(element, event, fn, selector) {
  event = parse(event);
  if (event.ns) var matcher = matcherFor(event.ns);
  return (Vo.data(element, 'events') || []).filter(function(handler) {
   return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) &&
    (!fn || guid(handler.fn) === guid(fn)) && (!selector || handler.sel == selector);
  });
 }

 function guid(fn) { return fn.guid || (fn.guid = Vo.guid++); }

 function parse(event) {
  var parts = ('' + event).split('.');
  return { e: parts[0], ns: parts.slice(1).sort().join(' ') };
 }

 function matcherFor(ns) { return new RegExp('(?:^| )' + ns.replace(/\ /g, ' .* ?') + '(?: |$)'); }

 function createProxy(event) {
  var key, proxy = { originalEvent: event };
  for (key in event)
   if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key];
  return fix(proxy, event);
 }

 function fix(event, source) {
  if (source || !event.isDefaultPrevented) {
   source = source || event;
   Vo.each(eventMethods, function(name, predicate) {
    var sourceMethod = source[name];
    event[name] = function() {
     this[predicate] = returnTrue;
     return sourceMethod && sourceMethod.apply(source, arguments);
    };
    event[predicate] = returnFalse;
   });
   try { event.timeStamp = event.timeStamp || Vo.now(); } catch (e) {}
   if (source.defaultPrevented !== undefined ? source.defaultPrevented : 'returnValue' in source ?
    source.returnValue === false : source.getPreventDefault && source.getPreventDefault())
    event.isDefaultPrevented = returnTrue;
  }
  return event;
 }

 //Deferred and Callbacks;
 !function(Vo, window, undefined) {
  var optionsCache = {};
  Vo.extend({
   Deferred: function(func) {
    var tuples = [
      ['notify', 'progress', Vo.Callbacks('memory'), Vo.Callbacks('memory'), 2],
      ['resolve', 'done', Vo.Callbacks('once memory'), Vo.Callbacks('once memory'), 0, 'resolved'],
      ['reject', 'fail', Vo.Callbacks('once memory'), Vo.Callbacks('once memory'), 1, 'rejected']
     ],
     state = 'pending',
     promise = {
      state: function() { return state; },
      always: function() {
       deferred.done(arguments).fail(arguments);
       return this;
      },
      'catch': function(fn) { return promise.then(null, fn); },
      pipe: function() {
       var fns = arguments;
       return Vo.Deferred(function(newDefer) {
        Vo.each(tuples, function(i, tuple) {
         var fn = Vo.isFunction(fns[tuple[4]]) && fns[tuple[4]];
         deferred[tuple[1]](function() {
          var returned = fn && fn.apply(this, arguments);
          if (returned && Vo.isFunction(returned.promise))
           returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
          else newDefer[tuple[0] + 'With'](this, fn ? [returned] : arguments);
         });
        });
        fns = null;
       }).promise();
      },
      then: function(onFulfilled, onRejected, onProgress) {
       var maxDepth = 0,
        resolve = function(depth, deferred, handler, special) {
         return function() {
          var that = this,
           args = arguments,
           mightThrow = function() {
            var returned, then;
            if (depth < maxDepth) return;
            returned = handler.apply(that, args);
            if (returned === deferred.promise()) Vo.error('Type error, thenable self-resolution');
            then = returned && (typeof returned === 'object' ||
             typeof returned === 'function') && returned.then;
            if (Vo.isFunction(then)) {
             if (special) then.call(returned, resolve(maxDepth, deferred, Identity, special),
              resolve(maxDepth, deferred, Thrower, special));
             else {
              maxDepth++;
              then.call(returned, resolve(maxDepth, deferred, Identity, special),
               resolve(maxDepth, deferred, Thrower, special),
               resolve(maxDepth, deferred, Identity, deferred.notifyWith));
             }
            } else {
             if (handler !== Identity && !!returned) {
              that = undefined;
              args = [returned];
             }(special || deferred.resolveWith)(that, args);
            }
           },
           process = special ? mightThrow : function() {
            try { mightThrow(); } catch (e) {
             if (Vo.Deferred.exceptionHook) Vo.Deferred.exceptionHook(e, process.stackTrace);
             if (depth + 1 >= maxDepth) {
              if (handler !== Thrower) {
               that = undefined;
               args = [e];
              }
              deferred.rejectWith(that, args);
             }
            }
           };
          if (depth) process();
          else {
           if (Vo.Deferred.getStackHook) process.stackTrace = Vo.Deferred.getStackHook();
           window.setTimeout(process);
          }
         };
        };
       return Vo.Deferred(function(newDefer) {
        tuples[0][3].add(resolve(0, newDefer, Vo.isFunction(onProgress) ? onProgress :
         Identity, newDefer.notifyWith));
        tuples[1][3].add(resolve(0, newDefer, Vo.isFunction(onFulfilled) ? onFulfilled : Identity));
        tuples[2][3].add(resolve(0, newDefer, Vo.isFunction(onRejected) ? onRejected : Thrower));
       }).promise();
      },
      promise: function(obj) { return obj != null ? Vo.extend(obj, promise) : promise; }
     },
     deferred = {};
    Vo.each(tuples, function(i, tuple) {
     var list = tuple[2],
      stateString = tuple[5];
     promise[tuple[1]] = list.add;
     if (stateString)
      list.add(function() { state = stateString; }, tuples[3 - i][2].disable, tuples[0][2].lock);
     list.add(tuple[3].fire);
     deferred[tuple[0]] = function() {
      deferred[tuple[0] + 'With'](this === deferred ? undefined : this, arguments);
      return this;
     };
     deferred[tuple[0] + 'With'] = list.fireWith;
    });
    promise.promise(deferred);
    if (func) func.call(deferred, deferred);
    return deferred;
   },
   when: function(singleValue) {
    var remaining = arguments.length,
     i = remaining,
     resolveContexts = Array(i),
     resolveValues = Vo.makeArray(arguments),
     master = Vo.Deferred(),
     updateFunc = function(i) {
      return function(value) {
       resolveContexts[i] = this;
       resolveValues[i] = arguments.length > 1 ? Vo.makeArray(arguments) : value;
       if (!(--remaining)) master.resolveWith(resolveContexts, resolveValues);
      };
     };
    if (remaining <= 1) {
     adoptValue(singleValue, master.done(updateFunc(i)).resolve, master.reject);
     if (master.state() === 'pending' || Vo.isFunction(resolveValues[i] && resolveValues[i].then))
      return master.then();
    }
    while (i--) adoptValue(resolveValues[i], updateFunc(i), master.reject);
    return master.promise();
   },
   Callbacks: function(options) {
    options = typeof options === 'string' ? createOptions(options) : Vo.extend({}, options);
    var firing, memory, fired, locked, list = [],
     queue = [],
     firingIndex = -1,
     fire = function() {
      locked = options.once;
      fired = firing = true;
      for (; queue.length; firingIndex = -1) {
       memory = queue.shift();
       while (++firingIndex < list.length) {
        if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
         firingIndex = list.length;
         memory = false;
        }
       }
      }
      if (!options.memory) memory = false;
      firing = false;
      if (locked) {
       if (memory) list = [];
       else list = '';
      }
     },
     self = {
      add: function() {
       if (list) {
        if (memory && !firing) {
         firingIndex = list.length - 1;
         queue[queue.length] = memory;
        }(function add(args) {
         Vo.each(args, function(_, arg) {
          if (Vo.isFunction(arg)) {
           if (!options.unique || !self.has(arg)) list[list.length] = arg;
          } else if (arg && arg.length && Vo.type(arg) !== 'string') add(arg);
         });
        })(arguments);
        if (memory && !firing) fire();
       }
       return this;
      },
      remove: function() {
       Vo.each(arguments, function(_, arg) {
        var index;
        while ((index = Vo.inArray(arg, list, index)) > -1) {
         list.splice(index, 1);
         if (index <= firingIndex) firingIndex--;
        }
       });
       return this;
      },
      has: function(fn) { return fn ? Vo.inArray(fn, list) > -1 : list.length > 0; },
      empty: function() {
       if (list) list = [];
       return this;
      },
      disable: function() {
       locked = queue = [];
       list = memory = '';
       return this;
      },
      disabled: function() { return !list; },
      lock: function() {
       locked = true;
       if (!memory) self.disable();
       return this;
      },
      locked: function() { return !!locked; },
      fireWith: function(context, args) {
       if (!locked) {
        args = args || [];
        args = [context, args.slice ? args.slice() : args];
        queue[queue.length] = args;
        if (!firing) fire();
       }
       return this;
      },
      fire: function() {
       self.fireWith(this, arguments);
       return this;
      },
      fired: function() { return !!fired; }
     };
    return self;
   }
  });

  function createOptions(options) {
   var object = optionsCache[options] = {};
   Vo.each(options.split(/\s+/), function(i, flag) { object[flag] = true; });
   return object;
  }

  function Identity(v) { return v; }

  function Thrower(ex) { throw ex; }

  function adoptValue(value, resolve, reject) {
   var method;
   try {
    if (value && Vo.isFunction((method = value.promise))) method.call(value).done(resolve).fail(reject);
    else if (value && Vo.isFunction((method = value.then))) method.call(value, resolve, reject);
    else resolve.call(undefined, value);
   } catch (e) { reject.call(undefined, e); }
  }
 }(Vo, window);
 //Ajax;
 !function(Vo, window, document, undefined) {
  var jsonpID = Vo.now(),
   scriptRe = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/ig,
   jsRe = /\=\?(&|$)/,
   ajaxEvents = ['ajaxStart', 'ajaxStop', 'ajaxComplete', 'ajaxError', 'ajaxSuccess', 'ajaxSend'];
  Vo.fn.extend({
   _load: Vo.fn.load,
   load: function(url, params, callback) {
    if (typeof url !== 'string' && Vo.fn._load) return this._load(url);
    else if (!this.length) return this;
    var off = url.indexOf(' ');
    if (off >= 0) {
     var selector = url.slice(off, url.length);
     url = url.slice(0, off);
    }
    var type = 'GET';
    if (params) {
     if (Vo.isFunction(params)) {
      callback = params;
      params = null;
     } else if (typeof params === 'object') {
      params = Vo.param(params, Vo.ajaxSettings.traditional);
      type = 'POST';
     }
    }
    var self = this;
    Vo.ajax({
     url: url,
     type: type,
     dataType: 'html',
     data: params,
     complete: function(res, status) {
      if (status === 'success' || status === 'notmodified') self.html(selector ?
       Vo('<div>').append(res.responseText.replace(scriptRe, '')).find(selector) : res.responseText);
      if (callback) self.each(callback, [res.responseText, status, res]);
     }
    });
    return this;
   }
  });
  Vo.each(ajaxEvents, function(_, name) {
   Vo.fn[name] = function(callback) { return this.bind(name, callback); };
  });
  Vo.extend({
   get: function(url, data, callback, type) {
    if (Vo.isFunction(data)) {
     type = type || callback;
     callback = data;
     data = null;
    }
    return Vo.ajax({ type: 'GET', url: url, data: data, success: callback, dataType: type });
   },
   getScript: function(url, callback) { return Vo.get(url, null, callback, 'script'); },
   getJSON: function(url, data, callback) { return Vo.get(url, data, callback, 'json'); },
   post: function(url, data, callback, type) {
    if (Vo.isFunction(data)) {
     type = type || callback;
     callback = data;
     data = {};
    }
    return Vo.ajax({ type: 'POST', url: url, data: data, success: callback, dataType: type });
   },
   ajaxSetup: function(settings) { Vo.extend(Vo.ajaxSettings, settings); },
   ajaxSettings: {
    url: location.href,
    global: true,
    type: 'GET',
    contentType: 'application/x-www-form-urlencoded',
    processData: true,
    async: true,
    xhr: function() { return new window.XMLHttpRequest(); },
    accepts: {
     xml: 'application/xml, text/xml',
     html: 'text/html',
     script: 'text/javascript, application/javascript',
     json: 'application/json, text/javascript',
     text: 'text/plain',
     _default: '*/*'
    }
   },
   ajax: function(options) {
    var settings = Vo.extend(true, {}, Vo.ajaxSettings, options),
     jsonp, status, data, type = settings.type.toUpperCase(),
     noContent = /^(?:GET|HEAD)$/.test(type),
     deferred = Vo.Deferred && Vo.Deferred();
    settings.url = settings.url.replace(/#.*$/, '');
    settings.context = options && options.context != null ? options.context : settings;
    if (settings.data && settings.processData && typeof settings.data !== 'string')
     settings.data = Vo.param(settings.data, settings.traditional);
    if (settings.dataType === 'jsonp') {
     if (type === 'GET') {
      if (!jsRe.test(settings.url)) settings.url += (/\?/.test(settings.url) ?
       '&' : '?') + (settings.jsonp || 'callback') + '=?';
     } else if (!settings.data || !jsRe.test(settings.data))
      settings.data = (settings.data ? settings.data + '&' : '') + (settings.jsonp || 'callback') + '=?';
     settings.dataType = 'json';
    }
    if (settings.dataType === 'json' && (settings.data && jsRe
      .test(settings.data) || jsRe.test(settings.url))) {
     jsonp = settings.jsonpCallback || ('jsonp' + jsonpID++);
     if (settings.data) settings.data = (settings.data + '').replace(jsRe, '=' + jsonp + '$1');
     settings.url = settings.url.replace(jsRe, '=' + jsonp + '$1');
     settings.dataType = 'script';
     var customJsonp = window[jsonp];
     window[jsonp] = function(tmp) {
      if (Vo.isFunction(customJsonp)) customJsonp(tmp);
      else { window[jsonp] = undefined; try { delete window[jsonp]; } catch (jsonpError) {} }
      data = tmp;
      Vo.handleSuccess(settings, xhr, status, data, deferred);
      Vo.handleComplete(settings, xhr, status, data);
      if (head) head.removeChild(script);
     };
    }
    if (settings.dataType === 'script' && settings.cache === null) settings.cache = false;
    if (settings.cache === false && noContent) {
     var ts = Vo.now(),
      ret = settings.url.replace(/([?&])_=[^&]*/, '$1_=' + ts);
     settings.url = ret + ((ret === settings.url) ? (/\?/.test(settings.url) ?
      '&' : '?') + '_=' + ts : '');
    }
    if (settings.data && noContent) settings.url += (/\?/.test(settings.url) ? '&' : '?') + settings.data;
    if (settings.global && Vo.active++ === 0) Vo(document).trigger('ajaxStart');
    var parts = /^(\w+:)?\/\/([^\/?#]+)/.exec(settings.url),
     remote = parts && (parts[1] && parts[1].toLowerCase() !== location.protocol ||
      parts[2].toLowerCase() !== location.host);
    if (settings.dataType === 'script' && type === 'GET' && remote) {
     var head = document.getElementsByTagName('head')[0] || document.documentElement,
      script = document.createElement('script');
     if (settings.scriptCharset) script.charset = settings.scriptCharset;
     script.src = settings.url;
     if (!jsonp) {
      var done = false;
      script.onload = script.onreadystatechange = function() {
       if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
        done = true;
        Vo.handleSuccess(settings, xhr, status, data, deferred);
        Vo.handleComplete(settings, xhr, status, data);
        script.onload = script.onreadystatechange = null;
        if (head && script.parentNode) head.removeChild(script);
       }
      };
     }
     head.insertBefore(script, head.firstChild);
     return undefined;
    }
    var requestDone = false,
     xhr = settings.xhr();
    if (deferred) deferred.promise(xhr);
    if (!xhr) return;
    if (settings.username) xhr.open(type, settings.url,
     settings.async, settings.username, settings.password);
    else xhr.open(type, settings.url, settings.async);
    try {
     if ((settings.data != null && !noContent) || (options && options.contentType))
      xhr.setRequestHeader('Content-Type', settings.contentType);
     if (settings.ifModified) {
      if (Vo.lastModified[settings.url])
       xhr.setRequestHeader('If-Modified-Since', Vo.lastModified[settings.url]);
      if (Vo.etag[settings.url]) xhr.setRequestHeader('If-None-Match', Vo.etag[settings.url]);
     }
     if (!remote) xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
     xhr.setRequestHeader('Accept', settings.dataType && settings.accepts[settings.dataType] ?
      settings.accepts[settings.dataType] + ', */*; q=0.01' : settings.accepts._default);
    } catch (headerError) {}
    if (settings.beforeSend && settings.beforeSend.call(settings.context, xhr, settings) === false) {
     if (settings.global && Vo.active-- === 1) Vo(document).trigger('ajaxStop');
     xhr.abort();
     return false;
    }
    if (settings.global) Vo.triggerGlobal(settings, 'ajaxSend', [xhr, settings]);
    var onreadystatechange = xhr.onreadystatechange = function(isTimeout) {
     if (!xhr || xhr.readyState === 0 || isTimeout === 'abort') {
      if (!requestDone) Vo.handleComplete(settings, xhr, status, data);
      requestDone = true;
      if (xhr) xhr.onreadystatechange = Vo.noop;
     } else if (!requestDone && xhr && (xhr.readyState === 4 || isTimeout === 'timeout')) {
      requestDone = true;
      xhr.onreadystatechange = Vo.noop;
      status = isTimeout === 'timeout' ? 'timeout' : !Vo.httpSuccess(xhr) ? 'error' :
       settings.ifModified && Vo.httpNotModified(xhr, settings.url) ? 'notmodified' : 'success';
      var errMsg;
      if (status === 'success') {
       try { data = Vo.httpData(xhr, settings.dataType, settings); } catch (parserError) {
        status = 'parsererror';
        errMsg = parserError;
       }
      }
      if (status === 'success' || status === 'notmodified') {
       if (!jsonp) Vo.handleSuccess(settings, xhr, status, data, deferred);
      } else Vo.handleError(settings, xhr, status, errMsg, deferred);
      if (!jsonp) Vo.handleComplete(settings, xhr, status, data);
      if (isTimeout === 'timeout') xhr.abort();
      if (settings.async) xhr = null;
     }
    };
    try {
     var oldAbort = xhr.abort;
     xhr.abort = function() {
      if (xhr) Function.prototype.call.call(oldAbort, xhr);
      onreadystatechange('abort');
     };
    } catch (abortError) {}
    if (settings.async && settings.timeout > 0) {
     setTimeout(function() {
      if (xhr && !requestDone) onreadystatechange('timeout');
     }, settings.timeout);
    }
    try { xhr.send(noContent || settings.data == null ? null : settings.data); } catch (sendError) {
     Vo.handleError(settings, xhr, null, sendError, deferred);
     Vo.handleComplete(settings, xhr, status, data);
    }
    if (!settings.async) onreadystatechange();
    return xhr;
   },
   param: function(a, traditional) {
    var settings = [],
     add = function(key, value) {
      value = Vo.isFunction(value) ? value() : value;
      settings[settings.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
     };
    if (traditional === undefined) traditional = Vo.ajaxSettings.traditional;
    if (Vo.isArray(a) || Vo.isVo(a)) Vo.each(a, function() { add(this.name, this.value); });
    else
     for (var prefix in a) buildParams(prefix, a[prefix], traditional, add);
    return settings.join('&').replace(/%20/g, '+');
   }
  });

  function buildParams(prefix, obj, traditional, add) {
   if (Vo.isArray(obj) && obj.length) {
    Vo.each(obj, function(i, v) {
     if (traditional || /\[\]$/.test(prefix)) add(prefix, v);
     else buildParams(prefix + '[' + (typeof v === 'object' ||
      Vo.isArray(v) ? i : '') + ']', v, traditional, add);
    });
   } else if (!traditional && obj != null && typeof obj === 'object') {
    if (Vo.isEmptyObject(obj)) add(prefix, '');
    else Vo.each(obj, function(k, v) { buildParams(prefix + '[' + k + ']', v, traditional, add); });
   } else add(prefix, obj);
  }
  Vo.extend({
   active: 0,
   lastModified: {},
   etag: {},
   handleError: function(settings, xhr, status, e, deferred) {
    if (settings.error) settings.error.call(settings.context, xhr, status, e);
    if (deferred) deferred.rejectWith(settings.context, [xhr, status, e]);
    if (settings.global) Vo.triggerGlobal(settings, 'ajaxError', [xhr, settings, e]);
   },
   handleSuccess: function(settings, xhr, status, data, deferred) {
    if (settings.success) settings.success.call(settings.context, data, status, xhr);
    if (deferred) deferred.resolveWith(settings.context, [data, status, xhr]);
    if (settings.global) Vo.triggerGlobal(settings, 'ajaxSuccess', [xhr, settings]);
   },
   handleComplete: function(settings, xhr, status) {
    if (settings.complete) settings.complete.call(settings.context, xhr, status);
    if (settings.global) Vo.triggerGlobal(settings, 'ajaxComplete', [xhr, settings]);
    if (settings.global && Vo.active-- === 1) Vo(document).trigger('ajaxStop');
   },
   triggerGlobal: function(settings, type, args) {
    Vo(settings.context && settings.context.url == null ? settings.context : document).trigger(type, args);
   },
   httpSuccess: function(xhr) {
    try {
     return !xhr.status && location.protocol === 'file:' || xhr.status >= 200 &&
      xhr.status < 300 || xhr.status === 304 || xhr.status === 1223;
    } catch (e) {}
    return false;
   },
   httpNotModified: function(xhr, url) {
    var lastModified = xhr.getResponseHeader('Last-Modified'),
     etag = xhr.getResponseHeader('Etag');
    if (lastModified) Vo.lastModified[url] = lastModified;
    if (etag) Vo.etag[url] = etag;
    return xhr.status === 304;
   },
   httpData: function(xhr, type, settings) {
    var ct = xhr.getResponseHeader('content-type') || '',
     xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
     data = xml ? xhr.responseXML : xhr.responseText;
    if (xml && data.documentElement.nodeName === 'parsererror') Vo.error('parsererror');
    if (settings && settings.dataFilter) data = settings.dataFilter(data, type);
    if (typeof data === 'string') {
     if (type === 'json' || !type && ct.indexOf('json') >= 0) data = Vo.parseJSON(data);
     else if (type === 'script' || !type && ct.indexOf('javascript') >= 0) Vo.globalEval(data);
    }
    return data;
   }
  });
 }(Vo, window, document);
 //Form;
 !function(Vo) {
  Vo.fn.extend({
   serializeArray: function() {
    var result = [];
    Vo(this.get(0).elements).each(function() {
     var self = Vo(this),
      type = self.attr('type');
     if (!Vo.nodeName(this, 'fieldset') && !this.disabled && type != 'submit' && type != 'reset' &&
      type != 'button' && ((type != 'radio' && type != 'checkbox') || this.checked)) {
      result[result.length] = { name: self.attr('name'), value: self.val() };
     }
    });
    return result;
   },
   serialize: function() {
    var result = [];
    Vo.each(this.serializeArray(), function(i, item) {
     result[result.length] = encodeURIComponent(item.name) + '=' + encodeURIComponent(item.value);
    });
    return result.join('&');
   },
   submit: function(callback) {
    if (callback) this.bind('submit', callback);
    else if (this.length) {
     var event = Vo.Event('submit');
     this.eq(0).trigger(event);
     if (!event.defaultPrevented) this.get(0).submit();
    }
    return this;
   }
  });
 }(Vo);
 //Effects;
 !function(Vo, window, document, undefined) {
  var iframe, iframeDoc, elemDisplay = {},
   fxAttributes = ['height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom',
    'width', 'marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'opacity'
   ];
  Vo.each({
   slideDown: generateFx('show', true),
   slideUp: generateFx('hide', true),
   slideToggle: generateFx('toggle', true),
   fadeIn: { opacity: 'show' },
   fadeOut: { opacity: 'hide' },
   fadeToggle: { opacity: 'toggle' }
  }, function(name, props) {
   Vo.fn[name] = function(speed, easing, callback) {
    return this.animate(props, speed, easing, callback);
   };
  });
  Vo.fn.extend({
   show: function(speed, callback) {
    return speed ? this.animate(generateFx('show'), speed, callback) :
     this.filter(function() { return Vo.isHidden(this); }).each(function() {
      this.style.display = Vo.data(this, 'oldDisplay') || defaultDisplay(this.nodeName);
     }).end();
   },
   hide: function(speed, callback) {
    return speed ? this.animate(generateFx('hide'), speed, callback) :
     this.filter(function() { return !Vo.isHidden(this); }).each(function() {
      if (!Vo.data(this, 'oldDisplay')) Vo.data(this, 'oldDisplay', Vo(this).css('display'));
      this.style.display = 'none';
     }).end();
   },
   _toggle: Vo.fn.toggle,
   toggle: function(fn, fn2) {
    return Vo.isFunction(fn) && Vo.isFunction(fn2) ? this._toggle.apply(this, arguments) :
     fn ? this.animate(generateFx('toggle'), fn, fn2) :
     this.each(function() { Vo(this)[Vo.isHidden(this) ? 'show' : 'hide'](); });
   },
   fadeTo: function(speed, to, easing, callback) {
    return this.filter(function() { return Vo.isHidden(this); }).css('opacity', 0).show().end()
     .animate({ opacity: to }, speed, easing, callback);
   },
   animate: function(prop, speed, easing, callback) {
    var optall = Vo.speed(speed, easing, callback);
    return this[optall.queue === false ? 'each' : 'queue'](function() {
     if (this.nodeType != 1) return false;
     var p, opt = Vo.extend({}, optall),
      hidden = Vo.isHidden(this),
      self = this;
     for (p in prop) {
      if (prop[p] === 'hide' && hidden || prop[p] === 'show' && !hidden) return opt.complete.call(this);
      if (p === 'height' || p === 'width') {
       opt.display = Vo(this).css('display');
       opt.overflow = this.style.overflow;
       if (Vo.nodeName(this, 'img') && !this.style.width && (prop[p] === 'show' || prop[p] === 'toggle')) {
        Vo(this).css('width', this.width);
        if (!Vo.data(this, 'setImageWidth')) Vo.data(this, 'setImageWidth', true);
       }
      }
     }
     if (opt.overflow != null) this.style.overflow = 'hidden';
     opt.curAnim = Vo.extend({}, prop);
     Vo.each(prop, function(name, val) {
      var e = new Vo.fx(self, opt, name);
      if (/toggle|show|hide/.test(val)) e[val === 'toggle' ? hidden ? 'show' : 'hide' : val](prop);
      else {
       var parts = val.toString().match(/^([\+\-]=)?([\d\+\-\.]+)(.*)$/),
        start = e.cur(true) || 0;
       if (parts) {
        var end = parseFloat(parts[2]),
         unit = parts[3] || 'px';
        if (unit != 'px') {
         self.style[name] = (end || 1) + unit;
         start = ((end || 1) / e.cur(true)) * start;
         self.style[name] = start + unit;
        }
        if (parts[1]) end = ((parts[1] === '-=' ? -1 : 1) * end) + start;
        e.custom(start, end, unit);
       } else e.custom(start, val, '');
      }
     });
     return true;
    });
   },
   queue: function(type, data) {
    if (typeof type !== 'string') {
     data = type;
     type = 'fx';
    }
    if (data === undefined) return Vo.queue(this[0], type);
    return this.each(function(i) {
     var queue = Vo.queue(this, type, data);
     if (type === 'fx' && queue[0] !== 'inprogress') Vo.dequeue(this, type);
    });
   },
   dequeue: function(type) { return this.each(function() { Vo.dequeue(this, type); }); },
   delay: function(time, type) {
    time = Vo.fx ? Vo.fx.speeds[time] || time : time;
    type = type || 'fx';
    return this.queue(type, function() {
     var elem = this;
     setTimeout(function() { Vo.dequeue(elem, type); }, time);
    });
   },
   clearQueue: function(type) { return this.queue(type || 'fx', []); },
   stop: function(clearQueue, gotoEnd) {
    var timers = Vo.timers;
    if (clearQueue) this.queue([]);
    this.each(function() {
     for (var i = timers.length - 1; i >= 0; i--)
      if (timers[i].elem === this) {
       if (gotoEnd) timers[i](true);
       timers.splice(i, 1);
      }
    });
    if (!gotoEnd) this.dequeue();
    return this;
   }
  });
  Vo.extend({
   speed: function(speed, easing, fn) {
    var opt = speed && Vo.isPlainObject(speed) ? speed : {
     complete: fn || !fn && easing || Vo.isFunction(speed) && speed,
     duration: speed,
     easing: fn && easing || easing && !Vo.isFunction(easing) && easing
    };
    opt.duration = Vo.fx.off ? 0 : (opt.duration && Vo.isNumeric(opt.duration) ?
     opt.duration : Vo.fx.speeds[opt.duration]) || Vo.fx.speeds.def;
    opt.old = opt.complete;
    opt.complete = function() {
     if (opt.queue !== false) Vo(this).dequeue();
     if (Vo.isFunction(opt.old)) opt.old.call(this);
    };
    return opt;
   },
   easing: {
    linear: function(p, n, firstNum, diff) { return firstNum + diff * p; },
    swing: function(p, n, firstNum, diff) {
     return ((-Math.cos(p * Math.PI) / 2) + 0.5) * diff + firstNum;
    }
   },
   queue: function(elem, type, data) {
    if (!elem) return;
    type = (type || 'fx') + 'queue';
    var q = Vo.data(elem, type);
    if (!data) return q || [];
    if (!q || Vo.isArray(data)) q = Vo.data(elem, type, Vo.makeArray(data));
    else q[q.length] = data;
    return q;
   },
   dequeue: function(elem, type) {
    type = type || 'fx';
    var queue = Vo.queue(elem, type),
     fn = queue.shift();
    if (fn === 'inprogress') fn = queue.shift();
    if (fn) {
     if (type === 'fx') queue.unshift('inprogress');
     fn.call(elem, function() { Vo.dequeue(elem, type); });
    }
   },
   timers: [],
   timerId: null,
   fx: function(elem, options, prop) {
    this.options = options;
    this.elem = elem;
    this.prop = prop;
    if (!options.orig) options.orig = {};
   }
  });
  Vo.fx.prototype = {
   update: function() {
    var display = Vo.data(this.elem, 'oldDisplay') || (Vo.isHidden(this.elem) ?
     defaultDisplay(this.elem.nodeName) : Vo(this.elem).css('display'));
    if (this.options.step) this.options.step.call(this.elem, this.now, this);
    (Vo.fx.step[this.prop] || Vo.fx.step._default)(this);
    if (this.prop === 'height' || this.prop === 'width') this.elem.style.display =
     /^(inline|inline-block)$/.test(display) ? 'inline-block' : 'block';
   },
   cur: function(force) {
    if (this.elem[this.prop] != null && this.elem.style[this.prop] == null) return this.elem[this.prop];
    var r = parseFloat(Vo.css(this.elem, this.prop, force));
    return r && r > -10000 ? r : 0;
   },
   custom: function(from, to, unit) {
    this.startTime = Vo.now();
    this.start = from;
    this.end = to;
    this.unit = unit || this.unit || 'px';
    this.now = this.start;
    this.pos = this.state = 0;
    this.update();
    var self = this,
     t = function(gotoEnd) { return self.step(gotoEnd); };
    t.elem = this.elem;
    Vo.timers[Vo.timers.length] = t;
    if (Vo.timerId == null) Vo.timerId = requestAnimationFrame(Vo.fx.tick);
   },
   show: function() {
    this.options.orig[this.prop] = this.elem.style[this.prop];
    this.options.show = true;
    this.custom(this.prop === 'width' || this.prop === 'height' ? 1 : 0, this.cur());
    Vo(this.elem).show();
   },
   hide: function() {
    this.options.orig[this.prop] = this.elem.style[this.prop];
    this.options.hide = true;
    this.custom(this.cur(), 0);
   },
   step: function(gotoEnd) {
    var i, p, t = Vo.now();
    if (gotoEnd || t > this.options.duration + this.startTime) {
     this.now = this.end;
     this.pos = this.state = 1;
     this.update();
     this.options.curAnim[this.prop] = true;
     var done = true;
     for (i in this.options.curAnim)
      if (this.options.curAnim[i] !== true) done = false;
     if (done) {
      if (this.options.display != null) {
       this.elem.style.overflow = this.options.overflow;
       this.elem.style.display = this.options.display;
       if (Vo(this.elem).css('display') === 'none') Vo(this.elem).show();
      }
      if (this.options.hide) Vo(this.elem).hide();
      if (this.options.hide || this.options.show)
       for (p in this.options.curAnim) this.elem.style[p] = this.options.orig[p];
     }
     if (done) {
      this.options.complete.call(this.elem);
      if (Vo.data(this.elem, 'setImageWidth')) Vo(this.elem).css('width', null);
     }
     return false;
    } else {
     var n = t - this.startTime;
     this.state = n / this.options.duration;
     this.pos = Vo.easing[this.options.easing || (Vo.easing.swing ? 'swing' : 'linear')]
      (this.state, n, 0, 1, this.options.duration);
     this.now = this.start + ((this.end - this.start) * this.pos);
     this.update();
    }
    return true;
   }
  };
  Vo.extend(Vo.fx, {
   tick: function() {
    var timers = Vo.timers;
    for (var i = 0; i < timers.length; i++)
     if (!timers[i]()) timers.splice(i--, 1);
    requestAnimationFrame(Vo.fx.tick);
    if (!timers.length) Vo.fx.stop();
   },
   stop: function() {
    cancelAnimationFrame(Vo.timerId);
    Vo.timerId = null;
   },
   speeds: { slow: 600, fast: 200, def: 400 },
   step: {
    scrollLeft: function(fx) { fx.elem.scrollLeft = fx.now; },
    scrollTop: function(fx) { fx.elem.scrollTop = fx.now; },
    opacity: function(fx) { fx.elem.style.opacity = fx.now; },
    _default: function(fx) {
     if (fx.elem.style && fx.elem.style[fx.prop] != null) fx.elem.style[fx.prop] =
      (fx.prop === 'width' || fx.prop === 'height' ? Math.max(0, fx.now) : fx.now) + fx.unit;
     else fx.elem[fx.prop] = fx.now;
    }
   }
  });

  function generateFx(type, slide) {
   var obj = {};
   Vo.each(fxAttributes.slice(0, slide ? 5 : undefined), function() { obj[this] = type; });
   return obj;
  }

  function defaultDisplay(nodeName) {
   nodeName = nodeName.toLowerCase();
   if (!elemDisplay[nodeName]) {
    var body = document.body,
     elem = Vo('<' + nodeName + '>').appendTo(body),
     display = elem.css('display');
    elem.remove();
    if (display === 'none' || display === '') {
     if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.frameBorder = iframe.width = iframe.height = 0;
     }
     body.appendChild(iframe);
     if (!iframeDoc || !iframe.createElement) {
      iframeDoc = (iframe.contentWindow || iframe.contentDocument).document;
      iframeDoc.write((document.compatMode === 'CSS1Compat' ?
       '<!doctype html>' : '') + '<html><body>');
      iframeDoc.close();
     }
     elem = iframeDoc.createElement(nodeName);
     iframeDoc.body.appendChild(elem);
     display = Vo.css(elem, 'display');
     body.removeChild(iframe);
    }
    elemDisplay[nodeName] = display;
   }
   return elemDisplay[nodeName];
  }
 }(Vo, window, document);
 Vo.fn.init.prototype = Vo.fn;
 return Vo;
});