(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fastclick = require('fastclick');
var polylaunch = require('./polylaunch');

polylaunch(function(P) {
  fastclick(document.body);

  var app = new P.App(
    'container',
    'sketchpad',
    'tableview',
    'sliderview',
    window.innerWidth,
    window.innerHeight
  );

  window.addEventListener('resize', function() {
    app.resize(window.innerWidth, window.innerHeight);
  });

  document
    .getElementById('actionButton')
    .addEventListener('click', function() {
      app.createPipeAt(0, 0); 
    });

  app.draw();
});

},{"./polylaunch":35,"fastclick":6}],2:[function(require,module,exports){
var roundPrecision = require('round-precision');

function bezier2(name, p0, p1, p2) {
  function interpolator(t) {
    return (
      (p0 * Math.pow(1 - t, 2)) +
      (p1 * 2 * (1 - t) * t) +
      (p2 * Math.pow(t, 2))
    );
  }

  interpolator.toTex = function(t) {
    if (t !== undefined) {
      var rt = roundPrecision(t, 2);
      return (
        name + ' = ' +
        '\\color{green}{' + roundPrecision(p0, 2) + '}\\times (1-' + rt + ')^2 + ' +
        '\\color{red}{' + roundPrecision(p1, 2) + '}\\times 2(1-' + rt + ')' + rt + ' + ' +
        '\\color{blue}{' + roundPrecision(p2, 2) + '}\\times ' + rt + '^2 ' +
        ' = ' + roundPrecision(interpolator(t), 2)
      );
    } else {
      return (
        name + ' = ' +
        '\\color{green}{' + roundPrecision(p0, 2) + '}\\times (1-t)^2 + ' +
        '\\color{red}{' + roundPrecision(p1, 2) + '}\\times 2(1-t)t + ' +
        '\\color{blue}{' + roundPrecision(p2, 2) + '}\\times t^2'
      );
    }  
  };

  return interpolator;
}

module.exports = function(controlPoint, startPoint, endPoint) {
  return {
    x: bezier2('x', startPoint.x, controlPoint.x, endPoint.x),
    y: bezier2('y', startPoint.y, controlPoint.y, endPoint.y)
  }
};

},{"round-precision":31}],3:[function(require,module,exports){
function linearTween(x0, y0, x1, y1) {
  var diffX = x1 - x0;
  var diffY = y1 - y0;
   
  return function(progress) {
    return {
      x: x0 + progress * diffX,
      y: y0 + progress * diffY
    };
  };
}

module.exports = linearTween;

},{}],4:[function(require,module,exports){

/**
 * Module dependencies.
 */

var now = require('date-now');

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = now() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function debounced() {
    context = this;
    args = arguments;
    timestamp = now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

},{"date-now":5}],5:[function(require,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],6:[function(require,module,exports){
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

},{}],7:[function(require,module,exports){
/* eslint no-console:0 */
/**
 * This is the main entry point for KaTeX. Here, we expose functions for
 * rendering expressions either to DOM nodes or to markup strings.
 *
 * We also expose the ParseError class to check if errors thrown from KaTeX are
 * errors in the expression, or errors in javascript handling.
 */

var ParseError = require("./src/ParseError");
var Settings = require("./src/Settings");

var buildTree = require("./src/buildTree");
var parseTree = require("./src/parseTree");
var utils = require("./src/utils");

/**
 * Parse and build an expression, and place that expression in the DOM node
 * given.
 */
var render = function(expression, baseNode, options) {
    utils.clearNode(baseNode);

    var settings = new Settings(options);

    var tree = parseTree(expression, settings);
    var node = buildTree(tree, expression, settings).toNode();

    baseNode.appendChild(node);
};

// KaTeX's styles don't work properly in quirks mode. Print out an error, and
// disable rendering.
if (typeof document !== "undefined") {
    if (document.compatMode !== "CSS1Compat") {
        typeof console !== "undefined" && console.warn(
            "Warning: KaTeX doesn't work in quirks mode. Make sure your " +
                "website has a suitable doctype.");

        render = function() {
            throw new ParseError("KaTeX doesn't work in quirks mode.");
        };
    }
}

/**
 * Parse and build an expression, and return the markup for that.
 */
var renderToString = function(expression, options) {
    var settings = new Settings(options);

    var tree = parseTree(expression, settings);
    return buildTree(tree, expression, settings).toMarkup();
};

/**
 * Parse an expression and return the parse tree.
 */
var generateParseTree = function(expression, options) {
    var settings = new Settings(options);
    return parseTree(expression, settings);
};

module.exports = {
    render: render,
    renderToString: renderToString,
    /**
     * NOTE: This method is not currently recommended for public use.
     * The internal tree representation is unstable and is very likely
     * to change. Use at your own risk.
     */
    __parse: generateParseTree,
    ParseError: ParseError,
};

},{"./src/ParseError":11,"./src/Settings":13,"./src/buildTree":18,"./src/parseTree":27,"./src/utils":29}],8:[function(require,module,exports){
/** @flow */

"use strict";

function getRelocatable(re) {
  // In the future, this could use a WeakMap instead of an expando.
  if (!re.__matchAtRelocatable) {
    // Disjunctions are the lowest-precedence operator, so we can make any
    // pattern match the empty string by appending `|()` to it:
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-patterns
    var source = re.source + "|()";

    // We always make the new regex global.
    var flags = "g" + (re.ignoreCase ? "i" : "") + (re.multiline ? "m" : "") + (re.unicode ? "u" : "")
    // sticky (/.../y) doesn't make sense in conjunction with our relocation
    // logic, so we ignore it here.
    ;

    re.__matchAtRelocatable = new RegExp(source, flags);
  }
  return re.__matchAtRelocatable;
}

function matchAt(re, str, pos) {
  if (re.global || re.sticky) {
    throw new Error("matchAt(...): Only non-global regexes are supported");
  }
  var reloc = getRelocatable(re);
  reloc.lastIndex = pos;
  var match = reloc.exec(str);
  // Last capturing group is our sentinel that indicates whether the regex
  // matched at the given location.
  if (match[match.length - 1] == null) {
    // Original regex matched.
    match.length = match.length - 1;
    return match;
  } else {
    return null;
  }
}

module.exports = matchAt;
},{}],9:[function(require,module,exports){
/**
 * The Lexer class handles tokenizing the input in various ways. Since our
 * parser expects us to be able to backtrack, the lexer allows lexing from any
 * given starting point.
 *
 * Its main exposed function is the `lex` function, which takes a position to
 * lex from and a type of token to lex. It defers to the appropriate `_innerLex`
 * function.
 *
 * The various `_innerLex` functions perform the actual lexing of different
 * kinds.
 */

var matchAt = require("match-at");

var ParseError = require("./ParseError");

// The main lexer class
function Lexer(input) {
    this._input = input;
}

// The resulting token returned from `lex`.
function Token(text, data, position) {
    this.text = text;
    this.data = data;
    this.position = position;
}

/* The following tokenRegex
 * - matches typical whitespace (but not NBSP etc.) using its first group
 * - matches symbol combinations which result in a single output character
 * - does not match any control character \x00-\x1f except whitespace
 * - does not match a bare backslash
 * - matches any ASCII character except those just mentioned
 * - does not match the BMP private use area \uE000-\uF8FF
 * - does not match bare surrogate code units
 * - matches any BMP character except for those just described
 * - matches any valid Unicode surrogate pair
 * - matches a backslash followed by one or more letters
 * - matches a backslash followed by any BMP character, including newline
 * Just because the Lexer matches something doesn't mean it's valid input:
 * If there is no matching function or symbol definition, the Parser will
 * still reject the input.
 */
var tokenRegex = new RegExp(
    "([ \r\n\t]+)|(" +                                // whitespace
    "---?" +                                          // special combinations
    "|[!-\\[\\]-\u2027\u202A-\uD7FF\uF900-\uFFFF]" +  // single codepoint
    "|[\uD800-\uDBFF][\uDC00-\uDFFF]" +               // surrogate pair
    "|\\\\(?:[a-zA-Z]+|[^\uD800-\uDFFF])" +           // function name
    ")"
);

var whitespaceRegex = /\s*/;

/**
 * This function lexes a single normal token. It takes a position and
 * whether it should completely ignore whitespace or not.
 */
Lexer.prototype._innerLex = function(pos, ignoreWhitespace) {
    var input = this._input;
    if (pos === input.length) {
        return new Token("EOF", null, pos);
    }
    var match = matchAt(tokenRegex, input, pos);
    if (match === null) {
        throw new ParseError(
            "Unexpected character: '" + input[pos] + "'",
            this, pos);
    } else if (match[2]) { // matched non-whitespace
        return new Token(match[2], null, pos + match[2].length);
    } else if (ignoreWhitespace) {
        return this._innerLex(pos + match[1].length, true);
    } else { // concatenate whitespace to a single space
        return new Token(" ", null, pos + match[1].length);
    }
};

// A regex to match a CSS color (like #ffffff or BlueViolet)
var cssColor = /#[a-z0-9]+|[a-z]+/i;

/**
 * This function lexes a CSS color.
 */
Lexer.prototype._innerLexColor = function(pos) {
    var input = this._input;

    // Ignore whitespace
    var whitespace = matchAt(whitespaceRegex, input, pos)[0];
    pos += whitespace.length;

    var match;
    if ((match = matchAt(cssColor, input, pos))) {
        // If we look like a color, return a color
        return new Token(match[0], null, pos + match[0].length);
    } else {
        throw new ParseError("Invalid color", this, pos);
    }
};

// A regex to match a dimension. Dimensions look like
// "1.2em" or ".4pt" or "1 ex"
var sizeRegex = /(-?)\s*(\d+(?:\.\d*)?|\.\d+)\s*([a-z]{2})/;

/**
 * This function lexes a dimension.
 */
Lexer.prototype._innerLexSize = function(pos) {
    var input = this._input;

    // Ignore whitespace
    var whitespace = matchAt(whitespaceRegex, input, pos)[0];
    pos += whitespace.length;

    var match;
    if ((match = matchAt(sizeRegex, input, pos))) {
        var unit = match[3];
        // We only currently handle "em" and "ex" units
        if (unit !== "em" && unit !== "ex") {
            throw new ParseError("Invalid unit: '" + unit + "'", this, pos);
        }
        return new Token(match[0], {
            number: +(match[1] + match[2]),
            unit: unit,
        }, pos + match[0].length);
    }

    throw new ParseError("Invalid size", this, pos);
};

/**
 * This function lexes a string of whitespace.
 */
Lexer.prototype._innerLexWhitespace = function(pos) {
    var input = this._input;

    var whitespace = matchAt(whitespaceRegex, input, pos)[0];
    pos += whitespace.length;

    return new Token(whitespace[0], null, pos);
};

/**
 * This function lexes a single token starting at `pos` and of the given mode.
 * Based on the mode, we defer to one of the `_innerLex` functions.
 */
Lexer.prototype.lex = function(pos, mode) {
    if (mode === "math") {
        return this._innerLex(pos, true);
    } else if (mode === "text") {
        return this._innerLex(pos, false);
    } else if (mode === "color") {
        return this._innerLexColor(pos);
    } else if (mode === "size") {
        return this._innerLexSize(pos);
    } else if (mode === "whitespace") {
        return this._innerLexWhitespace(pos);
    }
};

module.exports = Lexer;

},{"./ParseError":11,"match-at":8}],10:[function(require,module,exports){
/**
 * This file contains information about the options that the Parser carries
 * around with it while parsing. Data is held in an `Options` object, and when
 * recursing, a new `Options` object can be created with the `.with*` and
 * `.reset` functions.
 */

/**
 * This is the main options class. It contains the style, size, color, and font
 * of the current parse level. It also contains the style and size of the parent
 * parse level, so size changes can be handled efficiently.
 *
 * Each of the `.with*` and `.reset` functions passes its current style and size
 * as the parentStyle and parentSize of the new options class, so parent
 * handling is taken care of automatically.
 */
function Options(data) {
    this.style = data.style;
    this.color = data.color;
    this.size = data.size;
    this.phantom = data.phantom;
    this.font = data.font;

    if (data.parentStyle === undefined) {
        this.parentStyle = data.style;
    } else {
        this.parentStyle = data.parentStyle;
    }

    if (data.parentSize === undefined) {
        this.parentSize = data.size;
    } else {
        this.parentSize = data.parentSize;
    }
}

/**
 * Returns a new options object with the same properties as "this".  Properties
 * from "extension" will be copied to the new options object.
 */
Options.prototype.extend = function(extension) {
    var data = {
        style: this.style,
        size: this.size,
        color: this.color,
        parentStyle: this.style,
        parentSize: this.size,
        phantom: this.phantom,
        font: this.font,
    };

    for (var key in extension) {
        if (extension.hasOwnProperty(key)) {
            data[key] = extension[key];
        }
    }

    return new Options(data);
};

/**
 * Create a new options object with the given style.
 */
Options.prototype.withStyle = function(style) {
    return this.extend({
        style: style,
    });
};

/**
 * Create a new options object with the given size.
 */
Options.prototype.withSize = function(size) {
    return this.extend({
        size: size,
    });
};

/**
 * Create a new options object with the given color.
 */
Options.prototype.withColor = function(color) {
    return this.extend({
        color: color,
    });
};

/**
 * Create a new options object with "phantom" set to true.
 */
Options.prototype.withPhantom = function() {
    return this.extend({
        phantom: true,
    });
};

/**
 * Create a new options objects with the give font.
 */
Options.prototype.withFont = function(font) {
    return this.extend({
        font: font,
    });
};

/**
 * Create a new options object with the same style, size, and color. This is
 * used so that parent style and size changes are handled correctly.
 */
Options.prototype.reset = function() {
    return this.extend({});
};

/**
 * A map of color names to CSS colors.
 * TODO(emily): Remove this when we have real macros
 */
var colorMap = {
    "katex-blue": "#6495ed",
    "katex-orange": "#ffa500",
    "katex-pink": "#ff00af",
    "katex-red": "#df0030",
    "katex-green": "#28ae7b",
    "katex-gray": "gray",
    "katex-purple": "#9d38bd",
    "katex-blueA": "#c7e9f1",
    "katex-blueB": "#9cdceb",
    "katex-blueC": "#58c4dd",
    "katex-blueD": "#29abca",
    "katex-blueE": "#1c758a",
    "katex-tealA": "#acead7",
    "katex-tealB": "#76ddc0",
    "katex-tealC": "#5cd0b3",
    "katex-tealD": "#55c1a7",
    "katex-tealE": "#49a88f",
    "katex-greenA": "#c9e2ae",
    "katex-greenB": "#a6cf8c",
    "katex-greenC": "#83c167",
    "katex-greenD": "#77b05d",
    "katex-greenE": "#699c52",
    "katex-goldA": "#f7c797",
    "katex-goldB": "#f9b775",
    "katex-goldC": "#f0ac5f",
    "katex-goldD": "#e1a158",
    "katex-goldE": "#c78d46",
    "katex-redA": "#f7a1a3",
    "katex-redB": "#ff8080",
    "katex-redC": "#fc6255",
    "katex-redD": "#e65a4c",
    "katex-redE": "#cf5044",
    "katex-maroonA": "#ecabc1",
    "katex-maroonB": "#ec92ab",
    "katex-maroonC": "#c55f73",
    "katex-maroonD": "#a24d61",
    "katex-maroonE": "#94424f",
    "katex-purpleA": "#caa3e8",
    "katex-purpleB": "#b189c6",
    "katex-purpleC": "#9a72ac",
    "katex-purpleD": "#715582",
    "katex-purpleE": "#644172",
    "katex-mintA": "#f5f9e8",
    "katex-mintB": "#edf2df",
    "katex-mintC": "#e0e5cc",
    "katex-grayA": "#fdfdfd",
    "katex-grayB": "#f7f7f7",
    "katex-grayC": "#eeeeee",
    "katex-grayD": "#dddddd",
    "katex-grayE": "#cccccc",
    "katex-grayF": "#aaaaaa",
    "katex-grayG": "#999999",
    "katex-grayH": "#555555",
    "katex-grayI": "#333333",
    "katex-kaBlue": "#314453",
    "katex-kaGreen": "#639b24",
};

/**
 * Gets the CSS color of the current options object, accounting for the
 * `colorMap`.
 */
Options.prototype.getColor = function() {
    if (this.phantom) {
        return "transparent";
    } else {
        return colorMap[this.color] || this.color;
    }
};

module.exports = Options;

},{}],11:[function(require,module,exports){
/**
 * This is the ParseError class, which is the main error thrown by KaTeX
 * functions when something has gone wrong. This is used to distinguish internal
 * errors from errors in the expression that the user provided.
 */
function ParseError(message, lexer, position) {
    var error = "KaTeX parse error: " + message;

    if (lexer !== undefined && position !== undefined) {
        // If we have the input and a position, make the error a bit fancier

        // Prepend some information
        error += " at position " + position + ": ";

        // Get the input
        var input = lexer._input;
        // Insert a combining underscore at the correct position
        input = input.slice(0, position) + "\u0332" +
            input.slice(position);

        // Extract some context from the input and add it to the error
        var begin = Math.max(0, position - 15);
        var end = position + 15;
        error += input.slice(begin, end);
    }

    // Some hackery to make ParseError a prototype of Error
    // See http://stackoverflow.com/a/8460753
    var self = new Error(error);
    self.name = "ParseError";
    self.__proto__ = ParseError.prototype;

    self.position = position;
    return self;
}

// More hackery
ParseError.prototype.__proto__ = Error.prototype;

module.exports = ParseError;

},{}],12:[function(require,module,exports){
/* eslint no-constant-condition:0 */
var functions = require("./functions");
var environments = require("./environments");
var Lexer = require("./Lexer");
var symbols = require("./symbols");
var utils = require("./utils");

var parseData = require("./parseData");
var ParseError = require("./ParseError");

/**
 * This file contains the parser used to parse out a TeX expression from the
 * input. Since TeX isn't context-free, standard parsers don't work particularly
 * well.
 *
 * The strategy of this parser is as such:
 *
 * The main functions (the `.parse...` ones) take a position in the current
 * parse string to parse tokens from. The lexer (found in Lexer.js, stored at
 * this.lexer) also supports pulling out tokens at arbitrary places. When
 * individual tokens are needed at a position, the lexer is called to pull out a
 * token, which is then used.
 *
 * The parser has a property called "mode" indicating the mode that
 * the parser is currently in. Currently it has to be one of "math" or
 * "text", which denotes whether the current environment is a math-y
 * one or a text-y one (e.g. inside \text). Currently, this serves to
 * limit the functions which can be used in text mode.
 *
 * The main functions then return an object which contains the useful data that
 * was parsed at its given point, and a new position at the end of the parsed
 * data. The main functions can call each other and continue the parsing by
 * using the returned position as a new starting point.
 *
 * There are also extra `.handle...` functions, which pull out some reused
 * functionality into self-contained functions.
 *
 * The earlier functions return ParseNodes.
 * The later functions (which are called deeper in the parse) sometimes return
 * ParseFuncOrArgument, which contain a ParseNode as well as some data about
 * whether the parsed object is a function which is missing some arguments, or a
 * standalone object which can be used as an argument to another function.
 */

/**
 * Main Parser class
 */
function Parser(input, settings) {
    // Make a new lexer
    this.lexer = new Lexer(input);
    // Store the settings for use in parsing
    this.settings = settings;
}

var ParseNode = parseData.ParseNode;

/**
 * An initial function (without its arguments), or an argument to a function.
 * The `result` argument should be a ParseNode.
 */
function ParseFuncOrArgument(result, isFunction) {
    this.result = result;
    // Is this a function (i.e. is it something defined in functions.js)?
    this.isFunction = isFunction;
}

/**
 * Checks a result to make sure it has the right type, and throws an
 * appropriate error otherwise.
 *
 * @param {boolean=} consume whether to consume the expected token,
 *                           defaults to true
 */
Parser.prototype.expect = function(text, consume) {
    if (this.nextToken.text !== text) {
        throw new ParseError(
            "Expected '" + text + "', got '" + this.nextToken.text + "'",
            this.lexer, this.nextToken.position
        );
    }
    if (consume !== false) {
        this.consume();
    }
};

/**
 * Considers the current look ahead token as consumed,
 * and fetches the one after that as the new look ahead.
 */
Parser.prototype.consume = function() {
    this.pos = this.nextToken.position;
    this.nextToken = this.lexer.lex(this.pos, this.mode);
};

/**
 * Main parsing function, which parses an entire input.
 *
 * @return {?Array.<ParseNode>}
 */
Parser.prototype.parse = function() {
    // Try to parse the input
    this.mode = "math";
    this.pos = 0;
    this.nextToken = this.lexer.lex(this.pos, this.mode);
    var parse = this.parseInput();
    return parse;
};

/**
 * Parses an entire input tree.
 */
Parser.prototype.parseInput = function() {
    // Parse an expression
    var expression = this.parseExpression(false);
    // If we succeeded, make sure there's an EOF at the end
    this.expect("EOF", false);
    return expression;
};

var endOfExpression = ["}", "\\end", "\\right", "&", "\\\\", "\\cr"];

/**
 * Parses an "expression", which is a list of atoms.
 *
 * @param {boolean} breakOnInfix Should the parsing stop when we hit infix
 *                  nodes? This happens when functions have higher precendence
 *                  than infix nodes in implicit parses.
 *
 * @param {?string} breakOnToken The token that the expression should end with,
 *                  or `null` if something else should end the expression.
 *
 * @return {ParseNode}
 */
Parser.prototype.parseExpression = function(breakOnInfix, breakOnToken) {
    var body = [];
    // Keep adding atoms to the body until we can't parse any more atoms (either
    // we reached the end, a }, or a \right)
    while (true) {
        var lex = this.nextToken;
        var pos = this.pos;
        if (endOfExpression.indexOf(lex.text) !== -1) {
            break;
        }
        if (breakOnToken && lex.text === breakOnToken) {
            break;
        }
        var atom = this.parseAtom();
        if (!atom) {
            if (!this.settings.throwOnError && lex.text[0] === "\\") {
                var errorNode = this.handleUnsupportedCmd();
                body.push(errorNode);

                pos = lex.position;
                continue;
            }

            break;
        }
        if (breakOnInfix && atom.type === "infix") {
            // rewind so we can parse the infix atom again
            this.pos = pos;
            this.nextToken = lex;
            break;
        }
        body.push(atom);
    }
    return this.handleInfixNodes(body);
};

/**
 * Rewrites infix operators such as \over with corresponding commands such
 * as \frac.
 *
 * There can only be one infix operator per group.  If there's more than one
 * then the expression is ambiguous.  This can be resolved by adding {}.
 *
 * @returns {Array}
 */
Parser.prototype.handleInfixNodes = function(body) {
    var overIndex = -1;
    var funcName;

    for (var i = 0; i < body.length; i++) {
        var node = body[i];
        if (node.type === "infix") {
            if (overIndex !== -1) {
                throw new ParseError("only one infix operator per group",
                    this.lexer, -1);
            }
            overIndex = i;
            funcName = node.value.replaceWith;
        }
    }

    if (overIndex !== -1) {
        var numerNode;
        var denomNode;

        var numerBody = body.slice(0, overIndex);
        var denomBody = body.slice(overIndex + 1);

        if (numerBody.length === 1 && numerBody[0].type === "ordgroup") {
            numerNode = numerBody[0];
        } else {
            numerNode = new ParseNode("ordgroup", numerBody, this.mode);
        }

        if (denomBody.length === 1 && denomBody[0].type === "ordgroup") {
            denomNode = denomBody[0];
        } else {
            denomNode = new ParseNode("ordgroup", denomBody, this.mode);
        }

        var value = this.callFunction(
            funcName, [numerNode, denomNode], null);
        return [new ParseNode(value.type, value, this.mode)];
    } else {
        return body;
    }
};

// The greediness of a superscript or subscript
var SUPSUB_GREEDINESS = 1;

/**
 * Handle a subscript or superscript with nice errors.
 */
Parser.prototype.handleSupSubscript = function(name) {
    var symbol = this.nextToken.text;
    var symPos = this.pos;
    this.consume();
    var group = this.parseGroup();

    if (!group) {
        if (!this.settings.throwOnError && this.nextToken.text[0] === "\\") {
            return this.handleUnsupportedCmd();
        } else {
            throw new ParseError(
                "Expected group after '" + symbol + "'",
                this.lexer,
                symPos + 1
            );
        }
    } else if (group.isFunction) {
        // ^ and _ have a greediness, so handle interactions with functions'
        // greediness
        var funcGreediness = functions[group.result].greediness;
        if (funcGreediness > SUPSUB_GREEDINESS) {
            return this.parseFunction(group);
        } else {
            throw new ParseError(
                "Got function '" + group.result + "' with no arguments " +
                    "as " + name,
                this.lexer, symPos + 1);
        }
    } else {
        return group.result;
    }
};

/**
 * Converts the textual input of an unsupported command into a text node
 * contained within a color node whose color is determined by errorColor
 */
Parser.prototype.handleUnsupportedCmd = function() {
    var text = this.nextToken.text;
    var textordArray = [];

    for (var i = 0; i < text.length; i++) {
        textordArray.push(new ParseNode("textord", text[i], "text"));
    }

    var textNode = new ParseNode(
        "text",
        {
            body: textordArray,
            type: "text",
        },
        this.mode);

    var colorNode = new ParseNode(
        "color",
        {
            color: this.settings.errorColor,
            value: [textNode],
            type: "color",
        },
        this.mode);

    this.consume();
    return colorNode;
};

/**
 * Parses a group with optional super/subscripts.
 *
 * @return {?ParseNode}
 */
Parser.prototype.parseAtom = function() {
    // The body of an atom is an implicit group, so that things like
    // \left(x\right)^2 work correctly.
    var base = this.parseImplicitGroup();

    // In text mode, we don't have superscripts or subscripts
    if (this.mode === "text") {
        return base;
    }

    // Note that base may be empty (i.e. null) at this point.

    var superscript;
    var subscript;
    while (true) {
        // Lex the first token
        var lex = this.nextToken;

        if (lex.text === "\\limits" || lex.text === "\\nolimits") {
            // We got a limit control
            if (!base || base.type !== "op") {
                throw new ParseError(
                    "Limit controls must follow a math operator",
                    this.lexer, this.pos);
            } else {
                var limits = lex.text === "\\limits";
                base.value.limits = limits;
                base.value.alwaysHandleSupSub = true;
            }
            this.consume();
        } else if (lex.text === "^") {
            // We got a superscript start
            if (superscript) {
                throw new ParseError(
                    "Double superscript", this.lexer, this.pos);
            }
            superscript = this.handleSupSubscript("superscript");
        } else if (lex.text === "_") {
            // We got a subscript start
            if (subscript) {
                throw new ParseError(
                    "Double subscript", this.lexer, this.pos);
            }
            subscript = this.handleSupSubscript("subscript");
        } else if (lex.text === "'") {
            // We got a prime
            var prime = new ParseNode("textord", "\\prime", this.mode);

            // Many primes can be grouped together, so we handle this here
            var primes = [prime];
            this.consume();
            // Keep lexing tokens until we get something that's not a prime
            while (this.nextToken.text === "'") {
                // For each one, add another prime to the list
                primes.push(prime);
                this.consume();
            }
            // Put them into an ordgroup as the superscript
            superscript = new ParseNode("ordgroup", primes, this.mode);
        } else {
            // If it wasn't ^, _, or ', stop parsing super/subscripts
            break;
        }
    }

    if (superscript || subscript) {
        // If we got either a superscript or subscript, create a supsub
        return new ParseNode("supsub", {
            base: base,
            sup: superscript,
            sub: subscript,
        }, this.mode);
    } else {
        // Otherwise return the original body
        return base;
    }
};

// A list of the size-changing functions, for use in parseImplicitGroup
var sizeFuncs = [
    "\\tiny", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize",
    "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge",
];

// A list of the style-changing functions, for use in parseImplicitGroup
var styleFuncs = [
    "\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle",
];

/**
 * Parses an implicit group, which is a group that starts at the end of a
 * specified, and ends right before a higher explicit group ends, or at EOL. It
 * is used for functions that appear to affect the current style, like \Large or
 * \textrm, where instead of keeping a style we just pretend that there is an
 * implicit grouping after it until the end of the group. E.g.
 *   small text {\Large large text} small text again
 * It is also used for \left and \right to get the correct grouping.
 *
 * @return {?ParseNode}
 */
Parser.prototype.parseImplicitGroup = function() {
    var start = this.parseSymbol();

    if (start == null) {
        // If we didn't get anything we handle, fall back to parseFunction
        return this.parseFunction();
    }

    var func = start.result;
    var body;

    if (func === "\\left") {
        // If we see a left:
        // Parse the entire left function (including the delimiter)
        var left = this.parseFunction(start);
        // Parse out the implicit body
        body = this.parseExpression(false);
        // Check the next token
        this.expect("\\right", false);
        var right = this.parseFunction();
        return new ParseNode("leftright", {
            body: body,
            left: left.value.value,
            right: right.value.value,
        }, this.mode);
    } else if (func === "\\begin") {
        // begin...end is similar to left...right
        var begin = this.parseFunction(start);
        var envName = begin.value.name;
        if (!environments.hasOwnProperty(envName)) {
            throw new ParseError(
                "No such environment: " + envName,
                this.lexer, begin.value.namepos);
        }
        // Build the environment object. Arguments and other information will
        // be made available to the begin and end methods using properties.
        var env = environments[envName];
        var args = this.parseArguments("\\begin{" + envName + "}", env);
        var context = {
            mode: this.mode,
            envName: envName,
            parser: this,
            lexer: this.lexer,
            positions: args.pop(),
        };
        var result = env.handler(context, args);
        this.expect("\\end", false);
        var end = this.parseFunction();
        if (end.value.name !== envName) {
            throw new ParseError(
                "Mismatch: \\begin{" + envName + "} matched " +
                "by \\end{" + end.value.name + "}",
                this.lexer /* , end.value.namepos */);
            // TODO: Add position to the above line and adjust test case,
            // requires #385 to get merged first
        }
        result.position = end.position;
        return result;
    } else if (utils.contains(sizeFuncs, func)) {
        // If we see a sizing function, parse out the implict body
        body = this.parseExpression(false);
        return new ParseNode("sizing", {
            // Figure out what size to use based on the list of functions above
            size: "size" + (utils.indexOf(sizeFuncs, func) + 1),
            value: body,
        }, this.mode);
    } else if (utils.contains(styleFuncs, func)) {
        // If we see a styling function, parse out the implict body
        body = this.parseExpression(true);
        return new ParseNode("styling", {
            // Figure out what style to use by pulling out the style from
            // the function name
            style: func.slice(1, func.length - 5),
            value: body,
        }, this.mode);
    } else {
        // Defer to parseFunction if it's not a function we handle
        return this.parseFunction(start);
    }
};

/**
 * Parses an entire function, including its base and all of its arguments.
 * The base might either have been parsed already, in which case
 * it is provided as an argument, or it's the next group in the input.
 *
 * @param {ParseFuncOrArgument=} baseGroup optional as described above
 * @return {?ParseNode}
 */
Parser.prototype.parseFunction = function(baseGroup) {
    if (!baseGroup) {
        baseGroup = this.parseGroup();
    }

    if (baseGroup) {
        if (baseGroup.isFunction) {
            var func = baseGroup.result;
            var funcData = functions[func];
            if (this.mode === "text" && !funcData.allowedInText) {
                throw new ParseError(
                    "Can't use function '" + func + "' in text mode",
                    this.lexer, baseGroup.position);
            }

            var args = this.parseArguments(func, funcData);
            var result = this.callFunction(func, args, args.pop());
            return new ParseNode(result.type, result, this.mode);
        } else {
            return baseGroup.result;
        }
    } else {
        return null;
    }
};

/**
 * Call a function handler with a suitable context and arguments.
 */
Parser.prototype.callFunction = function(name, args, positions) {
    var context = {
        funcName: name,
        parser: this,
        lexer: this.lexer,
        positions: positions,
    };
    return functions[name].handler(context, args);
};

/**
 * Parses the arguments of a function or environment
 *
 * @param {string} func  "\name" or "\begin{name}"
 * @param {{numArgs:number,numOptionalArgs:number|undefined}} funcData
 * @return the array of arguments, with the list of positions as last element
 */
Parser.prototype.parseArguments = function(func, funcData) {
    var totalArgs = funcData.numArgs + funcData.numOptionalArgs;
    if (totalArgs === 0) {
        return [[this.pos]];
    }

    var baseGreediness = funcData.greediness;
    var positions = [this.pos];
    var args = [];

    for (var i = 0; i < totalArgs; i++) {
        var argType = funcData.argTypes && funcData.argTypes[i];
        var arg;
        if (i < funcData.numOptionalArgs) {
            if (argType) {
                arg = this.parseSpecialGroup(argType, true);
            } else {
                arg = this.parseOptionalGroup();
            }
            if (!arg) {
                args.push(null);
                positions.push(this.pos);
                continue;
            }
        } else {
            if (argType) {
                arg = this.parseSpecialGroup(argType);
            } else {
                arg = this.parseGroup();
            }
            if (!arg) {
                if (!this.settings.throwOnError &&
                    this.nextToken.text[0] === "\\") {
                    arg = new ParseFuncOrArgument(
                        this.handleUnsupportedCmd(this.nextToken.text),
                        false);
                } else {
                    throw new ParseError(
                        "Expected group after '" + func + "'",
                        this.lexer, this.pos);
                }
            }
        }
        var argNode;
        if (arg.isFunction) {
            var argGreediness =
                functions[arg.result].greediness;
            if (argGreediness > baseGreediness) {
                argNode = this.parseFunction(arg);
            } else {
                throw new ParseError(
                    "Got function '" + arg.result + "' as " +
                    "argument to '" + func + "'",
                    this.lexer, this.pos - 1);
            }
        } else {
            argNode = arg.result;
        }
        args.push(argNode);
        positions.push(this.pos);
    }

    args.push(positions);

    return args;
};


/**
 * Parses a group when the mode is changing. Takes a position, a new mode, and
 * an outer mode that is used to parse the outside.
 *
 * @return {?ParseFuncOrArgument}
 */
Parser.prototype.parseSpecialGroup = function(innerMode, optional) {
    var outerMode = this.mode;
    // Handle `original` argTypes
    if (innerMode === "original") {
        innerMode = outerMode;
    }

    if (innerMode === "color" || innerMode === "size") {
        // color and size modes are special because they should have braces and
        // should only lex a single symbol inside
        var openBrace = this.nextToken;
        if (optional && openBrace.text !== "[") {
            // optional arguments should return null if they don't exist
            return null;
        }
        // The call to expect will lex the token after the '{' in inner mode
        this.mode = innerMode;
        this.expect(optional ? "[" : "{");
        var inner = this.nextToken;
        this.mode = outerMode;
        var data;
        if (innerMode === "color") {
            data = inner.text;
        } else {
            data = inner.data;
        }
        this.consume(); // consume the token stored in inner
        this.expect(optional ? "]" : "}");
        return new ParseFuncOrArgument(
            new ParseNode(innerMode, data, outerMode),
            false);
    } else if (innerMode === "text") {
        // text mode is special because it should ignore the whitespace before
        // it
        var whitespace = this.lexer.lex(this.pos, "whitespace");
        this.pos = whitespace.position;
    }

    // By the time we get here, innerMode is one of "text" or "math".
    // We switch the mode of the parser, recurse, then restore the old mode.
    this.mode = innerMode;
    this.nextToken = this.lexer.lex(this.pos, innerMode);
    var res;
    if (optional) {
        res = this.parseOptionalGroup();
    } else {
        res = this.parseGroup();
    }
    this.mode = outerMode;
    this.nextToken = this.lexer.lex(this.pos, outerMode);
    return res;
};

/**
 * Parses a group, which is either a single nucleus (like "x") or an expression
 * in braces (like "{x+y}")
 *
 * @return {?ParseFuncOrArgument}
 */
Parser.prototype.parseGroup = function() {
    // Try to parse an open brace
    if (this.nextToken.text === "{") {
        // If we get a brace, parse an expression
        this.consume();
        var expression = this.parseExpression(false);
        // Make sure we get a close brace
        this.expect("}");
        return new ParseFuncOrArgument(
            new ParseNode("ordgroup", expression, this.mode),
            false);
    } else {
        // Otherwise, just return a nucleus
        return this.parseSymbol();
    }
};

/**
 * Parses a group, which is an expression in brackets (like "[x+y]")
 *
 * @return {?ParseFuncOrArgument}
 */
Parser.prototype.parseOptionalGroup = function() {
    // Try to parse an open bracket
    if (this.nextToken.text === "[") {
        // If we get a brace, parse an expression
        this.consume();
        var expression = this.parseExpression(false, "]");
        // Make sure we get a close bracket
        this.expect("]");
        return new ParseFuncOrArgument(
            new ParseNode("ordgroup", expression, this.mode),
            false);
    } else {
        // Otherwise, return null,
        return null;
    }
};

/**
 * Parse a single symbol out of the string. Here, we handle both the functions
 * we have defined, as well as the single character symbols
 *
 * @return {?ParseFuncOrArgument}
 */
Parser.prototype.parseSymbol = function() {
    var nucleus = this.nextToken;

    if (functions[nucleus.text]) {
        this.consume();
        // If there exists a function with this name, we return the function and
        // say that it is a function.
        return new ParseFuncOrArgument(
            nucleus.text,
            true);
    } else if (symbols[this.mode][nucleus.text]) {
        this.consume();
        // Otherwise if this is a no-argument function, find the type it
        // corresponds to in the symbols map
        return new ParseFuncOrArgument(
            new ParseNode(symbols[this.mode][nucleus.text].group,
                          nucleus.text, this.mode),
            false);
    } else {
        return null;
    }
};

Parser.prototype.ParseNode = ParseNode;

module.exports = Parser;

},{"./Lexer":9,"./ParseError":11,"./environments":21,"./functions":24,"./parseData":26,"./symbols":28,"./utils":29}],13:[function(require,module,exports){
/**
 * This is a module for storing settings passed into KaTeX. It correctly handles
 * default settings.
 */

/**
 * Helper function for getting a default value if the value is undefined
 */
function get(option, defaultValue) {
    return option === undefined ? defaultValue : option;
}

/**
 * The main Settings object
 *
 * The current options stored are:
 *  - displayMode: Whether the expression should be typeset by default in
 *                 textstyle or displaystyle (default false)
 */
function Settings(options) {
    // allow null options
    options = options || {};
    this.displayMode = get(options.displayMode, false);
    this.throwOnError = get(options.throwOnError, true);
    this.errorColor = get(options.errorColor, "#cc0000");
}

module.exports = Settings;

},{}],14:[function(require,module,exports){
/**
 * This file contains information and classes for the various kinds of styles
 * used in TeX. It provides a generic `Style` class, which holds information
 * about a specific style. It then provides instances of all the different kinds
 * of styles possible, and provides functions to move between them and get
 * information about them.
 */

/**
 * The main style class. Contains a unique id for the style, a size (which is
 * the same for cramped and uncramped version of a style), a cramped flag, and a
 * size multiplier, which gives the size difference between a style and
 * textstyle.
 */
function Style(id, size, multiplier, cramped) {
    this.id = id;
    this.size = size;
    this.cramped = cramped;
    this.sizeMultiplier = multiplier;
}

/**
 * Get the style of a superscript given a base in the current style.
 */
Style.prototype.sup = function() {
    return styles[sup[this.id]];
};

/**
 * Get the style of a subscript given a base in the current style.
 */
Style.prototype.sub = function() {
    return styles[sub[this.id]];
};

/**
 * Get the style of a fraction numerator given the fraction in the current
 * style.
 */
Style.prototype.fracNum = function() {
    return styles[fracNum[this.id]];
};

/**
 * Get the style of a fraction denominator given the fraction in the current
 * style.
 */
Style.prototype.fracDen = function() {
    return styles[fracDen[this.id]];
};

/**
 * Get the cramped version of a style (in particular, cramping a cramped style
 * doesn't change the style).
 */
Style.prototype.cramp = function() {
    return styles[cramp[this.id]];
};

/**
 * HTML class name, like "displaystyle cramped"
 */
Style.prototype.cls = function() {
    return sizeNames[this.size] + (this.cramped ? " cramped" : " uncramped");
};

/**
 * HTML Reset class name, like "reset-textstyle"
 */
Style.prototype.reset = function() {
    return resetNames[this.size];
};

// IDs of the different styles
var D = 0;
var Dc = 1;
var T = 2;
var Tc = 3;
var S = 4;
var Sc = 5;
var SS = 6;
var SSc = 7;

// String names for the different sizes
var sizeNames = [
    "displaystyle textstyle",
    "textstyle",
    "scriptstyle",
    "scriptscriptstyle",
];

// Reset names for the different sizes
var resetNames = [
    "reset-textstyle",
    "reset-textstyle",
    "reset-scriptstyle",
    "reset-scriptscriptstyle",
];

// Instances of the different styles
var styles = [
    new Style(D, 0, 1.0, false),
    new Style(Dc, 0, 1.0, true),
    new Style(T, 1, 1.0, false),
    new Style(Tc, 1, 1.0, true),
    new Style(S, 2, 0.7, false),
    new Style(Sc, 2, 0.7, true),
    new Style(SS, 3, 0.5, false),
    new Style(SSc, 3, 0.5, true),
];

// Lookup tables for switching from one style to another
var sup = [S, Sc, S, Sc, SS, SSc, SS, SSc];
var sub = [Sc, Sc, Sc, Sc, SSc, SSc, SSc, SSc];
var fracNum = [T, Tc, S, Sc, SS, SSc, SS, SSc];
var fracDen = [Tc, Tc, Sc, Sc, SSc, SSc, SSc, SSc];
var cramp = [Dc, Dc, Tc, Tc, Sc, Sc, SSc, SSc];

// We only export some of the styles. Also, we don't export the `Style` class so
// no more styles can be generated.
module.exports = {
    DISPLAY: styles[D],
    TEXT: styles[T],
    SCRIPT: styles[S],
    SCRIPTSCRIPT: styles[SS],
};

},{}],15:[function(require,module,exports){
/* eslint no-console:0 */
/**
 * This module contains general functions that can be used for building
 * different kinds of domTree nodes in a consistent manner.
 */

var domTree = require("./domTree");
var fontMetrics = require("./fontMetrics");
var symbols = require("./symbols");
var utils = require("./utils");

var greekCapitals = [
    "\\Gamma",
    "\\Delta",
    "\\Theta",
    "\\Lambda",
    "\\Xi",
    "\\Pi",
    "\\Sigma",
    "\\Upsilon",
    "\\Phi",
    "\\Psi",
    "\\Omega",
];

var dotlessLetters = [
    "\u0131",   // dotless i, \imath
    "\u0237",   // dotless j, \jmath
];

/**
 * Makes a symbolNode after translation via the list of symbols in symbols.js.
 * Correctly pulls out metrics for the character, and optionally takes a list of
 * classes to be attached to the node.
 */
var makeSymbol = function(value, style, mode, color, classes) {
    // Replace the value with its replaced value from symbol.js
    if (symbols[mode][value] && symbols[mode][value].replace) {
        value = symbols[mode][value].replace;
    }

    var metrics = fontMetrics.getCharacterMetrics(value, style);

    var symbolNode;
    if (metrics) {
        symbolNode = new domTree.symbolNode(
            value, metrics.height, metrics.depth, metrics.italic, metrics.skew,
            classes);
    } else {
        // TODO(emily): Figure out a good way to only print this in development
        typeof console !== "undefined" && console.warn(
            "No character metrics for '" + value + "' in style '" +
                style + "'");
        symbolNode = new domTree.symbolNode(value, 0, 0, 0, 0, classes);
    }

    if (color) {
        symbolNode.style.color = color;
    }

    return symbolNode;
};

/**
 * Makes a symbol in Main-Regular or AMS-Regular.
 * Used for rel, bin, open, close, inner, and punct.
 */
var mathsym = function(value, mode, color, classes) {
    // Decide what font to render the symbol in by its entry in the symbols
    // table.
    // Have a special case for when the value = \ because the \ is used as a
    // textord in unsupported command errors but cannot be parsed as a regular
    // text ordinal and is therefore not present as a symbol in the symbols
    // table for text
    if (value === "\\" || symbols[mode][value].font === "main") {
        return makeSymbol(value, "Main-Regular", mode, color, classes);
    } else {
        return makeSymbol(
            value, "AMS-Regular", mode, color, classes.concat(["amsrm"]));
    }
};

/**
 * Makes a symbol in the default font for mathords and textords.
 */
var mathDefault = function(value, mode, color, classes, type) {
    if (type === "mathord") {
        return mathit(value, mode, color, classes);
    } else if (type === "textord") {
        return makeSymbol(
            value, "Main-Regular", mode, color, classes.concat(["mathrm"]));
    } else {
        throw new Error("unexpected type: " + type + " in mathDefault");
    }
};

/**
 * Makes a symbol in the italic math font.
 */
var mathit = function(value, mode, color, classes) {
    if (/[0-9]/.test(value.charAt(0)) ||
            // glyphs for \imath and \jmath do not exist in Math-Italic so we
            // need to use Main-Italic instead
            utils.contains(dotlessLetters, value) ||
            utils.contains(greekCapitals, value)) {
        return makeSymbol(
            value, "Main-Italic", mode, color, classes.concat(["mainit"]));
    } else {
        return makeSymbol(
            value, "Math-Italic", mode, color, classes.concat(["mathit"]));
    }
};

/**
 * Makes either a mathord or textord in the correct font and color.
 */
var makeOrd = function(group, options, type) {
    var mode = group.mode;
    var value = group.value;
    if (symbols[mode][value] && symbols[mode][value].replace) {
        value = symbols[mode][value].replace;
    }

    var classes = ["mord"];
    var color = options.getColor();

    var font = options.font;
    if (font) {
        if (font === "mathit" || utils.contains(dotlessLetters, value)) {
            return mathit(value, mode, color, classes);
        } else {
            var fontName = fontMap[font].fontName;
            if (fontMetrics.getCharacterMetrics(value, fontName)) {
                return makeSymbol(
                    value, fontName, mode, color, classes.concat([font]));
            } else {
                return mathDefault(value, mode, color, classes, type);
            }
        }
    } else {
        return mathDefault(value, mode, color, classes, type);
    }
};

/**
 * Calculate the height, depth, and maxFontSize of an element based on its
 * children.
 */
var sizeElementFromChildren = function(elem) {
    var height = 0;
    var depth = 0;
    var maxFontSize = 0;

    if (elem.children) {
        for (var i = 0; i < elem.children.length; i++) {
            if (elem.children[i].height > height) {
                height = elem.children[i].height;
            }
            if (elem.children[i].depth > depth) {
                depth = elem.children[i].depth;
            }
            if (elem.children[i].maxFontSize > maxFontSize) {
                maxFontSize = elem.children[i].maxFontSize;
            }
        }
    }

    elem.height = height;
    elem.depth = depth;
    elem.maxFontSize = maxFontSize;
};

/**
 * Makes a span with the given list of classes, list of children, and color.
 */
var makeSpan = function(classes, children, color) {
    var span = new domTree.span(classes, children);

    sizeElementFromChildren(span);

    if (color) {
        span.style.color = color;
    }

    return span;
};

/**
 * Makes a document fragment with the given list of children.
 */
var makeFragment = function(children) {
    var fragment = new domTree.documentFragment(children);

    sizeElementFromChildren(fragment);

    return fragment;
};

/**
 * Makes an element placed in each of the vlist elements to ensure that each
 * element has the same max font size. To do this, we create a zero-width space
 * with the correct font size.
 */
var makeFontSizer = function(options, fontSize) {
    var fontSizeInner = makeSpan([], [new domTree.symbolNode("\u200b")]);
    fontSizeInner.style.fontSize =
        (fontSize / options.style.sizeMultiplier) + "em";

    var fontSizer = makeSpan(
        ["fontsize-ensurer", "reset-" + options.size, "size5"],
        [fontSizeInner]);

    return fontSizer;
};

/**
 * Makes a vertical list by stacking elements and kerns on top of each other.
 * Allows for many different ways of specifying the positioning method.
 *
 * Arguments:
 *  - children: A list of child or kern nodes to be stacked on top of each other
 *              (i.e. the first element will be at the bottom, and the last at
 *              the top). Element nodes are specified as
 *                {type: "elem", elem: node}
 *              while kern nodes are specified as
 *                {type: "kern", size: size}
 *  - positionType: The method by which the vlist should be positioned. Valid
 *                  values are:
 *                   - "individualShift": The children list only contains elem
 *                                        nodes, and each node contains an extra
 *                                        "shift" value of how much it should be
 *                                        shifted (note that shifting is always
 *                                        moving downwards). positionData is
 *                                        ignored.
 *                   - "top": The positionData specifies the topmost point of
 *                            the vlist (note this is expected to be a height,
 *                            so positive values move up)
 *                   - "bottom": The positionData specifies the bottommost point
 *                               of the vlist (note this is expected to be a
 *                               depth, so positive values move down
 *                   - "shift": The vlist will be positioned such that its
 *                              baseline is positionData away from the baseline
 *                              of the first child. Positive values move
 *                              downwards.
 *                   - "firstBaseline": The vlist will be positioned such that
 *                                      its baseline is aligned with the
 *                                      baseline of the first child.
 *                                      positionData is ignored. (this is
 *                                      equivalent to "shift" with
 *                                      positionData=0)
 *  - positionData: Data used in different ways depending on positionType
 *  - options: An Options object
 *
 */
var makeVList = function(children, positionType, positionData, options) {
    var depth;
    var currPos;
    var i;
    if (positionType === "individualShift") {
        var oldChildren = children;
        children = [oldChildren[0]];

        // Add in kerns to the list of children to get each element to be
        // shifted to the correct specified shift
        depth = -oldChildren[0].shift - oldChildren[0].elem.depth;
        currPos = depth;
        for (i = 1; i < oldChildren.length; i++) {
            var diff = -oldChildren[i].shift - currPos -
                oldChildren[i].elem.depth;
            var size = diff -
                (oldChildren[i - 1].elem.height +
                 oldChildren[i - 1].elem.depth);

            currPos = currPos + diff;

            children.push({type: "kern", size: size});
            children.push(oldChildren[i]);
        }
    } else if (positionType === "top") {
        // We always start at the bottom, so calculate the bottom by adding up
        // all the sizes
        var bottom = positionData;
        for (i = 0; i < children.length; i++) {
            if (children[i].type === "kern") {
                bottom -= children[i].size;
            } else {
                bottom -= children[i].elem.height + children[i].elem.depth;
            }
        }
        depth = bottom;
    } else if (positionType === "bottom") {
        depth = -positionData;
    } else if (positionType === "shift") {
        depth = -children[0].elem.depth - positionData;
    } else if (positionType === "firstBaseline") {
        depth = -children[0].elem.depth;
    } else {
        depth = 0;
    }

    // Make the fontSizer
    var maxFontSize = 0;
    for (i = 0; i < children.length; i++) {
        if (children[i].type === "elem") {
            maxFontSize = Math.max(maxFontSize, children[i].elem.maxFontSize);
        }
    }
    var fontSizer = makeFontSizer(options, maxFontSize);

    // Create a new list of actual children at the correct offsets
    var realChildren = [];
    currPos = depth;
    for (i = 0; i < children.length; i++) {
        if (children[i].type === "kern") {
            currPos += children[i].size;
        } else {
            var child = children[i].elem;

            var shift = -child.depth - currPos;
            currPos += child.height + child.depth;

            var childWrap = makeSpan([], [fontSizer, child]);
            childWrap.height -= shift;
            childWrap.depth += shift;
            childWrap.style.top = shift + "em";

            realChildren.push(childWrap);
        }
    }

    // Add in an element at the end with no offset to fix the calculation of
    // baselines in some browsers (namely IE, sometimes safari)
    var baselineFix = makeSpan(
        ["baseline-fix"], [fontSizer, new domTree.symbolNode("\u200b")]);
    realChildren.push(baselineFix);

    var vlist = makeSpan(["vlist"], realChildren);
    // Fix the final height and depth, in case there were kerns at the ends
    // since the makeSpan calculation won't take that in to account.
    vlist.height = Math.max(currPos, vlist.height);
    vlist.depth = Math.max(-depth, vlist.depth);
    return vlist;
};

// A table of size -> font size for the different sizing functions
var sizingMultiplier = {
    size1: 0.5,
    size2: 0.7,
    size3: 0.8,
    size4: 0.9,
    size5: 1.0,
    size6: 1.2,
    size7: 1.44,
    size8: 1.73,
    size9: 2.07,
    size10: 2.49,
};

// A map of spacing functions to their attributes, like size and corresponding
// CSS class
var spacingFunctions = {
    "\\qquad": {
        size: "2em",
        className: "qquad",
    },
    "\\quad": {
        size: "1em",
        className: "quad",
    },
    "\\enspace": {
        size: "0.5em",
        className: "enspace",
    },
    "\\;": {
        size: "0.277778em",
        className: "thickspace",
    },
    "\\:": {
        size: "0.22222em",
        className: "mediumspace",
    },
    "\\,": {
        size: "0.16667em",
        className: "thinspace",
    },
    "\\!": {
        size: "-0.16667em",
        className: "negativethinspace",
    },
};

/**
 * Maps TeX font commands to objects containing:
 * - variant: string used for "mathvariant" attribute in buildMathML.js
 * - fontName: the "style" parameter to fontMetrics.getCharacterMetrics
 */
// A map between tex font commands an MathML mathvariant attribute values
var fontMap = {
    // styles
    "mathbf": {
        variant: "bold",
        fontName: "Main-Bold",
    },
    "mathrm": {
        variant: "normal",
        fontName: "Main-Regular",
    },

    // "mathit" is missing because it requires the use of two fonts: Main-Italic
    // and Math-Italic.  This is handled by a special case in makeOrd which ends
    // up calling mathit.

    // families
    "mathbb": {
        variant: "double-struck",
        fontName: "AMS-Regular",
    },
    "mathcal": {
        variant: "script",
        fontName: "Caligraphic-Regular",
    },
    "mathfrak": {
        variant: "fraktur",
        fontName: "Fraktur-Regular",
    },
    "mathscr": {
        variant: "script",
        fontName: "Script-Regular",
    },
    "mathsf": {
        variant: "sans-serif",
        fontName: "SansSerif-Regular",
    },
    "mathtt": {
        variant: "monospace",
        fontName: "Typewriter-Regular",
    },
};

module.exports = {
    fontMap: fontMap,
    makeSymbol: makeSymbol,
    mathsym: mathsym,
    makeSpan: makeSpan,
    makeFragment: makeFragment,
    makeVList: makeVList,
    makeOrd: makeOrd,
    sizingMultiplier: sizingMultiplier,
    spacingFunctions: spacingFunctions,
};

},{"./domTree":20,"./fontMetrics":22,"./symbols":28,"./utils":29}],16:[function(require,module,exports){
/* eslint no-console:0 */
/**
 * This file does the main work of building a domTree structure from a parse
 * tree. The entry point is the `buildHTML` function, which takes a parse tree.
 * Then, the buildExpression, buildGroup, and various groupTypes functions are
 * called, to produce a final HTML tree.
 */

var ParseError = require("./ParseError");
var Style = require("./Style");

var buildCommon = require("./buildCommon");
var delimiter = require("./delimiter");
var domTree = require("./domTree");
var fontMetrics = require("./fontMetrics");
var utils = require("./utils");

var makeSpan = buildCommon.makeSpan;

/**
 * Take a list of nodes, build them in order, and return a list of the built
 * nodes. This function handles the `prev` node correctly, and passes the
 * previous element from the list as the prev of the next element.
 */
var buildExpression = function(expression, options, prev) {
    var groups = [];
    for (var i = 0; i < expression.length; i++) {
        var group = expression[i];
        groups.push(buildGroup(group, options, prev));
        prev = group;
    }
    return groups;
};

// List of types used by getTypeOfGroup,
// see https://github.com/Khan/KaTeX/wiki/Examining-TeX#group-types
var groupToType = {
    mathord: "mord",
    textord: "mord",
    bin: "mbin",
    rel: "mrel",
    text: "mord",
    open: "mopen",
    close: "mclose",
    inner: "minner",
    genfrac: "mord",
    array: "mord",
    spacing: "mord",
    punct: "mpunct",
    ordgroup: "mord",
    op: "mop",
    katex: "mord",
    overline: "mord",
    underline: "mord",
    rule: "mord",
    leftright: "minner",
    sqrt: "mord",
    accent: "mord",
};

/**
 * Gets the final math type of an expression, given its group type. This type is
 * used to determine spacing between elements, and affects bin elements by
 * causing them to change depending on what types are around them. This type
 * must be attached to the outermost node of an element as a CSS class so that
 * spacing with its surrounding elements works correctly.
 *
 * Some elements can be mapped one-to-one from group type to math type, and
 * those are listed in the `groupToType` table.
 *
 * Others (usually elements that wrap around other elements) often have
 * recursive definitions, and thus call `getTypeOfGroup` on their inner
 * elements.
 */
var getTypeOfGroup = function(group) {
    if (group == null) {
        // Like when typesetting $^3$
        return groupToType.mathord;
    } else if (group.type === "supsub") {
        return getTypeOfGroup(group.value.base);
    } else if (group.type === "llap" || group.type === "rlap") {
        return getTypeOfGroup(group.value);
    } else if (group.type === "color") {
        return getTypeOfGroup(group.value.value);
    } else if (group.type === "sizing") {
        return getTypeOfGroup(group.value.value);
    } else if (group.type === "styling") {
        return getTypeOfGroup(group.value.value);
    } else if (group.type === "delimsizing") {
        return groupToType[group.value.delimType];
    } else {
        return groupToType[group.type];
    }
};

/**
 * Sometimes, groups perform special rules when they have superscripts or
 * subscripts attached to them. This function lets the `supsub` group know that
 * its inner element should handle the superscripts and subscripts instead of
 * handling them itself.
 */
var shouldHandleSupSub = function(group, options) {
    if (!group) {
        return false;
    } else if (group.type === "op") {
        // Operators handle supsubs differently when they have limits
        // (e.g. `\displaystyle\sum_2^3`)
        return group.value.limits &&
            (options.style.size === Style.DISPLAY.size ||
            group.value.alwaysHandleSupSub);
    } else if (group.type === "accent") {
        return isCharacterBox(group.value.base);
    } else {
        return null;
    }
};

/**
 * Sometimes we want to pull out the innermost element of a group. In most
 * cases, this will just be the group itself, but when ordgroups and colors have
 * a single element, we want to pull that out.
 */
var getBaseElem = function(group) {
    if (!group) {
        return false;
    } else if (group.type === "ordgroup") {
        if (group.value.length === 1) {
            return getBaseElem(group.value[0]);
        } else {
            return group;
        }
    } else if (group.type === "color") {
        if (group.value.value.length === 1) {
            return getBaseElem(group.value.value[0]);
        } else {
            return group;
        }
    } else {
        return group;
    }
};

/**
 * TeXbook algorithms often reference "character boxes", which are simply groups
 * with a single character in them. To decide if something is a character box,
 * we find its innermost group, and see if it is a single character.
 */
var isCharacterBox = function(group) {
    var baseElem = getBaseElem(group);

    // These are all they types of groups which hold single characters
    return baseElem.type === "mathord" ||
        baseElem.type === "textord" ||
        baseElem.type === "bin" ||
        baseElem.type === "rel" ||
        baseElem.type === "inner" ||
        baseElem.type === "open" ||
        baseElem.type === "close" ||
        baseElem.type === "punct";
};

var makeNullDelimiter = function(options) {
    return makeSpan([
        "sizing", "reset-" + options.size, "size5",
        options.style.reset(), Style.TEXT.cls(),
        "nulldelimiter",
    ]);
};

/**
 * This is a map of group types to the function used to handle that type.
 * Simpler types come at the beginning, while complicated types come afterwards.
 */
var groupTypes = {};

groupTypes.mathord = function(group, options, prev) {
    return buildCommon.makeOrd(group, options, "mathord");
};

groupTypes.textord = function(group, options, prev) {
    return buildCommon.makeOrd(group, options, "textord");
};

groupTypes.bin = function(group, options, prev) {
    var className = "mbin";
    // Pull out the most recent element. Do some special handling to find
    // things at the end of a \color group. Note that we don't use the same
    // logic for ordgroups (which count as ords).
    var prevAtom = prev;
    while (prevAtom && prevAtom.type === "color") {
        var atoms = prevAtom.value.value;
        prevAtom = atoms[atoms.length - 1];
    }
    // See TeXbook pg. 442-446, Rules 5 and 6, and the text before Rule 19.
    // Here, we determine whether the bin should turn into an ord. We
    // currently only apply Rule 5.
    if (!prev || utils.contains(["mbin", "mopen", "mrel", "mop", "mpunct"],
            getTypeOfGroup(prevAtom))) {
        group.type = "textord";
        className = "mord";
    }

    return buildCommon.mathsym(
        group.value, group.mode, options.getColor(), [className]);
};

groupTypes.rel = function(group, options, prev) {
    return buildCommon.mathsym(
        group.value, group.mode, options.getColor(), ["mrel"]);
};

groupTypes.open = function(group, options, prev) {
    return buildCommon.mathsym(
        group.value, group.mode, options.getColor(), ["mopen"]);
};

groupTypes.close = function(group, options, prev) {
    return buildCommon.mathsym(
        group.value, group.mode, options.getColor(), ["mclose"]);
};

groupTypes.inner = function(group, options, prev) {
    return buildCommon.mathsym(
        group.value, group.mode, options.getColor(), ["minner"]);
};

groupTypes.punct = function(group, options, prev) {
    return buildCommon.mathsym(
        group.value, group.mode, options.getColor(), ["mpunct"]);
};

groupTypes.ordgroup = function(group, options, prev) {
    return makeSpan(
        ["mord", options.style.cls()],
        buildExpression(group.value, options.reset())
    );
};

groupTypes.text = function(group, options, prev) {
    return makeSpan(["text", "mord", options.style.cls()],
        buildExpression(group.value.body, options.reset()));
};

groupTypes.color = function(group, options, prev) {
    var elements = buildExpression(
        group.value.value,
        options.withColor(group.value.color),
        prev
    );

    // \color isn't supposed to affect the type of the elements it contains.
    // To accomplish this, we wrap the results in a fragment, so the inner
    // elements will be able to directly interact with their neighbors. For
    // example, `\color{red}{2 +} 3` has the same spacing as `2 + 3`
    return new buildCommon.makeFragment(elements);
};

groupTypes.supsub = function(group, options, prev) {
    // Superscript and subscripts are handled in the TeXbook on page
    // 445-446, rules 18(a-f).

    // Here is where we defer to the inner group if it should handle
    // superscripts and subscripts itself.
    if (shouldHandleSupSub(group.value.base, options)) {
        return groupTypes[group.value.base.type](group, options, prev);
    }

    var base = buildGroup(group.value.base, options.reset());
    var supmid;
    var submid;
    var sup;
    var sub;

    if (group.value.sup) {
        sup = buildGroup(group.value.sup,
                options.withStyle(options.style.sup()));
        supmid = makeSpan(
                [options.style.reset(), options.style.sup().cls()], [sup]);
    }

    if (group.value.sub) {
        sub = buildGroup(group.value.sub,
                options.withStyle(options.style.sub()));
        submid = makeSpan(
                [options.style.reset(), options.style.sub().cls()], [sub]);
    }

    // Rule 18a
    var supShift;
    var subShift;
    if (isCharacterBox(group.value.base)) {
        supShift = 0;
        subShift = 0;
    } else {
        supShift = base.height - fontMetrics.metrics.supDrop;
        subShift = base.depth + fontMetrics.metrics.subDrop;
    }

    // Rule 18c
    var minSupShift;
    if (options.style === Style.DISPLAY) {
        minSupShift = fontMetrics.metrics.sup1;
    } else if (options.style.cramped) {
        minSupShift = fontMetrics.metrics.sup3;
    } else {
        minSupShift = fontMetrics.metrics.sup2;
    }

    // scriptspace is a font-size-independent size, so scale it
    // appropriately
    var multiplier = Style.TEXT.sizeMultiplier *
            options.style.sizeMultiplier;
    var scriptspace =
        (0.5 / fontMetrics.metrics.ptPerEm) / multiplier + "em";

    var supsub;
    if (!group.value.sup) {
        // Rule 18b
        subShift = Math.max(
            subShift, fontMetrics.metrics.sub1,
            sub.height - 0.8 * fontMetrics.metrics.xHeight);

        supsub = buildCommon.makeVList([
            {type: "elem", elem: submid},
        ], "shift", subShift, options);

        supsub.children[0].style.marginRight = scriptspace;

        // Subscripts shouldn't be shifted by the base's italic correction.
        // Account for that by shifting the subscript back the appropriate
        // amount. Note we only do this when the base is a single symbol.
        if (base instanceof domTree.symbolNode) {
            supsub.children[0].style.marginLeft = -base.italic + "em";
        }
    } else if (!group.value.sub) {
        // Rule 18c, d
        supShift = Math.max(supShift, minSupShift,
            sup.depth + 0.25 * fontMetrics.metrics.xHeight);

        supsub = buildCommon.makeVList([
            {type: "elem", elem: supmid},
        ], "shift", -supShift, options);

        supsub.children[0].style.marginRight = scriptspace;
    } else {
        supShift = Math.max(
            supShift, minSupShift,
            sup.depth + 0.25 * fontMetrics.metrics.xHeight);
        subShift = Math.max(subShift, fontMetrics.metrics.sub2);

        var ruleWidth = fontMetrics.metrics.defaultRuleThickness;

        // Rule 18e
        if ((supShift - sup.depth) - (sub.height - subShift) <
                4 * ruleWidth) {
            subShift = 4 * ruleWidth - (supShift - sup.depth) + sub.height;
            var psi = 0.8 * fontMetrics.metrics.xHeight -
                (supShift - sup.depth);
            if (psi > 0) {
                supShift += psi;
                subShift -= psi;
            }
        }

        supsub = buildCommon.makeVList([
            {type: "elem", elem: submid, shift: subShift},
            {type: "elem", elem: supmid, shift: -supShift},
        ], "individualShift", null, options);

        // See comment above about subscripts not being shifted
        if (base instanceof domTree.symbolNode) {
            supsub.children[0].style.marginLeft = -base.italic + "em";
        }

        supsub.children[0].style.marginRight = scriptspace;
        supsub.children[1].style.marginRight = scriptspace;
    }

    return makeSpan([getTypeOfGroup(group.value.base)],
        [base, supsub]);
};

groupTypes.genfrac = function(group, options, prev) {
    // Fractions are handled in the TeXbook on pages 444-445, rules 15(a-e).
    // Figure out what style this fraction should be in based on the
    // function used
    var fstyle = options.style;
    if (group.value.size === "display") {
        fstyle = Style.DISPLAY;
    } else if (group.value.size === "text") {
        fstyle = Style.TEXT;
    }

    var nstyle = fstyle.fracNum();
    var dstyle = fstyle.fracDen();

    var numer = buildGroup(group.value.numer, options.withStyle(nstyle));
    var numerreset = makeSpan([fstyle.reset(), nstyle.cls()], [numer]);

    var denom = buildGroup(group.value.denom, options.withStyle(dstyle));
    var denomreset = makeSpan([fstyle.reset(), dstyle.cls()], [denom]);

    var ruleWidth;
    if (group.value.hasBarLine) {
        ruleWidth = fontMetrics.metrics.defaultRuleThickness /
            options.style.sizeMultiplier;
    } else {
        ruleWidth = 0;
    }

    // Rule 15b
    var numShift;
    var clearance;
    var denomShift;
    if (fstyle.size === Style.DISPLAY.size) {
        numShift = fontMetrics.metrics.num1;
        if (ruleWidth > 0) {
            clearance = 3 * ruleWidth;
        } else {
            clearance = 7 * fontMetrics.metrics.defaultRuleThickness;
        }
        denomShift = fontMetrics.metrics.denom1;
    } else {
        if (ruleWidth > 0) {
            numShift = fontMetrics.metrics.num2;
            clearance = ruleWidth;
        } else {
            numShift = fontMetrics.metrics.num3;
            clearance = 3 * fontMetrics.metrics.defaultRuleThickness;
        }
        denomShift = fontMetrics.metrics.denom2;
    }

    var frac;
    if (ruleWidth === 0) {
        // Rule 15c
        var candiateClearance =
            (numShift - numer.depth) - (denom.height - denomShift);
        if (candiateClearance < clearance) {
            numShift += 0.5 * (clearance - candiateClearance);
            denomShift += 0.5 * (clearance - candiateClearance);
        }

        frac = buildCommon.makeVList([
            {type: "elem", elem: denomreset, shift: denomShift},
            {type: "elem", elem: numerreset, shift: -numShift},
        ], "individualShift", null, options);
    } else {
        // Rule 15d
        var axisHeight = fontMetrics.metrics.axisHeight;

        if ((numShift - numer.depth) - (axisHeight + 0.5 * ruleWidth) <
                clearance) {
            numShift +=
                clearance - ((numShift - numer.depth) -
                             (axisHeight + 0.5 * ruleWidth));
        }

        if ((axisHeight - 0.5 * ruleWidth) - (denom.height - denomShift) <
                clearance) {
            denomShift +=
                clearance - ((axisHeight - 0.5 * ruleWidth) -
                             (denom.height - denomShift));
        }

        var mid = makeSpan(
            [options.style.reset(), Style.TEXT.cls(), "frac-line"]);
        // Manually set the height of the line because its height is
        // created in CSS
        mid.height = ruleWidth;

        var midShift = -(axisHeight - 0.5 * ruleWidth);

        frac = buildCommon.makeVList([
            {type: "elem", elem: denomreset, shift: denomShift},
            {type: "elem", elem: mid,        shift: midShift},
            {type: "elem", elem: numerreset, shift: -numShift},
        ], "individualShift", null, options);
    }

    // Since we manually change the style sometimes (with \dfrac or \tfrac),
    // account for the possible size change here.
    frac.height *= fstyle.sizeMultiplier / options.style.sizeMultiplier;
    frac.depth *= fstyle.sizeMultiplier / options.style.sizeMultiplier;

    // Rule 15e
    var delimSize;
    if (fstyle.size === Style.DISPLAY.size) {
        delimSize = fontMetrics.metrics.delim1;
    } else {
        delimSize = fontMetrics.metrics.getDelim2(fstyle);
    }

    var leftDelim;
    var rightDelim;
    if (group.value.leftDelim == null) {
        leftDelim = makeNullDelimiter(options);
    } else {
        leftDelim = delimiter.customSizedDelim(
            group.value.leftDelim, delimSize, true,
            options.withStyle(fstyle), group.mode);
    }
    if (group.value.rightDelim == null) {
        rightDelim = makeNullDelimiter(options);
    } else {
        rightDelim = delimiter.customSizedDelim(
            group.value.rightDelim, delimSize, true,
            options.withStyle(fstyle), group.mode);
    }

    return makeSpan(
        ["mord", options.style.reset(), fstyle.cls()],
        [leftDelim, makeSpan(["mfrac"], [frac]), rightDelim],
        options.getColor());
};

groupTypes.array = function(group, options, prev) {
    var r;
    var c;
    var nr = group.value.body.length;
    var nc = 0;
    var body = new Array(nr);

    // Horizontal spacing
    var pt = 1 / fontMetrics.metrics.ptPerEm;
    var arraycolsep = 5 * pt; // \arraycolsep in article.cls

    // Vertical spacing
    var baselineskip = 12 * pt; // see size10.clo
    // Default \arraystretch from lttab.dtx
    // TODO(gagern): may get redefined once we have user-defined macros
    var arraystretch = utils.deflt(group.value.arraystretch, 1);
    var arrayskip = arraystretch * baselineskip;
    var arstrutHeight = 0.7 * arrayskip; // \strutbox in ltfsstrc.dtx and
    var arstrutDepth = 0.3 * arrayskip;  // \@arstrutbox in lttab.dtx

    var totalHeight = 0;
    for (r = 0; r < group.value.body.length; ++r) {
        var inrow = group.value.body[r];
        var height = arstrutHeight; // \@array adds an \@arstrut
        var depth = arstrutDepth;   // to each tow (via the template)

        if (nc < inrow.length) {
            nc = inrow.length;
        }

        var outrow = new Array(inrow.length);
        for (c = 0; c < inrow.length; ++c) {
            var elt = buildGroup(inrow[c], options);
            if (depth < elt.depth) {
                depth = elt.depth;
            }
            if (height < elt.height) {
                height = elt.height;
            }
            outrow[c] = elt;
        }

        var gap = 0;
        if (group.value.rowGaps[r]) {
            gap = group.value.rowGaps[r].value;
            switch (gap.unit) {
                case "em":
                    gap = gap.number;
                    break;
                case "ex":
                    gap = gap.number * fontMetrics.metrics.emPerEx;
                    break;
                default:
                    console.error("Can't handle unit " + gap.unit);
                    gap = 0;
            }
            if (gap > 0) { // \@argarraycr
                gap += arstrutDepth;
                if (depth < gap) {
                    depth = gap; // \@xargarraycr
                }
                gap = 0;
            }
        }

        outrow.height = height;
        outrow.depth = depth;
        totalHeight += height;
        outrow.pos = totalHeight;
        totalHeight += depth + gap; // \@yargarraycr
        body[r] = outrow;
    }

    var offset = totalHeight / 2 + fontMetrics.metrics.axisHeight;
    var colDescriptions = group.value.cols || [];
    var cols = [];
    var colSep;
    var colDescrNum;
    for (c = 0, colDescrNum = 0;
         // Continue while either there are more columns or more column
         // descriptions, so trailing separators don't get lost.
         c < nc || colDescrNum < colDescriptions.length;
         ++c, ++colDescrNum) {

        var colDescr = colDescriptions[colDescrNum] || {};

        var firstSeparator = true;
        while (colDescr.type === "separator") {
            // If there is more than one separator in a row, add a space
            // between them.
            if (!firstSeparator) {
                colSep = makeSpan(["arraycolsep"], []);
                colSep.style.width =
                    fontMetrics.metrics.doubleRuleSep + "em";
                cols.push(colSep);
            }

            if (colDescr.separator === "|") {
                var separator = makeSpan(
                    ["vertical-separator"],
                    []);
                separator.style.height = totalHeight + "em";
                separator.style.verticalAlign =
                    -(totalHeight - offset) + "em";

                cols.push(separator);
            } else {
                throw new ParseError(
                    "Invalid separator type: " + colDescr.separator);
            }

            colDescrNum++;
            colDescr = colDescriptions[colDescrNum] || {};
            firstSeparator = false;
        }

        if (c >= nc) {
            continue;
        }

        var sepwidth;
        if (c > 0 || group.value.hskipBeforeAndAfter) {
            sepwidth = utils.deflt(colDescr.pregap, arraycolsep);
            if (sepwidth !== 0) {
                colSep = makeSpan(["arraycolsep"], []);
                colSep.style.width = sepwidth + "em";
                cols.push(colSep);
            }
        }

        var col = [];
        for (r = 0; r < nr; ++r) {
            var row = body[r];
            var elem = row[c];
            if (!elem) {
                continue;
            }
            var shift = row.pos - offset;
            elem.depth = row.depth;
            elem.height = row.height;
            col.push({type: "elem", elem: elem, shift: shift});
        }

        col = buildCommon.makeVList(col, "individualShift", null, options);
        col = makeSpan(
            ["col-align-" + (colDescr.align || "c")],
            [col]);
        cols.push(col);

        if (c < nc - 1 || group.value.hskipBeforeAndAfter) {
            sepwidth = utils.deflt(colDescr.postgap, arraycolsep);
            if (sepwidth !== 0) {
                colSep = makeSpan(["arraycolsep"], []);
                colSep.style.width = sepwidth + "em";
                cols.push(colSep);
            }
        }
    }
    body = makeSpan(["mtable"], cols);
    return makeSpan(["mord"], [body], options.getColor());
};

groupTypes.spacing = function(group, options, prev) {
    if (group.value === "\\ " || group.value === "\\space" ||
        group.value === " " || group.value === "~") {
        // Spaces are generated by adding an actual space. Each of these
        // things has an entry in the symbols table, so these will be turned
        // into appropriate outputs.
        return makeSpan(
            ["mord", "mspace"],
            [buildCommon.mathsym(group.value, group.mode)]
        );
    } else {
        // Other kinds of spaces are of arbitrary width. We use CSS to
        // generate these.
        return makeSpan(
            ["mord", "mspace",
             buildCommon.spacingFunctions[group.value].className]);
    }
};

groupTypes.llap = function(group, options, prev) {
    var inner = makeSpan(
        ["inner"], [buildGroup(group.value.body, options.reset())]);
    var fix = makeSpan(["fix"], []);
    return makeSpan(
        ["llap", options.style.cls()], [inner, fix]);
};

groupTypes.rlap = function(group, options, prev) {
    var inner = makeSpan(
        ["inner"], [buildGroup(group.value.body, options.reset())]);
    var fix = makeSpan(["fix"], []);
    return makeSpan(
        ["rlap", options.style.cls()], [inner, fix]);
};

groupTypes.op = function(group, options, prev) {
    // Operators are handled in the TeXbook pg. 443-444, rule 13(a).
    var supGroup;
    var subGroup;
    var hasLimits = false;
    if (group.type === "supsub" ) {
        // If we have limits, supsub will pass us its group to handle. Pull
        // out the superscript and subscript and set the group to the op in
        // its base.
        supGroup = group.value.sup;
        subGroup = group.value.sub;
        group = group.value.base;
        hasLimits = true;
    }

    // Most operators have a large successor symbol, but these don't.
    var noSuccessor = [
        "\\smallint",
    ];

    var large = false;
    if (options.style.size === Style.DISPLAY.size &&
        group.value.symbol &&
        !utils.contains(noSuccessor, group.value.body)) {

        // Most symbol operators get larger in displaystyle (rule 13)
        large = true;
    }

    var base;
    var baseShift = 0;
    var slant = 0;
    if (group.value.symbol) {
        // If this is a symbol, create the symbol.
        var style = large ? "Size2-Regular" : "Size1-Regular";
        base = buildCommon.makeSymbol(
            group.value.body, style, "math", options.getColor(),
            ["op-symbol", large ? "large-op" : "small-op", "mop"]);

        // Shift the symbol so its center lies on the axis (rule 13). It
        // appears that our fonts have the centers of the symbols already
        // almost on the axis, so these numbers are very small. Note we
        // don't actually apply this here, but instead it is used either in
        // the vlist creation or separately when there are no limits.
        baseShift = (base.height - base.depth) / 2 -
            fontMetrics.metrics.axisHeight *
            options.style.sizeMultiplier;

        // The slant of the symbol is just its italic correction.
        slant = base.italic;
    } else {
        // Otherwise, this is a text operator. Build the text from the
        // operator's name.
        // TODO(emily): Add a space in the middle of some of these
        // operators, like \limsup
        var output = [];
        for (var i = 1; i < group.value.body.length; i++) {
            output.push(buildCommon.mathsym(group.value.body[i], group.mode));
        }
        base = makeSpan(["mop"], output, options.getColor());
    }

    if (hasLimits) {
        // IE 8 clips \int if it is in a display: inline-block. We wrap it
        // in a new span so it is an inline, and works.
        base = makeSpan([], [base]);

        var supmid;
        var supKern;
        var submid;
        var subKern;
        // We manually have to handle the superscripts and subscripts. This,
        // aside from the kern calculations, is copied from supsub.
        if (supGroup) {
            var sup = buildGroup(
                supGroup, options.withStyle(options.style.sup()));
            supmid = makeSpan(
                [options.style.reset(), options.style.sup().cls()], [sup]);

            supKern = Math.max(
                fontMetrics.metrics.bigOpSpacing1,
                fontMetrics.metrics.bigOpSpacing3 - sup.depth);
        }

        if (subGroup) {
            var sub = buildGroup(
                subGroup, options.withStyle(options.style.sub()));
            submid = makeSpan(
                [options.style.reset(), options.style.sub().cls()],
                [sub]);

            subKern = Math.max(
                fontMetrics.metrics.bigOpSpacing2,
                fontMetrics.metrics.bigOpSpacing4 - sub.height);
        }

        // Build the final group as a vlist of the possible subscript, base,
        // and possible superscript.
        var finalGroup;
        var top;
        var bottom;
        if (!supGroup) {
            top = base.height - baseShift;

            finalGroup = buildCommon.makeVList([
                {type: "kern", size: fontMetrics.metrics.bigOpSpacing5},
                {type: "elem", elem: submid},
                {type: "kern", size: subKern},
                {type: "elem", elem: base},
            ], "top", top, options);

            // Here, we shift the limits by the slant of the symbol. Note
            // that we are supposed to shift the limits by 1/2 of the slant,
            // but since we are centering the limits adding a full slant of
            // margin will shift by 1/2 that.
            finalGroup.children[0].style.marginLeft = -slant + "em";
        } else if (!subGroup) {
            bottom = base.depth + baseShift;

            finalGroup = buildCommon.makeVList([
                {type: "elem", elem: base},
                {type: "kern", size: supKern},
                {type: "elem", elem: supmid},
                {type: "kern", size: fontMetrics.metrics.bigOpSpacing5},
            ], "bottom", bottom, options);

            // See comment above about slants
            finalGroup.children[1].style.marginLeft = slant + "em";
        } else if (!supGroup && !subGroup) {
            // This case probably shouldn't occur (this would mean the
            // supsub was sending us a group with no superscript or
            // subscript) but be safe.
            return base;
        } else {
            bottom = fontMetrics.metrics.bigOpSpacing5 +
                submid.height + submid.depth +
                subKern +
                base.depth + baseShift;

            finalGroup = buildCommon.makeVList([
                {type: "kern", size: fontMetrics.metrics.bigOpSpacing5},
                {type: "elem", elem: submid},
                {type: "kern", size: subKern},
                {type: "elem", elem: base},
                {type: "kern", size: supKern},
                {type: "elem", elem: supmid},
                {type: "kern", size: fontMetrics.metrics.bigOpSpacing5},
            ], "bottom", bottom, options);

            // See comment above about slants
            finalGroup.children[0].style.marginLeft = -slant + "em";
            finalGroup.children[2].style.marginLeft = slant + "em";
        }

        return makeSpan(["mop", "op-limits"], [finalGroup]);
    } else {
        if (group.value.symbol) {
            base.style.top = baseShift + "em";
        }

        return base;
    }
};

groupTypes.katex = function(group, options, prev) {
    // The KaTeX logo. The offsets for the K and a were chosen to look
    // good, but the offsets for the T, E, and X were taken from the
    // definition of \TeX in TeX (see TeXbook pg. 356)
    var k = makeSpan(
        ["k"], [buildCommon.mathsym("K", group.mode)]);
    var a = makeSpan(
        ["a"], [buildCommon.mathsym("A", group.mode)]);

    a.height = (a.height + 0.2) * 0.75;
    a.depth = (a.height - 0.2) * 0.75;

    var t = makeSpan(
        ["t"], [buildCommon.mathsym("T", group.mode)]);
    var e = makeSpan(
        ["e"], [buildCommon.mathsym("E", group.mode)]);

    e.height = (e.height - 0.2155);
    e.depth = (e.depth + 0.2155);

    var x = makeSpan(
        ["x"], [buildCommon.mathsym("X", group.mode)]);

    return makeSpan(
        ["katex-logo", "mord"], [k, a, t, e, x], options.getColor());
};

groupTypes.overline = function(group, options, prev) {
    // Overlines are handled in the TeXbook pg 443, Rule 9.

    // Build the inner group in the cramped style.
    var innerGroup = buildGroup(group.value.body,
            options.withStyle(options.style.cramp()));

    var ruleWidth = fontMetrics.metrics.defaultRuleThickness /
        options.style.sizeMultiplier;

    // Create the line above the body
    var line = makeSpan(
        [options.style.reset(), Style.TEXT.cls(), "overline-line"]);
    line.height = ruleWidth;
    line.maxFontSize = 1.0;

    // Generate the vlist, with the appropriate kerns
    var vlist = buildCommon.makeVList([
        {type: "elem", elem: innerGroup},
        {type: "kern", size: 3 * ruleWidth},
        {type: "elem", elem: line},
        {type: "kern", size: ruleWidth},
    ], "firstBaseline", null, options);

    return makeSpan(["overline", "mord"], [vlist], options.getColor());
};

groupTypes.underline = function(group, options, prev) {
    // Underlines are handled in the TeXbook pg 443, Rule 10.

    // Build the inner group.
    var innerGroup = buildGroup(group.value.body, options);

    var ruleWidth = fontMetrics.metrics.defaultRuleThickness /
        options.style.sizeMultiplier;

    // Create the line above the body
    var line = makeSpan(
        [options.style.reset(), Style.TEXT.cls(), "underline-line"]);
    line.height = ruleWidth;
    line.maxFontSize = 1.0;

    // Generate the vlist, with the appropriate kerns
    var vlist = buildCommon.makeVList([
        {type: "kern", size: ruleWidth},
        {type: "elem", elem: line},
        {type: "kern", size: 3 * ruleWidth},
        {type: "elem", elem: innerGroup},
    ], "top", innerGroup.height, options);

    return makeSpan(["underline", "mord"], [vlist], options.getColor());
};

groupTypes.sqrt = function(group, options, prev) {
    // Square roots are handled in the TeXbook pg. 443, Rule 11.

    // First, we do the same steps as in overline to build the inner group
    // and line
    var inner = buildGroup(group.value.body,
            options.withStyle(options.style.cramp()));

    var ruleWidth = fontMetrics.metrics.defaultRuleThickness /
        options.style.sizeMultiplier;

    var line = makeSpan(
        [options.style.reset(), Style.TEXT.cls(), "sqrt-line"], [],
        options.getColor());
    line.height = ruleWidth;
    line.maxFontSize = 1.0;

    var phi = ruleWidth;
    if (options.style.id < Style.TEXT.id) {
        phi = fontMetrics.metrics.xHeight;
    }

    // Calculate the clearance between the body and line
    var lineClearance = ruleWidth + phi / 4;

    var innerHeight =
        (inner.height + inner.depth) * options.style.sizeMultiplier;
    var minDelimiterHeight = innerHeight + lineClearance + ruleWidth;

    // Create a \surd delimiter of the required minimum size
    var delim = makeSpan(["sqrt-sign"], [
        delimiter.customSizedDelim("\\surd", minDelimiterHeight,
                                   false, options, group.mode)],
                         options.getColor());

    var delimDepth = (delim.height + delim.depth) - ruleWidth;

    // Adjust the clearance based on the delimiter size
    if (delimDepth > inner.height + inner.depth + lineClearance) {
        lineClearance =
            (lineClearance + delimDepth - inner.height - inner.depth) / 2;
    }

    // Shift the delimiter so that its top lines up with the top of the line
    var delimShift = -(inner.height + lineClearance + ruleWidth) + delim.height;
    delim.style.top = delimShift + "em";
    delim.height -= delimShift;
    delim.depth += delimShift;

    // We add a special case here, because even when `inner` is empty, we
    // still get a line. So, we use a simple heuristic to decide if we
    // should omit the body entirely. (note this doesn't work for something
    // like `\sqrt{\rlap{x}}`, but if someone is doing that they deserve for
    // it not to work.
    var body;
    if (inner.height === 0 && inner.depth === 0) {
        body = makeSpan();
    } else {
        body = buildCommon.makeVList([
            {type: "elem", elem: inner},
            {type: "kern", size: lineClearance},
            {type: "elem", elem: line},
            {type: "kern", size: ruleWidth},
        ], "firstBaseline", null, options);
    }

    if (!group.value.index) {
        return makeSpan(["sqrt", "mord"], [delim, body]);
    } else {
        // Handle the optional root index

        // The index is always in scriptscript style
        var root = buildGroup(
            group.value.index,
            options.withStyle(Style.SCRIPTSCRIPT));
        var rootWrap = makeSpan(
            [options.style.reset(), Style.SCRIPTSCRIPT.cls()],
            [root]);

        // Figure out the height and depth of the inner part
        var innerRootHeight = Math.max(delim.height, body.height);
        var innerRootDepth = Math.max(delim.depth, body.depth);

        // The amount the index is shifted by. This is taken from the TeX
        // source, in the definition of `\r@@t`.
        var toShift = 0.6 * (innerRootHeight - innerRootDepth);

        // Build a VList with the superscript shifted up correctly
        var rootVList = buildCommon.makeVList(
            [{type: "elem", elem: rootWrap}],
            "shift", -toShift, options);
        // Add a class surrounding it so we can add on the appropriate
        // kerning
        var rootVListWrap = makeSpan(["root"], [rootVList]);

        return makeSpan(["sqrt", "mord"], [rootVListWrap, delim, body]);
    }
};

groupTypes.sizing = function(group, options, prev) {
    // Handle sizing operators like \Huge. Real TeX doesn't actually allow
    // these functions inside of math expressions, so we do some special
    // handling.
    var inner = buildExpression(group.value.value,
            options.withSize(group.value.size), prev);

    var span = makeSpan(["mord"],
        [makeSpan(["sizing", "reset-" + options.size, group.value.size,
                   options.style.cls()],
                  inner)]);

    // Calculate the correct maxFontSize manually
    var fontSize = buildCommon.sizingMultiplier[group.value.size];
    span.maxFontSize = fontSize * options.style.sizeMultiplier;

    return span;
};

groupTypes.styling = function(group, options, prev) {
    // Style changes are handled in the TeXbook on pg. 442, Rule 3.

    // Figure out what style we're changing to.
    var style = {
        "display": Style.DISPLAY,
        "text": Style.TEXT,
        "script": Style.SCRIPT,
        "scriptscript": Style.SCRIPTSCRIPT,
    };

    var newStyle = style[group.value.style];

    // Build the inner expression in the new style.
    var inner = buildExpression(
        group.value.value, options.withStyle(newStyle), prev);

    return makeSpan([options.style.reset(), newStyle.cls()], inner);
};

groupTypes.font = function(group, options, prev) {
    var font = group.value.font;
    return buildGroup(group.value.body, options.withFont(font), prev);
};

groupTypes.delimsizing = function(group, options, prev) {
    var delim = group.value.value;

    if (delim === ".") {
        // Empty delimiters still count as elements, even though they don't
        // show anything.
        return makeSpan([groupToType[group.value.delimType]]);
    }

    // Use delimiter.sizedDelim to generate the delimiter.
    return makeSpan(
        [groupToType[group.value.delimType]],
        [delimiter.sizedDelim(
            delim, group.value.size, options, group.mode)]);
};

groupTypes.leftright = function(group, options, prev) {
    // Build the inner expression
    var inner = buildExpression(group.value.body, options.reset());

    var innerHeight = 0;
    var innerDepth = 0;

    // Calculate its height and depth
    for (var i = 0; i < inner.length; i++) {
        innerHeight = Math.max(inner[i].height, innerHeight);
        innerDepth = Math.max(inner[i].depth, innerDepth);
    }

    // The size of delimiters is the same, regardless of what style we are
    // in. Thus, to correctly calculate the size of delimiter we need around
    // a group, we scale down the inner size based on the size.
    innerHeight *= options.style.sizeMultiplier;
    innerDepth *= options.style.sizeMultiplier;

    var leftDelim;
    if (group.value.left === ".") {
        // Empty delimiters in \left and \right make null delimiter spaces.
        leftDelim = makeNullDelimiter(options);
    } else {
        // Otherwise, use leftRightDelim to generate the correct sized
        // delimiter.
        leftDelim = delimiter.leftRightDelim(
            group.value.left, innerHeight, innerDepth, options,
            group.mode);
    }
    // Add it to the beginning of the expression
    inner.unshift(leftDelim);

    var rightDelim;
    // Same for the right delimiter
    if (group.value.right === ".") {
        rightDelim = makeNullDelimiter(options);
    } else {
        rightDelim = delimiter.leftRightDelim(
            group.value.right, innerHeight, innerDepth, options,
            group.mode);
    }
    // Add it to the end of the expression.
    inner.push(rightDelim);

    return makeSpan(
        ["minner", options.style.cls()], inner, options.getColor());
};

groupTypes.rule = function(group, options, prev) {
    // Make an empty span for the rule
    var rule = makeSpan(["mord", "rule"], [], options.getColor());

    // Calculate the shift, width, and height of the rule, and account for units
    var shift = 0;
    if (group.value.shift) {
        shift = group.value.shift.number;
        if (group.value.shift.unit === "ex") {
            shift *= fontMetrics.metrics.xHeight;
        }
    }

    var width = group.value.width.number;
    if (group.value.width.unit === "ex") {
        width *= fontMetrics.metrics.xHeight;
    }

    var height = group.value.height.number;
    if (group.value.height.unit === "ex") {
        height *= fontMetrics.metrics.xHeight;
    }

    // The sizes of rules are absolute, so make it larger if we are in a
    // smaller style.
    shift /= options.style.sizeMultiplier;
    width /= options.style.sizeMultiplier;
    height /= options.style.sizeMultiplier;

    // Style the rule to the right size
    rule.style.borderRightWidth = width + "em";
    rule.style.borderTopWidth = height + "em";
    rule.style.bottom = shift + "em";

    // Record the height and width
    rule.width = width;
    rule.height = height + shift;
    rule.depth = -shift;

    return rule;
};

groupTypes.accent = function(group, options, prev) {
    // Accents are handled in the TeXbook pg. 443, rule 12.
    var base = group.value.base;

    var supsubGroup;
    if (group.type === "supsub") {
        // If our base is a character box, and we have superscripts and
        // subscripts, the supsub will defer to us. In particular, we want
        // to attach the superscripts and subscripts to the inner body (so
        // that the position of the superscripts and subscripts won't be
        // affected by the height of the accent). We accomplish this by
        // sticking the base of the accent into the base of the supsub, and
        // rendering that, while keeping track of where the accent is.

        // The supsub group is the group that was passed in
        var supsub = group;
        // The real accent group is the base of the supsub group
        group = supsub.value.base;
        // The character box is the base of the accent group
        base = group.value.base;
        // Stick the character box into the base of the supsub group
        supsub.value.base = base;

        // Rerender the supsub group with its new base, and store that
        // result.
        supsubGroup = buildGroup(
            supsub, options.reset(), prev);
    }

    // Build the base group
    var body = buildGroup(
        base, options.withStyle(options.style.cramp()));

    // Calculate the skew of the accent. This is based on the line "If the
    // nucleus is not a single character, let s = 0; otherwise set s to the
    // kern amount for the nucleus followed by the \skewchar of its font."
    // Note that our skew metrics are just the kern between each character
    // and the skewchar.
    var skew;
    if (isCharacterBox(base)) {
        // If the base is a character box, then we want the skew of the
        // innermost character. To do that, we find the innermost character:
        var baseChar = getBaseElem(base);
        // Then, we render its group to get the symbol inside it
        var baseGroup = buildGroup(
            baseChar, options.withStyle(options.style.cramp()));
        // Finally, we pull the skew off of the symbol.
        skew = baseGroup.skew;
        // Note that we now throw away baseGroup, because the layers we
        // removed with getBaseElem might contain things like \color which
        // we can't get rid of.
        // TODO(emily): Find a better way to get the skew
    } else {
        skew = 0;
    }

    // calculate the amount of space between the body and the accent
    var clearance = Math.min(body.height, fontMetrics.metrics.xHeight);

    // Build the accent
    var accent = buildCommon.makeSymbol(
        group.value.accent, "Main-Regular", "math", options.getColor());
    // Remove the italic correction of the accent, because it only serves to
    // shift the accent over to a place we don't want.
    accent.italic = 0;

    // The \vec character that the fonts use is a combining character, and
    // thus shows up much too far to the left. To account for this, we add a
    // specific class which shifts the accent over to where we want it.
    // TODO(emily): Fix this in a better way, like by changing the font
    var vecClass = group.value.accent === "\\vec" ? "accent-vec" : null;

    var accentBody = makeSpan(["accent-body", vecClass], [
        makeSpan([], [accent])]);

    accentBody = buildCommon.makeVList([
        {type: "elem", elem: body},
        {type: "kern", size: -clearance},
        {type: "elem", elem: accentBody},
    ], "firstBaseline", null, options);

    // Shift the accent over by the skew. Note we shift by twice the skew
    // because we are centering the accent, so by adding 2*skew to the left,
    // we shift it to the right by 1*skew.
    accentBody.children[1].style.marginLeft = 2 * skew + "em";

    var accentWrap = makeSpan(["mord", "accent"], [accentBody]);

    if (supsubGroup) {
        // Here, we replace the "base" child of the supsub with our newly
        // generated accent.
        supsubGroup.children[0] = accentWrap;

        // Since we don't rerun the height calculation after replacing the
        // accent, we manually recalculate height.
        supsubGroup.height = Math.max(accentWrap.height, supsubGroup.height);

        // Accents should always be ords, even when their innards are not.
        supsubGroup.classes[0] = "mord";

        return supsubGroup;
    } else {
        return accentWrap;
    }
};

groupTypes.phantom = function(group, options, prev) {
    var elements = buildExpression(
        group.value.value,
        options.withPhantom(),
        prev
    );

    // \phantom isn't supposed to affect the elements it contains.
    // See "color" for more details.
    return new buildCommon.makeFragment(elements);
};

/**
 * buildGroup is the function that takes a group and calls the correct groupType
 * function for it. It also handles the interaction of size and style changes
 * between parents and children.
 */
var buildGroup = function(group, options, prev) {
    if (!group) {
        return makeSpan();
    }

    if (groupTypes[group.type]) {
        // Call the groupTypes function
        var groupNode = groupTypes[group.type](group, options, prev);
        var multiplier;

        // If the style changed between the parent and the current group,
        // account for the size difference
        if (options.style !== options.parentStyle) {
            multiplier = options.style.sizeMultiplier /
                    options.parentStyle.sizeMultiplier;

            groupNode.height *= multiplier;
            groupNode.depth *= multiplier;
        }

        // If the size changed between the parent and the current group, account
        // for that size difference.
        if (options.size !== options.parentSize) {
            multiplier = buildCommon.sizingMultiplier[options.size] /
                    buildCommon.sizingMultiplier[options.parentSize];

            groupNode.height *= multiplier;
            groupNode.depth *= multiplier;
        }

        return groupNode;
    } else {
        throw new ParseError(
            "Got group of unknown type: '" + group.type + "'");
    }
};

/**
 * Take an entire parse tree, and build it into an appropriate set of HTML
 * nodes.
 */
var buildHTML = function(tree, options) {
    // buildExpression is destructive, so we need to make a clone
    // of the incoming tree so that it isn't accidentally changed
    tree = JSON.parse(JSON.stringify(tree));

    // Build the expression contained in the tree
    var expression = buildExpression(tree, options);
    var body = makeSpan(["base", options.style.cls()], expression);

    // Add struts, which ensure that the top of the HTML element falls at the
    // height of the expression, and the bottom of the HTML element falls at the
    // depth of the expression.
    var topStrut = makeSpan(["strut"]);
    var bottomStrut = makeSpan(["strut", "bottom"]);

    topStrut.style.height = body.height + "em";
    bottomStrut.style.height = (body.height + body.depth) + "em";
    // We'd like to use `vertical-align: top` but in IE 9 this lowers the
    // baseline of the box to the bottom of this strut (instead staying in the
    // normal place) so we use an absolute value for vertical-align instead
    bottomStrut.style.verticalAlign = -body.depth + "em";

    // Wrap the struts and body together
    var htmlNode = makeSpan(["katex-html"], [topStrut, bottomStrut, body]);

    htmlNode.setAttribute("aria-hidden", "true");

    return htmlNode;
};

module.exports = buildHTML;

},{"./ParseError":11,"./Style":14,"./buildCommon":15,"./delimiter":19,"./domTree":20,"./fontMetrics":22,"./utils":29}],17:[function(require,module,exports){
/**
 * This file converts a parse tree into a cooresponding MathML tree. The main
 * entry point is the `buildMathML` function, which takes a parse tree from the
 * parser.
 */

var buildCommon = require("./buildCommon");
var fontMetrics = require("./fontMetrics");
var mathMLTree = require("./mathMLTree");
var ParseError = require("./ParseError");
var symbols = require("./symbols");
var utils = require("./utils");

var makeSpan = buildCommon.makeSpan;
var fontMap = buildCommon.fontMap;

/**
 * Takes a symbol and converts it into a MathML text node after performing
 * optional replacement from symbols.js.
 */
var makeText = function(text, mode) {
    if (symbols[mode][text] && symbols[mode][text].replace) {
        text = symbols[mode][text].replace;
    }

    return new mathMLTree.TextNode(text);
};

/**
 * Returns the math variant as a string or null if none is required.
 */
var getVariant = function(group, options) {
    var font = options.font;
    if (!font) {
        return null;
    }

    var mode = group.mode;
    if (font === "mathit") {
        return "italic";
    }

    var value = group.value;
    if (utils.contains(["\\imath", "\\jmath"], value)) {
        return null;
    }

    if (symbols[mode][value] && symbols[mode][value].replace) {
        value = symbols[mode][value].replace;
    }

    var fontName = fontMap[font].fontName;
    if (fontMetrics.getCharacterMetrics(value, fontName)) {
        return fontMap[options.font].variant;
    }

    return null;
};

/**
 * Functions for handling the different types of groups found in the parse
 * tree. Each function should take a parse group and return a MathML node.
 */
var groupTypes = {};

groupTypes.mathord = function(group, options) {
    var node = new mathMLTree.MathNode(
        "mi",
        [makeText(group.value, group.mode)]);

    var variant = getVariant(group, options);
    if (variant) {
        node.setAttribute("mathvariant", variant);
    }
    return node;
};

groupTypes.textord = function(group, options) {
    var text = makeText(group.value, group.mode);

    var variant = getVariant(group, options) || "normal";

    var node;
    if (/[0-9]/.test(group.value)) {
        // TODO(kevinb) merge adjacent <mn> nodes
        // do it as a post processing step
        node = new mathMLTree.MathNode("mn", [text]);
        if (options.font) {
            node.setAttribute("mathvariant", variant);
        }
    } else {
        node = new mathMLTree.MathNode("mi", [text]);
        node.setAttribute("mathvariant", variant);
    }

    return node;
};

groupTypes.bin = function(group) {
    var node = new mathMLTree.MathNode(
        "mo", [makeText(group.value, group.mode)]);

    return node;
};

groupTypes.rel = function(group) {
    var node = new mathMLTree.MathNode(
        "mo", [makeText(group.value, group.mode)]);

    return node;
};

groupTypes.open = function(group) {
    var node = new mathMLTree.MathNode(
        "mo", [makeText(group.value, group.mode)]);

    return node;
};

groupTypes.close = function(group) {
    var node = new mathMLTree.MathNode(
        "mo", [makeText(group.value, group.mode)]);

    return node;
};

groupTypes.inner = function(group) {
    var node = new mathMLTree.MathNode(
        "mo", [makeText(group.value, group.mode)]);

    return node;
};

groupTypes.punct = function(group) {
    var node = new mathMLTree.MathNode(
        "mo", [makeText(group.value, group.mode)]);

    node.setAttribute("separator", "true");

    return node;
};

groupTypes.ordgroup = function(group, options) {
    var inner = buildExpression(group.value, options);

    var node = new mathMLTree.MathNode("mrow", inner);

    return node;
};

groupTypes.text = function(group, options) {
    var inner = buildExpression(group.value.body, options);

    var node = new mathMLTree.MathNode("mtext", inner);

    return node;
};

groupTypes.color = function(group, options) {
    var inner = buildExpression(group.value.value, options);

    var node = new mathMLTree.MathNode("mstyle", inner);

    node.setAttribute("mathcolor", group.value.color);

    return node;
};

groupTypes.supsub = function(group, options) {
    var children = [buildGroup(group.value.base, options)];

    if (group.value.sub) {
        children.push(buildGroup(group.value.sub, options));
    }

    if (group.value.sup) {
        children.push(buildGroup(group.value.sup, options));
    }

    var nodeType;
    if (!group.value.sub) {
        nodeType = "msup";
    } else if (!group.value.sup) {
        nodeType = "msub";
    } else {
        nodeType = "msubsup";
    }

    var node = new mathMLTree.MathNode(nodeType, children);

    return node;
};

groupTypes.genfrac = function(group, options) {
    var node = new mathMLTree.MathNode(
        "mfrac",
        [buildGroup(group.value.numer, options),
         buildGroup(group.value.denom, options)]);

    if (!group.value.hasBarLine) {
        node.setAttribute("linethickness", "0px");
    }

    if (group.value.leftDelim != null || group.value.rightDelim != null) {
        var withDelims = [];

        if (group.value.leftDelim != null) {
            var leftOp = new mathMLTree.MathNode(
                "mo", [new mathMLTree.TextNode(group.value.leftDelim)]);

            leftOp.setAttribute("fence", "true");

            withDelims.push(leftOp);
        }

        withDelims.push(node);

        if (group.value.rightDelim != null) {
            var rightOp = new mathMLTree.MathNode(
                "mo", [new mathMLTree.TextNode(group.value.rightDelim)]);

            rightOp.setAttribute("fence", "true");

            withDelims.push(rightOp);
        }

        var outerNode = new mathMLTree.MathNode("mrow", withDelims);

        return outerNode;
    }

    return node;
};

groupTypes.array = function(group, options) {
    return new mathMLTree.MathNode(
        "mtable", group.value.body.map(function(row) {
            return new mathMLTree.MathNode(
                "mtr", row.map(function(cell) {
                    return new mathMLTree.MathNode(
                        "mtd", [buildGroup(cell, options)]);
                }));
        }));
};

groupTypes.sqrt = function(group, options) {
    var node;
    if (group.value.index) {
        node = new mathMLTree.MathNode(
            "mroot", [
                buildGroup(group.value.body, options),
                buildGroup(group.value.index, options),
            ]);
    } else {
        node = new mathMLTree.MathNode(
            "msqrt", [buildGroup(group.value.body, options)]);
    }

    return node;
};

groupTypes.leftright = function(group, options) {
    var inner = buildExpression(group.value.body, options);

    if (group.value.left !== ".") {
        var leftNode = new mathMLTree.MathNode(
            "mo", [makeText(group.value.left, group.mode)]);

        leftNode.setAttribute("fence", "true");

        inner.unshift(leftNode);
    }

    if (group.value.right !== ".") {
        var rightNode = new mathMLTree.MathNode(
            "mo", [makeText(group.value.right, group.mode)]);

        rightNode.setAttribute("fence", "true");

        inner.push(rightNode);
    }

    var outerNode = new mathMLTree.MathNode("mrow", inner);

    return outerNode;
};

groupTypes.accent = function(group, options) {
    var accentNode = new mathMLTree.MathNode(
        "mo", [makeText(group.value.accent, group.mode)]);

    var node = new mathMLTree.MathNode(
        "mover",
        [buildGroup(group.value.base, options),
         accentNode]);

    node.setAttribute("accent", "true");

    return node;
};

groupTypes.spacing = function(group) {
    var node;

    if (group.value === "\\ " || group.value === "\\space" ||
        group.value === " " || group.value === "~") {
        node = new mathMLTree.MathNode(
            "mtext", [new mathMLTree.TextNode("\u00a0")]);
    } else {
        node = new mathMLTree.MathNode("mspace");

        node.setAttribute(
            "width", buildCommon.spacingFunctions[group.value].size);
    }

    return node;
};

groupTypes.op = function(group) {
    var node;

    // TODO(emily): handle big operators using the `largeop` attribute

    if (group.value.symbol) {
        // This is a symbol. Just add the symbol.
        node = new mathMLTree.MathNode(
            "mo", [makeText(group.value.body, group.mode)]);
    } else {
        // This is a text operator. Add all of the characters from the
        // operator's name.
        // TODO(emily): Add a space in the middle of some of these
        // operators, like \limsup.
        node = new mathMLTree.MathNode(
            "mi", [new mathMLTree.TextNode(group.value.body.slice(1))]);
    }

    return node;
};

groupTypes.katex = function(group) {
    var node = new mathMLTree.MathNode(
        "mtext", [new mathMLTree.TextNode("KaTeX")]);

    return node;
};

groupTypes.font = function(group, options) {
    var font = group.value.font;
    return buildGroup(group.value.body, options.withFont(font));
};

groupTypes.delimsizing = function(group) {
    var children = [];

    if (group.value.value !== ".") {
        children.push(makeText(group.value.value, group.mode));
    }

    var node = new mathMLTree.MathNode("mo", children);

    if (group.value.delimType === "open" ||
        group.value.delimType === "close") {
        // Only some of the delimsizing functions act as fences, and they
        // return "open" or "close" delimTypes.
        node.setAttribute("fence", "true");
    } else {
        // Explicitly disable fencing if it's not a fence, to override the
        // defaults.
        node.setAttribute("fence", "false");
    }

    return node;
};

groupTypes.styling = function(group, options) {
    var inner = buildExpression(group.value.value, options);

    var node = new mathMLTree.MathNode("mstyle", inner);

    var styleAttributes = {
        "display": ["0", "true"],
        "text": ["0", "false"],
        "script": ["1", "false"],
        "scriptscript": ["2", "false"],
    };

    var attr = styleAttributes[group.value.style];

    node.setAttribute("scriptlevel", attr[0]);
    node.setAttribute("displaystyle", attr[1]);

    return node;
};

groupTypes.sizing = function(group, options) {
    var inner = buildExpression(group.value.value, options);

    var node = new mathMLTree.MathNode("mstyle", inner);

    // TODO(emily): This doesn't produce the correct size for nested size
    // changes, because we don't keep state of what style we're currently
    // in, so we can't reset the size to normal before changing it.  Now
    // that we're passing an options parameter we should be able to fix
    // this.
    node.setAttribute(
        "mathsize", buildCommon.sizingMultiplier[group.value.size] + "em");

    return node;
};

groupTypes.overline = function(group, options) {
    var operator = new mathMLTree.MathNode(
        "mo", [new mathMLTree.TextNode("\u203e")]);
    operator.setAttribute("stretchy", "true");

    var node = new mathMLTree.MathNode(
        "mover",
        [buildGroup(group.value.body, options),
         operator]);
    node.setAttribute("accent", "true");

    return node;
};

groupTypes.underline = function(group, options) {
    var operator = new mathMLTree.MathNode(
        "mo", [new mathMLTree.TextNode("\u203e")]);
    operator.setAttribute("stretchy", "true");

    var node = new mathMLTree.MathNode(
        "munder",
        [buildGroup(group.value.body, options),
         operator]);
    node.setAttribute("accentunder", "true");

    return node;
};

groupTypes.rule = function(group) {
    // TODO(emily): Figure out if there's an actual way to draw black boxes
    // in MathML.
    var node = new mathMLTree.MathNode("mrow");

    return node;
};

groupTypes.llap = function(group, options) {
    var node = new mathMLTree.MathNode(
        "mpadded", [buildGroup(group.value.body, options)]);

    node.setAttribute("lspace", "-1width");
    node.setAttribute("width", "0px");

    return node;
};

groupTypes.rlap = function(group, options) {
    var node = new mathMLTree.MathNode(
        "mpadded", [buildGroup(group.value.body, options)]);

    node.setAttribute("width", "0px");

    return node;
};

groupTypes.phantom = function(group, options, prev) {
    var inner = buildExpression(group.value.value, options);
    return new mathMLTree.MathNode("mphantom", inner);
};

/**
 * Takes a list of nodes, builds them, and returns a list of the generated
 * MathML nodes. A little simpler than the HTML version because we don't do any
 * previous-node handling.
 */
var buildExpression = function(expression, options) {
    var groups = [];
    for (var i = 0; i < expression.length; i++) {
        var group = expression[i];
        groups.push(buildGroup(group, options));
    }
    return groups;
};

/**
 * Takes a group from the parser and calls the appropriate groupTypes function
 * on it to produce a MathML node.
 */
var buildGroup = function(group, options) {
    if (!group) {
        return new mathMLTree.MathNode("mrow");
    }

    if (groupTypes[group.type]) {
        // Call the groupTypes function
        return groupTypes[group.type](group, options);
    } else {
        throw new ParseError(
            "Got group of unknown type: '" + group.type + "'");
    }
};

/**
 * Takes a full parse tree and settings and builds a MathML representation of
 * it. In particular, we put the elements from building the parse tree into a
 * <semantics> tag so we can also include that TeX source as an annotation.
 *
 * Note that we actually return a domTree element with a `<math>` inside it so
 * we can do appropriate styling.
 */
var buildMathML = function(tree, texExpression, options) {
    var expression = buildExpression(tree, options);

    // Wrap up the expression in an mrow so it is presented in the semantics
    // tag correctly.
    var wrapper = new mathMLTree.MathNode("mrow", expression);

    // Build a TeX annotation of the source
    var annotation = new mathMLTree.MathNode(
        "annotation", [new mathMLTree.TextNode(texExpression)]);

    annotation.setAttribute("encoding", "application/x-tex");

    var semantics = new mathMLTree.MathNode(
        "semantics", [wrapper, annotation]);

    var math = new mathMLTree.MathNode("math", [semantics]);

    // You can't style <math> nodes, so we wrap the node in a span.
    return makeSpan(["katex-mathml"], [math]);
};

module.exports = buildMathML;

},{"./ParseError":11,"./buildCommon":15,"./fontMetrics":22,"./mathMLTree":25,"./symbols":28,"./utils":29}],18:[function(require,module,exports){
var buildHTML = require("./buildHTML");
var buildMathML = require("./buildMathML");
var buildCommon = require("./buildCommon");
var Options = require("./Options");
var Settings = require("./Settings");
var Style = require("./Style");

var makeSpan = buildCommon.makeSpan;

var buildTree = function(tree, expression, settings) {
    settings = settings || new Settings({});

    var startStyle = Style.TEXT;
    if (settings.displayMode) {
        startStyle = Style.DISPLAY;
    }

    // Setup the default options
    var options = new Options({
        style: startStyle,
        size: "size5",
    });

    // `buildHTML` sometimes messes with the parse tree (like turning bins ->
    // ords), so we build the MathML version first.
    var mathMLNode = buildMathML(tree, expression, options);
    var htmlNode = buildHTML(tree, options);

    var katexNode = makeSpan(["katex"], [
        mathMLNode, htmlNode,
    ]);

    if (settings.displayMode) {
        return makeSpan(["katex-display"], [katexNode]);
    } else {
        return katexNode;
    }
};

module.exports = buildTree;

},{"./Options":10,"./Settings":13,"./Style":14,"./buildCommon":15,"./buildHTML":16,"./buildMathML":17}],19:[function(require,module,exports){
/**
 * This file deals with creating delimiters of various sizes. The TeXbook
 * discusses these routines on page 441-442, in the "Another subroutine sets box
 * x to a specified variable delimiter" paragraph.
 *
 * There are three main routines here. `makeSmallDelim` makes a delimiter in the
 * normal font, but in either text, script, or scriptscript style.
 * `makeLargeDelim` makes a delimiter in textstyle, but in one of the Size1,
 * Size2, Size3, or Size4 fonts. `makeStackedDelim` makes a delimiter out of
 * smaller pieces that are stacked on top of one another.
 *
 * The functions take a parameter `center`, which determines if the delimiter
 * should be centered around the axis.
 *
 * Then, there are three exposed functions. `sizedDelim` makes a delimiter in
 * one of the given sizes. This is used for things like `\bigl`.
 * `customSizedDelim` makes a delimiter with a given total height+depth. It is
 * called in places like `\sqrt`. `leftRightDelim` makes an appropriate
 * delimiter which surrounds an expression of a given height an depth. It is
 * used in `\left` and `\right`.
 */

var ParseError = require("./ParseError");
var Style = require("./Style");

var buildCommon = require("./buildCommon");
var fontMetrics = require("./fontMetrics");
var symbols = require("./symbols");
var utils = require("./utils");

var makeSpan = buildCommon.makeSpan;

/**
 * Get the metrics for a given symbol and font, after transformation (i.e.
 * after following replacement from symbols.js)
 */
var getMetrics = function(symbol, font) {
    if (symbols.math[symbol] && symbols.math[symbol].replace) {
        return fontMetrics.getCharacterMetrics(
            symbols.math[symbol].replace, font);
    } else {
        return fontMetrics.getCharacterMetrics(
            symbol, font);
    }
};

/**
 * Builds a symbol in the given font size (note size is an integer)
 */
var mathrmSize = function(value, size, mode) {
    return buildCommon.makeSymbol(value, "Size" + size + "-Regular", mode);
};

/**
 * Puts a delimiter span in a given style, and adds appropriate height, depth,
 * and maxFontSizes.
 */
var styleWrap = function(delim, toStyle, options) {
    var span = makeSpan(
        ["style-wrap", options.style.reset(), toStyle.cls()], [delim]);

    var multiplier = toStyle.sizeMultiplier / options.style.sizeMultiplier;

    span.height *= multiplier;
    span.depth *= multiplier;
    span.maxFontSize = toStyle.sizeMultiplier;

    return span;
};

/**
 * Makes a small delimiter. This is a delimiter that comes in the Main-Regular
 * font, but is restyled to either be in textstyle, scriptstyle, or
 * scriptscriptstyle.
 */
var makeSmallDelim = function(delim, style, center, options, mode) {
    var text = buildCommon.makeSymbol(delim, "Main-Regular", mode);

    var span = styleWrap(text, style, options);

    if (center) {
        var shift =
            (1 - options.style.sizeMultiplier / style.sizeMultiplier) *
            fontMetrics.metrics.axisHeight;

        span.style.top = shift + "em";
        span.height -= shift;
        span.depth += shift;
    }

    return span;
};

/**
 * Makes a large delimiter. This is a delimiter that comes in the Size1, Size2,
 * Size3, or Size4 fonts. It is always rendered in textstyle.
 */
var makeLargeDelim = function(delim, size, center, options, mode) {
    var inner = mathrmSize(delim, size, mode);

    var span = styleWrap(
        makeSpan(["delimsizing", "size" + size],
                 [inner], options.getColor()),
        Style.TEXT, options);

    if (center) {
        var shift = (1 - options.style.sizeMultiplier) *
            fontMetrics.metrics.axisHeight;

        span.style.top = shift + "em";
        span.height -= shift;
        span.depth += shift;
    }

    return span;
};

/**
 * Make an inner span with the given offset and in the given font. This is used
 * in `makeStackedDelim` to make the stacking pieces for the delimiter.
 */
var makeInner = function(symbol, font, mode) {
    var sizeClass;
    // Apply the correct CSS class to choose the right font.
    if (font === "Size1-Regular") {
        sizeClass = "delim-size1";
    } else if (font === "Size4-Regular") {
        sizeClass = "delim-size4";
    }

    var inner = makeSpan(
        ["delimsizinginner", sizeClass],
        [makeSpan([], [buildCommon.makeSymbol(symbol, font, mode)])]);

    // Since this will be passed into `makeVList` in the end, wrap the element
    // in the appropriate tag that VList uses.
    return {type: "elem", elem: inner};
};

/**
 * Make a stacked delimiter out of a given delimiter, with the total height at
 * least `heightTotal`. This routine is mentioned on page 442 of the TeXbook.
 */
var makeStackedDelim = function(delim, heightTotal, center, options, mode) {
    // There are four parts, the top, an optional middle, a repeated part, and a
    // bottom.
    var top;
    var middle;
    var repeat;
    var bottom;
    top = repeat = bottom = delim;
    middle = null;
    // Also keep track of what font the delimiters are in
    var font = "Size1-Regular";

    // We set the parts and font based on the symbol. Note that we use
    // '\u23d0' instead of '|' and '\u2016' instead of '\\|' for the
    // repeats of the arrows
    if (delim === "\\uparrow") {
        repeat = bottom = "\u23d0";
    } else if (delim === "\\Uparrow") {
        repeat = bottom = "\u2016";
    } else if (delim === "\\downarrow") {
        top = repeat = "\u23d0";
    } else if (delim === "\\Downarrow") {
        top = repeat = "\u2016";
    } else if (delim === "\\updownarrow") {
        top = "\\uparrow";
        repeat = "\u23d0";
        bottom = "\\downarrow";
    } else if (delim === "\\Updownarrow") {
        top = "\\Uparrow";
        repeat = "\u2016";
        bottom = "\\Downarrow";
    } else if (delim === "[" || delim === "\\lbrack") {
        top = "\u23a1";
        repeat = "\u23a2";
        bottom = "\u23a3";
        font = "Size4-Regular";
    } else if (delim === "]" || delim === "\\rbrack") {
        top = "\u23a4";
        repeat = "\u23a5";
        bottom = "\u23a6";
        font = "Size4-Regular";
    } else if (delim === "\\lfloor") {
        repeat = top = "\u23a2";
        bottom = "\u23a3";
        font = "Size4-Regular";
    } else if (delim === "\\lceil") {
        top = "\u23a1";
        repeat = bottom = "\u23a2";
        font = "Size4-Regular";
    } else if (delim === "\\rfloor") {
        repeat = top = "\u23a5";
        bottom = "\u23a6";
        font = "Size4-Regular";
    } else if (delim === "\\rceil") {
        top = "\u23a4";
        repeat = bottom = "\u23a5";
        font = "Size4-Regular";
    } else if (delim === "(") {
        top = "\u239b";
        repeat = "\u239c";
        bottom = "\u239d";
        font = "Size4-Regular";
    } else if (delim === ")") {
        top = "\u239e";
        repeat = "\u239f";
        bottom = "\u23a0";
        font = "Size4-Regular";
    } else if (delim === "\\{" || delim === "\\lbrace") {
        top = "\u23a7";
        middle = "\u23a8";
        bottom = "\u23a9";
        repeat = "\u23aa";
        font = "Size4-Regular";
    } else if (delim === "\\}" || delim === "\\rbrace") {
        top = "\u23ab";
        middle = "\u23ac";
        bottom = "\u23ad";
        repeat = "\u23aa";
        font = "Size4-Regular";
    } else if (delim === "\\lgroup") {
        top = "\u23a7";
        bottom = "\u23a9";
        repeat = "\u23aa";
        font = "Size4-Regular";
    } else if (delim === "\\rgroup") {
        top = "\u23ab";
        bottom = "\u23ad";
        repeat = "\u23aa";
        font = "Size4-Regular";
    } else if (delim === "\\lmoustache") {
        top = "\u23a7";
        bottom = "\u23ad";
        repeat = "\u23aa";
        font = "Size4-Regular";
    } else if (delim === "\\rmoustache") {
        top = "\u23ab";
        bottom = "\u23a9";
        repeat = "\u23aa";
        font = "Size4-Regular";
    } else if (delim === "\\surd") {
        top = "\ue001";
        bottom = "\u23b7";
        repeat = "\ue000";
        font = "Size4-Regular";
    }

    // Get the metrics of the four sections
    var topMetrics = getMetrics(top, font);
    var topHeightTotal = topMetrics.height + topMetrics.depth;
    var repeatMetrics = getMetrics(repeat, font);
    var repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
    var bottomMetrics = getMetrics(bottom, font);
    var bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
    var middleHeightTotal = 0;
    var middleFactor = 1;
    if (middle !== null) {
        var middleMetrics = getMetrics(middle, font);
        middleHeightTotal = middleMetrics.height + middleMetrics.depth;
        middleFactor = 2; // repeat symmetrically above and below middle
    }

    // Calcuate the minimal height that the delimiter can have.
    // It is at least the size of the top, bottom, and optional middle combined.
    var minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal;

    // Compute the number of copies of the repeat symbol we will need
    var repeatCount = Math.ceil(
        (heightTotal - minHeight) / (middleFactor * repeatHeightTotal));

    // Compute the total height of the delimiter including all the symbols
    var realHeightTotal =
        minHeight + repeatCount * middleFactor * repeatHeightTotal;

    // The center of the delimiter is placed at the center of the axis. Note
    // that in this context, "center" means that the delimiter should be
    // centered around the axis in the current style, while normally it is
    // centered around the axis in textstyle.
    var axisHeight = fontMetrics.metrics.axisHeight;
    if (center) {
        axisHeight *= options.style.sizeMultiplier;
    }
    // Calculate the depth
    var depth = realHeightTotal / 2 - axisHeight;

    // Now, we start building the pieces that will go into the vlist

    // Keep a list of the inner pieces
    var inners = [];

    // Add the bottom symbol
    inners.push(makeInner(bottom, font, mode));

    var i;
    if (middle === null) {
        // Add that many symbols
        for (i = 0; i < repeatCount; i++) {
            inners.push(makeInner(repeat, font, mode));
        }
    } else {
        // When there is a middle bit, we need the middle part and two repeated
        // sections
        for (i = 0; i < repeatCount; i++) {
            inners.push(makeInner(repeat, font, mode));
        }
        inners.push(makeInner(middle, font, mode));
        for (i = 0; i < repeatCount; i++) {
            inners.push(makeInner(repeat, font, mode));
        }
    }

    // Add the top symbol
    inners.push(makeInner(top, font, mode));

    // Finally, build the vlist
    var inner = buildCommon.makeVList(inners, "bottom", depth, options);

    return styleWrap(
        makeSpan(["delimsizing", "mult"], [inner], options.getColor()),
        Style.TEXT, options);
};

// There are three kinds of delimiters, delimiters that stack when they become
// too large
var stackLargeDelimiters = [
    "(", ")", "[", "\\lbrack", "]", "\\rbrack",
    "\\{", "\\lbrace", "\\}", "\\rbrace",
    "\\lfloor", "\\rfloor", "\\lceil", "\\rceil",
    "\\surd",
];

// delimiters that always stack
var stackAlwaysDelimiters = [
    "\\uparrow", "\\downarrow", "\\updownarrow",
    "\\Uparrow", "\\Downarrow", "\\Updownarrow",
    "|", "\\|", "\\vert", "\\Vert",
    "\\lvert", "\\rvert", "\\lVert", "\\rVert",
    "\\lgroup", "\\rgroup", "\\lmoustache", "\\rmoustache",
];

// and delimiters that never stack
var stackNeverDelimiters = [
    "<", ">", "\\langle", "\\rangle", "/", "\\backslash", "\\lt", "\\gt",
];

// Metrics of the different sizes. Found by looking at TeX's output of
// $\bigl| // \Bigl| \biggl| \Biggl| \showlists$
// Used to create stacked delimiters of appropriate sizes in makeSizedDelim.
var sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3.0];

/**
 * Used to create a delimiter of a specific size, where `size` is 1, 2, 3, or 4.
 */
var makeSizedDelim = function(delim, size, options, mode) {
    // < and > turn into \langle and \rangle in delimiters
    if (delim === "<" || delim === "\\lt") {
        delim = "\\langle";
    } else if (delim === ">" || delim === "\\gt") {
        delim = "\\rangle";
    }

    // Sized delimiters are never centered.
    if (utils.contains(stackLargeDelimiters, delim) ||
        utils.contains(stackNeverDelimiters, delim)) {
        return makeLargeDelim(delim, size, false, options, mode);
    } else if (utils.contains(stackAlwaysDelimiters, delim)) {
        return makeStackedDelim(
            delim, sizeToMaxHeight[size], false, options, mode);
    } else {
        throw new ParseError("Illegal delimiter: '" + delim + "'");
    }
};

/**
 * There are three different sequences of delimiter sizes that the delimiters
 * follow depending on the kind of delimiter. This is used when creating custom
 * sized delimiters to decide whether to create a small, large, or stacked
 * delimiter.
 *
 * In real TeX, these sequences aren't explicitly defined, but are instead
 * defined inside the font metrics. Since there are only three sequences that
 * are possible for the delimiters that TeX defines, it is easier to just encode
 * them explicitly here.
 */

// Delimiters that never stack try small delimiters and large delimiters only
var stackNeverDelimiterSequence = [
    {type: "small", style: Style.SCRIPTSCRIPT},
    {type: "small", style: Style.SCRIPT},
    {type: "small", style: Style.TEXT},
    {type: "large", size: 1},
    {type: "large", size: 2},
    {type: "large", size: 3},
    {type: "large", size: 4},
];

// Delimiters that always stack try the small delimiters first, then stack
var stackAlwaysDelimiterSequence = [
    {type: "small", style: Style.SCRIPTSCRIPT},
    {type: "small", style: Style.SCRIPT},
    {type: "small", style: Style.TEXT},
    {type: "stack"},
];

// Delimiters that stack when large try the small and then large delimiters, and
// stack afterwards
var stackLargeDelimiterSequence = [
    {type: "small", style: Style.SCRIPTSCRIPT},
    {type: "small", style: Style.SCRIPT},
    {type: "small", style: Style.TEXT},
    {type: "large", size: 1},
    {type: "large", size: 2},
    {type: "large", size: 3},
    {type: "large", size: 4},
    {type: "stack"},
];

/**
 * Get the font used in a delimiter based on what kind of delimiter it is.
 */
var delimTypeToFont = function(type) {
    if (type.type === "small") {
        return "Main-Regular";
    } else if (type.type === "large") {
        return "Size" + type.size + "-Regular";
    } else if (type.type === "stack") {
        return "Size4-Regular";
    }
};

/**
 * Traverse a sequence of types of delimiters to decide what kind of delimiter
 * should be used to create a delimiter of the given height+depth.
 */
var traverseSequence = function(delim, height, sequence, options) {
    // Here, we choose the index we should start at in the sequences. In smaller
    // sizes (which correspond to larger numbers in style.size) we start earlier
    // in the sequence. Thus, scriptscript starts at index 3-3=0, script starts
    // at index 3-2=1, text starts at 3-1=2, and display starts at min(2,3-0)=2
    var start = Math.min(2, 3 - options.style.size);
    for (var i = start; i < sequence.length; i++) {
        if (sequence[i].type === "stack") {
            // This is always the last delimiter, so we just break the loop now.
            break;
        }

        var metrics = getMetrics(delim, delimTypeToFont(sequence[i]));
        var heightDepth = metrics.height + metrics.depth;

        // Small delimiters are scaled down versions of the same font, so we
        // account for the style change size.

        if (sequence[i].type === "small") {
            heightDepth *= sequence[i].style.sizeMultiplier;
        }

        // Check if the delimiter at this size works for the given height.
        if (heightDepth > height) {
            return sequence[i];
        }
    }

    // If we reached the end of the sequence, return the last sequence element.
    return sequence[sequence.length - 1];
};

/**
 * Make a delimiter of a given height+depth, with optional centering. Here, we
 * traverse the sequences, and create a delimiter that the sequence tells us to.
 */
var makeCustomSizedDelim = function(delim, height, center, options, mode) {
    if (delim === "<" || delim === "\\lt") {
        delim = "\\langle";
    } else if (delim === ">" || delim === "\\gt") {
        delim = "\\rangle";
    }

    // Decide what sequence to use
    var sequence;
    if (utils.contains(stackNeverDelimiters, delim)) {
        sequence = stackNeverDelimiterSequence;
    } else if (utils.contains(stackLargeDelimiters, delim)) {
        sequence = stackLargeDelimiterSequence;
    } else {
        sequence = stackAlwaysDelimiterSequence;
    }

    // Look through the sequence
    var delimType = traverseSequence(delim, height, sequence, options);

    // Depending on the sequence element we decided on, call the appropriate
    // function.
    if (delimType.type === "small") {
        return makeSmallDelim(delim, delimType.style, center, options, mode);
    } else if (delimType.type === "large") {
        return makeLargeDelim(delim, delimType.size, center, options, mode);
    } else if (delimType.type === "stack") {
        return makeStackedDelim(delim, height, center, options, mode);
    }
};

/**
 * Make a delimiter for use with `\left` and `\right`, given a height and depth
 * of an expression that the delimiters surround.
 */
var makeLeftRightDelim = function(delim, height, depth, options, mode) {
    // We always center \left/\right delimiters, so the axis is always shifted
    var axisHeight =
        fontMetrics.metrics.axisHeight * options.style.sizeMultiplier;

    // Taken from TeX source, tex.web, function make_left_right
    var delimiterFactor = 901;
    var delimiterExtend = 5.0 / fontMetrics.metrics.ptPerEm;

    var maxDistFromAxis = Math.max(
        height - axisHeight, depth + axisHeight);

    var totalHeight = Math.max(
        // In real TeX, calculations are done using integral values which are
        // 65536 per pt, or 655360 per em. So, the division here truncates in
        // TeX but doesn't here, producing different results. If we wanted to
        // exactly match TeX's calculation, we could do
        //   Math.floor(655360 * maxDistFromAxis / 500) *
        //    delimiterFactor / 655360
        // (To see the difference, compare
        //    x^{x^{\left(\rule{0.1em}{0.68em}\right)}}
        // in TeX and KaTeX)
        maxDistFromAxis / 500 * delimiterFactor,
        2 * maxDistFromAxis - delimiterExtend);

    // Finally, we defer to `makeCustomSizedDelim` with our calculated total
    // height
    return makeCustomSizedDelim(delim, totalHeight, true, options, mode);
};

module.exports = {
    sizedDelim: makeSizedDelim,
    customSizedDelim: makeCustomSizedDelim,
    leftRightDelim: makeLeftRightDelim,
};

},{"./ParseError":11,"./Style":14,"./buildCommon":15,"./fontMetrics":22,"./symbols":28,"./utils":29}],20:[function(require,module,exports){
/**
 * These objects store the data about the DOM nodes we create, as well as some
 * extra data. They can then be transformed into real DOM nodes with the
 * `toNode` function or HTML markup using `toMarkup`. They are useful for both
 * storing extra properties on the nodes, as well as providing a way to easily
 * work with the DOM.
 *
 * Similar functions for working with MathML nodes exist in mathMLTree.js.
 */

var utils = require("./utils");

/**
 * Create an HTML className based on a list of classes. In addition to joining
 * with spaces, we also remove null or empty classes.
 */
var createClass = function(classes) {
    classes = classes.slice();
    for (var i = classes.length - 1; i >= 0; i--) {
        if (!classes[i]) {
            classes.splice(i, 1);
        }
    }

    return classes.join(" ");
};

/**
 * This node represents a span node, with a className, a list of children, and
 * an inline style. It also contains information about its height, depth, and
 * maxFontSize.
 */
function span(classes, children, height, depth, maxFontSize, style) {
    this.classes = classes || [];
    this.children = children || [];
    this.height = height || 0;
    this.depth = depth || 0;
    this.maxFontSize = maxFontSize || 0;
    this.style = style || {};
    this.attributes = {};
}

/**
 * Sets an arbitrary attribute on the span. Warning: use this wisely. Not all
 * browsers support attributes the same, and having too many custom attributes
 * is probably bad.
 */
span.prototype.setAttribute = function(attribute, value) {
    this.attributes[attribute] = value;
};

/**
 * Convert the span into an HTML node
 */
span.prototype.toNode = function() {
    var span = document.createElement("span");

    // Apply the class
    span.className = createClass(this.classes);

    // Apply inline styles
    for (var style in this.style) {
        if (Object.prototype.hasOwnProperty.call(this.style, style)) {
            span.style[style] = this.style[style];
        }
    }

    // Apply attributes
    for (var attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
            span.setAttribute(attr, this.attributes[attr]);
        }
    }

    // Append the children, also as HTML nodes
    for (var i = 0; i < this.children.length; i++) {
        span.appendChild(this.children[i].toNode());
    }

    return span;
};

/**
 * Convert the span into an HTML markup string
 */
span.prototype.toMarkup = function() {
    var markup = "<span";

    // Add the class
    if (this.classes.length) {
        markup += " class=\"";
        markup += utils.escape(createClass(this.classes));
        markup += "\"";
    }

    var styles = "";

    // Add the styles, after hyphenation
    for (var style in this.style) {
        if (this.style.hasOwnProperty(style)) {
            styles += utils.hyphenate(style) + ":" + this.style[style] + ";";
        }
    }

    if (styles) {
        markup += " style=\"" + utils.escape(styles) + "\"";
    }

    // Add the attributes
    for (var attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
            markup += " " + attr + "=\"";
            markup += utils.escape(this.attributes[attr]);
            markup += "\"";
        }
    }

    markup += ">";

    // Add the markup of the children, also as markup
    for (var i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
    }

    markup += "</span>";

    return markup;
};

/**
 * This node represents a document fragment, which contains elements, but when
 * placed into the DOM doesn't have any representation itself. Thus, it only
 * contains children and doesn't have any HTML properties. It also keeps track
 * of a height, depth, and maxFontSize.
 */
function documentFragment(children, height, depth, maxFontSize) {
    this.children = children || [];
    this.height = height || 0;
    this.depth = depth || 0;
    this.maxFontSize = maxFontSize || 0;
}

/**
 * Convert the fragment into a node
 */
documentFragment.prototype.toNode = function() {
    // Create a fragment
    var frag = document.createDocumentFragment();

    // Append the children
    for (var i = 0; i < this.children.length; i++) {
        frag.appendChild(this.children[i].toNode());
    }

    return frag;
};

/**
 * Convert the fragment into HTML markup
 */
documentFragment.prototype.toMarkup = function() {
    var markup = "";

    // Simply concatenate the markup for the children together
    for (var i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
    }

    return markup;
};

/**
 * A symbol node contains information about a single symbol. It either renders
 * to a single text node, or a span with a single text node in it, depending on
 * whether it has CSS classes, styles, or needs italic correction.
 */
function symbolNode(value, height, depth, italic, skew, classes, style) {
    this.value = value || "";
    this.height = height || 0;
    this.depth = depth || 0;
    this.italic = italic || 0;
    this.skew = skew || 0;
    this.classes = classes || [];
    this.style = style || {};
    this.maxFontSize = 0;
}

/**
 * Creates a text node or span from a symbol node. Note that a span is only
 * created if it is needed.
 */
symbolNode.prototype.toNode = function() {
    var node = document.createTextNode(this.value);
    var span = null;

    if (this.italic > 0) {
        span = document.createElement("span");
        span.style.marginRight = this.italic + "em";
    }

    if (this.classes.length > 0) {
        span = span || document.createElement("span");
        span.className = createClass(this.classes);
    }

    for (var style in this.style) {
        if (this.style.hasOwnProperty(style)) {
            span = span || document.createElement("span");
            span.style[style] = this.style[style];
        }
    }

    if (span) {
        span.appendChild(node);
        return span;
    } else {
        return node;
    }
};

/**
 * Creates markup for a symbol node.
 */
symbolNode.prototype.toMarkup = function() {
    // TODO(alpert): More duplication than I'd like from
    // span.prototype.toMarkup and symbolNode.prototype.toNode...
    var needsSpan = false;

    var markup = "<span";

    if (this.classes.length) {
        needsSpan = true;
        markup += " class=\"";
        markup += utils.escape(createClass(this.classes));
        markup += "\"";
    }

    var styles = "";

    if (this.italic > 0) {
        styles += "margin-right:" + this.italic + "em;";
    }
    for (var style in this.style) {
        if (this.style.hasOwnProperty(style)) {
            styles += utils.hyphenate(style) + ":" + this.style[style] + ";";
        }
    }

    if (styles) {
        needsSpan = true;
        markup += " style=\"" + utils.escape(styles) + "\"";
    }

    var escaped = utils.escape(this.value);
    if (needsSpan) {
        markup += ">";
        markup += escaped;
        markup += "</span>";
        return markup;
    } else {
        return escaped;
    }
};

module.exports = {
    span: span,
    documentFragment: documentFragment,
    symbolNode: symbolNode,
};

},{"./utils":29}],21:[function(require,module,exports){
/* eslint no-constant-condition:0 */
var fontMetrics = require("./fontMetrics");
var parseData = require("./parseData");
var ParseError = require("./ParseError");

var ParseNode = parseData.ParseNode;

/**
 * Parse the body of the environment, with rows delimited by \\ and
 * columns delimited by &, and create a nested list in row-major order
 * with one group per cell.
 */
function parseArray(parser, result) {
    var row = [];
    var body = [row];
    var rowGaps = [];
    while (true) {
        var cell = parser.parseExpression(false, null);
        row.push(new ParseNode("ordgroup", cell, parser.mode));
        var next = parser.nextToken.text;
        if (next === "&") {
            parser.consume();
        } else if (next === "\\end") {
            break;
        } else if (next === "\\\\" || next === "\\cr") {
            var cr = parser.parseFunction();
            rowGaps.push(cr.value.size);
            row = [];
            body.push(row);
        } else {
            // TODO: Clean up the following hack once #385 got merged
            var pos = Math.min(parser.pos + 1, parser.lexer._input.length);
            throw new ParseError("Expected & or \\\\ or \\end",
                                 parser.lexer, pos);
        }
    }
    result.body = body;
    result.rowGaps = rowGaps;
    return new ParseNode(result.type, result, parser.mode);
}

/*
 * An environment definition is very similar to a function definition:
 * it is declared with a name or a list of names, a set of properties
 * and a handler containing the actual implementation.
 *
 * The properties include:
 *  - numArgs: The number of arguments after the \begin{name} function.
 *  - argTypes: (optional) Just like for a function
 *  - allowedInText: (optional) Whether or not the environment is allowed inside
 *                   text mode (default false) (not enforced yet)
 *  - numOptionalArgs: (optional) Just like for a function
 * A bare number instead of that object indicates the numArgs value.
 *
 * The handler function will receive two arguments
 *  - context: information and references provided by the parser
 *  - args: an array of arguments passed to \begin{name}
 * The context contains the following properties:
 *  - envName: the name of the environment, one of the listed names.
 *  - parser: the parser object
 *  - lexer: the lexer object
 *  - positions: the positions associated with these arguments from args.
 * The handler must return a ParseResult.
 */

function defineEnvironment(names, props, handler) {
    if (typeof names === "string") {
        names = [names];
    }
    if (typeof props === "number") {
        props = { numArgs: props };
    }
    // Set default values of environments
    var data = {
        numArgs: props.numArgs || 0,
        argTypes: props.argTypes,
        greediness: 1,
        allowedInText: !!props.allowedInText,
        numOptionalArgs: props.numOptionalArgs || 0,
        handler: handler,
    };
    for (var i = 0; i < names.length; ++i) {
        module.exports[names[i]] = data;
    }
}

// Arrays are part of LaTeX, defined in lttab.dtx so its documentation
// is part of the source2e.pdf file of LaTeX2e source documentation.
defineEnvironment("array", {
    numArgs: 1,
}, function(context, args) {
    var colalign = args[0];
    colalign = colalign.value.map ? colalign.value : [colalign];
    var cols = colalign.map(function(node) {
        var ca = node.value;
        if ("lcr".indexOf(ca) !== -1) {
            return {
                type: "align",
                align: ca,
            };
        } else if (ca === "|") {
            return {
                type: "separator",
                separator: "|",
            };
        }
        throw new ParseError(
            "Unknown column alignment: " + node.value,
            context.lexer, context.positions[1]);
    });
    var res = {
        type: "array",
        cols: cols,
        hskipBeforeAndAfter: true, // \@preamble in lttab.dtx
    };
    res = parseArray(context.parser, res);
    return res;
});

// The matrix environments of amsmath builds on the array environment
// of LaTeX, which is discussed above.
defineEnvironment([
    "matrix",
    "pmatrix",
    "bmatrix",
    "Bmatrix",
    "vmatrix",
    "Vmatrix",
], {
}, function(context) {
    var delimiters = {
        "matrix": null,
        "pmatrix": ["(", ")"],
        "bmatrix": ["[", "]"],
        "Bmatrix": ["\\{", "\\}"],
        "vmatrix": ["|", "|"],
        "Vmatrix": ["\\Vert", "\\Vert"],
    }[context.envName];
    var res = {
        type: "array",
        hskipBeforeAndAfter: false, // \hskip -\arraycolsep in amsmath
    };
    res = parseArray(context.parser, res);
    if (delimiters) {
        res = new ParseNode("leftright", {
            body: [res],
            left: delimiters[0],
            right: delimiters[1],
        }, context.mode);
    }
    return res;
});

// A cases environment (in amsmath.sty) is almost equivalent to
// \def\arraystretch{1.2}%
// \left\{\begin{array}{@{}l@{\quad}l@{}} … \end{array}\right.
defineEnvironment("cases", {
}, function(context) {
    var res = {
        type: "array",
        arraystretch: 1.2,
        cols: [{
            type: "align",
            align: "l",
            pregap: 0,
            postgap: fontMetrics.metrics.quad,
        }, {
            type: "align",
            align: "l",
            pregap: 0,
            postgap: 0,
        }],
    };
    res = parseArray(context.parser, res);
    res = new ParseNode("leftright", {
        body: [res],
        left: "\\{",
        right: ".",
    }, context.mode);
    return res;
});

// An aligned environment is like the align* environment
// except it operates within math mode.
// Note that we assume \nomallineskiplimit to be zero,
// so that \strut@ is the same as \strut.
defineEnvironment("aligned", {
}, function(context) {
    var res = {
        type: "array",
        cols: [],
    };
    res = parseArray(context.parser, res);
    var emptyGroup = new ParseNode("ordgroup", [], context.mode);
    var numCols = 0;
    res.value.body.forEach(function(row) {
        var i;
        for (i = 1; i < row.length; i += 2) {
            row[i].value.unshift(emptyGroup);
        }
        if (numCols < row.length) {
            numCols = row.length;
        }
    });
    for (var i = 0; i < numCols; ++i) {
        var align = "r";
        var pregap = 0;
        if (i % 2 === 1) {
            align = "l";
        } else if (i > 0) {
            pregap = 2; // one \qquad between columns
        }
        res.value.cols[i] = {
            type: "align",
            align: align,
            pregap: pregap,
            postgap: 0,
        };
    }
    return res;
});

},{"./ParseError":11,"./fontMetrics":22,"./parseData":26}],22:[function(require,module,exports){
/* eslint no-unused-vars:0 */

var Style = require("./Style");

/**
 * This file contains metrics regarding fonts and individual symbols. The sigma
 * and xi variables, as well as the metricMap map contain data extracted from
 * TeX, TeX font metrics, and the TTF files. These data are then exposed via the
 * `metrics` variable and the getCharacterMetrics function.
 */

// These font metrics are extracted from TeX by using
// \font\a=cmmi10
// \showthe\fontdimenX\a
// where X is the corresponding variable number. These correspond to the font
// parameters of the symbol fonts. In TeX, there are actually three sets of
// dimensions, one for each of textstyle, scriptstyle, and scriptscriptstyle,
// but we only use the textstyle ones, and scale certain dimensions accordingly.
// See the TeXbook, page 441.
var sigma1 = 0.025;
var sigma2 = 0;
var sigma3 = 0;
var sigma4 = 0;
var sigma5 = 0.431;
var sigma6 = 1;
var sigma7 = 0;
var sigma8 = 0.677;
var sigma9 = 0.394;
var sigma10 = 0.444;
var sigma11 = 0.686;
var sigma12 = 0.345;
var sigma13 = 0.413;
var sigma14 = 0.363;
var sigma15 = 0.289;
var sigma16 = 0.150;
var sigma17 = 0.247;
var sigma18 = 0.386;
var sigma19 = 0.050;
var sigma20 = 2.390;
var sigma21 = 1.01;
var sigma21Script = 0.81;
var sigma21ScriptScript = 0.71;
var sigma22 = 0.250;

// These font metrics are extracted from TeX by using
// \font\a=cmex10
// \showthe\fontdimenX\a
// where X is the corresponding variable number. These correspond to the font
// parameters of the extension fonts (family 3). See the TeXbook, page 441.
var xi1 = 0;
var xi2 = 0;
var xi3 = 0;
var xi4 = 0;
var xi5 = 0.431;
var xi6 = 1;
var xi7 = 0;
var xi8 = 0.04;
var xi9 = 0.111;
var xi10 = 0.166;
var xi11 = 0.2;
var xi12 = 0.6;
var xi13 = 0.1;

// This value determines how large a pt is, for metrics which are defined in
// terms of pts.
// This value is also used in katex.less; if you change it make sure the values
// match.
var ptPerEm = 10.0;

// The space between adjacent `|` columns in an array definition. From
// `\showthe\doublerulesep` in LaTeX.
var doubleRuleSep = 2.0 / ptPerEm;

/**
 * This is just a mapping from common names to real metrics
 */
var metrics = {
    xHeight: sigma5,
    quad: sigma6,
    num1: sigma8,
    num2: sigma9,
    num3: sigma10,
    denom1: sigma11,
    denom2: sigma12,
    sup1: sigma13,
    sup2: sigma14,
    sup3: sigma15,
    sub1: sigma16,
    sub2: sigma17,
    supDrop: sigma18,
    subDrop: sigma19,
    axisHeight: sigma22,
    defaultRuleThickness: xi8,
    bigOpSpacing1: xi9,
    bigOpSpacing2: xi10,
    bigOpSpacing3: xi11,
    bigOpSpacing4: xi12,
    bigOpSpacing5: xi13,
    ptPerEm: ptPerEm,
    emPerEx: sigma5 / sigma6,
    doubleRuleSep: doubleRuleSep,

    // TODO(alpert): Missing parallel structure here. We should probably add
    // style-specific metrics for all of these.
    delim1: sigma20,
    getDelim2: function(style) {
        if (style.size === Style.TEXT.size) {
            return sigma21;
        } else if (style.size === Style.SCRIPT.size) {
            return sigma21Script;
        } else if (style.size === Style.SCRIPTSCRIPT.size) {
            return sigma21ScriptScript;
        }
        throw new Error("Unexpected style size: " + style.size);
    },
};

// This map contains a mapping from font name and character code to character
// metrics, including height, depth, italic correction, and skew (kern from the
// character to the corresponding \skewchar)
// This map is generated via `make metrics`. It should not be changed manually.
var metricMap = require("./fontMetricsData");

/**
 * This function is a convenience function for looking up information in the
 * metricMap table. It takes a character as a string, and a style.
 *
 * Note: the `width` property may be undefined if fontMetricsData.js wasn't
 * built using `Make extended_metrics`.
 */
var getCharacterMetrics = function(character, style) {
    var metrics = metricMap[style][character.charCodeAt(0)];
    if (metrics) {
        return {
            depth: metrics[0],
            height: metrics[1],
            italic: metrics[2],
            skew: metrics[3],
            width: metrics[4],
        };
    }
};

module.exports = {
    metrics: metrics,
    getCharacterMetrics: getCharacterMetrics,
};

},{"./Style":14,"./fontMetricsData":23}],23:[function(require,module,exports){
module.exports = {
    "AMS-Regular": {
        "65": [0, 0.68889, 0, 0],
        "66": [0, 0.68889, 0, 0],
        "67": [0, 0.68889, 0, 0],
        "68": [0, 0.68889, 0, 0],
        "69": [0, 0.68889, 0, 0],
        "70": [0, 0.68889, 0, 0],
        "71": [0, 0.68889, 0, 0],
        "72": [0, 0.68889, 0, 0],
        "73": [0, 0.68889, 0, 0],
        "74": [0.16667, 0.68889, 0, 0],
        "75": [0, 0.68889, 0, 0],
        "76": [0, 0.68889, 0, 0],
        "77": [0, 0.68889, 0, 0],
        "78": [0, 0.68889, 0, 0],
        "79": [0.16667, 0.68889, 0, 0],
        "80": [0, 0.68889, 0, 0],
        "81": [0.16667, 0.68889, 0, 0],
        "82": [0, 0.68889, 0, 0],
        "83": [0, 0.68889, 0, 0],
        "84": [0, 0.68889, 0, 0],
        "85": [0, 0.68889, 0, 0],
        "86": [0, 0.68889, 0, 0],
        "87": [0, 0.68889, 0, 0],
        "88": [0, 0.68889, 0, 0],
        "89": [0, 0.68889, 0, 0],
        "90": [0, 0.68889, 0, 0],
        "107": [0, 0.68889, 0, 0],
        "165": [0, 0.675, 0.025, 0],
        "174": [0.15559, 0.69224, 0, 0],
        "240": [0, 0.68889, 0, 0],
        "295": [0, 0.68889, 0, 0],
        "710": [0, 0.825, 0, 0],
        "732": [0, 0.9, 0, 0],
        "770": [0, 0.825, 0, 0],
        "771": [0, 0.9, 0, 0],
        "989": [0.08167, 0.58167, 0, 0],
        "1008": [0, 0.43056, 0.04028, 0],
        "8245": [0, 0.54986, 0, 0],
        "8463": [0, 0.68889, 0, 0],
        "8487": [0, 0.68889, 0, 0],
        "8498": [0, 0.68889, 0, 0],
        "8502": [0, 0.68889, 0, 0],
        "8503": [0, 0.68889, 0, 0],
        "8504": [0, 0.68889, 0, 0],
        "8513": [0, 0.68889, 0, 0],
        "8592": [-0.03598, 0.46402, 0, 0],
        "8594": [-0.03598, 0.46402, 0, 0],
        "8602": [-0.13313, 0.36687, 0, 0],
        "8603": [-0.13313, 0.36687, 0, 0],
        "8606": [0.01354, 0.52239, 0, 0],
        "8608": [0.01354, 0.52239, 0, 0],
        "8610": [0.01354, 0.52239, 0, 0],
        "8611": [0.01354, 0.52239, 0, 0],
        "8619": [0, 0.54986, 0, 0],
        "8620": [0, 0.54986, 0, 0],
        "8621": [-0.13313, 0.37788, 0, 0],
        "8622": [-0.13313, 0.36687, 0, 0],
        "8624": [0, 0.69224, 0, 0],
        "8625": [0, 0.69224, 0, 0],
        "8630": [0, 0.43056, 0, 0],
        "8631": [0, 0.43056, 0, 0],
        "8634": [0.08198, 0.58198, 0, 0],
        "8635": [0.08198, 0.58198, 0, 0],
        "8638": [0.19444, 0.69224, 0, 0],
        "8639": [0.19444, 0.69224, 0, 0],
        "8642": [0.19444, 0.69224, 0, 0],
        "8643": [0.19444, 0.69224, 0, 0],
        "8644": [0.1808, 0.675, 0, 0],
        "8646": [0.1808, 0.675, 0, 0],
        "8647": [0.1808, 0.675, 0, 0],
        "8648": [0.19444, 0.69224, 0, 0],
        "8649": [0.1808, 0.675, 0, 0],
        "8650": [0.19444, 0.69224, 0, 0],
        "8651": [0.01354, 0.52239, 0, 0],
        "8652": [0.01354, 0.52239, 0, 0],
        "8653": [-0.13313, 0.36687, 0, 0],
        "8654": [-0.13313, 0.36687, 0, 0],
        "8655": [-0.13313, 0.36687, 0, 0],
        "8666": [0.13667, 0.63667, 0, 0],
        "8667": [0.13667, 0.63667, 0, 0],
        "8669": [-0.13313, 0.37788, 0, 0],
        "8672": [-0.064, 0.437, 0, 0],
        "8674": [-0.064, 0.437, 0, 0],
        "8705": [0, 0.825, 0, 0],
        "8708": [0, 0.68889, 0, 0],
        "8709": [0.08167, 0.58167, 0, 0],
        "8717": [0, 0.43056, 0, 0],
        "8722": [-0.03598, 0.46402, 0, 0],
        "8724": [0.08198, 0.69224, 0, 0],
        "8726": [0.08167, 0.58167, 0, 0],
        "8733": [0, 0.69224, 0, 0],
        "8736": [0, 0.69224, 0, 0],
        "8737": [0, 0.69224, 0, 0],
        "8738": [0.03517, 0.52239, 0, 0],
        "8739": [0.08167, 0.58167, 0, 0],
        "8740": [0.25142, 0.74111, 0, 0],
        "8741": [0.08167, 0.58167, 0, 0],
        "8742": [0.25142, 0.74111, 0, 0],
        "8756": [0, 0.69224, 0, 0],
        "8757": [0, 0.69224, 0, 0],
        "8764": [-0.13313, 0.36687, 0, 0],
        "8765": [-0.13313, 0.37788, 0, 0],
        "8769": [-0.13313, 0.36687, 0, 0],
        "8770": [-0.03625, 0.46375, 0, 0],
        "8774": [0.30274, 0.79383, 0, 0],
        "8776": [-0.01688, 0.48312, 0, 0],
        "8778": [0.08167, 0.58167, 0, 0],
        "8782": [0.06062, 0.54986, 0, 0],
        "8783": [0.06062, 0.54986, 0, 0],
        "8785": [0.08198, 0.58198, 0, 0],
        "8786": [0.08198, 0.58198, 0, 0],
        "8787": [0.08198, 0.58198, 0, 0],
        "8790": [0, 0.69224, 0, 0],
        "8791": [0.22958, 0.72958, 0, 0],
        "8796": [0.08198, 0.91667, 0, 0],
        "8806": [0.25583, 0.75583, 0, 0],
        "8807": [0.25583, 0.75583, 0, 0],
        "8808": [0.25142, 0.75726, 0, 0],
        "8809": [0.25142, 0.75726, 0, 0],
        "8812": [0.25583, 0.75583, 0, 0],
        "8814": [0.20576, 0.70576, 0, 0],
        "8815": [0.20576, 0.70576, 0, 0],
        "8816": [0.30274, 0.79383, 0, 0],
        "8817": [0.30274, 0.79383, 0, 0],
        "8818": [0.22958, 0.72958, 0, 0],
        "8819": [0.22958, 0.72958, 0, 0],
        "8822": [0.1808, 0.675, 0, 0],
        "8823": [0.1808, 0.675, 0, 0],
        "8828": [0.13667, 0.63667, 0, 0],
        "8829": [0.13667, 0.63667, 0, 0],
        "8830": [0.22958, 0.72958, 0, 0],
        "8831": [0.22958, 0.72958, 0, 0],
        "8832": [0.20576, 0.70576, 0, 0],
        "8833": [0.20576, 0.70576, 0, 0],
        "8840": [0.30274, 0.79383, 0, 0],
        "8841": [0.30274, 0.79383, 0, 0],
        "8842": [0.13597, 0.63597, 0, 0],
        "8843": [0.13597, 0.63597, 0, 0],
        "8847": [0.03517, 0.54986, 0, 0],
        "8848": [0.03517, 0.54986, 0, 0],
        "8858": [0.08198, 0.58198, 0, 0],
        "8859": [0.08198, 0.58198, 0, 0],
        "8861": [0.08198, 0.58198, 0, 0],
        "8862": [0, 0.675, 0, 0],
        "8863": [0, 0.675, 0, 0],
        "8864": [0, 0.675, 0, 0],
        "8865": [0, 0.675, 0, 0],
        "8872": [0, 0.69224, 0, 0],
        "8873": [0, 0.69224, 0, 0],
        "8874": [0, 0.69224, 0, 0],
        "8876": [0, 0.68889, 0, 0],
        "8877": [0, 0.68889, 0, 0],
        "8878": [0, 0.68889, 0, 0],
        "8879": [0, 0.68889, 0, 0],
        "8882": [0.03517, 0.54986, 0, 0],
        "8883": [0.03517, 0.54986, 0, 0],
        "8884": [0.13667, 0.63667, 0, 0],
        "8885": [0.13667, 0.63667, 0, 0],
        "8888": [0, 0.54986, 0, 0],
        "8890": [0.19444, 0.43056, 0, 0],
        "8891": [0.19444, 0.69224, 0, 0],
        "8892": [0.19444, 0.69224, 0, 0],
        "8901": [0, 0.54986, 0, 0],
        "8903": [0.08167, 0.58167, 0, 0],
        "8905": [0.08167, 0.58167, 0, 0],
        "8906": [0.08167, 0.58167, 0, 0],
        "8907": [0, 0.69224, 0, 0],
        "8908": [0, 0.69224, 0, 0],
        "8909": [-0.03598, 0.46402, 0, 0],
        "8910": [0, 0.54986, 0, 0],
        "8911": [0, 0.54986, 0, 0],
        "8912": [0.03517, 0.54986, 0, 0],
        "8913": [0.03517, 0.54986, 0, 0],
        "8914": [0, 0.54986, 0, 0],
        "8915": [0, 0.54986, 0, 0],
        "8916": [0, 0.69224, 0, 0],
        "8918": [0.0391, 0.5391, 0, 0],
        "8919": [0.0391, 0.5391, 0, 0],
        "8920": [0.03517, 0.54986, 0, 0],
        "8921": [0.03517, 0.54986, 0, 0],
        "8922": [0.38569, 0.88569, 0, 0],
        "8923": [0.38569, 0.88569, 0, 0],
        "8926": [0.13667, 0.63667, 0, 0],
        "8927": [0.13667, 0.63667, 0, 0],
        "8928": [0.30274, 0.79383, 0, 0],
        "8929": [0.30274, 0.79383, 0, 0],
        "8934": [0.23222, 0.74111, 0, 0],
        "8935": [0.23222, 0.74111, 0, 0],
        "8936": [0.23222, 0.74111, 0, 0],
        "8937": [0.23222, 0.74111, 0, 0],
        "8938": [0.20576, 0.70576, 0, 0],
        "8939": [0.20576, 0.70576, 0, 0],
        "8940": [0.30274, 0.79383, 0, 0],
        "8941": [0.30274, 0.79383, 0, 0],
        "8994": [0.19444, 0.69224, 0, 0],
        "8995": [0.19444, 0.69224, 0, 0],
        "9416": [0.15559, 0.69224, 0, 0],
        "9484": [0, 0.69224, 0, 0],
        "9488": [0, 0.69224, 0, 0],
        "9492": [0, 0.37788, 0, 0],
        "9496": [0, 0.37788, 0, 0],
        "9585": [0.19444, 0.68889, 0, 0],
        "9586": [0.19444, 0.74111, 0, 0],
        "9632": [0, 0.675, 0, 0],
        "9633": [0, 0.675, 0, 0],
        "9650": [0, 0.54986, 0, 0],
        "9651": [0, 0.54986, 0, 0],
        "9654": [0.03517, 0.54986, 0, 0],
        "9660": [0, 0.54986, 0, 0],
        "9661": [0, 0.54986, 0, 0],
        "9664": [0.03517, 0.54986, 0, 0],
        "9674": [0.11111, 0.69224, 0, 0],
        "9733": [0.19444, 0.69224, 0, 0],
        "10003": [0, 0.69224, 0, 0],
        "10016": [0, 0.69224, 0, 0],
        "10731": [0.11111, 0.69224, 0, 0],
        "10846": [0.19444, 0.75583, 0, 0],
        "10877": [0.13667, 0.63667, 0, 0],
        "10878": [0.13667, 0.63667, 0, 0],
        "10885": [0.25583, 0.75583, 0, 0],
        "10886": [0.25583, 0.75583, 0, 0],
        "10887": [0.13597, 0.63597, 0, 0],
        "10888": [0.13597, 0.63597, 0, 0],
        "10889": [0.26167, 0.75726, 0, 0],
        "10890": [0.26167, 0.75726, 0, 0],
        "10891": [0.48256, 0.98256, 0, 0],
        "10892": [0.48256, 0.98256, 0, 0],
        "10901": [0.13667, 0.63667, 0, 0],
        "10902": [0.13667, 0.63667, 0, 0],
        "10933": [0.25142, 0.75726, 0, 0],
        "10934": [0.25142, 0.75726, 0, 0],
        "10935": [0.26167, 0.75726, 0, 0],
        "10936": [0.26167, 0.75726, 0, 0],
        "10937": [0.26167, 0.75726, 0, 0],
        "10938": [0.26167, 0.75726, 0, 0],
        "10949": [0.25583, 0.75583, 0, 0],
        "10950": [0.25583, 0.75583, 0, 0],
        "10955": [0.28481, 0.79383, 0, 0],
        "10956": [0.28481, 0.79383, 0, 0],
        "57350": [0.08167, 0.58167, 0, 0],
        "57351": [0.08167, 0.58167, 0, 0],
        "57352": [0.08167, 0.58167, 0, 0],
        "57353": [0, 0.43056, 0.04028, 0],
        "57356": [0.25142, 0.75726, 0, 0],
        "57357": [0.25142, 0.75726, 0, 0],
        "57358": [0.41951, 0.91951, 0, 0],
        "57359": [0.30274, 0.79383, 0, 0],
        "57360": [0.30274, 0.79383, 0, 0],
        "57361": [0.41951, 0.91951, 0, 0],
        "57366": [0.25142, 0.75726, 0, 0],
        "57367": [0.25142, 0.75726, 0, 0],
        "57368": [0.25142, 0.75726, 0, 0],
        "57369": [0.25142, 0.75726, 0, 0],
        "57370": [0.13597, 0.63597, 0, 0],
        "57371": [0.13597, 0.63597, 0, 0],
    },
    "Caligraphic-Regular": {
        "48": [0, 0.43056, 0, 0],
        "49": [0, 0.43056, 0, 0],
        "50": [0, 0.43056, 0, 0],
        "51": [0.19444, 0.43056, 0, 0],
        "52": [0.19444, 0.43056, 0, 0],
        "53": [0.19444, 0.43056, 0, 0],
        "54": [0, 0.64444, 0, 0],
        "55": [0.19444, 0.43056, 0, 0],
        "56": [0, 0.64444, 0, 0],
        "57": [0.19444, 0.43056, 0, 0],
        "65": [0, 0.68333, 0, 0.19445],
        "66": [0, 0.68333, 0.03041, 0.13889],
        "67": [0, 0.68333, 0.05834, 0.13889],
        "68": [0, 0.68333, 0.02778, 0.08334],
        "69": [0, 0.68333, 0.08944, 0.11111],
        "70": [0, 0.68333, 0.09931, 0.11111],
        "71": [0.09722, 0.68333, 0.0593, 0.11111],
        "72": [0, 0.68333, 0.00965, 0.11111],
        "73": [0, 0.68333, 0.07382, 0],
        "74": [0.09722, 0.68333, 0.18472, 0.16667],
        "75": [0, 0.68333, 0.01445, 0.05556],
        "76": [0, 0.68333, 0, 0.13889],
        "77": [0, 0.68333, 0, 0.13889],
        "78": [0, 0.68333, 0.14736, 0.08334],
        "79": [0, 0.68333, 0.02778, 0.11111],
        "80": [0, 0.68333, 0.08222, 0.08334],
        "81": [0.09722, 0.68333, 0, 0.11111],
        "82": [0, 0.68333, 0, 0.08334],
        "83": [0, 0.68333, 0.075, 0.13889],
        "84": [0, 0.68333, 0.25417, 0],
        "85": [0, 0.68333, 0.09931, 0.08334],
        "86": [0, 0.68333, 0.08222, 0],
        "87": [0, 0.68333, 0.08222, 0.08334],
        "88": [0, 0.68333, 0.14643, 0.13889],
        "89": [0.09722, 0.68333, 0.08222, 0.08334],
        "90": [0, 0.68333, 0.07944, 0.13889],
    },
    "Fraktur-Regular": {
        "33": [0, 0.69141, 0, 0],
        "34": [0, 0.69141, 0, 0],
        "38": [0, 0.69141, 0, 0],
        "39": [0, 0.69141, 0, 0],
        "40": [0.24982, 0.74947, 0, 0],
        "41": [0.24982, 0.74947, 0, 0],
        "42": [0, 0.62119, 0, 0],
        "43": [0.08319, 0.58283, 0, 0],
        "44": [0, 0.10803, 0, 0],
        "45": [0.08319, 0.58283, 0, 0],
        "46": [0, 0.10803, 0, 0],
        "47": [0.24982, 0.74947, 0, 0],
        "48": [0, 0.47534, 0, 0],
        "49": [0, 0.47534, 0, 0],
        "50": [0, 0.47534, 0, 0],
        "51": [0.18906, 0.47534, 0, 0],
        "52": [0.18906, 0.47534, 0, 0],
        "53": [0.18906, 0.47534, 0, 0],
        "54": [0, 0.69141, 0, 0],
        "55": [0.18906, 0.47534, 0, 0],
        "56": [0, 0.69141, 0, 0],
        "57": [0.18906, 0.47534, 0, 0],
        "58": [0, 0.47534, 0, 0],
        "59": [0.12604, 0.47534, 0, 0],
        "61": [-0.13099, 0.36866, 0, 0],
        "63": [0, 0.69141, 0, 0],
        "65": [0, 0.69141, 0, 0],
        "66": [0, 0.69141, 0, 0],
        "67": [0, 0.69141, 0, 0],
        "68": [0, 0.69141, 0, 0],
        "69": [0, 0.69141, 0, 0],
        "70": [0.12604, 0.69141, 0, 0],
        "71": [0, 0.69141, 0, 0],
        "72": [0.06302, 0.69141, 0, 0],
        "73": [0, 0.69141, 0, 0],
        "74": [0.12604, 0.69141, 0, 0],
        "75": [0, 0.69141, 0, 0],
        "76": [0, 0.69141, 0, 0],
        "77": [0, 0.69141, 0, 0],
        "78": [0, 0.69141, 0, 0],
        "79": [0, 0.69141, 0, 0],
        "80": [0.18906, 0.69141, 0, 0],
        "81": [0.03781, 0.69141, 0, 0],
        "82": [0, 0.69141, 0, 0],
        "83": [0, 0.69141, 0, 0],
        "84": [0, 0.69141, 0, 0],
        "85": [0, 0.69141, 0, 0],
        "86": [0, 0.69141, 0, 0],
        "87": [0, 0.69141, 0, 0],
        "88": [0, 0.69141, 0, 0],
        "89": [0.18906, 0.69141, 0, 0],
        "90": [0.12604, 0.69141, 0, 0],
        "91": [0.24982, 0.74947, 0, 0],
        "93": [0.24982, 0.74947, 0, 0],
        "94": [0, 0.69141, 0, 0],
        "97": [0, 0.47534, 0, 0],
        "98": [0, 0.69141, 0, 0],
        "99": [0, 0.47534, 0, 0],
        "100": [0, 0.62119, 0, 0],
        "101": [0, 0.47534, 0, 0],
        "102": [0.18906, 0.69141, 0, 0],
        "103": [0.18906, 0.47534, 0, 0],
        "104": [0.18906, 0.69141, 0, 0],
        "105": [0, 0.69141, 0, 0],
        "106": [0, 0.69141, 0, 0],
        "107": [0, 0.69141, 0, 0],
        "108": [0, 0.69141, 0, 0],
        "109": [0, 0.47534, 0, 0],
        "110": [0, 0.47534, 0, 0],
        "111": [0, 0.47534, 0, 0],
        "112": [0.18906, 0.52396, 0, 0],
        "113": [0.18906, 0.47534, 0, 0],
        "114": [0, 0.47534, 0, 0],
        "115": [0, 0.47534, 0, 0],
        "116": [0, 0.62119, 0, 0],
        "117": [0, 0.47534, 0, 0],
        "118": [0, 0.52396, 0, 0],
        "119": [0, 0.52396, 0, 0],
        "120": [0.18906, 0.47534, 0, 0],
        "121": [0.18906, 0.47534, 0, 0],
        "122": [0.18906, 0.47534, 0, 0],
        "8216": [0, 0.69141, 0, 0],
        "8217": [0, 0.69141, 0, 0],
        "58112": [0, 0.62119, 0, 0],
        "58113": [0, 0.62119, 0, 0],
        "58114": [0.18906, 0.69141, 0, 0],
        "58115": [0.18906, 0.69141, 0, 0],
        "58116": [0.18906, 0.47534, 0, 0],
        "58117": [0, 0.69141, 0, 0],
        "58118": [0, 0.62119, 0, 0],
        "58119": [0, 0.47534, 0, 0],
    },
    "Main-Bold": {
        "33": [0, 0.69444, 0, 0],
        "34": [0, 0.69444, 0, 0],
        "35": [0.19444, 0.69444, 0, 0],
        "36": [0.05556, 0.75, 0, 0],
        "37": [0.05556, 0.75, 0, 0],
        "38": [0, 0.69444, 0, 0],
        "39": [0, 0.69444, 0, 0],
        "40": [0.25, 0.75, 0, 0],
        "41": [0.25, 0.75, 0, 0],
        "42": [0, 0.75, 0, 0],
        "43": [0.13333, 0.63333, 0, 0],
        "44": [0.19444, 0.15556, 0, 0],
        "45": [0, 0.44444, 0, 0],
        "46": [0, 0.15556, 0, 0],
        "47": [0.25, 0.75, 0, 0],
        "48": [0, 0.64444, 0, 0],
        "49": [0, 0.64444, 0, 0],
        "50": [0, 0.64444, 0, 0],
        "51": [0, 0.64444, 0, 0],
        "52": [0, 0.64444, 0, 0],
        "53": [0, 0.64444, 0, 0],
        "54": [0, 0.64444, 0, 0],
        "55": [0, 0.64444, 0, 0],
        "56": [0, 0.64444, 0, 0],
        "57": [0, 0.64444, 0, 0],
        "58": [0, 0.44444, 0, 0],
        "59": [0.19444, 0.44444, 0, 0],
        "60": [0.08556, 0.58556, 0, 0],
        "61": [-0.10889, 0.39111, 0, 0],
        "62": [0.08556, 0.58556, 0, 0],
        "63": [0, 0.69444, 0, 0],
        "64": [0, 0.69444, 0, 0],
        "65": [0, 0.68611, 0, 0],
        "66": [0, 0.68611, 0, 0],
        "67": [0, 0.68611, 0, 0],
        "68": [0, 0.68611, 0, 0],
        "69": [0, 0.68611, 0, 0],
        "70": [0, 0.68611, 0, 0],
        "71": [0, 0.68611, 0, 0],
        "72": [0, 0.68611, 0, 0],
        "73": [0, 0.68611, 0, 0],
        "74": [0, 0.68611, 0, 0],
        "75": [0, 0.68611, 0, 0],
        "76": [0, 0.68611, 0, 0],
        "77": [0, 0.68611, 0, 0],
        "78": [0, 0.68611, 0, 0],
        "79": [0, 0.68611, 0, 0],
        "80": [0, 0.68611, 0, 0],
        "81": [0.19444, 0.68611, 0, 0],
        "82": [0, 0.68611, 0, 0],
        "83": [0, 0.68611, 0, 0],
        "84": [0, 0.68611, 0, 0],
        "85": [0, 0.68611, 0, 0],
        "86": [0, 0.68611, 0.01597, 0],
        "87": [0, 0.68611, 0.01597, 0],
        "88": [0, 0.68611, 0, 0],
        "89": [0, 0.68611, 0.02875, 0],
        "90": [0, 0.68611, 0, 0],
        "91": [0.25, 0.75, 0, 0],
        "92": [0.25, 0.75, 0, 0],
        "93": [0.25, 0.75, 0, 0],
        "94": [0, 0.69444, 0, 0],
        "95": [0.31, 0.13444, 0.03194, 0],
        "96": [0, 0.69444, 0, 0],
        "97": [0, 0.44444, 0, 0],
        "98": [0, 0.69444, 0, 0],
        "99": [0, 0.44444, 0, 0],
        "100": [0, 0.69444, 0, 0],
        "101": [0, 0.44444, 0, 0],
        "102": [0, 0.69444, 0.10903, 0],
        "103": [0.19444, 0.44444, 0.01597, 0],
        "104": [0, 0.69444, 0, 0],
        "105": [0, 0.69444, 0, 0],
        "106": [0.19444, 0.69444, 0, 0],
        "107": [0, 0.69444, 0, 0],
        "108": [0, 0.69444, 0, 0],
        "109": [0, 0.44444, 0, 0],
        "110": [0, 0.44444, 0, 0],
        "111": [0, 0.44444, 0, 0],
        "112": [0.19444, 0.44444, 0, 0],
        "113": [0.19444, 0.44444, 0, 0],
        "114": [0, 0.44444, 0, 0],
        "115": [0, 0.44444, 0, 0],
        "116": [0, 0.63492, 0, 0],
        "117": [0, 0.44444, 0, 0],
        "118": [0, 0.44444, 0.01597, 0],
        "119": [0, 0.44444, 0.01597, 0],
        "120": [0, 0.44444, 0, 0],
        "121": [0.19444, 0.44444, 0.01597, 0],
        "122": [0, 0.44444, 0, 0],
        "123": [0.25, 0.75, 0, 0],
        "124": [0.25, 0.75, 0, 0],
        "125": [0.25, 0.75, 0, 0],
        "126": [0.35, 0.34444, 0, 0],
        "168": [0, 0.69444, 0, 0],
        "172": [0, 0.44444, 0, 0],
        "175": [0, 0.59611, 0, 0],
        "176": [0, 0.69444, 0, 0],
        "177": [0.13333, 0.63333, 0, 0],
        "180": [0, 0.69444, 0, 0],
        "215": [0.13333, 0.63333, 0, 0],
        "247": [0.13333, 0.63333, 0, 0],
        "305": [0, 0.44444, 0, 0],
        "567": [0.19444, 0.44444, 0, 0],
        "710": [0, 0.69444, 0, 0],
        "711": [0, 0.63194, 0, 0],
        "713": [0, 0.59611, 0, 0],
        "714": [0, 0.69444, 0, 0],
        "715": [0, 0.69444, 0, 0],
        "728": [0, 0.69444, 0, 0],
        "729": [0, 0.69444, 0, 0],
        "730": [0, 0.69444, 0, 0],
        "732": [0, 0.69444, 0, 0],
        "768": [0, 0.69444, 0, 0],
        "769": [0, 0.69444, 0, 0],
        "770": [0, 0.69444, 0, 0],
        "771": [0, 0.69444, 0, 0],
        "772": [0, 0.59611, 0, 0],
        "774": [0, 0.69444, 0, 0],
        "775": [0, 0.69444, 0, 0],
        "776": [0, 0.69444, 0, 0],
        "778": [0, 0.69444, 0, 0],
        "779": [0, 0.69444, 0, 0],
        "780": [0, 0.63194, 0, 0],
        "824": [0.19444, 0.69444, 0, 0],
        "915": [0, 0.68611, 0, 0],
        "916": [0, 0.68611, 0, 0],
        "920": [0, 0.68611, 0, 0],
        "923": [0, 0.68611, 0, 0],
        "926": [0, 0.68611, 0, 0],
        "928": [0, 0.68611, 0, 0],
        "931": [0, 0.68611, 0, 0],
        "933": [0, 0.68611, 0, 0],
        "934": [0, 0.68611, 0, 0],
        "936": [0, 0.68611, 0, 0],
        "937": [0, 0.68611, 0, 0],
        "8211": [0, 0.44444, 0.03194, 0],
        "8212": [0, 0.44444, 0.03194, 0],
        "8216": [0, 0.69444, 0, 0],
        "8217": [0, 0.69444, 0, 0],
        "8220": [0, 0.69444, 0, 0],
        "8221": [0, 0.69444, 0, 0],
        "8224": [0.19444, 0.69444, 0, 0],
        "8225": [0.19444, 0.69444, 0, 0],
        "8242": [0, 0.55556, 0, 0],
        "8407": [0, 0.72444, 0.15486, 0],
        "8463": [0, 0.69444, 0, 0],
        "8465": [0, 0.69444, 0, 0],
        "8467": [0, 0.69444, 0, 0],
        "8472": [0.19444, 0.44444, 0, 0],
        "8476": [0, 0.69444, 0, 0],
        "8501": [0, 0.69444, 0, 0],
        "8592": [-0.10889, 0.39111, 0, 0],
        "8593": [0.19444, 0.69444, 0, 0],
        "8594": [-0.10889, 0.39111, 0, 0],
        "8595": [0.19444, 0.69444, 0, 0],
        "8596": [-0.10889, 0.39111, 0, 0],
        "8597": [0.25, 0.75, 0, 0],
        "8598": [0.19444, 0.69444, 0, 0],
        "8599": [0.19444, 0.69444, 0, 0],
        "8600": [0.19444, 0.69444, 0, 0],
        "8601": [0.19444, 0.69444, 0, 0],
        "8636": [-0.10889, 0.39111, 0, 0],
        "8637": [-0.10889, 0.39111, 0, 0],
        "8640": [-0.10889, 0.39111, 0, 0],
        "8641": [-0.10889, 0.39111, 0, 0],
        "8656": [-0.10889, 0.39111, 0, 0],
        "8657": [0.19444, 0.69444, 0, 0],
        "8658": [-0.10889, 0.39111, 0, 0],
        "8659": [0.19444, 0.69444, 0, 0],
        "8660": [-0.10889, 0.39111, 0, 0],
        "8661": [0.25, 0.75, 0, 0],
        "8704": [0, 0.69444, 0, 0],
        "8706": [0, 0.69444, 0.06389, 0],
        "8707": [0, 0.69444, 0, 0],
        "8709": [0.05556, 0.75, 0, 0],
        "8711": [0, 0.68611, 0, 0],
        "8712": [0.08556, 0.58556, 0, 0],
        "8715": [0.08556, 0.58556, 0, 0],
        "8722": [0.13333, 0.63333, 0, 0],
        "8723": [0.13333, 0.63333, 0, 0],
        "8725": [0.25, 0.75, 0, 0],
        "8726": [0.25, 0.75, 0, 0],
        "8727": [-0.02778, 0.47222, 0, 0],
        "8728": [-0.02639, 0.47361, 0, 0],
        "8729": [-0.02639, 0.47361, 0, 0],
        "8730": [0.18, 0.82, 0, 0],
        "8733": [0, 0.44444, 0, 0],
        "8734": [0, 0.44444, 0, 0],
        "8736": [0, 0.69224, 0, 0],
        "8739": [0.25, 0.75, 0, 0],
        "8741": [0.25, 0.75, 0, 0],
        "8743": [0, 0.55556, 0, 0],
        "8744": [0, 0.55556, 0, 0],
        "8745": [0, 0.55556, 0, 0],
        "8746": [0, 0.55556, 0, 0],
        "8747": [0.19444, 0.69444, 0.12778, 0],
        "8764": [-0.10889, 0.39111, 0, 0],
        "8768": [0.19444, 0.69444, 0, 0],
        "8771": [0.00222, 0.50222, 0, 0],
        "8776": [0.02444, 0.52444, 0, 0],
        "8781": [0.00222, 0.50222, 0, 0],
        "8801": [0.00222, 0.50222, 0, 0],
        "8804": [0.19667, 0.69667, 0, 0],
        "8805": [0.19667, 0.69667, 0, 0],
        "8810": [0.08556, 0.58556, 0, 0],
        "8811": [0.08556, 0.58556, 0, 0],
        "8826": [0.08556, 0.58556, 0, 0],
        "8827": [0.08556, 0.58556, 0, 0],
        "8834": [0.08556, 0.58556, 0, 0],
        "8835": [0.08556, 0.58556, 0, 0],
        "8838": [0.19667, 0.69667, 0, 0],
        "8839": [0.19667, 0.69667, 0, 0],
        "8846": [0, 0.55556, 0, 0],
        "8849": [0.19667, 0.69667, 0, 0],
        "8850": [0.19667, 0.69667, 0, 0],
        "8851": [0, 0.55556, 0, 0],
        "8852": [0, 0.55556, 0, 0],
        "8853": [0.13333, 0.63333, 0, 0],
        "8854": [0.13333, 0.63333, 0, 0],
        "8855": [0.13333, 0.63333, 0, 0],
        "8856": [0.13333, 0.63333, 0, 0],
        "8857": [0.13333, 0.63333, 0, 0],
        "8866": [0, 0.69444, 0, 0],
        "8867": [0, 0.69444, 0, 0],
        "8868": [0, 0.69444, 0, 0],
        "8869": [0, 0.69444, 0, 0],
        "8900": [-0.02639, 0.47361, 0, 0],
        "8901": [-0.02639, 0.47361, 0, 0],
        "8902": [-0.02778, 0.47222, 0, 0],
        "8968": [0.25, 0.75, 0, 0],
        "8969": [0.25, 0.75, 0, 0],
        "8970": [0.25, 0.75, 0, 0],
        "8971": [0.25, 0.75, 0, 0],
        "8994": [-0.13889, 0.36111, 0, 0],
        "8995": [-0.13889, 0.36111, 0, 0],
        "9651": [0.19444, 0.69444, 0, 0],
        "9657": [-0.02778, 0.47222, 0, 0],
        "9661": [0.19444, 0.69444, 0, 0],
        "9667": [-0.02778, 0.47222, 0, 0],
        "9711": [0.19444, 0.69444, 0, 0],
        "9824": [0.12963, 0.69444, 0, 0],
        "9825": [0.12963, 0.69444, 0, 0],
        "9826": [0.12963, 0.69444, 0, 0],
        "9827": [0.12963, 0.69444, 0, 0],
        "9837": [0, 0.75, 0, 0],
        "9838": [0.19444, 0.69444, 0, 0],
        "9839": [0.19444, 0.69444, 0, 0],
        "10216": [0.25, 0.75, 0, 0],
        "10217": [0.25, 0.75, 0, 0],
        "10815": [0, 0.68611, 0, 0],
        "10927": [0.19667, 0.69667, 0, 0],
        "10928": [0.19667, 0.69667, 0, 0],
    },
    "Main-Italic": {
        "33": [0, 0.69444, 0.12417, 0],
        "34": [0, 0.69444, 0.06961, 0],
        "35": [0.19444, 0.69444, 0.06616, 0],
        "37": [0.05556, 0.75, 0.13639, 0],
        "38": [0, 0.69444, 0.09694, 0],
        "39": [0, 0.69444, 0.12417, 0],
        "40": [0.25, 0.75, 0.16194, 0],
        "41": [0.25, 0.75, 0.03694, 0],
        "42": [0, 0.75, 0.14917, 0],
        "43": [0.05667, 0.56167, 0.03694, 0],
        "44": [0.19444, 0.10556, 0, 0],
        "45": [0, 0.43056, 0.02826, 0],
        "46": [0, 0.10556, 0, 0],
        "47": [0.25, 0.75, 0.16194, 0],
        "48": [0, 0.64444, 0.13556, 0],
        "49": [0, 0.64444, 0.13556, 0],
        "50": [0, 0.64444, 0.13556, 0],
        "51": [0, 0.64444, 0.13556, 0],
        "52": [0.19444, 0.64444, 0.13556, 0],
        "53": [0, 0.64444, 0.13556, 0],
        "54": [0, 0.64444, 0.13556, 0],
        "55": [0.19444, 0.64444, 0.13556, 0],
        "56": [0, 0.64444, 0.13556, 0],
        "57": [0, 0.64444, 0.13556, 0],
        "58": [0, 0.43056, 0.0582, 0],
        "59": [0.19444, 0.43056, 0.0582, 0],
        "61": [-0.13313, 0.36687, 0.06616, 0],
        "63": [0, 0.69444, 0.1225, 0],
        "64": [0, 0.69444, 0.09597, 0],
        "65": [0, 0.68333, 0, 0],
        "66": [0, 0.68333, 0.10257, 0],
        "67": [0, 0.68333, 0.14528, 0],
        "68": [0, 0.68333, 0.09403, 0],
        "69": [0, 0.68333, 0.12028, 0],
        "70": [0, 0.68333, 0.13305, 0],
        "71": [0, 0.68333, 0.08722, 0],
        "72": [0, 0.68333, 0.16389, 0],
        "73": [0, 0.68333, 0.15806, 0],
        "74": [0, 0.68333, 0.14028, 0],
        "75": [0, 0.68333, 0.14528, 0],
        "76": [0, 0.68333, 0, 0],
        "77": [0, 0.68333, 0.16389, 0],
        "78": [0, 0.68333, 0.16389, 0],
        "79": [0, 0.68333, 0.09403, 0],
        "80": [0, 0.68333, 0.10257, 0],
        "81": [0.19444, 0.68333, 0.09403, 0],
        "82": [0, 0.68333, 0.03868, 0],
        "83": [0, 0.68333, 0.11972, 0],
        "84": [0, 0.68333, 0.13305, 0],
        "85": [0, 0.68333, 0.16389, 0],
        "86": [0, 0.68333, 0.18361, 0],
        "87": [0, 0.68333, 0.18361, 0],
        "88": [0, 0.68333, 0.15806, 0],
        "89": [0, 0.68333, 0.19383, 0],
        "90": [0, 0.68333, 0.14528, 0],
        "91": [0.25, 0.75, 0.1875, 0],
        "93": [0.25, 0.75, 0.10528, 0],
        "94": [0, 0.69444, 0.06646, 0],
        "95": [0.31, 0.12056, 0.09208, 0],
        "97": [0, 0.43056, 0.07671, 0],
        "98": [0, 0.69444, 0.06312, 0],
        "99": [0, 0.43056, 0.05653, 0],
        "100": [0, 0.69444, 0.10333, 0],
        "101": [0, 0.43056, 0.07514, 0],
        "102": [0.19444, 0.69444, 0.21194, 0],
        "103": [0.19444, 0.43056, 0.08847, 0],
        "104": [0, 0.69444, 0.07671, 0],
        "105": [0, 0.65536, 0.1019, 0],
        "106": [0.19444, 0.65536, 0.14467, 0],
        "107": [0, 0.69444, 0.10764, 0],
        "108": [0, 0.69444, 0.10333, 0],
        "109": [0, 0.43056, 0.07671, 0],
        "110": [0, 0.43056, 0.07671, 0],
        "111": [0, 0.43056, 0.06312, 0],
        "112": [0.19444, 0.43056, 0.06312, 0],
        "113": [0.19444, 0.43056, 0.08847, 0],
        "114": [0, 0.43056, 0.10764, 0],
        "115": [0, 0.43056, 0.08208, 0],
        "116": [0, 0.61508, 0.09486, 0],
        "117": [0, 0.43056, 0.07671, 0],
        "118": [0, 0.43056, 0.10764, 0],
        "119": [0, 0.43056, 0.10764, 0],
        "120": [0, 0.43056, 0.12042, 0],
        "121": [0.19444, 0.43056, 0.08847, 0],
        "122": [0, 0.43056, 0.12292, 0],
        "126": [0.35, 0.31786, 0.11585, 0],
        "163": [0, 0.69444, 0, 0],
        "305": [0, 0.43056, 0, 0.02778],
        "567": [0.19444, 0.43056, 0, 0.08334],
        "768": [0, 0.69444, 0, 0],
        "769": [0, 0.69444, 0.09694, 0],
        "770": [0, 0.69444, 0.06646, 0],
        "771": [0, 0.66786, 0.11585, 0],
        "772": [0, 0.56167, 0.10333, 0],
        "774": [0, 0.69444, 0.10806, 0],
        "775": [0, 0.66786, 0.11752, 0],
        "776": [0, 0.66786, 0.10474, 0],
        "778": [0, 0.69444, 0, 0],
        "779": [0, 0.69444, 0.1225, 0],
        "780": [0, 0.62847, 0.08295, 0],
        "915": [0, 0.68333, 0.13305, 0],
        "916": [0, 0.68333, 0, 0],
        "920": [0, 0.68333, 0.09403, 0],
        "923": [0, 0.68333, 0, 0],
        "926": [0, 0.68333, 0.15294, 0],
        "928": [0, 0.68333, 0.16389, 0],
        "931": [0, 0.68333, 0.12028, 0],
        "933": [0, 0.68333, 0.11111, 0],
        "934": [0, 0.68333, 0.05986, 0],
        "936": [0, 0.68333, 0.11111, 0],
        "937": [0, 0.68333, 0.10257, 0],
        "8211": [0, 0.43056, 0.09208, 0],
        "8212": [0, 0.43056, 0.09208, 0],
        "8216": [0, 0.69444, 0.12417, 0],
        "8217": [0, 0.69444, 0.12417, 0],
        "8220": [0, 0.69444, 0.1685, 0],
        "8221": [0, 0.69444, 0.06961, 0],
        "8463": [0, 0.68889, 0, 0],
    },
    "Main-Regular": {
        "32": [0, 0, 0, 0],
        "33": [0, 0.69444, 0, 0],
        "34": [0, 0.69444, 0, 0],
        "35": [0.19444, 0.69444, 0, 0],
        "36": [0.05556, 0.75, 0, 0],
        "37": [0.05556, 0.75, 0, 0],
        "38": [0, 0.69444, 0, 0],
        "39": [0, 0.69444, 0, 0],
        "40": [0.25, 0.75, 0, 0],
        "41": [0.25, 0.75, 0, 0],
        "42": [0, 0.75, 0, 0],
        "43": [0.08333, 0.58333, 0, 0],
        "44": [0.19444, 0.10556, 0, 0],
        "45": [0, 0.43056, 0, 0],
        "46": [0, 0.10556, 0, 0],
        "47": [0.25, 0.75, 0, 0],
        "48": [0, 0.64444, 0, 0],
        "49": [0, 0.64444, 0, 0],
        "50": [0, 0.64444, 0, 0],
        "51": [0, 0.64444, 0, 0],
        "52": [0, 0.64444, 0, 0],
        "53": [0, 0.64444, 0, 0],
        "54": [0, 0.64444, 0, 0],
        "55": [0, 0.64444, 0, 0],
        "56": [0, 0.64444, 0, 0],
        "57": [0, 0.64444, 0, 0],
        "58": [0, 0.43056, 0, 0],
        "59": [0.19444, 0.43056, 0, 0],
        "60": [0.0391, 0.5391, 0, 0],
        "61": [-0.13313, 0.36687, 0, 0],
        "62": [0.0391, 0.5391, 0, 0],
        "63": [0, 0.69444, 0, 0],
        "64": [0, 0.69444, 0, 0],
        "65": [0, 0.68333, 0, 0],
        "66": [0, 0.68333, 0, 0],
        "67": [0, 0.68333, 0, 0],
        "68": [0, 0.68333, 0, 0],
        "69": [0, 0.68333, 0, 0],
        "70": [0, 0.68333, 0, 0],
        "71": [0, 0.68333, 0, 0],
        "72": [0, 0.68333, 0, 0],
        "73": [0, 0.68333, 0, 0],
        "74": [0, 0.68333, 0, 0],
        "75": [0, 0.68333, 0, 0],
        "76": [0, 0.68333, 0, 0],
        "77": [0, 0.68333, 0, 0],
        "78": [0, 0.68333, 0, 0],
        "79": [0, 0.68333, 0, 0],
        "80": [0, 0.68333, 0, 0],
        "81": [0.19444, 0.68333, 0, 0],
        "82": [0, 0.68333, 0, 0],
        "83": [0, 0.68333, 0, 0],
        "84": [0, 0.68333, 0, 0],
        "85": [0, 0.68333, 0, 0],
        "86": [0, 0.68333, 0.01389, 0],
        "87": [0, 0.68333, 0.01389, 0],
        "88": [0, 0.68333, 0, 0],
        "89": [0, 0.68333, 0.025, 0],
        "90": [0, 0.68333, 0, 0],
        "91": [0.25, 0.75, 0, 0],
        "92": [0.25, 0.75, 0, 0],
        "93": [0.25, 0.75, 0, 0],
        "94": [0, 0.69444, 0, 0],
        "95": [0.31, 0.12056, 0.02778, 0],
        "96": [0, 0.69444, 0, 0],
        "97": [0, 0.43056, 0, 0],
        "98": [0, 0.69444, 0, 0],
        "99": [0, 0.43056, 0, 0],
        "100": [0, 0.69444, 0, 0],
        "101": [0, 0.43056, 0, 0],
        "102": [0, 0.69444, 0.07778, 0],
        "103": [0.19444, 0.43056, 0.01389, 0],
        "104": [0, 0.69444, 0, 0],
        "105": [0, 0.66786, 0, 0],
        "106": [0.19444, 0.66786, 0, 0],
        "107": [0, 0.69444, 0, 0],
        "108": [0, 0.69444, 0, 0],
        "109": [0, 0.43056, 0, 0],
        "110": [0, 0.43056, 0, 0],
        "111": [0, 0.43056, 0, 0],
        "112": [0.19444, 0.43056, 0, 0],
        "113": [0.19444, 0.43056, 0, 0],
        "114": [0, 0.43056, 0, 0],
        "115": [0, 0.43056, 0, 0],
        "116": [0, 0.61508, 0, 0],
        "117": [0, 0.43056, 0, 0],
        "118": [0, 0.43056, 0.01389, 0],
        "119": [0, 0.43056, 0.01389, 0],
        "120": [0, 0.43056, 0, 0],
        "121": [0.19444, 0.43056, 0.01389, 0],
        "122": [0, 0.43056, 0, 0],
        "123": [0.25, 0.75, 0, 0],
        "124": [0.25, 0.75, 0, 0],
        "125": [0.25, 0.75, 0, 0],
        "126": [0.35, 0.31786, 0, 0],
        "160": [0, 0, 0, 0],
        "168": [0, 0.66786, 0, 0],
        "172": [0, 0.43056, 0, 0],
        "175": [0, 0.56778, 0, 0],
        "176": [0, 0.69444, 0, 0],
        "177": [0.08333, 0.58333, 0, 0],
        "180": [0, 0.69444, 0, 0],
        "215": [0.08333, 0.58333, 0, 0],
        "247": [0.08333, 0.58333, 0, 0],
        "305": [0, 0.43056, 0, 0],
        "567": [0.19444, 0.43056, 0, 0],
        "710": [0, 0.69444, 0, 0],
        "711": [0, 0.62847, 0, 0],
        "713": [0, 0.56778, 0, 0],
        "714": [0, 0.69444, 0, 0],
        "715": [0, 0.69444, 0, 0],
        "728": [0, 0.69444, 0, 0],
        "729": [0, 0.66786, 0, 0],
        "730": [0, 0.69444, 0, 0],
        "732": [0, 0.66786, 0, 0],
        "768": [0, 0.69444, 0, 0],
        "769": [0, 0.69444, 0, 0],
        "770": [0, 0.69444, 0, 0],
        "771": [0, 0.66786, 0, 0],
        "772": [0, 0.56778, 0, 0],
        "774": [0, 0.69444, 0, 0],
        "775": [0, 0.66786, 0, 0],
        "776": [0, 0.66786, 0, 0],
        "778": [0, 0.69444, 0, 0],
        "779": [0, 0.69444, 0, 0],
        "780": [0, 0.62847, 0, 0],
        "824": [0.19444, 0.69444, 0, 0],
        "915": [0, 0.68333, 0, 0],
        "916": [0, 0.68333, 0, 0],
        "920": [0, 0.68333, 0, 0],
        "923": [0, 0.68333, 0, 0],
        "926": [0, 0.68333, 0, 0],
        "928": [0, 0.68333, 0, 0],
        "931": [0, 0.68333, 0, 0],
        "933": [0, 0.68333, 0, 0],
        "934": [0, 0.68333, 0, 0],
        "936": [0, 0.68333, 0, 0],
        "937": [0, 0.68333, 0, 0],
        "8211": [0, 0.43056, 0.02778, 0],
        "8212": [0, 0.43056, 0.02778, 0],
        "8216": [0, 0.69444, 0, 0],
        "8217": [0, 0.69444, 0, 0],
        "8220": [0, 0.69444, 0, 0],
        "8221": [0, 0.69444, 0, 0],
        "8224": [0.19444, 0.69444, 0, 0],
        "8225": [0.19444, 0.69444, 0, 0],
        "8230": [0, 0.12, 0, 0],
        "8242": [0, 0.55556, 0, 0],
        "8407": [0, 0.71444, 0.15382, 0],
        "8463": [0, 0.68889, 0, 0],
        "8465": [0, 0.69444, 0, 0],
        "8467": [0, 0.69444, 0, 0.11111],
        "8472": [0.19444, 0.43056, 0, 0.11111],
        "8476": [0, 0.69444, 0, 0],
        "8501": [0, 0.69444, 0, 0],
        "8592": [-0.13313, 0.36687, 0, 0],
        "8593": [0.19444, 0.69444, 0, 0],
        "8594": [-0.13313, 0.36687, 0, 0],
        "8595": [0.19444, 0.69444, 0, 0],
        "8596": [-0.13313, 0.36687, 0, 0],
        "8597": [0.25, 0.75, 0, 0],
        "8598": [0.19444, 0.69444, 0, 0],
        "8599": [0.19444, 0.69444, 0, 0],
        "8600": [0.19444, 0.69444, 0, 0],
        "8601": [0.19444, 0.69444, 0, 0],
        "8614": [0.011, 0.511, 0, 0],
        "8617": [0.011, 0.511, 0, 0],
        "8618": [0.011, 0.511, 0, 0],
        "8636": [-0.13313, 0.36687, 0, 0],
        "8637": [-0.13313, 0.36687, 0, 0],
        "8640": [-0.13313, 0.36687, 0, 0],
        "8641": [-0.13313, 0.36687, 0, 0],
        "8652": [0.011, 0.671, 0, 0],
        "8656": [-0.13313, 0.36687, 0, 0],
        "8657": [0.19444, 0.69444, 0, 0],
        "8658": [-0.13313, 0.36687, 0, 0],
        "8659": [0.19444, 0.69444, 0, 0],
        "8660": [-0.13313, 0.36687, 0, 0],
        "8661": [0.25, 0.75, 0, 0],
        "8704": [0, 0.69444, 0, 0],
        "8706": [0, 0.69444, 0.05556, 0.08334],
        "8707": [0, 0.69444, 0, 0],
        "8709": [0.05556, 0.75, 0, 0],
        "8711": [0, 0.68333, 0, 0],
        "8712": [0.0391, 0.5391, 0, 0],
        "8715": [0.0391, 0.5391, 0, 0],
        "8722": [0.08333, 0.58333, 0, 0],
        "8723": [0.08333, 0.58333, 0, 0],
        "8725": [0.25, 0.75, 0, 0],
        "8726": [0.25, 0.75, 0, 0],
        "8727": [-0.03472, 0.46528, 0, 0],
        "8728": [-0.05555, 0.44445, 0, 0],
        "8729": [-0.05555, 0.44445, 0, 0],
        "8730": [0.2, 0.8, 0, 0],
        "8733": [0, 0.43056, 0, 0],
        "8734": [0, 0.43056, 0, 0],
        "8736": [0, 0.69224, 0, 0],
        "8739": [0.25, 0.75, 0, 0],
        "8741": [0.25, 0.75, 0, 0],
        "8743": [0, 0.55556, 0, 0],
        "8744": [0, 0.55556, 0, 0],
        "8745": [0, 0.55556, 0, 0],
        "8746": [0, 0.55556, 0, 0],
        "8747": [0.19444, 0.69444, 0.11111, 0],
        "8764": [-0.13313, 0.36687, 0, 0],
        "8768": [0.19444, 0.69444, 0, 0],
        "8771": [-0.03625, 0.46375, 0, 0],
        "8773": [-0.022, 0.589, 0, 0],
        "8776": [-0.01688, 0.48312, 0, 0],
        "8781": [-0.03625, 0.46375, 0, 0],
        "8784": [-0.133, 0.67, 0, 0],
        "8800": [0.215, 0.716, 0, 0],
        "8801": [-0.03625, 0.46375, 0, 0],
        "8804": [0.13597, 0.63597, 0, 0],
        "8805": [0.13597, 0.63597, 0, 0],
        "8810": [0.0391, 0.5391, 0, 0],
        "8811": [0.0391, 0.5391, 0, 0],
        "8826": [0.0391, 0.5391, 0, 0],
        "8827": [0.0391, 0.5391, 0, 0],
        "8834": [0.0391, 0.5391, 0, 0],
        "8835": [0.0391, 0.5391, 0, 0],
        "8838": [0.13597, 0.63597, 0, 0],
        "8839": [0.13597, 0.63597, 0, 0],
        "8846": [0, 0.55556, 0, 0],
        "8849": [0.13597, 0.63597, 0, 0],
        "8850": [0.13597, 0.63597, 0, 0],
        "8851": [0, 0.55556, 0, 0],
        "8852": [0, 0.55556, 0, 0],
        "8853": [0.08333, 0.58333, 0, 0],
        "8854": [0.08333, 0.58333, 0, 0],
        "8855": [0.08333, 0.58333, 0, 0],
        "8856": [0.08333, 0.58333, 0, 0],
        "8857": [0.08333, 0.58333, 0, 0],
        "8866": [0, 0.69444, 0, 0],
        "8867": [0, 0.69444, 0, 0],
        "8868": [0, 0.69444, 0, 0],
        "8869": [0, 0.69444, 0, 0],
        "8872": [0.249, 0.75, 0, 0],
        "8900": [-0.05555, 0.44445, 0, 0],
        "8901": [-0.05555, 0.44445, 0, 0],
        "8902": [-0.03472, 0.46528, 0, 0],
        "8904": [0.005, 0.505, 0, 0],
        "8942": [0.03, 0.9, 0, 0],
        "8943": [-0.19, 0.31, 0, 0],
        "8945": [-0.1, 0.82, 0, 0],
        "8968": [0.25, 0.75, 0, 0],
        "8969": [0.25, 0.75, 0, 0],
        "8970": [0.25, 0.75, 0, 0],
        "8971": [0.25, 0.75, 0, 0],
        "8994": [-0.14236, 0.35764, 0, 0],
        "8995": [-0.14236, 0.35764, 0, 0],
        "9136": [0.244, 0.744, 0, 0],
        "9137": [0.244, 0.744, 0, 0],
        "9651": [0.19444, 0.69444, 0, 0],
        "9657": [-0.03472, 0.46528, 0, 0],
        "9661": [0.19444, 0.69444, 0, 0],
        "9667": [-0.03472, 0.46528, 0, 0],
        "9711": [0.19444, 0.69444, 0, 0],
        "9824": [0.12963, 0.69444, 0, 0],
        "9825": [0.12963, 0.69444, 0, 0],
        "9826": [0.12963, 0.69444, 0, 0],
        "9827": [0.12963, 0.69444, 0, 0],
        "9837": [0, 0.75, 0, 0],
        "9838": [0.19444, 0.69444, 0, 0],
        "9839": [0.19444, 0.69444, 0, 0],
        "10216": [0.25, 0.75, 0, 0],
        "10217": [0.25, 0.75, 0, 0],
        "10222": [0.244, 0.744, 0, 0],
        "10223": [0.244, 0.744, 0, 0],
        "10229": [0.011, 0.511, 0, 0],
        "10230": [0.011, 0.511, 0, 0],
        "10231": [0.011, 0.511, 0, 0],
        "10232": [0.024, 0.525, 0, 0],
        "10233": [0.024, 0.525, 0, 0],
        "10234": [0.024, 0.525, 0, 0],
        "10236": [0.011, 0.511, 0, 0],
        "10815": [0, 0.68333, 0, 0],
        "10927": [0.13597, 0.63597, 0, 0],
        "10928": [0.13597, 0.63597, 0, 0],
    },
    "Math-BoldItalic": {
        "47": [0.19444, 0.69444, 0, 0],
        "65": [0, 0.68611, 0, 0],
        "66": [0, 0.68611, 0.04835, 0],
        "67": [0, 0.68611, 0.06979, 0],
        "68": [0, 0.68611, 0.03194, 0],
        "69": [0, 0.68611, 0.05451, 0],
        "70": [0, 0.68611, 0.15972, 0],
        "71": [0, 0.68611, 0, 0],
        "72": [0, 0.68611, 0.08229, 0],
        "73": [0, 0.68611, 0.07778, 0],
        "74": [0, 0.68611, 0.10069, 0],
        "75": [0, 0.68611, 0.06979, 0],
        "76": [0, 0.68611, 0, 0],
        "77": [0, 0.68611, 0.11424, 0],
        "78": [0, 0.68611, 0.11424, 0],
        "79": [0, 0.68611, 0.03194, 0],
        "80": [0, 0.68611, 0.15972, 0],
        "81": [0.19444, 0.68611, 0, 0],
        "82": [0, 0.68611, 0.00421, 0],
        "83": [0, 0.68611, 0.05382, 0],
        "84": [0, 0.68611, 0.15972, 0],
        "85": [0, 0.68611, 0.11424, 0],
        "86": [0, 0.68611, 0.25555, 0],
        "87": [0, 0.68611, 0.15972, 0],
        "88": [0, 0.68611, 0.07778, 0],
        "89": [0, 0.68611, 0.25555, 0],
        "90": [0, 0.68611, 0.06979, 0],
        "97": [0, 0.44444, 0, 0],
        "98": [0, 0.69444, 0, 0],
        "99": [0, 0.44444, 0, 0],
        "100": [0, 0.69444, 0, 0],
        "101": [0, 0.44444, 0, 0],
        "102": [0.19444, 0.69444, 0.11042, 0],
        "103": [0.19444, 0.44444, 0.03704, 0],
        "104": [0, 0.69444, 0, 0],
        "105": [0, 0.69326, 0, 0],
        "106": [0.19444, 0.69326, 0.0622, 0],
        "107": [0, 0.69444, 0.01852, 0],
        "108": [0, 0.69444, 0.0088, 0],
        "109": [0, 0.44444, 0, 0],
        "110": [0, 0.44444, 0, 0],
        "111": [0, 0.44444, 0, 0],
        "112": [0.19444, 0.44444, 0, 0],
        "113": [0.19444, 0.44444, 0.03704, 0],
        "114": [0, 0.44444, 0.03194, 0],
        "115": [0, 0.44444, 0, 0],
        "116": [0, 0.63492, 0, 0],
        "117": [0, 0.44444, 0, 0],
        "118": [0, 0.44444, 0.03704, 0],
        "119": [0, 0.44444, 0.02778, 0],
        "120": [0, 0.44444, 0, 0],
        "121": [0.19444, 0.44444, 0.03704, 0],
        "122": [0, 0.44444, 0.04213, 0],
        "915": [0, 0.68611, 0.15972, 0],
        "916": [0, 0.68611, 0, 0],
        "920": [0, 0.68611, 0.03194, 0],
        "923": [0, 0.68611, 0, 0],
        "926": [0, 0.68611, 0.07458, 0],
        "928": [0, 0.68611, 0.08229, 0],
        "931": [0, 0.68611, 0.05451, 0],
        "933": [0, 0.68611, 0.15972, 0],
        "934": [0, 0.68611, 0, 0],
        "936": [0, 0.68611, 0.11653, 0],
        "937": [0, 0.68611, 0.04835, 0],
        "945": [0, 0.44444, 0, 0],
        "946": [0.19444, 0.69444, 0.03403, 0],
        "947": [0.19444, 0.44444, 0.06389, 0],
        "948": [0, 0.69444, 0.03819, 0],
        "949": [0, 0.44444, 0, 0],
        "950": [0.19444, 0.69444, 0.06215, 0],
        "951": [0.19444, 0.44444, 0.03704, 0],
        "952": [0, 0.69444, 0.03194, 0],
        "953": [0, 0.44444, 0, 0],
        "954": [0, 0.44444, 0, 0],
        "955": [0, 0.69444, 0, 0],
        "956": [0.19444, 0.44444, 0, 0],
        "957": [0, 0.44444, 0.06898, 0],
        "958": [0.19444, 0.69444, 0.03021, 0],
        "959": [0, 0.44444, 0, 0],
        "960": [0, 0.44444, 0.03704, 0],
        "961": [0.19444, 0.44444, 0, 0],
        "962": [0.09722, 0.44444, 0.07917, 0],
        "963": [0, 0.44444, 0.03704, 0],
        "964": [0, 0.44444, 0.13472, 0],
        "965": [0, 0.44444, 0.03704, 0],
        "966": [0.19444, 0.44444, 0, 0],
        "967": [0.19444, 0.44444, 0, 0],
        "968": [0.19444, 0.69444, 0.03704, 0],
        "969": [0, 0.44444, 0.03704, 0],
        "977": [0, 0.69444, 0, 0],
        "981": [0.19444, 0.69444, 0, 0],
        "982": [0, 0.44444, 0.03194, 0],
        "1009": [0.19444, 0.44444, 0, 0],
        "1013": [0, 0.44444, 0, 0],
    },
    "Math-Italic": {
        "47": [0.19444, 0.69444, 0, 0],
        "65": [0, 0.68333, 0, 0.13889],
        "66": [0, 0.68333, 0.05017, 0.08334],
        "67": [0, 0.68333, 0.07153, 0.08334],
        "68": [0, 0.68333, 0.02778, 0.05556],
        "69": [0, 0.68333, 0.05764, 0.08334],
        "70": [0, 0.68333, 0.13889, 0.08334],
        "71": [0, 0.68333, 0, 0.08334],
        "72": [0, 0.68333, 0.08125, 0.05556],
        "73": [0, 0.68333, 0.07847, 0.11111],
        "74": [0, 0.68333, 0.09618, 0.16667],
        "75": [0, 0.68333, 0.07153, 0.05556],
        "76": [0, 0.68333, 0, 0.02778],
        "77": [0, 0.68333, 0.10903, 0.08334],
        "78": [0, 0.68333, 0.10903, 0.08334],
        "79": [0, 0.68333, 0.02778, 0.08334],
        "80": [0, 0.68333, 0.13889, 0.08334],
        "81": [0.19444, 0.68333, 0, 0.08334],
        "82": [0, 0.68333, 0.00773, 0.08334],
        "83": [0, 0.68333, 0.05764, 0.08334],
        "84": [0, 0.68333, 0.13889, 0.08334],
        "85": [0, 0.68333, 0.10903, 0.02778],
        "86": [0, 0.68333, 0.22222, 0],
        "87": [0, 0.68333, 0.13889, 0],
        "88": [0, 0.68333, 0.07847, 0.08334],
        "89": [0, 0.68333, 0.22222, 0],
        "90": [0, 0.68333, 0.07153, 0.08334],
        "97": [0, 0.43056, 0, 0],
        "98": [0, 0.69444, 0, 0],
        "99": [0, 0.43056, 0, 0.05556],
        "100": [0, 0.69444, 0, 0.16667],
        "101": [0, 0.43056, 0, 0.05556],
        "102": [0.19444, 0.69444, 0.10764, 0.16667],
        "103": [0.19444, 0.43056, 0.03588, 0.02778],
        "104": [0, 0.69444, 0, 0],
        "105": [0, 0.65952, 0, 0],
        "106": [0.19444, 0.65952, 0.05724, 0],
        "107": [0, 0.69444, 0.03148, 0],
        "108": [0, 0.69444, 0.01968, 0.08334],
        "109": [0, 0.43056, 0, 0],
        "110": [0, 0.43056, 0, 0],
        "111": [0, 0.43056, 0, 0.05556],
        "112": [0.19444, 0.43056, 0, 0.08334],
        "113": [0.19444, 0.43056, 0.03588, 0.08334],
        "114": [0, 0.43056, 0.02778, 0.05556],
        "115": [0, 0.43056, 0, 0.05556],
        "116": [0, 0.61508, 0, 0.08334],
        "117": [0, 0.43056, 0, 0.02778],
        "118": [0, 0.43056, 0.03588, 0.02778],
        "119": [0, 0.43056, 0.02691, 0.08334],
        "120": [0, 0.43056, 0, 0.02778],
        "121": [0.19444, 0.43056, 0.03588, 0.05556],
        "122": [0, 0.43056, 0.04398, 0.05556],
        "915": [0, 0.68333, 0.13889, 0.08334],
        "916": [0, 0.68333, 0, 0.16667],
        "920": [0, 0.68333, 0.02778, 0.08334],
        "923": [0, 0.68333, 0, 0.16667],
        "926": [0, 0.68333, 0.07569, 0.08334],
        "928": [0, 0.68333, 0.08125, 0.05556],
        "931": [0, 0.68333, 0.05764, 0.08334],
        "933": [0, 0.68333, 0.13889, 0.05556],
        "934": [0, 0.68333, 0, 0.08334],
        "936": [0, 0.68333, 0.11, 0.05556],
        "937": [0, 0.68333, 0.05017, 0.08334],
        "945": [0, 0.43056, 0.0037, 0.02778],
        "946": [0.19444, 0.69444, 0.05278, 0.08334],
        "947": [0.19444, 0.43056, 0.05556, 0],
        "948": [0, 0.69444, 0.03785, 0.05556],
        "949": [0, 0.43056, 0, 0.08334],
        "950": [0.19444, 0.69444, 0.07378, 0.08334],
        "951": [0.19444, 0.43056, 0.03588, 0.05556],
        "952": [0, 0.69444, 0.02778, 0.08334],
        "953": [0, 0.43056, 0, 0.05556],
        "954": [0, 0.43056, 0, 0],
        "955": [0, 0.69444, 0, 0],
        "956": [0.19444, 0.43056, 0, 0.02778],
        "957": [0, 0.43056, 0.06366, 0.02778],
        "958": [0.19444, 0.69444, 0.04601, 0.11111],
        "959": [0, 0.43056, 0, 0.05556],
        "960": [0, 0.43056, 0.03588, 0],
        "961": [0.19444, 0.43056, 0, 0.08334],
        "962": [0.09722, 0.43056, 0.07986, 0.08334],
        "963": [0, 0.43056, 0.03588, 0],
        "964": [0, 0.43056, 0.1132, 0.02778],
        "965": [0, 0.43056, 0.03588, 0.02778],
        "966": [0.19444, 0.43056, 0, 0.08334],
        "967": [0.19444, 0.43056, 0, 0.05556],
        "968": [0.19444, 0.69444, 0.03588, 0.11111],
        "969": [0, 0.43056, 0.03588, 0],
        "977": [0, 0.69444, 0, 0.08334],
        "981": [0.19444, 0.69444, 0, 0.08334],
        "982": [0, 0.43056, 0.02778, 0],
        "1009": [0.19444, 0.43056, 0, 0.08334],
        "1013": [0, 0.43056, 0, 0.05556],
    },
    "Math-Regular": {
        "65": [0, 0.68333, 0, 0.13889],
        "66": [0, 0.68333, 0.05017, 0.08334],
        "67": [0, 0.68333, 0.07153, 0.08334],
        "68": [0, 0.68333, 0.02778, 0.05556],
        "69": [0, 0.68333, 0.05764, 0.08334],
        "70": [0, 0.68333, 0.13889, 0.08334],
        "71": [0, 0.68333, 0, 0.08334],
        "72": [0, 0.68333, 0.08125, 0.05556],
        "73": [0, 0.68333, 0.07847, 0.11111],
        "74": [0, 0.68333, 0.09618, 0.16667],
        "75": [0, 0.68333, 0.07153, 0.05556],
        "76": [0, 0.68333, 0, 0.02778],
        "77": [0, 0.68333, 0.10903, 0.08334],
        "78": [0, 0.68333, 0.10903, 0.08334],
        "79": [0, 0.68333, 0.02778, 0.08334],
        "80": [0, 0.68333, 0.13889, 0.08334],
        "81": [0.19444, 0.68333, 0, 0.08334],
        "82": [0, 0.68333, 0.00773, 0.08334],
        "83": [0, 0.68333, 0.05764, 0.08334],
        "84": [0, 0.68333, 0.13889, 0.08334],
        "85": [0, 0.68333, 0.10903, 0.02778],
        "86": [0, 0.68333, 0.22222, 0],
        "87": [0, 0.68333, 0.13889, 0],
        "88": [0, 0.68333, 0.07847, 0.08334],
        "89": [0, 0.68333, 0.22222, 0],
        "90": [0, 0.68333, 0.07153, 0.08334],
        "97": [0, 0.43056, 0, 0],
        "98": [0, 0.69444, 0, 0],
        "99": [0, 0.43056, 0, 0.05556],
        "100": [0, 0.69444, 0, 0.16667],
        "101": [0, 0.43056, 0, 0.05556],
        "102": [0.19444, 0.69444, 0.10764, 0.16667],
        "103": [0.19444, 0.43056, 0.03588, 0.02778],
        "104": [0, 0.69444, 0, 0],
        "105": [0, 0.65952, 0, 0],
        "106": [0.19444, 0.65952, 0.05724, 0],
        "107": [0, 0.69444, 0.03148, 0],
        "108": [0, 0.69444, 0.01968, 0.08334],
        "109": [0, 0.43056, 0, 0],
        "110": [0, 0.43056, 0, 0],
        "111": [0, 0.43056, 0, 0.05556],
        "112": [0.19444, 0.43056, 0, 0.08334],
        "113": [0.19444, 0.43056, 0.03588, 0.08334],
        "114": [0, 0.43056, 0.02778, 0.05556],
        "115": [0, 0.43056, 0, 0.05556],
        "116": [0, 0.61508, 0, 0.08334],
        "117": [0, 0.43056, 0, 0.02778],
        "118": [0, 0.43056, 0.03588, 0.02778],
        "119": [0, 0.43056, 0.02691, 0.08334],
        "120": [0, 0.43056, 0, 0.02778],
        "121": [0.19444, 0.43056, 0.03588, 0.05556],
        "122": [0, 0.43056, 0.04398, 0.05556],
        "915": [0, 0.68333, 0.13889, 0.08334],
        "916": [0, 0.68333, 0, 0.16667],
        "920": [0, 0.68333, 0.02778, 0.08334],
        "923": [0, 0.68333, 0, 0.16667],
        "926": [0, 0.68333, 0.07569, 0.08334],
        "928": [0, 0.68333, 0.08125, 0.05556],
        "931": [0, 0.68333, 0.05764, 0.08334],
        "933": [0, 0.68333, 0.13889, 0.05556],
        "934": [0, 0.68333, 0, 0.08334],
        "936": [0, 0.68333, 0.11, 0.05556],
        "937": [0, 0.68333, 0.05017, 0.08334],
        "945": [0, 0.43056, 0.0037, 0.02778],
        "946": [0.19444, 0.69444, 0.05278, 0.08334],
        "947": [0.19444, 0.43056, 0.05556, 0],
        "948": [0, 0.69444, 0.03785, 0.05556],
        "949": [0, 0.43056, 0, 0.08334],
        "950": [0.19444, 0.69444, 0.07378, 0.08334],
        "951": [0.19444, 0.43056, 0.03588, 0.05556],
        "952": [0, 0.69444, 0.02778, 0.08334],
        "953": [0, 0.43056, 0, 0.05556],
        "954": [0, 0.43056, 0, 0],
        "955": [0, 0.69444, 0, 0],
        "956": [0.19444, 0.43056, 0, 0.02778],
        "957": [0, 0.43056, 0.06366, 0.02778],
        "958": [0.19444, 0.69444, 0.04601, 0.11111],
        "959": [0, 0.43056, 0, 0.05556],
        "960": [0, 0.43056, 0.03588, 0],
        "961": [0.19444, 0.43056, 0, 0.08334],
        "962": [0.09722, 0.43056, 0.07986, 0.08334],
        "963": [0, 0.43056, 0.03588, 0],
        "964": [0, 0.43056, 0.1132, 0.02778],
        "965": [0, 0.43056, 0.03588, 0.02778],
        "966": [0.19444, 0.43056, 0, 0.08334],
        "967": [0.19444, 0.43056, 0, 0.05556],
        "968": [0.19444, 0.69444, 0.03588, 0.11111],
        "969": [0, 0.43056, 0.03588, 0],
        "977": [0, 0.69444, 0, 0.08334],
        "981": [0.19444, 0.69444, 0, 0.08334],
        "982": [0, 0.43056, 0.02778, 0],
        "1009": [0.19444, 0.43056, 0, 0.08334],
        "1013": [0, 0.43056, 0, 0.05556],
    },
    "SansSerif-Regular": {
        "33": [0, 0.69444, 0, 0],
        "34": [0, 0.69444, 0, 0],
        "35": [0.19444, 0.69444, 0, 0],
        "36": [0.05556, 0.75, 0, 0],
        "37": [0.05556, 0.75, 0, 0],
        "38": [0, 0.69444, 0, 0],
        "39": [0, 0.69444, 0, 0],
        "40": [0.25, 0.75, 0, 0],
        "41": [0.25, 0.75, 0, 0],
        "42": [0, 0.75, 0, 0],
        "43": [0.08333, 0.58333, 0, 0],
        "44": [0.125, 0.08333, 0, 0],
        "45": [0, 0.44444, 0, 0],
        "46": [0, 0.08333, 0, 0],
        "47": [0.25, 0.75, 0, 0],
        "48": [0, 0.65556, 0, 0],
        "49": [0, 0.65556, 0, 0],
        "50": [0, 0.65556, 0, 0],
        "51": [0, 0.65556, 0, 0],
        "52": [0, 0.65556, 0, 0],
        "53": [0, 0.65556, 0, 0],
        "54": [0, 0.65556, 0, 0],
        "55": [0, 0.65556, 0, 0],
        "56": [0, 0.65556, 0, 0],
        "57": [0, 0.65556, 0, 0],
        "58": [0, 0.44444, 0, 0],
        "59": [0.125, 0.44444, 0, 0],
        "61": [-0.13, 0.37, 0, 0],
        "63": [0, 0.69444, 0, 0],
        "64": [0, 0.69444, 0, 0],
        "65": [0, 0.69444, 0, 0],
        "66": [0, 0.69444, 0, 0],
        "67": [0, 0.69444, 0, 0],
        "68": [0, 0.69444, 0, 0],
        "69": [0, 0.69444, 0, 0],
        "70": [0, 0.69444, 0, 0],
        "71": [0, 0.69444, 0, 0],
        "72": [0, 0.69444, 0, 0],
        "73": [0, 0.69444, 0, 0],
        "74": [0, 0.69444, 0, 0],
        "75": [0, 0.69444, 0, 0],
        "76": [0, 0.69444, 0, 0],
        "77": [0, 0.69444, 0, 0],
        "78": [0, 0.69444, 0, 0],
        "79": [0, 0.69444, 0, 0],
        "80": [0, 0.69444, 0, 0],
        "81": [0.125, 0.69444, 0, 0],
        "82": [0, 0.69444, 0, 0],
        "83": [0, 0.69444, 0, 0],
        "84": [0, 0.69444, 0, 0],
        "85": [0, 0.69444, 0, 0],
        "86": [0, 0.69444, 0.01389, 0],
        "87": [0, 0.69444, 0.01389, 0],
        "88": [0, 0.69444, 0, 0],
        "89": [0, 0.69444, 0.025, 0],
        "90": [0, 0.69444, 0, 0],
        "91": [0.25, 0.75, 0, 0],
        "93": [0.25, 0.75, 0, 0],
        "94": [0, 0.69444, 0, 0],
        "95": [0.35, 0.09444, 0.02778, 0],
        "97": [0, 0.44444, 0, 0],
        "98": [0, 0.69444, 0, 0],
        "99": [0, 0.44444, 0, 0],
        "100": [0, 0.69444, 0, 0],
        "101": [0, 0.44444, 0, 0],
        "102": [0, 0.69444, 0.06944, 0],
        "103": [0.19444, 0.44444, 0.01389, 0],
        "104": [0, 0.69444, 0, 0],
        "105": [0, 0.67937, 0, 0],
        "106": [0.19444, 0.67937, 0, 0],
        "107": [0, 0.69444, 0, 0],
        "108": [0, 0.69444, 0, 0],
        "109": [0, 0.44444, 0, 0],
        "110": [0, 0.44444, 0, 0],
        "111": [0, 0.44444, 0, 0],
        "112": [0.19444, 0.44444, 0, 0],
        "113": [0.19444, 0.44444, 0, 0],
        "114": [0, 0.44444, 0.01389, 0],
        "115": [0, 0.44444, 0, 0],
        "116": [0, 0.57143, 0, 0],
        "117": [0, 0.44444, 0, 0],
        "118": [0, 0.44444, 0.01389, 0],
        "119": [0, 0.44444, 0.01389, 0],
        "120": [0, 0.44444, 0, 0],
        "121": [0.19444, 0.44444, 0.01389, 0],
        "122": [0, 0.44444, 0, 0],
        "126": [0.35, 0.32659, 0, 0],
        "305": [0, 0.44444, 0, 0],
        "567": [0.19444, 0.44444, 0, 0],
        "768": [0, 0.69444, 0, 0],
        "769": [0, 0.69444, 0, 0],
        "770": [0, 0.69444, 0, 0],
        "771": [0, 0.67659, 0, 0],
        "772": [0, 0.60889, 0, 0],
        "774": [0, 0.69444, 0, 0],
        "775": [0, 0.67937, 0, 0],
        "776": [0, 0.67937, 0, 0],
        "778": [0, 0.69444, 0, 0],
        "779": [0, 0.69444, 0, 0],
        "780": [0, 0.63194, 0, 0],
        "915": [0, 0.69444, 0, 0],
        "916": [0, 0.69444, 0, 0],
        "920": [0, 0.69444, 0, 0],
        "923": [0, 0.69444, 0, 0],
        "926": [0, 0.69444, 0, 0],
        "928": [0, 0.69444, 0, 0],
        "931": [0, 0.69444, 0, 0],
        "933": [0, 0.69444, 0, 0],
        "934": [0, 0.69444, 0, 0],
        "936": [0, 0.69444, 0, 0],
        "937": [0, 0.69444, 0, 0],
        "8211": [0, 0.44444, 0.02778, 0],
        "8212": [0, 0.44444, 0.02778, 0],
        "8216": [0, 0.69444, 0, 0],
        "8217": [0, 0.69444, 0, 0],
        "8220": [0, 0.69444, 0, 0],
        "8221": [0, 0.69444, 0, 0],
    },
    "Script-Regular": {
        "65": [0, 0.7, 0.22925, 0],
        "66": [0, 0.7, 0.04087, 0],
        "67": [0, 0.7, 0.1689, 0],
        "68": [0, 0.7, 0.09371, 0],
        "69": [0, 0.7, 0.18583, 0],
        "70": [0, 0.7, 0.13634, 0],
        "71": [0, 0.7, 0.17322, 0],
        "72": [0, 0.7, 0.29694, 0],
        "73": [0, 0.7, 0.19189, 0],
        "74": [0.27778, 0.7, 0.19189, 0],
        "75": [0, 0.7, 0.31259, 0],
        "76": [0, 0.7, 0.19189, 0],
        "77": [0, 0.7, 0.15981, 0],
        "78": [0, 0.7, 0.3525, 0],
        "79": [0, 0.7, 0.08078, 0],
        "80": [0, 0.7, 0.08078, 0],
        "81": [0, 0.7, 0.03305, 0],
        "82": [0, 0.7, 0.06259, 0],
        "83": [0, 0.7, 0.19189, 0],
        "84": [0, 0.7, 0.29087, 0],
        "85": [0, 0.7, 0.25815, 0],
        "86": [0, 0.7, 0.27523, 0],
        "87": [0, 0.7, 0.27523, 0],
        "88": [0, 0.7, 0.26006, 0],
        "89": [0, 0.7, 0.2939, 0],
        "90": [0, 0.7, 0.24037, 0],
    },
    "Size1-Regular": {
        "40": [0.35001, 0.85, 0, 0],
        "41": [0.35001, 0.85, 0, 0],
        "47": [0.35001, 0.85, 0, 0],
        "91": [0.35001, 0.85, 0, 0],
        "92": [0.35001, 0.85, 0, 0],
        "93": [0.35001, 0.85, 0, 0],
        "123": [0.35001, 0.85, 0, 0],
        "125": [0.35001, 0.85, 0, 0],
        "710": [0, 0.72222, 0, 0],
        "732": [0, 0.72222, 0, 0],
        "770": [0, 0.72222, 0, 0],
        "771": [0, 0.72222, 0, 0],
        "8214": [-0.00099, 0.601, 0, 0],
        "8593": [1e-05, 0.6, 0, 0],
        "8595": [1e-05, 0.6, 0, 0],
        "8657": [1e-05, 0.6, 0, 0],
        "8659": [1e-05, 0.6, 0, 0],
        "8719": [0.25001, 0.75, 0, 0],
        "8720": [0.25001, 0.75, 0, 0],
        "8721": [0.25001, 0.75, 0, 0],
        "8730": [0.35001, 0.85, 0, 0],
        "8739": [-0.00599, 0.606, 0, 0],
        "8741": [-0.00599, 0.606, 0, 0],
        "8747": [0.30612, 0.805, 0.19445, 0],
        "8748": [0.306, 0.805, 0.19445, 0],
        "8749": [0.306, 0.805, 0.19445, 0],
        "8750": [0.30612, 0.805, 0.19445, 0],
        "8896": [0.25001, 0.75, 0, 0],
        "8897": [0.25001, 0.75, 0, 0],
        "8898": [0.25001, 0.75, 0, 0],
        "8899": [0.25001, 0.75, 0, 0],
        "8968": [0.35001, 0.85, 0, 0],
        "8969": [0.35001, 0.85, 0, 0],
        "8970": [0.35001, 0.85, 0, 0],
        "8971": [0.35001, 0.85, 0, 0],
        "9168": [-0.00099, 0.601, 0, 0],
        "10216": [0.35001, 0.85, 0, 0],
        "10217": [0.35001, 0.85, 0, 0],
        "10752": [0.25001, 0.75, 0, 0],
        "10753": [0.25001, 0.75, 0, 0],
        "10754": [0.25001, 0.75, 0, 0],
        "10756": [0.25001, 0.75, 0, 0],
        "10758": [0.25001, 0.75, 0, 0],
    },
    "Size2-Regular": {
        "40": [0.65002, 1.15, 0, 0],
        "41": [0.65002, 1.15, 0, 0],
        "47": [0.65002, 1.15, 0, 0],
        "91": [0.65002, 1.15, 0, 0],
        "92": [0.65002, 1.15, 0, 0],
        "93": [0.65002, 1.15, 0, 0],
        "123": [0.65002, 1.15, 0, 0],
        "125": [0.65002, 1.15, 0, 0],
        "710": [0, 0.75, 0, 0],
        "732": [0, 0.75, 0, 0],
        "770": [0, 0.75, 0, 0],
        "771": [0, 0.75, 0, 0],
        "8719": [0.55001, 1.05, 0, 0],
        "8720": [0.55001, 1.05, 0, 0],
        "8721": [0.55001, 1.05, 0, 0],
        "8730": [0.65002, 1.15, 0, 0],
        "8747": [0.86225, 1.36, 0.44445, 0],
        "8748": [0.862, 1.36, 0.44445, 0],
        "8749": [0.862, 1.36, 0.44445, 0],
        "8750": [0.86225, 1.36, 0.44445, 0],
        "8896": [0.55001, 1.05, 0, 0],
        "8897": [0.55001, 1.05, 0, 0],
        "8898": [0.55001, 1.05, 0, 0],
        "8899": [0.55001, 1.05, 0, 0],
        "8968": [0.65002, 1.15, 0, 0],
        "8969": [0.65002, 1.15, 0, 0],
        "8970": [0.65002, 1.15, 0, 0],
        "8971": [0.65002, 1.15, 0, 0],
        "10216": [0.65002, 1.15, 0, 0],
        "10217": [0.65002, 1.15, 0, 0],
        "10752": [0.55001, 1.05, 0, 0],
        "10753": [0.55001, 1.05, 0, 0],
        "10754": [0.55001, 1.05, 0, 0],
        "10756": [0.55001, 1.05, 0, 0],
        "10758": [0.55001, 1.05, 0, 0],
    },
    "Size3-Regular": {
        "40": [0.95003, 1.45, 0, 0],
        "41": [0.95003, 1.45, 0, 0],
        "47": [0.95003, 1.45, 0, 0],
        "91": [0.95003, 1.45, 0, 0],
        "92": [0.95003, 1.45, 0, 0],
        "93": [0.95003, 1.45, 0, 0],
        "123": [0.95003, 1.45, 0, 0],
        "125": [0.95003, 1.45, 0, 0],
        "710": [0, 0.75, 0, 0],
        "732": [0, 0.75, 0, 0],
        "770": [0, 0.75, 0, 0],
        "771": [0, 0.75, 0, 0],
        "8730": [0.95003, 1.45, 0, 0],
        "8968": [0.95003, 1.45, 0, 0],
        "8969": [0.95003, 1.45, 0, 0],
        "8970": [0.95003, 1.45, 0, 0],
        "8971": [0.95003, 1.45, 0, 0],
        "10216": [0.95003, 1.45, 0, 0],
        "10217": [0.95003, 1.45, 0, 0],
    },
    "Size4-Regular": {
        "40": [1.25003, 1.75, 0, 0],
        "41": [1.25003, 1.75, 0, 0],
        "47": [1.25003, 1.75, 0, 0],
        "91": [1.25003, 1.75, 0, 0],
        "92": [1.25003, 1.75, 0, 0],
        "93": [1.25003, 1.75, 0, 0],
        "123": [1.25003, 1.75, 0, 0],
        "125": [1.25003, 1.75, 0, 0],
        "710": [0, 0.825, 0, 0],
        "732": [0, 0.825, 0, 0],
        "770": [0, 0.825, 0, 0],
        "771": [0, 0.825, 0, 0],
        "8730": [1.25003, 1.75, 0, 0],
        "8968": [1.25003, 1.75, 0, 0],
        "8969": [1.25003, 1.75, 0, 0],
        "8970": [1.25003, 1.75, 0, 0],
        "8971": [1.25003, 1.75, 0, 0],
        "9115": [0.64502, 1.155, 0, 0],
        "9116": [1e-05, 0.6, 0, 0],
        "9117": [0.64502, 1.155, 0, 0],
        "9118": [0.64502, 1.155, 0, 0],
        "9119": [1e-05, 0.6, 0, 0],
        "9120": [0.64502, 1.155, 0, 0],
        "9121": [0.64502, 1.155, 0, 0],
        "9122": [-0.00099, 0.601, 0, 0],
        "9123": [0.64502, 1.155, 0, 0],
        "9124": [0.64502, 1.155, 0, 0],
        "9125": [-0.00099, 0.601, 0, 0],
        "9126": [0.64502, 1.155, 0, 0],
        "9127": [1e-05, 0.9, 0, 0],
        "9128": [0.65002, 1.15, 0, 0],
        "9129": [0.90001, 0, 0, 0],
        "9130": [0, 0.3, 0, 0],
        "9131": [1e-05, 0.9, 0, 0],
        "9132": [0.65002, 1.15, 0, 0],
        "9133": [0.90001, 0, 0, 0],
        "9143": [0.88502, 0.915, 0, 0],
        "10216": [1.25003, 1.75, 0, 0],
        "10217": [1.25003, 1.75, 0, 0],
        "57344": [-0.00499, 0.605, 0, 0],
        "57345": [-0.00499, 0.605, 0, 0],
        "57680": [0, 0.12, 0, 0],
        "57681": [0, 0.12, 0, 0],
        "57682": [0, 0.12, 0, 0],
        "57683": [0, 0.12, 0, 0],
    },
    "Typewriter-Regular": {
        "33": [0, 0.61111, 0, 0],
        "34": [0, 0.61111, 0, 0],
        "35": [0, 0.61111, 0, 0],
        "36": [0.08333, 0.69444, 0, 0],
        "37": [0.08333, 0.69444, 0, 0],
        "38": [0, 0.61111, 0, 0],
        "39": [0, 0.61111, 0, 0],
        "40": [0.08333, 0.69444, 0, 0],
        "41": [0.08333, 0.69444, 0, 0],
        "42": [0, 0.52083, 0, 0],
        "43": [-0.08056, 0.53055, 0, 0],
        "44": [0.13889, 0.125, 0, 0],
        "45": [-0.08056, 0.53055, 0, 0],
        "46": [0, 0.125, 0, 0],
        "47": [0.08333, 0.69444, 0, 0],
        "48": [0, 0.61111, 0, 0],
        "49": [0, 0.61111, 0, 0],
        "50": [0, 0.61111, 0, 0],
        "51": [0, 0.61111, 0, 0],
        "52": [0, 0.61111, 0, 0],
        "53": [0, 0.61111, 0, 0],
        "54": [0, 0.61111, 0, 0],
        "55": [0, 0.61111, 0, 0],
        "56": [0, 0.61111, 0, 0],
        "57": [0, 0.61111, 0, 0],
        "58": [0, 0.43056, 0, 0],
        "59": [0.13889, 0.43056, 0, 0],
        "60": [-0.05556, 0.55556, 0, 0],
        "61": [-0.19549, 0.41562, 0, 0],
        "62": [-0.05556, 0.55556, 0, 0],
        "63": [0, 0.61111, 0, 0],
        "64": [0, 0.61111, 0, 0],
        "65": [0, 0.61111, 0, 0],
        "66": [0, 0.61111, 0, 0],
        "67": [0, 0.61111, 0, 0],
        "68": [0, 0.61111, 0, 0],
        "69": [0, 0.61111, 0, 0],
        "70": [0, 0.61111, 0, 0],
        "71": [0, 0.61111, 0, 0],
        "72": [0, 0.61111, 0, 0],
        "73": [0, 0.61111, 0, 0],
        "74": [0, 0.61111, 0, 0],
        "75": [0, 0.61111, 0, 0],
        "76": [0, 0.61111, 0, 0],
        "77": [0, 0.61111, 0, 0],
        "78": [0, 0.61111, 0, 0],
        "79": [0, 0.61111, 0, 0],
        "80": [0, 0.61111, 0, 0],
        "81": [0.13889, 0.61111, 0, 0],
        "82": [0, 0.61111, 0, 0],
        "83": [0, 0.61111, 0, 0],
        "84": [0, 0.61111, 0, 0],
        "85": [0, 0.61111, 0, 0],
        "86": [0, 0.61111, 0, 0],
        "87": [0, 0.61111, 0, 0],
        "88": [0, 0.61111, 0, 0],
        "89": [0, 0.61111, 0, 0],
        "90": [0, 0.61111, 0, 0],
        "91": [0.08333, 0.69444, 0, 0],
        "92": [0.08333, 0.69444, 0, 0],
        "93": [0.08333, 0.69444, 0, 0],
        "94": [0, 0.61111, 0, 0],
        "95": [0.09514, 0, 0, 0],
        "96": [0, 0.61111, 0, 0],
        "97": [0, 0.43056, 0, 0],
        "98": [0, 0.61111, 0, 0],
        "99": [0, 0.43056, 0, 0],
        "100": [0, 0.61111, 0, 0],
        "101": [0, 0.43056, 0, 0],
        "102": [0, 0.61111, 0, 0],
        "103": [0.22222, 0.43056, 0, 0],
        "104": [0, 0.61111, 0, 0],
        "105": [0, 0.61111, 0, 0],
        "106": [0.22222, 0.61111, 0, 0],
        "107": [0, 0.61111, 0, 0],
        "108": [0, 0.61111, 0, 0],
        "109": [0, 0.43056, 0, 0],
        "110": [0, 0.43056, 0, 0],
        "111": [0, 0.43056, 0, 0],
        "112": [0.22222, 0.43056, 0, 0],
        "113": [0.22222, 0.43056, 0, 0],
        "114": [0, 0.43056, 0, 0],
        "115": [0, 0.43056, 0, 0],
        "116": [0, 0.55358, 0, 0],
        "117": [0, 0.43056, 0, 0],
        "118": [0, 0.43056, 0, 0],
        "119": [0, 0.43056, 0, 0],
        "120": [0, 0.43056, 0, 0],
        "121": [0.22222, 0.43056, 0, 0],
        "122": [0, 0.43056, 0, 0],
        "123": [0.08333, 0.69444, 0, 0],
        "124": [0.08333, 0.69444, 0, 0],
        "125": [0.08333, 0.69444, 0, 0],
        "126": [0, 0.61111, 0, 0],
        "127": [0, 0.61111, 0, 0],
        "305": [0, 0.43056, 0, 0],
        "567": [0.22222, 0.43056, 0, 0],
        "768": [0, 0.61111, 0, 0],
        "769": [0, 0.61111, 0, 0],
        "770": [0, 0.61111, 0, 0],
        "771": [0, 0.61111, 0, 0],
        "772": [0, 0.56555, 0, 0],
        "774": [0, 0.61111, 0, 0],
        "776": [0, 0.61111, 0, 0],
        "778": [0, 0.61111, 0, 0],
        "780": [0, 0.56597, 0, 0],
        "915": [0, 0.61111, 0, 0],
        "916": [0, 0.61111, 0, 0],
        "920": [0, 0.61111, 0, 0],
        "923": [0, 0.61111, 0, 0],
        "926": [0, 0.61111, 0, 0],
        "928": [0, 0.61111, 0, 0],
        "931": [0, 0.61111, 0, 0],
        "933": [0, 0.61111, 0, 0],
        "934": [0, 0.61111, 0, 0],
        "936": [0, 0.61111, 0, 0],
        "937": [0, 0.61111, 0, 0],
        "2018": [0, 0.61111, 0, 0],
        "2019": [0, 0.61111, 0, 0],
        "8242": [0, 0.61111, 0, 0],
    },
};

},{}],24:[function(require,module,exports){
var utils = require("./utils");
var ParseError = require("./ParseError");

/* This file contains a list of functions that we parse, identified by
 * the calls to defineFunction.
 *
 * The first argument to defineFunction is a single name or a list of names.
 * All functions named in such a list will share a single implementation.
 *
 * Each declared function can have associated properties, which
 * include the following:
 *
 *  - numArgs: The number of arguments the function takes.
 *             If this is the only property, it can be passed as a number
 *             instead of an element of a properties object.
 *  - argTypes: (optional) An array corresponding to each argument of the
 *              function, giving the type of argument that should be parsed. Its
 *              length should be equal to `numArgs + numOptionalArgs`. Valid
 *              types:
 *               - "size": A size-like thing, such as "1em" or "5ex"
 *               - "color": An html color, like "#abc" or "blue"
 *               - "original": The same type as the environment that the
 *                             function being parsed is in (e.g. used for the
 *                             bodies of functions like \color where the first
 *                             argument is special and the second argument is
 *                             parsed normally)
 *              Other possible types (probably shouldn't be used)
 *               - "text": Text-like (e.g. \text)
 *               - "math": Normal math
 *              If undefined, this will be treated as an appropriate length
 *              array of "original" strings
 *  - greediness: (optional) The greediness of the function to use ungrouped
 *                arguments.
 *
 *                E.g. if you have an expression
 *                  \sqrt \frac 1 2
 *                since \frac has greediness=2 vs \sqrt's greediness=1, \frac
 *                will use the two arguments '1' and '2' as its two arguments,
 *                then that whole function will be used as the argument to
 *                \sqrt. On the other hand, the expressions
 *                  \frac \frac 1 2 3
 *                and
 *                  \frac \sqrt 1 2
 *                will fail because \frac and \frac have equal greediness
 *                and \sqrt has a lower greediness than \frac respectively. To
 *                make these parse, we would have to change them to:
 *                  \frac {\frac 1 2} 3
 *                and
 *                  \frac {\sqrt 1} 2
 *
 *                The default value is `1`
 *  - allowedInText: (optional) Whether or not the function is allowed inside
 *                   text mode (default false)
 *  - numOptionalArgs: (optional) The number of optional arguments the function
 *                     should parse. If the optional arguments aren't found,
 *                     `null` will be passed to the handler in their place.
 *                     (default 0)
 *
 * The last argument is that implementation, the handler for the function(s).
 * It is called to handle these functions and their arguments.
 * It receives two arguments:
 *  - context contains information and references provided by the parser
 *  - args is an array of arguments obtained from TeX input
 * The context contains the following properties:
 *  - funcName: the text (i.e. name) of the function, including \
 *  - parser: the parser object
 *  - lexer: the lexer object
 *  - positions: the positions in the overall string of the function
 *               and the arguments.
 * The latter three should only be used to produce error messages.
 *
 * The function should return an object with the following keys:
 *  - type: The type of element that this is. This is then used in
 *          buildHTML/buildMathML to determine which function
 *          should be called to build this node into a DOM node
 * Any other data can be added to the object, which will be passed
 * in to the function in buildHTML/buildMathML as `group.value`.
 */

function defineFunction(names, props, handler) {
    if (typeof names === "string") {
        names = [names];
    }
    if (typeof props === "number") {
        props = { numArgs: props };
    }
    // Set default values of functions
    var data = {
        numArgs: props.numArgs,
        argTypes: props.argTypes,
        greediness: (props.greediness === undefined) ? 1 : props.greediness,
        allowedInText: !!props.allowedInText,
        numOptionalArgs: props.numOptionalArgs || 0,
        handler: handler,
    };
    for (var i = 0; i < names.length; ++i) {
        module.exports[names[i]] = data;
    }
}

// A normal square root
defineFunction("\\sqrt", {
    numArgs: 1,
    numOptionalArgs: 1,
}, function(context, args) {
    var index = args[0];
    var body = args[1];
    return {
        type: "sqrt",
        body: body,
        index: index,
    };
});

// Some non-mathy text
defineFunction("\\text", {
    numArgs: 1,
    argTypes: ["text"],
    greediness: 2,
}, function(context, args) {
    var body = args[0];
    // Since the corresponding buildHTML/buildMathML function expects a
    // list of elements, we normalize for different kinds of arguments
    // TODO(emily): maybe this should be done somewhere else
    var inner;
    if (body.type === "ordgroup") {
        inner = body.value;
    } else {
        inner = [body];
    }

    return {
        type: "text",
        body: inner,
    };
});

// A two-argument custom color
defineFunction("\\color", {
    numArgs: 2,
    allowedInText: true,
    greediness: 3,
    argTypes: ["color", "original"],
}, function(context, args) {
    var color = args[0];
    var body = args[1];
    // Normalize the different kinds of bodies (see \text above)
    var inner;
    if (body.type === "ordgroup") {
        inner = body.value;
    } else {
        inner = [body];
    }

    return {
        type: "color",
        color: color.value,
        value: inner,
    };
});

// An overline
defineFunction("\\overline", {
    numArgs: 1,
}, function(context, args) {
    var body = args[0];
    return {
        type: "overline",
        body: body,
    };
});

// An underline
defineFunction("\\underline", {
    numArgs: 1,
}, function(context, args) {
    var body = args[0];
    return {
        type: "underline",
        body: body,
    };
});

// A box of the width and height
defineFunction("\\rule", {
    numArgs: 2,
    numOptionalArgs: 1,
    argTypes: ["size", "size", "size"],
}, function(context, args) {
    var shift = args[0];
    var width = args[1];
    var height = args[2];
    return {
        type: "rule",
        shift: shift && shift.value,
        width: width.value,
        height: height.value,
    };
});

// A KaTeX logo
defineFunction("\\KaTeX", {
    numArgs: 0,
}, function(context) {
    return {
        type: "katex",
    };
});

defineFunction("\\phantom", {
    numArgs: 1,
}, function(context, args) {
    var body = args[0];
    var inner;
    if (body.type === "ordgroup") {
        inner = body.value;
    } else {
        inner = [body];
    }

    return {
        type: "phantom",
        value: inner,
    };
});

// Extra data needed for the delimiter handler down below
var delimiterSizes = {
    "\\bigl" : {type: "open",    size: 1},
    "\\Bigl" : {type: "open",    size: 2},
    "\\biggl": {type: "open",    size: 3},
    "\\Biggl": {type: "open",    size: 4},
    "\\bigr" : {type: "close",   size: 1},
    "\\Bigr" : {type: "close",   size: 2},
    "\\biggr": {type: "close",   size: 3},
    "\\Biggr": {type: "close",   size: 4},
    "\\bigm" : {type: "rel",     size: 1},
    "\\Bigm" : {type: "rel",     size: 2},
    "\\biggm": {type: "rel",     size: 3},
    "\\Biggm": {type: "rel",     size: 4},
    "\\big"  : {type: "textord", size: 1},
    "\\Big"  : {type: "textord", size: 2},
    "\\bigg" : {type: "textord", size: 3},
    "\\Bigg" : {type: "textord", size: 4},
};

var delimiters = [
    "(", ")", "[", "\\lbrack", "]", "\\rbrack",
    "\\{", "\\lbrace", "\\}", "\\rbrace",
    "\\lfloor", "\\rfloor", "\\lceil", "\\rceil",
    "<", ">", "\\langle", "\\rangle", "\\lt", "\\gt",
    "\\lvert", "\\rvert", "\\lVert", "\\rVert",
    "\\lgroup", "\\rgroup", "\\lmoustache", "\\rmoustache",
    "/", "\\backslash",
    "|", "\\vert", "\\|", "\\Vert",
    "\\uparrow", "\\Uparrow",
    "\\downarrow", "\\Downarrow",
    "\\updownarrow", "\\Updownarrow",
    ".",
];

var fontAliases = {
    "\\Bbb": "\\mathbb",
    "\\bold": "\\mathbf",
    "\\frak": "\\mathfrak",
};

// Single-argument color functions
defineFunction([
    "\\blue", "\\orange", "\\pink", "\\red",
    "\\green", "\\gray", "\\purple",
    "\\blueA", "\\blueB", "\\blueC", "\\blueD", "\\blueE",
    "\\tealA", "\\tealB", "\\tealC", "\\tealD", "\\tealE",
    "\\greenA", "\\greenB", "\\greenC", "\\greenD", "\\greenE",
    "\\goldA", "\\goldB", "\\goldC", "\\goldD", "\\goldE",
    "\\redA", "\\redB", "\\redC", "\\redD", "\\redE",
    "\\maroonA", "\\maroonB", "\\maroonC", "\\maroonD", "\\maroonE",
    "\\purpleA", "\\purpleB", "\\purpleC", "\\purpleD", "\\purpleE",
    "\\mintA", "\\mintB", "\\mintC",
    "\\grayA", "\\grayB", "\\grayC", "\\grayD", "\\grayE",
    "\\grayF", "\\grayG", "\\grayH", "\\grayI",
    "\\kaBlue", "\\kaGreen",
], {
    numArgs: 1,
    allowedInText: true,
    greediness: 3,
}, function(context, args) {
    var body = args[0];
    var atoms;
    if (body.type === "ordgroup") {
        atoms = body.value;
    } else {
        atoms = [body];
    }

    return {
        type: "color",
        color: "katex-" + context.funcName.slice(1),
        value: atoms,
    };
});

// There are 2 flags for operators; whether they produce limits in
// displaystyle, and whether they are symbols and should grow in
// displaystyle. These four groups cover the four possible choices.

// No limits, not symbols
defineFunction([
    "\\arcsin", "\\arccos", "\\arctan", "\\arg", "\\cos", "\\cosh",
    "\\cot", "\\coth", "\\csc", "\\deg", "\\dim", "\\exp", "\\hom",
    "\\ker", "\\lg", "\\ln", "\\log", "\\sec", "\\sin", "\\sinh",
    "\\tan", "\\tanh",
], {
    numArgs: 0,
}, function(context) {
    return {
        type: "op",
        limits: false,
        symbol: false,
        body: context.funcName,
    };
});

// Limits, not symbols
defineFunction([
    "\\det", "\\gcd", "\\inf", "\\lim", "\\liminf", "\\limsup", "\\max",
    "\\min", "\\Pr", "\\sup",
], {
    numArgs: 0,
}, function(context) {
    return {
        type: "op",
        limits: true,
        symbol: false,
        body: context.funcName,
    };
});

// No limits, symbols
defineFunction([
    "\\int", "\\iint", "\\iiint", "\\oint",
], {
    numArgs: 0,
}, function(context) {
    return {
        type: "op",
        limits: false,
        symbol: true,
        body: context.funcName,
    };
});

// Limits, symbols
defineFunction([
    "\\coprod", "\\bigvee", "\\bigwedge", "\\biguplus", "\\bigcap",
    "\\bigcup", "\\intop", "\\prod", "\\sum", "\\bigotimes",
    "\\bigoplus", "\\bigodot", "\\bigsqcup", "\\smallint",
], {
    numArgs: 0,
}, function(context) {
    return {
        type: "op",
        limits: true,
        symbol: true,
        body: context.funcName,
    };
});

// Fractions
defineFunction([
    "\\dfrac", "\\frac", "\\tfrac",
    "\\dbinom", "\\binom", "\\tbinom",
], {
    numArgs: 2,
    greediness: 2,
}, function(context, args) {
    var numer = args[0];
    var denom = args[1];
    var hasBarLine;
    var leftDelim = null;
    var rightDelim = null;
    var size = "auto";

    switch (context.funcName) {
        case "\\dfrac":
        case "\\frac":
        case "\\tfrac":
            hasBarLine = true;
            break;
        case "\\dbinom":
        case "\\binom":
        case "\\tbinom":
            hasBarLine = false;
            leftDelim = "(";
            rightDelim = ")";
            break;
        default:
            throw new Error("Unrecognized genfrac command");
    }

    switch (context.funcName) {
        case "\\dfrac":
        case "\\dbinom":
            size = "display";
            break;
        case "\\tfrac":
        case "\\tbinom":
            size = "text";
            break;
    }

    return {
        type: "genfrac",
        numer: numer,
        denom: denom,
        hasBarLine: hasBarLine,
        leftDelim: leftDelim,
        rightDelim: rightDelim,
        size: size,
    };
});

// Left and right overlap functions
defineFunction(["\\llap", "\\rlap"], {
    numArgs: 1,
    allowedInText: true,
}, function(context, args) {
    var body = args[0];
    return {
        type: context.funcName.slice(1),
        body: body,
    };
});

// Delimiter functions
defineFunction([
    "\\bigl", "\\Bigl", "\\biggl", "\\Biggl",
    "\\bigr", "\\Bigr", "\\biggr", "\\Biggr",
    "\\bigm", "\\Bigm", "\\biggm", "\\Biggm",
    "\\big",  "\\Big",  "\\bigg",  "\\Bigg",
    "\\left", "\\right",
], {
    numArgs: 1,
}, function(context, args) {
    var delim = args[0];
    if (!utils.contains(delimiters, delim.value)) {
        throw new ParseError(
            "Invalid delimiter: '" + delim.value + "' after '" +
                context.funcName + "'",
            context.lexer, context.positions[1]);
    }

    // \left and \right are caught somewhere in Parser.js, which is
    // why this data doesn't match what is in buildHTML.
    if (context.funcName === "\\left" || context.funcName === "\\right") {
        return {
            type: "leftright",
            value: delim.value,
        };
    } else {
        return {
            type: "delimsizing",
            size: delimiterSizes[context.funcName].size,
            delimType: delimiterSizes[context.funcName].type,
            value: delim.value,
        };
    }
});

// Sizing functions (handled in Parser.js explicitly, hence no handler)
defineFunction([
    "\\tiny", "\\scriptsize", "\\footnotesize", "\\small",
    "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge",
], 0, null);

// Style changing functions (handled in Parser.js explicitly, hence no
// handler)
defineFunction([
    "\\displaystyle", "\\textstyle", "\\scriptstyle",
    "\\scriptscriptstyle",
], 0, null);

defineFunction([
    // styles
    "\\mathrm", "\\mathit", "\\mathbf",

    // families
    "\\mathbb", "\\mathcal", "\\mathfrak", "\\mathscr", "\\mathsf",
    "\\mathtt",

    // aliases
    "\\Bbb", "\\bold", "\\frak",
], {
    numArgs: 1,
    greediness: 2,
}, function(context, args) {
    var body = args[0];
    var func = context.funcName;
    if (func in fontAliases) {
        func = fontAliases[func];
    }
    return {
        type: "font",
        font: func.slice(1),
        body: body,
    };
});

// Accents
defineFunction([
    "\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve",
    "\\check", "\\hat", "\\vec", "\\dot",
    // We don't support expanding accents yet
    // "\\widetilde", "\\widehat"
], {
    numArgs: 1,
}, function(context, args) {
    var base = args[0];
    return {
        type: "accent",
        accent: context.funcName,
        base: base,
    };
});

// Infix generalized fractions
defineFunction(["\\over", "\\choose"], {
    numArgs: 0,
}, function(context) {
    var replaceWith;
    switch (context.funcName) {
        case "\\over":
            replaceWith = "\\frac";
            break;
        case "\\choose":
            replaceWith = "\\binom";
            break;
        default:
            throw new Error("Unrecognized infix genfrac command");
    }
    return {
        type: "infix",
        replaceWith: replaceWith,
    };
});

// Row breaks for aligned data
defineFunction(["\\\\", "\\cr"], {
    numArgs: 0,
    numOptionalArgs: 1,
    argTypes: ["size"],
}, function(context, args) {
    var size = args[0];
    return {
        type: "cr",
        size: size,
    };
});

// Environment delimiters
defineFunction(["\\begin", "\\end"], {
    numArgs: 1,
    argTypes: ["text"],
}, function(context, args) {
    var nameGroup = args[0];
    if (nameGroup.type !== "ordgroup") {
        throw new ParseError(
            "Invalid environment name",
            context.lexer, context.positions[1]);
    }
    var name = "";
    for (var i = 0; i < nameGroup.value.length; ++i) {
        name += nameGroup.value[i].value;
    }
    return {
        type: "environment",
        name: name,
        namepos: context.positions[1],
    };
});

},{"./ParseError":11,"./utils":29}],25:[function(require,module,exports){
/**
 * These objects store data about MathML nodes. This is the MathML equivalent
 * of the types in domTree.js. Since MathML handles its own rendering, and
 * since we're mainly using MathML to improve accessibility, we don't manage
 * any of the styling state that the plain DOM nodes do.
 *
 * The `toNode` and `toMarkup` functions work simlarly to how they do in
 * domTree.js, creating namespaced DOM nodes and HTML text markup respectively.
 */

var utils = require("./utils");

/**
 * This node represents a general purpose MathML node of any type. The
 * constructor requires the type of node to create (for example, `"mo"` or
 * `"mspace"`, corresponding to `<mo>` and `<mspace>` tags).
 */
function MathNode(type, children) {
    this.type = type;
    this.attributes = {};
    this.children = children || [];
}

/**
 * Sets an attribute on a MathML node. MathML depends on attributes to convey a
 * semantic content, so this is used heavily.
 */
MathNode.prototype.setAttribute = function(name, value) {
    this.attributes[name] = value;
};

/**
 * Converts the math node into a MathML-namespaced DOM element.
 */
MathNode.prototype.toNode = function() {
    var node = document.createElementNS(
        "http://www.w3.org/1998/Math/MathML", this.type);

    for (var attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
            node.setAttribute(attr, this.attributes[attr]);
        }
    }

    for (var i = 0; i < this.children.length; i++) {
        node.appendChild(this.children[i].toNode());
    }

    return node;
};

/**
 * Converts the math node into an HTML markup string.
 */
MathNode.prototype.toMarkup = function() {
    var markup = "<" + this.type;

    // Add the attributes
    for (var attr in this.attributes) {
        if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
            markup += " " + attr + "=\"";
            markup += utils.escape(this.attributes[attr]);
            markup += "\"";
        }
    }

    markup += ">";

    for (var i = 0; i < this.children.length; i++) {
        markup += this.children[i].toMarkup();
    }

    markup += "</" + this.type + ">";

    return markup;
};

/**
 * This node represents a piece of text.
 */
function TextNode(text) {
    this.text = text;
}

/**
 * Converts the text node into a DOM text node.
 */
TextNode.prototype.toNode = function() {
    return document.createTextNode(this.text);
};

/**
 * Converts the text node into HTML markup (which is just the text itself).
 */
TextNode.prototype.toMarkup = function() {
    return utils.escape(this.text);
};

module.exports = {
    MathNode: MathNode,
    TextNode: TextNode,
};

},{"./utils":29}],26:[function(require,module,exports){
/**
 * The resulting parse tree nodes of the parse tree.
 */
function ParseNode(type, value, mode) {
    this.type = type;
    this.value = value;
    this.mode = mode;
}

module.exports = {
    ParseNode: ParseNode,
};


},{}],27:[function(require,module,exports){
/**
 * Provides a single function for parsing an expression using a Parser
 * TODO(emily): Remove this
 */

var Parser = require("./Parser");

/**
 * Parses an expression using a Parser, then returns the parsed result.
 */
var parseTree = function(toParse, settings) {
    var parser = new Parser(toParse, settings);

    return parser.parse();
};

module.exports = parseTree;

},{"./Parser":12}],28:[function(require,module,exports){
/**
 * This file holds a list of all no-argument functions and single-character
 * symbols (like 'a' or ';').
 *
 * For each of the symbols, there are three properties they can have:
 * - font (required): the font to be used for this symbol. Either "main" (the
     normal font), or "ams" (the ams fonts).
 * - group (required): the ParseNode group type the symbol should have (i.e.
     "textord", "mathord", etc).
     See https://github.com/Khan/KaTeX/wiki/Examining-TeX#group-types
 * - replace: the character that this symbol or function should be
 *   replaced with (i.e. "\phi" has a replace value of "\u03d5", the phi
 *   character in the main font).
 *
 * The outermost map in the table indicates what mode the symbols should be
 * accepted in (e.g. "math" or "text").
 */

module.exports = {
    math: {},
    text: {},
};

function defineSymbol(mode, font, group, replace, name) {
    module.exports[mode][name] = {
        font: font,
        group: group,
        replace: replace,
    };
}

// Some abbreviations for commonly used strings.
// This helps minify the code, and also spotting typos using jshint.

// modes:
var math = "math";
var text = "text";

// fonts:
var main = "main";
var ams = "ams";

// groups:
var accent = "accent";
var bin = "bin";
var close = "close";
var inner = "inner";
var mathord = "mathord";
var op = "op";
var open = "open";
var punct = "punct";
var rel = "rel";
var spacing = "spacing";
var textord = "textord";

// Now comes the symbol table

// Relation Symbols
defineSymbol(math, main, rel, "\u2261", "\\equiv");
defineSymbol(math, main, rel, "\u227a", "\\prec");
defineSymbol(math, main, rel, "\u227b", "\\succ");
defineSymbol(math, main, rel, "\u223c", "\\sim");
defineSymbol(math, main, rel, "\u22a5", "\\perp");
defineSymbol(math, main, rel, "\u2aaf", "\\preceq");
defineSymbol(math, main, rel, "\u2ab0", "\\succeq");
defineSymbol(math, main, rel, "\u2243", "\\simeq");
defineSymbol(math, main, rel, "\u2223", "\\mid");
defineSymbol(math, main, rel, "\u226a", "\\ll");
defineSymbol(math, main, rel, "\u226b", "\\gg");
defineSymbol(math, main, rel, "\u224d", "\\asymp");
defineSymbol(math, main, rel, "\u2225", "\\parallel");
defineSymbol(math, main, rel, "\u22c8", "\\bowtie");
defineSymbol(math, main, rel, "\u2323", "\\smile");
defineSymbol(math, main, rel, "\u2291", "\\sqsubseteq");
defineSymbol(math, main, rel, "\u2292", "\\sqsupseteq");
defineSymbol(math, main, rel, "\u2250", "\\doteq");
defineSymbol(math, main, rel, "\u2322", "\\frown");
defineSymbol(math, main, rel, "\u220b", "\\ni");
defineSymbol(math, main, rel, "\u221d", "\\propto");
defineSymbol(math, main, rel, "\u22a2", "\\vdash");
defineSymbol(math, main, rel, "\u22a3", "\\dashv");
defineSymbol(math, main, rel, "\u220b", "\\owns");

// Punctuation
defineSymbol(math, main, punct, "\u002e", "\\ldotp");
defineSymbol(math, main, punct, "\u22c5", "\\cdotp");

// Misc Symbols
defineSymbol(math, main, textord, "\u0023", "\\#");
defineSymbol(math, main, textord, "\u0026", "\\&");
defineSymbol(math, main, textord, "\u2135", "\\aleph");
defineSymbol(math, main, textord, "\u2200", "\\forall");
defineSymbol(math, main, textord, "\u210f", "\\hbar");
defineSymbol(math, main, textord, "\u2203", "\\exists");
defineSymbol(math, main, textord, "\u2207", "\\nabla");
defineSymbol(math, main, textord, "\u266d", "\\flat");
defineSymbol(math, main, textord, "\u2113", "\\ell");
defineSymbol(math, main, textord, "\u266e", "\\natural");
defineSymbol(math, main, textord, "\u2663", "\\clubsuit");
defineSymbol(math, main, textord, "\u2118", "\\wp");
defineSymbol(math, main, textord, "\u266f", "\\sharp");
defineSymbol(math, main, textord, "\u2662", "\\diamondsuit");
defineSymbol(math, main, textord, "\u211c", "\\Re");
defineSymbol(math, main, textord, "\u2661", "\\heartsuit");
defineSymbol(math, main, textord, "\u2111", "\\Im");
defineSymbol(math, main, textord, "\u2660", "\\spadesuit");

// Math and Text
defineSymbol(math, main, textord, "\u2020", "\\dag");
defineSymbol(math, main, textord, "\u2021", "\\ddag");

// Large Delimiters
defineSymbol(math, main, close, "\u23b1", "\\rmoustache");
defineSymbol(math, main, open, "\u23b0", "\\lmoustache");
defineSymbol(math, main, close, "\u27ef", "\\rgroup");
defineSymbol(math, main, open, "\u27ee", "\\lgroup");

// Binary Operators
defineSymbol(math, main, bin, "\u2213", "\\mp");
defineSymbol(math, main, bin, "\u2296", "\\ominus");
defineSymbol(math, main, bin, "\u228e", "\\uplus");
defineSymbol(math, main, bin, "\u2293", "\\sqcap");
defineSymbol(math, main, bin, "\u2217", "\\ast");
defineSymbol(math, main, bin, "\u2294", "\\sqcup");
defineSymbol(math, main, bin, "\u25ef", "\\bigcirc");
defineSymbol(math, main, bin, "\u2219", "\\bullet");
defineSymbol(math, main, bin, "\u2021", "\\ddagger");
defineSymbol(math, main, bin, "\u2240", "\\wr");
defineSymbol(math, main, bin, "\u2a3f", "\\amalg");

// Arrow Symbols
defineSymbol(math, main, rel, "\u27f5", "\\longleftarrow");
defineSymbol(math, main, rel, "\u21d0", "\\Leftarrow");
defineSymbol(math, main, rel, "\u27f8", "\\Longleftarrow");
defineSymbol(math, main, rel, "\u27f6", "\\longrightarrow");
defineSymbol(math, main, rel, "\u21d2", "\\Rightarrow");
defineSymbol(math, main, rel, "\u27f9", "\\Longrightarrow");
defineSymbol(math, main, rel, "\u2194", "\\leftrightarrow");
defineSymbol(math, main, rel, "\u27f7", "\\longleftrightarrow");
defineSymbol(math, main, rel, "\u21d4", "\\Leftrightarrow");
defineSymbol(math, main, rel, "\u27fa", "\\Longleftrightarrow");
defineSymbol(math, main, rel, "\u21a6", "\\mapsto");
defineSymbol(math, main, rel, "\u27fc", "\\longmapsto");
defineSymbol(math, main, rel, "\u2197", "\\nearrow");
defineSymbol(math, main, rel, "\u21a9", "\\hookleftarrow");
defineSymbol(math, main, rel, "\u21aa", "\\hookrightarrow");
defineSymbol(math, main, rel, "\u2198", "\\searrow");
defineSymbol(math, main, rel, "\u21bc", "\\leftharpoonup");
defineSymbol(math, main, rel, "\u21c0", "\\rightharpoonup");
defineSymbol(math, main, rel, "\u2199", "\\swarrow");
defineSymbol(math, main, rel, "\u21bd", "\\leftharpoondown");
defineSymbol(math, main, rel, "\u21c1", "\\rightharpoondown");
defineSymbol(math, main, rel, "\u2196", "\\nwarrow");
defineSymbol(math, main, rel, "\u21cc", "\\rightleftharpoons");

// AMS Negated Binary Relations
defineSymbol(math, ams, rel, "\u226e", "\\nless");
defineSymbol(math, ams, rel, "\ue010", "\\nleqslant");
defineSymbol(math, ams, rel, "\ue011", "\\nleqq");
defineSymbol(math, ams, rel, "\u2a87", "\\lneq");
defineSymbol(math, ams, rel, "\u2268", "\\lneqq");
defineSymbol(math, ams, rel, "\ue00c", "\\lvertneqq");
defineSymbol(math, ams, rel, "\u22e6", "\\lnsim");
defineSymbol(math, ams, rel, "\u2a89", "\\lnapprox");
defineSymbol(math, ams, rel, "\u2280", "\\nprec");
defineSymbol(math, ams, rel, "\u22e0", "\\npreceq");
defineSymbol(math, ams, rel, "\u22e8", "\\precnsim");
defineSymbol(math, ams, rel, "\u2ab9", "\\precnapprox");
defineSymbol(math, ams, rel, "\u2241", "\\nsim");
defineSymbol(math, ams, rel, "\ue006", "\\nshortmid");
defineSymbol(math, ams, rel, "\u2224", "\\nmid");
defineSymbol(math, ams, rel, "\u22ac", "\\nvdash");
defineSymbol(math, ams, rel, "\u22ad", "\\nvDash");
defineSymbol(math, ams, rel, "\u22ea", "\\ntriangleleft");
defineSymbol(math, ams, rel, "\u22ec", "\\ntrianglelefteq");
defineSymbol(math, ams, rel, "\u228a", "\\subsetneq");
defineSymbol(math, ams, rel, "\ue01a", "\\varsubsetneq");
defineSymbol(math, ams, rel, "\u2acb", "\\subsetneqq");
defineSymbol(math, ams, rel, "\ue017", "\\varsubsetneqq");
defineSymbol(math, ams, rel, "\u226f", "\\ngtr");
defineSymbol(math, ams, rel, "\ue00f", "\\ngeqslant");
defineSymbol(math, ams, rel, "\ue00e", "\\ngeqq");
defineSymbol(math, ams, rel, "\u2a88", "\\gneq");
defineSymbol(math, ams, rel, "\u2269", "\\gneqq");
defineSymbol(math, ams, rel, "\ue00d", "\\gvertneqq");
defineSymbol(math, ams, rel, "\u22e7", "\\gnsim");
defineSymbol(math, ams, rel, "\u2a8a", "\\gnapprox");
defineSymbol(math, ams, rel, "\u2281", "\\nsucc");
defineSymbol(math, ams, rel, "\u22e1", "\\nsucceq");
defineSymbol(math, ams, rel, "\u22e9", "\\succnsim");
defineSymbol(math, ams, rel, "\u2aba", "\\succnapprox");
defineSymbol(math, ams, rel, "\u2246", "\\ncong");
defineSymbol(math, ams, rel, "\ue007", "\\nshortparallel");
defineSymbol(math, ams, rel, "\u2226", "\\nparallel");
defineSymbol(math, ams, rel, "\u22af", "\\nVDash");
defineSymbol(math, ams, rel, "\u22eb", "\\ntriangleright");
defineSymbol(math, ams, rel, "\u22ed", "\\ntrianglerighteq");
defineSymbol(math, ams, rel, "\ue018", "\\nsupseteqq");
defineSymbol(math, ams, rel, "\u228b", "\\supsetneq");
defineSymbol(math, ams, rel, "\ue01b", "\\varsupsetneq");
defineSymbol(math, ams, rel, "\u2acc", "\\supsetneqq");
defineSymbol(math, ams, rel, "\ue019", "\\varsupsetneqq");
defineSymbol(math, ams, rel, "\u22ae", "\\nVdash");
defineSymbol(math, ams, rel, "\u2ab5", "\\precneqq");
defineSymbol(math, ams, rel, "\u2ab6", "\\succneqq");
defineSymbol(math, ams, rel, "\ue016", "\\nsubseteqq");
defineSymbol(math, ams, bin, "\u22b4", "\\unlhd");
defineSymbol(math, ams, bin, "\u22b5", "\\unrhd");

// AMS Negated Arrows
defineSymbol(math, ams, rel, "\u219a", "\\nleftarrow");
defineSymbol(math, ams, rel, "\u219b", "\\nrightarrow");
defineSymbol(math, ams, rel, "\u21cd", "\\nLeftarrow");
defineSymbol(math, ams, rel, "\u21cf", "\\nRightarrow");
defineSymbol(math, ams, rel, "\u21ae", "\\nleftrightarrow");
defineSymbol(math, ams, rel, "\u21ce", "\\nLeftrightarrow");

// AMS Misc
defineSymbol(math, ams, rel, "\u25b3", "\\vartriangle");
defineSymbol(math, ams, textord, "\u210f", "\\hslash");
defineSymbol(math, ams, textord, "\u25bd", "\\triangledown");
defineSymbol(math, ams, textord, "\u25ca", "\\lozenge");
defineSymbol(math, ams, textord, "\u24c8", "\\circledS");
defineSymbol(math, ams, textord, "\u00ae", "\\circledR");
defineSymbol(math, ams, textord, "\u2221", "\\measuredangle");
defineSymbol(math, ams, textord, "\u2204", "\\nexists");
defineSymbol(math, ams, textord, "\u2127", "\\mho");
defineSymbol(math, ams, textord, "\u2132", "\\Finv");
defineSymbol(math, ams, textord, "\u2141", "\\Game");
defineSymbol(math, ams, textord, "\u006b", "\\Bbbk");
defineSymbol(math, ams, textord, "\u2035", "\\backprime");
defineSymbol(math, ams, textord, "\u25b2", "\\blacktriangle");
defineSymbol(math, ams, textord, "\u25bc", "\\blacktriangledown");
defineSymbol(math, ams, textord, "\u25a0", "\\blacksquare");
defineSymbol(math, ams, textord, "\u29eb", "\\blacklozenge");
defineSymbol(math, ams, textord, "\u2605", "\\bigstar");
defineSymbol(math, ams, textord, "\u2222", "\\sphericalangle");
defineSymbol(math, ams, textord, "\u2201", "\\complement");
defineSymbol(math, ams, textord, "\u00f0", "\\eth");
defineSymbol(math, ams, textord, "\u2571", "\\diagup");
defineSymbol(math, ams, textord, "\u2572", "\\diagdown");
defineSymbol(math, ams, textord, "\u25a1", "\\square");
defineSymbol(math, ams, textord, "\u25a1", "\\Box");
defineSymbol(math, ams, textord, "\u25ca", "\\Diamond");
defineSymbol(math, ams, textord, "\u00a5", "\\yen");
defineSymbol(math, ams, textord, "\u2713", "\\checkmark");

// AMS Hebrew
defineSymbol(math, ams, textord, "\u2136", "\\beth");
defineSymbol(math, ams, textord, "\u2138", "\\daleth");
defineSymbol(math, ams, textord, "\u2137", "\\gimel");

// AMS Greek
defineSymbol(math, ams, textord, "\u03dd", "\\digamma");
defineSymbol(math, ams, textord, "\u03f0", "\\varkappa");

// AMS Delimiters
defineSymbol(math, ams, open, "\u250c", "\\ulcorner");
defineSymbol(math, ams, close, "\u2510", "\\urcorner");
defineSymbol(math, ams, open, "\u2514", "\\llcorner");
defineSymbol(math, ams, close, "\u2518", "\\lrcorner");

// AMS Binary Relations
defineSymbol(math, ams, rel, "\u2266", "\\leqq");
defineSymbol(math, ams, rel, "\u2a7d", "\\leqslant");
defineSymbol(math, ams, rel, "\u2a95", "\\eqslantless");
defineSymbol(math, ams, rel, "\u2272", "\\lesssim");
defineSymbol(math, ams, rel, "\u2a85", "\\lessapprox");
defineSymbol(math, ams, rel, "\u224a", "\\approxeq");
defineSymbol(math, ams, bin, "\u22d6", "\\lessdot");
defineSymbol(math, ams, rel, "\u22d8", "\\lll");
defineSymbol(math, ams, rel, "\u2276", "\\lessgtr");
defineSymbol(math, ams, rel, "\u22da", "\\lesseqgtr");
defineSymbol(math, ams, rel, "\u2a8b", "\\lesseqqgtr");
defineSymbol(math, ams, rel, "\u2251", "\\doteqdot");
defineSymbol(math, ams, rel, "\u2253", "\\risingdotseq");
defineSymbol(math, ams, rel, "\u2252", "\\fallingdotseq");
defineSymbol(math, ams, rel, "\u223d", "\\backsim");
defineSymbol(math, ams, rel, "\u22cd", "\\backsimeq");
defineSymbol(math, ams, rel, "\u2ac5", "\\subseteqq");
defineSymbol(math, ams, rel, "\u22d0", "\\Subset");
defineSymbol(math, ams, rel, "\u228f", "\\sqsubset");
defineSymbol(math, ams, rel, "\u227c", "\\preccurlyeq");
defineSymbol(math, ams, rel, "\u22de", "\\curlyeqprec");
defineSymbol(math, ams, rel, "\u227e", "\\precsim");
defineSymbol(math, ams, rel, "\u2ab7", "\\precapprox");
defineSymbol(math, ams, rel, "\u22b2", "\\vartriangleleft");
defineSymbol(math, ams, rel, "\u22b4", "\\trianglelefteq");
defineSymbol(math, ams, rel, "\u22a8", "\\vDash");
defineSymbol(math, ams, rel, "\u22aa", "\\Vvdash");
defineSymbol(math, ams, rel, "\u2323", "\\smallsmile");
defineSymbol(math, ams, rel, "\u2322", "\\smallfrown");
defineSymbol(math, ams, rel, "\u224f", "\\bumpeq");
defineSymbol(math, ams, rel, "\u224e", "\\Bumpeq");
defineSymbol(math, ams, rel, "\u2267", "\\geqq");
defineSymbol(math, ams, rel, "\u2a7e", "\\geqslant");
defineSymbol(math, ams, rel, "\u2a96", "\\eqslantgtr");
defineSymbol(math, ams, rel, "\u2273", "\\gtrsim");
defineSymbol(math, ams, rel, "\u2a86", "\\gtrapprox");
defineSymbol(math, ams, bin, "\u22d7", "\\gtrdot");
defineSymbol(math, ams, rel, "\u22d9", "\\ggg");
defineSymbol(math, ams, rel, "\u2277", "\\gtrless");
defineSymbol(math, ams, rel, "\u22db", "\\gtreqless");
defineSymbol(math, ams, rel, "\u2a8c", "\\gtreqqless");
defineSymbol(math, ams, rel, "\u2256", "\\eqcirc");
defineSymbol(math, ams, rel, "\u2257", "\\circeq");
defineSymbol(math, ams, rel, "\u225c", "\\triangleq");
defineSymbol(math, ams, rel, "\u223c", "\\thicksim");
defineSymbol(math, ams, rel, "\u2248", "\\thickapprox");
defineSymbol(math, ams, rel, "\u2ac6", "\\supseteqq");
defineSymbol(math, ams, rel, "\u22d1", "\\Supset");
defineSymbol(math, ams, rel, "\u2290", "\\sqsupset");
defineSymbol(math, ams, rel, "\u227d", "\\succcurlyeq");
defineSymbol(math, ams, rel, "\u22df", "\\curlyeqsucc");
defineSymbol(math, ams, rel, "\u227f", "\\succsim");
defineSymbol(math, ams, rel, "\u2ab8", "\\succapprox");
defineSymbol(math, ams, rel, "\u22b3", "\\vartriangleright");
defineSymbol(math, ams, rel, "\u22b5", "\\trianglerighteq");
defineSymbol(math, ams, rel, "\u22a9", "\\Vdash");
defineSymbol(math, ams, rel, "\u2223", "\\shortmid");
defineSymbol(math, ams, rel, "\u2225", "\\shortparallel");
defineSymbol(math, ams, rel, "\u226c", "\\between");
defineSymbol(math, ams, rel, "\u22d4", "\\pitchfork");
defineSymbol(math, ams, rel, "\u221d", "\\varpropto");
defineSymbol(math, ams, rel, "\u25c0", "\\blacktriangleleft");
defineSymbol(math, ams, rel, "\u2234", "\\therefore");
defineSymbol(math, ams, rel, "\u220d", "\\backepsilon");
defineSymbol(math, ams, rel, "\u25b6", "\\blacktriangleright");
defineSymbol(math, ams, rel, "\u2235", "\\because");
defineSymbol(math, ams, rel, "\u22d8", "\\llless");
defineSymbol(math, ams, rel, "\u22d9", "\\gggtr");
defineSymbol(math, ams, bin, "\u22b2", "\\lhd");
defineSymbol(math, ams, bin, "\u22b3", "\\rhd");
defineSymbol(math, ams, rel, "\u2242", "\\eqsim");
defineSymbol(math, main, rel, "\u22c8", "\\Join");
defineSymbol(math, ams, rel, "\u2251", "\\Doteq");

// AMS Binary Operators
defineSymbol(math, ams, bin, "\u2214", "\\dotplus");
defineSymbol(math, ams, bin, "\u2216", "\\smallsetminus");
defineSymbol(math, ams, bin, "\u22d2", "\\Cap");
defineSymbol(math, ams, bin, "\u22d3", "\\Cup");
defineSymbol(math, ams, bin, "\u2a5e", "\\doublebarwedge");
defineSymbol(math, ams, bin, "\u229f", "\\boxminus");
defineSymbol(math, ams, bin, "\u229e", "\\boxplus");
defineSymbol(math, ams, bin, "\u22c7", "\\divideontimes");
defineSymbol(math, ams, bin, "\u22c9", "\\ltimes");
defineSymbol(math, ams, bin, "\u22ca", "\\rtimes");
defineSymbol(math, ams, bin, "\u22cb", "\\leftthreetimes");
defineSymbol(math, ams, bin, "\u22cc", "\\rightthreetimes");
defineSymbol(math, ams, bin, "\u22cf", "\\curlywedge");
defineSymbol(math, ams, bin, "\u22ce", "\\curlyvee");
defineSymbol(math, ams, bin, "\u229d", "\\circleddash");
defineSymbol(math, ams, bin, "\u229b", "\\circledast");
defineSymbol(math, ams, bin, "\u22c5", "\\centerdot");
defineSymbol(math, ams, bin, "\u22ba", "\\intercal");
defineSymbol(math, ams, bin, "\u22d2", "\\doublecap");
defineSymbol(math, ams, bin, "\u22d3", "\\doublecup");
defineSymbol(math, ams, bin, "\u22a0", "\\boxtimes");

// AMS Arrows
defineSymbol(math, ams, rel, "\u21e2", "\\dashrightarrow");
defineSymbol(math, ams, rel, "\u21e0", "\\dashleftarrow");
defineSymbol(math, ams, rel, "\u21c7", "\\leftleftarrows");
defineSymbol(math, ams, rel, "\u21c6", "\\leftrightarrows");
defineSymbol(math, ams, rel, "\u21da", "\\Lleftarrow");
defineSymbol(math, ams, rel, "\u219e", "\\twoheadleftarrow");
defineSymbol(math, ams, rel, "\u21a2", "\\leftarrowtail");
defineSymbol(math, ams, rel, "\u21ab", "\\looparrowleft");
defineSymbol(math, ams, rel, "\u21cb", "\\leftrightharpoons");
defineSymbol(math, ams, rel, "\u21b6", "\\curvearrowleft");
defineSymbol(math, ams, rel, "\u21ba", "\\circlearrowleft");
defineSymbol(math, ams, rel, "\u21b0", "\\Lsh");
defineSymbol(math, ams, rel, "\u21c8", "\\upuparrows");
defineSymbol(math, ams, rel, "\u21bf", "\\upharpoonleft");
defineSymbol(math, ams, rel, "\u21c3", "\\downharpoonleft");
defineSymbol(math, ams, rel, "\u22b8", "\\multimap");
defineSymbol(math, ams, rel, "\u21ad", "\\leftrightsquigarrow");
defineSymbol(math, ams, rel, "\u21c9", "\\rightrightarrows");
defineSymbol(math, ams, rel, "\u21c4", "\\rightleftarrows");
defineSymbol(math, ams, rel, "\u21a0", "\\twoheadrightarrow");
defineSymbol(math, ams, rel, "\u21a3", "\\rightarrowtail");
defineSymbol(math, ams, rel, "\u21ac", "\\looparrowright");
defineSymbol(math, ams, rel, "\u21b7", "\\curvearrowright");
defineSymbol(math, ams, rel, "\u21bb", "\\circlearrowright");
defineSymbol(math, ams, rel, "\u21b1", "\\Rsh");
defineSymbol(math, ams, rel, "\u21ca", "\\downdownarrows");
defineSymbol(math, ams, rel, "\u21be", "\\upharpoonright");
defineSymbol(math, ams, rel, "\u21c2", "\\downharpoonright");
defineSymbol(math, ams, rel, "\u21dd", "\\rightsquigarrow");
defineSymbol(math, ams, rel, "\u21dd", "\\leadsto");
defineSymbol(math, ams, rel, "\u21db", "\\Rrightarrow");
defineSymbol(math, ams, rel, "\u21be", "\\restriction");

defineSymbol(math, main, textord, "\u2018", "`");
defineSymbol(math, main, textord, "$", "\\$");
defineSymbol(math, main, textord, "%", "\\%");
defineSymbol(math, main, textord, "_", "\\_");
defineSymbol(math, main, textord, "\u2220", "\\angle");
defineSymbol(math, main, textord, "\u221e", "\\infty");
defineSymbol(math, main, textord, "\u2032", "\\prime");
defineSymbol(math, main, textord, "\u25b3", "\\triangle");
defineSymbol(math, main, textord, "\u0393", "\\Gamma");
defineSymbol(math, main, textord, "\u0394", "\\Delta");
defineSymbol(math, main, textord, "\u0398", "\\Theta");
defineSymbol(math, main, textord, "\u039b", "\\Lambda");
defineSymbol(math, main, textord, "\u039e", "\\Xi");
defineSymbol(math, main, textord, "\u03a0", "\\Pi");
defineSymbol(math, main, textord, "\u03a3", "\\Sigma");
defineSymbol(math, main, textord, "\u03a5", "\\Upsilon");
defineSymbol(math, main, textord, "\u03a6", "\\Phi");
defineSymbol(math, main, textord, "\u03a8", "\\Psi");
defineSymbol(math, main, textord, "\u03a9", "\\Omega");
defineSymbol(math, main, textord, "\u00ac", "\\neg");
defineSymbol(math, main, textord, "\u00ac", "\\lnot");
defineSymbol(math, main, textord, "\u22a4", "\\top");
defineSymbol(math, main, textord, "\u22a5", "\\bot");
defineSymbol(math, main, textord, "\u2205", "\\emptyset");
defineSymbol(math, ams, textord, "\u2205", "\\varnothing");
defineSymbol(math, main, mathord, "\u03b1", "\\alpha");
defineSymbol(math, main, mathord, "\u03b2", "\\beta");
defineSymbol(math, main, mathord, "\u03b3", "\\gamma");
defineSymbol(math, main, mathord, "\u03b4", "\\delta");
defineSymbol(math, main, mathord, "\u03f5", "\\epsilon");
defineSymbol(math, main, mathord, "\u03b6", "\\zeta");
defineSymbol(math, main, mathord, "\u03b7", "\\eta");
defineSymbol(math, main, mathord, "\u03b8", "\\theta");
defineSymbol(math, main, mathord, "\u03b9", "\\iota");
defineSymbol(math, main, mathord, "\u03ba", "\\kappa");
defineSymbol(math, main, mathord, "\u03bb", "\\lambda");
defineSymbol(math, main, mathord, "\u03bc", "\\mu");
defineSymbol(math, main, mathord, "\u03bd", "\\nu");
defineSymbol(math, main, mathord, "\u03be", "\\xi");
defineSymbol(math, main, mathord, "o", "\\omicron");
defineSymbol(math, main, mathord, "\u03c0", "\\pi");
defineSymbol(math, main, mathord, "\u03c1", "\\rho");
defineSymbol(math, main, mathord, "\u03c3", "\\sigma");
defineSymbol(math, main, mathord, "\u03c4", "\\tau");
defineSymbol(math, main, mathord, "\u03c5", "\\upsilon");
defineSymbol(math, main, mathord, "\u03d5", "\\phi");
defineSymbol(math, main, mathord, "\u03c7", "\\chi");
defineSymbol(math, main, mathord, "\u03c8", "\\psi");
defineSymbol(math, main, mathord, "\u03c9", "\\omega");
defineSymbol(math, main, mathord, "\u03b5", "\\varepsilon");
defineSymbol(math, main, mathord, "\u03d1", "\\vartheta");
defineSymbol(math, main, mathord, "\u03d6", "\\varpi");
defineSymbol(math, main, mathord, "\u03f1", "\\varrho");
defineSymbol(math, main, mathord, "\u03c2", "\\varsigma");
defineSymbol(math, main, mathord, "\u03c6", "\\varphi");
defineSymbol(math, main, bin, "\u2217", "*");
defineSymbol(math, main, bin, "+", "+");
defineSymbol(math, main, bin, "\u2212", "-");
defineSymbol(math, main, bin, "\u22c5", "\\cdot");
defineSymbol(math, main, bin, "\u2218", "\\circ");
defineSymbol(math, main, bin, "\u00f7", "\\div");
defineSymbol(math, main, bin, "\u00b1", "\\pm");
defineSymbol(math, main, bin, "\u00d7", "\\times");
defineSymbol(math, main, bin, "\u2229", "\\cap");
defineSymbol(math, main, bin, "\u222a", "\\cup");
defineSymbol(math, main, bin, "\u2216", "\\setminus");
defineSymbol(math, main, bin, "\u2227", "\\land");
defineSymbol(math, main, bin, "\u2228", "\\lor");
defineSymbol(math, main, bin, "\u2227", "\\wedge");
defineSymbol(math, main, bin, "\u2228", "\\vee");
defineSymbol(math, main, textord, "\u221a", "\\surd");
defineSymbol(math, main, open, "(", "(");
defineSymbol(math, main, open, "[", "[");
defineSymbol(math, main, open, "\u27e8", "\\langle");
defineSymbol(math, main, open, "\u2223", "\\lvert");
defineSymbol(math, main, open, "\u2225", "\\lVert");
defineSymbol(math, main, close, ")", ")");
defineSymbol(math, main, close, "]", "]");
defineSymbol(math, main, close, "?", "?");
defineSymbol(math, main, close, "!", "!");
defineSymbol(math, main, close, "\u27e9", "\\rangle");
defineSymbol(math, main, close, "\u2223", "\\rvert");
defineSymbol(math, main, close, "\u2225", "\\rVert");
defineSymbol(math, main, rel, "=", "=");
defineSymbol(math, main, rel, "<", "<");
defineSymbol(math, main, rel, ">", ">");
defineSymbol(math, main, rel, ":", ":");
defineSymbol(math, main, rel, "\u2248", "\\approx");
defineSymbol(math, main, rel, "\u2245", "\\cong");
defineSymbol(math, main, rel, "\u2265", "\\ge");
defineSymbol(math, main, rel, "\u2265", "\\geq");
defineSymbol(math, main, rel, "\u2190", "\\gets");
defineSymbol(math, main, rel, ">", "\\gt");
defineSymbol(math, main, rel, "\u2208", "\\in");
defineSymbol(math, main, rel, "\u2209", "\\notin");
defineSymbol(math, main, rel, "\u2282", "\\subset");
defineSymbol(math, main, rel, "\u2283", "\\supset");
defineSymbol(math, main, rel, "\u2286", "\\subseteq");
defineSymbol(math, main, rel, "\u2287", "\\supseteq");
defineSymbol(math, ams, rel, "\u2288", "\\nsubseteq");
defineSymbol(math, ams, rel, "\u2289", "\\nsupseteq");
defineSymbol(math, main, rel, "\u22a8", "\\models");
defineSymbol(math, main, rel, "\u2190", "\\leftarrow");
defineSymbol(math, main, rel, "\u2264", "\\le");
defineSymbol(math, main, rel, "\u2264", "\\leq");
defineSymbol(math, main, rel, "<", "\\lt");
defineSymbol(math, main, rel, "\u2260", "\\ne");
defineSymbol(math, main, rel, "\u2260", "\\neq");
defineSymbol(math, main, rel, "\u2192", "\\rightarrow");
defineSymbol(math, main, rel, "\u2192", "\\to");
defineSymbol(math, ams, rel, "\u2271", "\\ngeq");
defineSymbol(math, ams, rel, "\u2270", "\\nleq");
defineSymbol(math, main, spacing, null, "\\!");
defineSymbol(math, main, spacing, "\u00a0", "\\ ");
defineSymbol(math, main, spacing, "\u00a0", "~");
defineSymbol(math, main, spacing, null, "\\,");
defineSymbol(math, main, spacing, null, "\\:");
defineSymbol(math, main, spacing, null, "\\;");
defineSymbol(math, main, spacing, null, "\\enspace");
defineSymbol(math, main, spacing, null, "\\qquad");
defineSymbol(math, main, spacing, null, "\\quad");
defineSymbol(math, main, spacing, "\u00a0", "\\space");
defineSymbol(math, main, punct, ",", ",");
defineSymbol(math, main, punct, ";", ";");
defineSymbol(math, main, punct, ":", "\\colon");
defineSymbol(math, ams, bin, "\u22bc", "\\barwedge");
defineSymbol(math, ams, bin, "\u22bb", "\\veebar");
defineSymbol(math, main, bin, "\u2299", "\\odot");
defineSymbol(math, main, bin, "\u2295", "\\oplus");
defineSymbol(math, main, bin, "\u2297", "\\otimes");
defineSymbol(math, main, textord, "\u2202", "\\partial");
defineSymbol(math, main, bin, "\u2298", "\\oslash");
defineSymbol(math, ams, bin, "\u229a", "\\circledcirc");
defineSymbol(math, ams, bin, "\u22a1", "\\boxdot");
defineSymbol(math, main, bin, "\u25b3", "\\bigtriangleup");
defineSymbol(math, main, bin, "\u25bd", "\\bigtriangledown");
defineSymbol(math, main, bin, "\u2020", "\\dagger");
defineSymbol(math, main, bin, "\u22c4", "\\diamond");
defineSymbol(math, main, bin, "\u22c6", "\\star");
defineSymbol(math, main, bin, "\u25c3", "\\triangleleft");
defineSymbol(math, main, bin, "\u25b9", "\\triangleright");
defineSymbol(math, main, open, "{", "\\{");
defineSymbol(math, main, close, "}", "\\}");
defineSymbol(math, main, open, "{", "\\lbrace");
defineSymbol(math, main, close, "}", "\\rbrace");
defineSymbol(math, main, open, "[", "\\lbrack");
defineSymbol(math, main, close, "]", "\\rbrack");
defineSymbol(math, main, open, "\u230a", "\\lfloor");
defineSymbol(math, main, close, "\u230b", "\\rfloor");
defineSymbol(math, main, open, "\u2308", "\\lceil");
defineSymbol(math, main, close, "\u2309", "\\rceil");
defineSymbol(math, main, textord, "\\", "\\backslash");
defineSymbol(math, main, textord, "\u2223", "|");
defineSymbol(math, main, textord, "\u2223", "\\vert");
defineSymbol(math, main, textord, "\u2225", "\\|");
defineSymbol(math, main, textord, "\u2225", "\\Vert");
defineSymbol(math, main, rel, "\u2191", "\\uparrow");
defineSymbol(math, main, rel, "\u21d1", "\\Uparrow");
defineSymbol(math, main, rel, "\u2193", "\\downarrow");
defineSymbol(math, main, rel, "\u21d3", "\\Downarrow");
defineSymbol(math, main, rel, "\u2195", "\\updownarrow");
defineSymbol(math, main, rel, "\u21d5", "\\Updownarrow");
defineSymbol(math, math, op, "\u2210", "\\coprod");
defineSymbol(math, math, op, "\u22c1", "\\bigvee");
defineSymbol(math, math, op, "\u22c0", "\\bigwedge");
defineSymbol(math, math, op, "\u2a04", "\\biguplus");
defineSymbol(math, math, op, "\u22c2", "\\bigcap");
defineSymbol(math, math, op, "\u22c3", "\\bigcup");
defineSymbol(math, math, op, "\u222b", "\\int");
defineSymbol(math, math, op, "\u222b", "\\intop");
defineSymbol(math, math, op, "\u222c", "\\iint");
defineSymbol(math, math, op, "\u222d", "\\iiint");
defineSymbol(math, math, op, "\u220f", "\\prod");
defineSymbol(math, math, op, "\u2211", "\\sum");
defineSymbol(math, math, op, "\u2a02", "\\bigotimes");
defineSymbol(math, math, op, "\u2a01", "\\bigoplus");
defineSymbol(math, math, op, "\u2a00", "\\bigodot");
defineSymbol(math, math, op, "\u222e", "\\oint");
defineSymbol(math, math, op, "\u2a06", "\\bigsqcup");
defineSymbol(math, math, op, "\u222b", "\\smallint");
defineSymbol(math, main, inner, "\u2026", "\\ldots");
defineSymbol(math, main, inner, "\u22ef", "\\cdots");
defineSymbol(math, main, inner, "\u22f1", "\\ddots");
defineSymbol(math, main, textord, "\u22ee", "\\vdots");
defineSymbol(math, main, accent, "\u00b4", "\\acute");
defineSymbol(math, main, accent, "\u0060", "\\grave");
defineSymbol(math, main, accent, "\u00a8", "\\ddot");
defineSymbol(math, main, accent, "\u007e", "\\tilde");
defineSymbol(math, main, accent, "\u00af", "\\bar");
defineSymbol(math, main, accent, "\u02d8", "\\breve");
defineSymbol(math, main, accent, "\u02c7", "\\check");
defineSymbol(math, main, accent, "\u005e", "\\hat");
defineSymbol(math, main, accent, "\u20d7", "\\vec");
defineSymbol(math, main, accent, "\u02d9", "\\dot");
defineSymbol(math, main, mathord, "\u0131", "\\imath");
defineSymbol(math, main, mathord, "\u0237", "\\jmath");

defineSymbol(text, main, spacing, "\u00a0", "\\ ");
defineSymbol(text, main, spacing, "\u00a0", " ");
defineSymbol(text, main, spacing, "\u00a0", "~");

// There are lots of symbols which are the same, so we add them in afterwards.
var i;
var ch;

// All of these are textords in math mode
var mathTextSymbols = "0123456789/@.\"";
for (i = 0; i < mathTextSymbols.length; i++) {
    ch = mathTextSymbols.charAt(i);
    defineSymbol(math, main, textord, ch, ch);
}

// All of these are textords in text mode
var textSymbols = "0123456789`!@*()-=+[]'\";:?/.,";
for (i = 0; i < textSymbols.length; i++) {
    ch = textSymbols.charAt(i);
    defineSymbol(text, main, textord, ch, ch);
}

// All of these are textords in text mode, and mathords in math mode
var letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
for (i = 0; i < letters.length; i++) {
    ch = letters.charAt(i);
    defineSymbol(math, main, mathord, ch, ch);
    defineSymbol(text, main, textord, ch, ch);
}

},{}],29:[function(require,module,exports){
/**
 * This file contains a list of utility functions which are useful in other
 * files.
 */

/**
 * Provide an `indexOf` function which works in IE8, but defers to native if
 * possible.
 */
var nativeIndexOf = Array.prototype.indexOf;
var indexOf = function(list, elem) {
    if (list == null) {
        return -1;
    }
    if (nativeIndexOf && list.indexOf === nativeIndexOf) {
        return list.indexOf(elem);
    }
    var i = 0;
    var l = list.length;
    for (; i < l; i++) {
        if (list[i] === elem) {
            return i;
        }
    }
    return -1;
};

/**
 * Return whether an element is contained in a list
 */
var contains = function(list, elem) {
    return indexOf(list, elem) !== -1;
};

/**
 * Provide a default value if a setting is undefined
 */
var deflt = function(setting, defaultIfUndefined) {
    return setting === undefined ? defaultIfUndefined : setting;
};

// hyphenate and escape adapted from Facebook's React under Apache 2 license

var uppercase = /([A-Z])/g;
var hyphenate = function(str) {
    return str.replace(uppercase, "-$1").toLowerCase();
};

var ESCAPE_LOOKUP = {
    "&": "&amp;",
    ">": "&gt;",
    "<": "&lt;",
    "\"": "&quot;",
    "'": "&#x27;",
};

var ESCAPE_REGEX = /[&><"']/g;

function escaper(match) {
    return ESCAPE_LOOKUP[match];
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escape(text) {
    return ("" + text).replace(ESCAPE_REGEX, escaper);
}

/**
 * A function to set the text content of a DOM element in all supported
 * browsers. Note that we don't define this if there is no document.
 */
var setTextContent;
if (typeof document !== "undefined") {
    var testNode = document.createElement("span");
    if ("textContent" in testNode) {
        setTextContent = function(node, text) {
            node.textContent = text;
        };
    } else {
        setTextContent = function(node, text) {
            node.innerText = text;
        };
    }
}

/**
 * A function to clear a node.
 */
function clearNode(node) {
    setTextContent(node, "");
}

module.exports = {
    contains: contains,
    deflt: deflt,
    escape: escape,
    hyphenate: hyphenate,
    indexOf: indexOf,
    setTextContent: setTextContent,
    clearNode: clearNode,
};

},{}],30:[function(require,module,exports){
(function (global){

/*
 * Konva JavaScript Framework v0.12.4
 * http://konvajs.github.io/
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: Tue Apr 19 2016
 *
 * Original work Copyright (C) 2011 - 2013 by Eric Rowell (KineticJS)
 * Modified work Copyright (C) 2014 - 2015 by Anton Lavrenov (Konva)
 *
 * @license
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// runtime check for already included Konva
(function(global){
    'use strict';
    /**
     * @namespace Konva
     */

    var PI_OVER_180 = Math.PI / 180;

    var Konva = {
        // public
        version: '0.12.4',

        // private
        stages: [],
        idCounter: 0,
        ids: {},
        names: {},
        shapes: {},
        listenClickTap: false,
        inDblClickWindow: false,

        // configurations
        enableTrace: false,
        traceArrMax: 100,
        dblClickWindow: 400,
        /**
         * Global pixel ratio configuration. KonvaJS automatically detect pixel ratio of current device.
         * But you may override such property, if you want to use your value.
         * @property pixelRatio
         * @default undefined
         * @memberof Konva
         * @example
         * Konva.pixelRatio = 1;
         */
        pixelRatio: undefined,
        /**
         * Drag distance property. If you start to drag a node you may want to wait until pointer is moved to some distance from start point,
         * only then start dragging.
         * @property dragDistance
         * @default 0
         * @memberof Konva
         * @example
         * Konva.dragDistance = 10;
         */
        dragDistance: 0,
        /**
         * Use degree values for angle properties. You may set this property to false if you want to use radiant values.
         * @property angleDeg
         * @default true
         * @memberof Konva
         * @example
         * node.rotation(45); // 45 degrees
         * Konva.angleDeg = false;
         * node.rotation(Math.PI / 2); // PI/2 radian
         */
        angleDeg: true,
         /**
         * Show different warnings about errors or wrong API usage
         * @property showWarnings
         * @default true
         * @memberof Konva
         * @example
         * Konva.showWarnings = false;
         */
        showWarnings: true,



        /**
         * @namespace Filters
         * @memberof Konva
         */
        Filters: {},

        /**
         * returns whether or not drag and drop is currently active
         * @method
         * @memberof Konva
         */
        isDragging: function() {
            var dd = Konva.DD;

            // if DD is not included with the build, then
            // drag and drop is not even possible
            if (dd) {
                return dd.isDragging;
            }
            return false;
        },
        /**
        * returns whether or not a drag and drop operation is ready, but may
        *  not necessarily have started
        * @method
        * @memberof Konva
        */
        isDragReady: function() {
            var dd = Konva.DD;

            // if DD is not included with the build, then
            // drag and drop is not even possible
            if (dd) {
                return !!dd.node;
            }
            return false;
        },
        _addId: function(node, id) {
            if(id !== undefined) {
                this.ids[id] = node;
            }
        },
        _removeId: function(id) {
            if(id !== undefined) {
                delete this.ids[id];
            }
        },
        _addName: function(node, name) {
            if(name) {
                if(!this.names[name]) {
                    this.names[name] = [];
                }
                this.names[name].push(node);
            }
        },
        _removeName: function(name, _id) {
            if(!name) {
                return;
            }
            var nodes = this.names[name];
            if(!nodes) {
                return;
            }
            for(var n = 0; n < nodes.length; n++) {
                var no = nodes[n];
                if(no._id === _id) {
                    nodes.splice(n, 1);
                }
            }
            if(nodes.length === 0) {
                delete this.names[name];
            }
        },
        getAngle: function(angle) {
            return this.angleDeg ? angle * PI_OVER_180 : angle;
        },
        _parseUA: function(userAgent) {
            var ua = userAgent.toLowerCase(),
                // jQuery UA regex
                match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
                /(msie) ([\w.]+)/.exec( ua ) ||
                ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
                [],

                // adding mobile flag as well
                mobile = !!(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)),
                ieMobile = !!(userAgent.match(/IEMobile/i));

            return {
                browser: match[ 1 ] || '',
                version: match[ 2 ] || '0',

                // adding mobile flab
                mobile: mobile,
                ieMobile: ieMobile  // If this is true (i.e., WP8), then Konva touch events are executed instead of equivalent Konva mouse events
            };
        },
        // user agent
        UA: undefined
    };

    var glob =
        typeof window !== 'undefined' ? window :
        typeof global !== 'undefined' ? global :
        typeof WorkerGlobalScope !== 'undefined' ? self : {};


    Konva.UA = Konva._parseUA((glob.navigator && glob.navigator.userAgent) || '');

    if (glob.Konva) {
        console.error(
            'Konva instance is already exist in current eviroment. ' +
            'Please use only one instance.'
        );
    }
    glob.Konva = Konva;
    Konva.global = glob;


    if( typeof exports === 'object') {
        // runtime-check for browserify and nw.js (node-webkit)
        if(glob.window && glob.window.document) {
            Konva.document = glob.window.document;
            Konva.window = glob.window;
        } else {
            // Node. Does not work with strict CommonJS, but
            // only CommonJS-like enviroments that support module.exports,
            // like Node.
            var Canvas = require('canvas');
            var jsdom = require('jsdom').jsdom;

            Konva.document = jsdom('<!DOCTYPE html><html><head></head><body></body></html>');
            Konva.window = Konva.document.parentWindow;
            Konva.window.Image = Canvas.Image;
            Konva._nodeCanvas = Canvas;
        }
        module.exports = Konva;
        return;
    }
    else if( typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function() {
            return Konva;
        });
    }
    Konva.document = document;
    Konva.window = window;
})(typeof window !== 'undefined' ? window : global);

/*eslint-disable  eqeqeq, no-cond-assign, no-empty*/
(function() {
    'use strict';
    /**
     * Collection constructor.  Collection extends
     *  Array.  This class is used in conjunction with {@link Konva.Container#get}
     * @constructor
     * @memberof Konva
     */
    Konva.Collection = function() {
        var args = [].slice.call(arguments), length = args.length, i = 0;

        this.length = length;
        for(; i < length; i++) {
            this[i] = args[i];
        }
        return this;
    };
    Konva.Collection.prototype = [];
    /**
     * iterate through node array and run a function for each node.
     *  The node and index is passed into the function
     * @method
     * @memberof Konva.Collection.prototype
     * @param {Function} func
     * @example
     * // get all nodes with name foo inside layer, and set x to 10 for each
     * layer.get('.foo').each(function(shape, n) {
     *   shape.setX(10);
     * });
     */
    Konva.Collection.prototype.each = function(func) {
        for(var n = 0; n < this.length; n++) {
            func(this[n], n);
        }
    };
    /**
     * convert collection into an array
     * @method
     * @memberof Konva.Collection.prototype
     */
    Konva.Collection.prototype.toArray = function() {
        var arr = [],
            len = this.length,
            n;

        for(n = 0; n < len; n++) {
            arr.push(this[n]);
        }
        return arr;
    };
    /**
     * convert array into a collection
     * @method
     * @memberof Konva.Collection
     * @param {Array} arr
     */
    Konva.Collection.toCollection = function(arr) {
        var collection = new Konva.Collection(),
            len = arr.length,
            n;

        for(n = 0; n < len; n++) {
            collection.push(arr[n]);
        }
        return collection;
    };

    // map one method by it's name
    Konva.Collection._mapMethod = function(methodName) {
        Konva.Collection.prototype[methodName] = function() {
            var len = this.length,
                i;

            var args = [].slice.call(arguments);
            for(i = 0; i < len; i++) {
                this[i][methodName].apply(this[i], args);
            }

            return this;
        };
    };

    Konva.Collection.mapMethods = function(constructor) {
        var prot = constructor.prototype;
        for(var methodName in prot) {
            Konva.Collection._mapMethod(methodName);
        }
    };

    /*
    * Last updated November 2011
    * By Simon Sarris
    * www.simonsarris.com
    * sarris@acm.org
    *
    * Free to use and distribute at will
    * So long as you are nice to people, etc
    */

    /*
    * The usage of this class was inspired by some of the work done by a forked
    * project, KineticJS-Ext by Wappworks, which is based on Simon's Transform
    * class.  Modified by Eric Rowell
    */

    /**
     * Transform constructor
     * @constructor
     * @param {Array} [m] Optional six-element matrix
     * @memberof Konva
     */
    Konva.Transform = function(m) {
        this.m = (m && m.slice()) || [1, 0, 0, 1, 0, 0];
    };

    Konva.Transform.prototype = {
        /**
         * Copy Konva.Transform object
         * @method
         * @memberof Konva.Transform.prototype
         * @returns {Konva.Transform}
         */
        copy: function() {
            return new Konva.Transform(this.m);
        },
        /**
         * Transform point
         * @method
         * @memberof Konva.Transform.prototype
         * @param {Object} point 2D point(x, y)
         * @returns {Object} 2D point(x, y)
         */
        point: function(point) {
            var m = this.m;
            return {
                x: m[0] * point.x + m[2] * point.y + m[4],
                y: m[1] * point.x + m[3] * point.y + m[5]
            };
        },
        /**
         * Apply translation
         * @method
         * @memberof Konva.Transform.prototype
         * @param {Number} x
         * @param {Number} y
         * @returns {Konva.Transform}
         */
        translate: function(x, y) {
            this.m[4] += this.m[0] * x + this.m[2] * y;
            this.m[5] += this.m[1] * x + this.m[3] * y;
            return this;
        },
        /**
         * Apply scale
         * @method
         * @memberof Konva.Transform.prototype
         * @param {Number} sx
         * @param {Number} sy
         * @returns {Konva.Transform}
         */
        scale: function(sx, sy) {
            this.m[0] *= sx;
            this.m[1] *= sx;
            this.m[2] *= sy;
            this.m[3] *= sy;
            return this;
        },
        /**
         * Apply rotation
         * @method
         * @memberof Konva.Transform.prototype
         * @param {Number} rad  Angle in radians
         * @returns {Konva.Transform}
         */
        rotate: function(rad) {
            var c = Math.cos(rad);
            var s = Math.sin(rad);
            var m11 = this.m[0] * c + this.m[2] * s;
            var m12 = this.m[1] * c + this.m[3] * s;
            var m21 = this.m[0] * -s + this.m[2] * c;
            var m22 = this.m[1] * -s + this.m[3] * c;
            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
            return this;
        },
        /**
         * Returns the translation
         * @method
         * @memberof Konva.Transform.prototype
         * @returns {Object} 2D point(x, y)
         */
        getTranslation: function() {
            return {
                x: this.m[4],
                y: this.m[5]
            };
        },
        /**
         * Apply skew
         * @method
         * @memberof Konva.Transform.prototype
         * @param {Number} sx
         * @param {Number} sy
         * @returns {Konva.Transform}
         */
        skew: function(sx, sy) {
            var m11 = this.m[0] + this.m[2] * sy;
            var m12 = this.m[1] + this.m[3] * sy;
            var m21 = this.m[2] + this.m[0] * sx;
            var m22 = this.m[3] + this.m[1] * sx;
            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
            return this;
         },
        /**
         * Transform multiplication
         * @method
         * @memberof Konva.Transform.prototype
         * @param {Konva.Transform} matrix
         * @returns {Konva.Transform}
         */
        multiply: function(matrix) {
            var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
            var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

            var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
            var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

            var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
            var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
            this.m[4] = dx;
            this.m[5] = dy;
            return this;
        },
        /**
         * Invert the matrix
         * @method
         * @memberof Konva.Transform.prototype
         * @returns {Konva.Transform}
         */
        invert: function() {
            var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
            var m0 = this.m[3] * d;
            var m1 = -this.m[1] * d;
            var m2 = -this.m[2] * d;
            var m3 = this.m[0] * d;
            var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
            var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
            this.m[0] = m0;
            this.m[1] = m1;
            this.m[2] = m2;
            this.m[3] = m3;
            this.m[4] = m4;
            this.m[5] = m5;
            return this;
        },
        /**
         * return matrix
         * @method
         * @memberof Konva.Transform.prototype
         */
        getMatrix: function() {
            return this.m;
        },
        /**
         * set to absolute position via translation
         * @method
         * @memberof Konva.Transform.prototype
         * @returns {Konva.Transform}
         * @author ericdrowell
         */
        setAbsolutePosition: function(x, y) {
            var m0 = this.m[0],
                m1 = this.m[1],
                m2 = this.m[2],
                m3 = this.m[3],
                m4 = this.m[4],
                m5 = this.m[5],
                yt = ((m0 * (y - m5)) - (m1 * (x - m4))) / ((m0 * m3) - (m1 * m2)),
                xt = (x - m4 - (m2 * yt)) / m0;

            return this.translate(xt, yt);
        }
    };

    // CONSTANTS
    var CONTEXT_2D = '2d',
        OBJECT_ARRAY = '[object Array]',
        OBJECT_NUMBER = '[object Number]',
        OBJECT_STRING = '[object String]',
        PI_OVER_DEG180 = Math.PI / 180,
        DEG180_OVER_PI = 180 / Math.PI,
        HASH = '#',
        EMPTY_STRING = '',
        ZERO = '0',
        KONVA_WARNING = 'Konva warning: ',
        KONVA_ERROR = 'Konva error: ',
        RGB_PAREN = 'rgb(',
        COLORS = {
            aliceblue: [240, 248, 255],
            antiquewhite: [250, 235, 215],
            aqua: [0, 255, 255],
            aquamarine: [127, 255, 212],
            azure: [240, 255, 255],
            beige: [245, 245, 220],
            bisque: [255, 228, 196],
            black: [0, 0, 0],
            blanchedalmond: [255, 235, 205],
            blue: [0, 0, 255],
            blueviolet: [138, 43, 226],
            brown: [165, 42, 42],
            burlywood: [222, 184, 135],
            cadetblue: [95, 158, 160],
            chartreuse: [127, 255, 0],
            chocolate: [210, 105, 30],
            coral: [255, 127, 80],
            cornflowerblue: [100, 149, 237],
            cornsilk: [255, 248, 220],
            crimson: [220, 20, 60],
            cyan: [0, 255, 255],
            darkblue: [0, 0, 139],
            darkcyan: [0, 139, 139],
            darkgoldenrod: [184, 132, 11],
            darkgray: [169, 169, 169],
            darkgreen: [0, 100, 0],
            darkgrey: [169, 169, 169],
            darkkhaki: [189, 183, 107],
            darkmagenta: [139, 0, 139],
            darkolivegreen: [85, 107, 47],
            darkorange: [255, 140, 0],
            darkorchid: [153, 50, 204],
            darkred: [139, 0, 0],
            darksalmon: [233, 150, 122],
            darkseagreen: [143, 188, 143],
            darkslateblue: [72, 61, 139],
            darkslategray: [47, 79, 79],
            darkslategrey: [47, 79, 79],
            darkturquoise: [0, 206, 209],
            darkviolet: [148, 0, 211],
            deeppink: [255, 20, 147],
            deepskyblue: [0, 191, 255],
            dimgray: [105, 105, 105],
            dimgrey: [105, 105, 105],
            dodgerblue: [30, 144, 255],
            firebrick: [178, 34, 34],
            floralwhite: [255, 255, 240],
            forestgreen: [34, 139, 34],
            fuchsia: [255, 0, 255],
            gainsboro: [220, 220, 220],
            ghostwhite: [248, 248, 255],
            gold: [255, 215, 0],
            goldenrod: [218, 165, 32],
            gray: [128, 128, 128],
            green: [0, 128, 0],
            greenyellow: [173, 255, 47],
            grey: [128, 128, 128],
            honeydew: [240, 255, 240],
            hotpink: [255, 105, 180],
            indianred: [205, 92, 92],
            indigo: [75, 0, 130],
            ivory: [255, 255, 240],
            khaki: [240, 230, 140],
            lavender: [230, 230, 250],
            lavenderblush: [255, 240, 245],
            lawngreen: [124, 252, 0],
            lemonchiffon: [255, 250, 205],
            lightblue: [173, 216, 230],
            lightcoral: [240, 128, 128],
            lightcyan: [224, 255, 255],
            lightgoldenrodyellow: [250, 250, 210],
            lightgray: [211, 211, 211],
            lightgreen: [144, 238, 144],
            lightgrey: [211, 211, 211],
            lightpink: [255, 182, 193],
            lightsalmon: [255, 160, 122],
            lightseagreen: [32, 178, 170],
            lightskyblue: [135, 206, 250],
            lightslategray: [119, 136, 153],
            lightslategrey: [119, 136, 153],
            lightsteelblue: [176, 196, 222],
            lightyellow: [255, 255, 224],
            lime: [0, 255, 0],
            limegreen: [50, 205, 50],
            linen: [250, 240, 230],
            magenta: [255, 0, 255],
            maroon: [128, 0, 0],
            mediumaquamarine: [102, 205, 170],
            mediumblue: [0, 0, 205],
            mediumorchid: [186, 85, 211],
            mediumpurple: [147, 112, 219],
            mediumseagreen: [60, 179, 113],
            mediumslateblue: [123, 104, 238],
            mediumspringgreen: [0, 250, 154],
            mediumturquoise: [72, 209, 204],
            mediumvioletred: [199, 21, 133],
            midnightblue: [25, 25, 112],
            mintcream: [245, 255, 250],
            mistyrose: [255, 228, 225],
            moccasin: [255, 228, 181],
            navajowhite: [255, 222, 173],
            navy: [0, 0, 128],
            oldlace: [253, 245, 230],
            olive: [128, 128, 0],
            olivedrab: [107, 142, 35],
            orange: [255, 165, 0],
            orangered: [255, 69, 0],
            orchid: [218, 112, 214],
            palegoldenrod: [238, 232, 170],
            palegreen: [152, 251, 152],
            paleturquoise: [175, 238, 238],
            palevioletred: [219, 112, 147],
            papayawhip: [255, 239, 213],
            peachpuff: [255, 218, 185],
            peru: [205, 133, 63],
            pink: [255, 192, 203],
            plum: [221, 160, 203],
            powderblue: [176, 224, 230],
            purple: [128, 0, 128],
            rebeccapurple: [102, 51, 153],
            red: [255, 0, 0],
            rosybrown: [188, 143, 143],
            royalblue: [65, 105, 225],
            saddlebrown: [139, 69, 19],
            salmon: [250, 128, 114],
            sandybrown: [244, 164, 96],
            seagreen: [46, 139, 87],
            seashell: [255, 245, 238],
            sienna: [160, 82, 45],
            silver: [192, 192, 192],
            skyblue: [135, 206, 235],
            slateblue: [106, 90, 205],
            slategray: [119, 128, 144],
            slategrey: [119, 128, 144],
            snow: [255, 255, 250],
            springgreen: [0, 255, 127],
            steelblue: [70, 130, 180],
            tan: [210, 180, 140],
            teal: [0, 128, 128],
            thistle: [216, 191, 216],
            transparent: [255, 255, 255, 0],
            tomato: [255, 99, 71],
            turquoise: [64, 224, 208],
            violet: [238, 130, 238],
            wheat: [245, 222, 179],
            white: [255, 255, 255],
            whitesmoke: [245, 245, 245],
            yellow: [255, 255, 0],
            yellowgreen: [154, 205, 5]
        },

        RGB_REGEX = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;

    /**
     * @namespace Util
     * @memberof Konva
     */
    Konva.Util = {
        /*
         * cherry-picked utilities from underscore.js
         */
        _isElement: function(obj) {
            return !!(obj && obj.nodeType == 1);
        },
        _isFunction: function(obj) {
            return !!(obj && obj.constructor && obj.call && obj.apply);
        },
        _isObject: function(obj) {
            return (!!obj && obj.constructor === Object);
        },
        _isArray: function(obj) {
            return Object.prototype.toString.call(obj) === OBJECT_ARRAY;
        },
        _isNumber: function(obj) {
            return Object.prototype.toString.call(obj) === OBJECT_NUMBER;
        },
        _isString: function(obj) {
            return Object.prototype.toString.call(obj) === OBJECT_STRING;
        },
        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time. Normally, the throttled function will run
        // as much as it can, without ever going more than once per `wait` duration;
        // but if you'd like to disable the execution on the leading edge, pass
        // `{leading: false}`. To disable execution on the trailing edge, ditto.
        _throttle: function(func, wait, opts) {
            var context, args, result;
            var timeout = null;
            var previous = 0;
            var options = opts || {};
            var later = function() {
                previous = options.leading === false ? 0 : new Date().getTime();
                timeout = null;
                result = func.apply(context, args);
                context = args = null;
            };
            return function() {
                var now = new Date().getTime();
                if (!previous && options.leading === false) {
                    previous = now;
                }
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                  clearTimeout(timeout);
                  timeout = null;
                  previous = now;
                  result = func.apply(context, args);
                  context = args = null;
                } else if (!timeout && options.trailing !== false) {
                  timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        /*
         * other utils
         */
        _hasMethods: function(obj) {
            var names = [],
                key;

            for(key in obj) {
                if (!obj.hasOwnProperty(key)) {
                    continue;
                }
                if(this._isFunction(obj[key])) {
                    names.push(key);
                }
            }
            return names.length > 0;
        },
        isValidSelector: function(selector) {
            if (typeof selector !== 'string') {
                return false;
            }
            var firstChar = selector[0];
            return firstChar === '#' || firstChar === '.' || firstChar === firstChar.toUpperCase();
        },
        createCanvasElement: function() {
            var canvas = Konva.document.createElement('canvas');
            // on some environments canvas.style is readonly
            try {
                canvas.style = canvas.style || {};
            } catch (e) {
            }
            return canvas;
        },
        isBrowser: function() {
            return (typeof exports !== 'object');
        },
        _isInDocument: function(el) {
            while(el = el.parentNode) {
                if(el == Konva.document) {
                    return true;
                }
            }
            return false;
        },
        _simplifyArray: function(arr) {
            var retArr = [],
                len = arr.length,
                util = Konva.Util,
                n, val;

            for (n = 0; n < len; n++) {
                val = arr[n];
                if (util._isNumber(val)) {
                    val = Math.round(val * 1000) / 1000;
                }
                else if (!util._isString(val)) {
                    val = val.toString();
                }

                retArr.push(val);
            }

            return retArr;
        },
        /*
         * arg can be an image object or image data
         */
        _getImage: function(arg, callback) {
            var imageObj, canvas;

            // if arg is null or undefined
            if(!arg) {
                callback(null);
            }

            // if arg is already an image object
            else if(this._isElement(arg)) {
                callback(arg);
            }

            // if arg is a string, then it's a data url
            else if(this._isString(arg)) {
                imageObj = new Konva.window.Image();
                imageObj.onload = function() {
                    callback(imageObj);
                };
                imageObj.src = arg;
            }

            //if arg is an object that contains the data property, it's an image object
            else if(arg.data) {
                canvas = Konva.Util.createCanvasElement();
                canvas.width = arg.width;
                canvas.height = arg.height;
                var _context = canvas.getContext(CONTEXT_2D);
                _context.putImageData(arg, 0, 0);
                this._getImage(canvas.toDataURL(), callback);
            }
            else {
                callback(null);
            }
        },
        _getRGBAString: function(obj) {
            var red = obj.red || 0,
                green = obj.green || 0,
                blue = obj.blue || 0,
                alpha = obj.alpha || 1;

            return [
                'rgba(',
                red,
                ',',
                green,
                ',',
                blue,
                ',',
                alpha,
                ')'
            ].join(EMPTY_STRING);
        },
        _rgbToHex: function(r, g, b) {
            return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        _hexToRgb: function(hex) {
            hex = hex.replace(HASH, EMPTY_STRING);
            var bigint = parseInt(hex, 16);
            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255
            };
        },
        /**
         * return random hex color
         * @method
         * @memberof Konva.Util.prototype
         */
        getRandomColor: function() {
            var randColor = (Math.random() * 0xFFFFFF << 0).toString(16);
            while (randColor.length < 6) {
                randColor = ZERO + randColor;
            }
            return HASH + randColor;
        },
        /**
         * return value with default fallback
         * @method
         * @memberof Konva.Util.prototype
         */
        get: function(val, def) {
            if (val === undefined) {
                return def;
            }
            else {
                return val;
            }
        },
        /**
         * get RGB components of a color
         * @method
         * @memberof Konva.Util.prototype
         * @param {String} color
         * @example
         * // each of the following examples return {r:0, g:0, b:255}
         * var rgb = Konva.Util.getRGB('blue');
         * var rgb = Konva.Util.getRGB('#0000ff');
         * var rgb = Konva.Util.getRGB('rgb(0,0,255)');
         */
        getRGB: function(color) {
            var rgb;
            // color string
            if (color in COLORS) {
                rgb = COLORS[color];
                return {
                    r: rgb[0],
                    g: rgb[1],
                    b: rgb[2]
                };
            }
            // hex
            else if (color[0] === HASH) {
                return this._hexToRgb(color.substring(1));
            }
            // rgb string
            else if (color.substr(0, 4) === RGB_PAREN) {
                rgb = RGB_REGEX.exec(color.replace(/ /g, ''));
                return {
                    r: parseInt(rgb[1], 10),
                    g: parseInt(rgb[2], 10),
                    b: parseInt(rgb[3], 10)
                };
            }
            // default
            else {
                return {
                    r: 0,
                    g: 0,
                    b: 0
                };
            }
        },
        // convert any color string to RGBA object
        // from https://github.com/component/color-parser
        colorToRGBA: function(str) {
            str = str || 'black';
            return Konva.Util._namedColorToRBA(str)
                || Konva.Util._hex3ColorToRGBA(str)
                || Konva.Util._hex6ColorToRGBA(str)
                || Konva.Util._rgbColorToRGBA(str)
                || Konva.Util._rgbaColorToRGBA(str);
        },
        // Parse named css color. Like "green"
        _namedColorToRBA: function(str) {
            var c = COLORS[str.toLowerCase()];
            if (!c) {
                return null;
            }
            return {
                r: c[0],
                g: c[1],
                b: c[2],
                a: 1
            };
        },
        // Parse rgb(n, n, n)
        _rgbColorToRGBA: function(str) {
            if (str.indexOf('rgb(') === 0) {
                str = str.match(/rgb\(([^)]+)\)/)[1];
                var parts = str.split(/ *, */).map(Number);
                return {
                    r: parts[0],
                    g: parts[1],
                    b: parts[2],
                    a: 1
                };
            }
        },
        // Parse rgba(n, n, n, n)
        _rgbaColorToRGBA: function(str) {
            if (str.indexOf('rgba(') === 0) {
                str = str.match(/rgba\(([^)]+)\)/)[1];
                var parts = str.split(/ *, */).map(Number);
                return {
                    r: parts[0],
                    g: parts[1],
                    b: parts[2],
                    a: parts[3]
                };
            }

        },
        // Parse #nnnnnn
        _hex6ColorToRGBA: function(str) {
            if ((str[0] === '#') && (str.length === 7)) {
                return {
                    r: parseInt(str.slice(1, 3), 16),
                    g: parseInt(str.slice(3, 5), 16),
                    b: parseInt(str.slice(5, 7), 16),
                    a: 1
                };
            }
        },
        // Parse #nnn
        _hex3ColorToRGBA: function(str) {
            if ((str[0] === '#') && (str.length === 4)) {
                return {
                    r: parseInt(str[1] + str[1], 16),
                    g: parseInt(str[2] + str[2], 16),
                    b: parseInt(str[3] + str[3], 16),
                    a: 1
                };
            }
        },
        // o1 takes precedence over o2
        _merge: function(o1, o2) {
            var retObj = this._clone(o2);
            for(var key in o1) {
                if(this._isObject(o1[key])) {
                    retObj[key] = this._merge(o1[key], retObj[key]);
                }
                else {
                    retObj[key] = o1[key];
                }
            }
            return retObj;
        },
        cloneObject: function(obj) {
            var retObj = {};
            for(var key in obj) {
                if(this._isObject(obj[key])) {
                    retObj[key] = this.cloneObject(obj[key]);
                }
                else if (this._isArray(obj[key])) {
                    retObj[key] = this.cloneArray(obj[key]);
                } else {
                    retObj[key] = obj[key];
                }
            }
            return retObj;
        },
        cloneArray: function(arr) {
            return arr.slice(0);
        },
        _degToRad: function(deg) {
            return deg * PI_OVER_DEG180;
        },
        _radToDeg: function(rad) {
            return rad * DEG180_OVER_PI;
        },
        _capitalize: function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        throw: function(str) {
            throw new Error(KONVA_ERROR + str);
        },
        error: function(str) {
          console.error(KONVA_ERROR + str);
        },
        warn: function(str) {
            /*
             * IE9 on Windows7 64bit will throw a JS error
             * if we don't use window.console in the conditional
             */
            if(Konva.global.console && console.warn && Konva.showWarnings) {
                console.warn(KONVA_WARNING + str);
            }
        },
        extend: function(child, parent) {
            function Ctor() {
                this.constructor = child;
            }
            Ctor.prototype = parent.prototype;
            var oldProto = child.prototype;
            child.prototype = new Ctor();
            for (var key in oldProto) {
                if (oldProto.hasOwnProperty(key)) {
                    child.prototype[key] = oldProto[key];
                }
            }
            child.__super__ = parent.prototype;
            // create reference to parent
            child.super = parent;
        },
        /**
         * adds methods to a constructor prototype
         * @method
         * @memberof Konva.Util.prototype
         * @param {Function} constructor
         * @param {Object} methods
         */
        addMethods: function(constructor, methods) {
            var key;

            for (key in methods) {
                constructor.prototype[key] = methods[key];
            }
        },
        _getControlPoints: function(x0, y0, x1, y1, x2, y2, t) {
            var d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)),
                d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                fa = t * d01 / (d01 + d12),
                fb = t * d12 / (d01 + d12),
                p1x = x1 - fa * (x2 - x0),
                p1y = y1 - fa * (y2 - y0),
                p2x = x1 + fb * (x2 - x0),
                p2y = y1 + fb * (y2 - y0);

            return [p1x, p1y, p2x, p2y];
        },
        _expandPoints: function(p, tension) {
            var len = p.length,
                allPoints = [],
                n, cp;

            for (n = 2; n < len - 2; n += 2) {
                cp = Konva.Util._getControlPoints(p[n - 2], p[n - 1], p[n], p[n + 1], p[n + 2], p[n + 3], tension);
                allPoints.push(cp[0]);
                allPoints.push(cp[1]);
                allPoints.push(p[n]);
                allPoints.push(p[n + 1]);
                allPoints.push(cp[2]);
                allPoints.push(cp[3]);
            }

            return allPoints;
        },
        _removeLastLetter: function(str) {
            return str.substring(0, str.length - 1);
        },
        each: function(obj, func) {
            for (var key in obj) {
                func(key, obj[key]);
            }
        },
        _getProjectionToSegment: function(x1, y1, x2, y2, x3, y3) {
            var x, y, dist;

            var pd2 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
            if(pd2 == 0) {
                x = x1;
                y = y1;
                dist = (x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2);
            } else {
                var u = ((x3 - x1) * (x2 - x1) + (y3 - y1) * (y2 - y1)) / pd2;
                if(u < 0) {
                    x = x1;
                    y = y1;
                    dist = (x1 - x3) * (x1 - x3) + (y1 - y3) * (y1 - y3);
                } else if (u > 1.0) {
                    x = x2;
                    y = y2;
                    dist = (x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3);
                } else {
                    x = x1 + u * (x2 - x1);
                    y = y1 + u * (y2 - y1);
                    dist = (x - x3) * (x - x3) + (y - y3) * (y - y3);
                }
            }
            return [x, y, dist];
        },
        // line as array of points.
        // line might be closed
        _getProjectionToLine: function(pt, line, isClosed) {
            var pc = Konva.Util.cloneObject(pt);
            var dist = Number.MAX_VALUE;
            line.forEach(function(p1, i) {
                if (!isClosed && i === line.length - 1) {
                    return;
                }
                var p2 = line[(i + 1) % line.length];
                var proj = Konva.Util._getProjectionToSegment(p1.x, p1.y, p2.x, p2.y, pt.x, pt.y);
                var px = proj[0], py = proj[1], pdist = proj[2];
                if (pdist < dist) {
                    pc.x = px;
                    pc.y = py;
                    dist = pdist;
                }
            });
            return pc;
        },
        _prepareArrayForTween: function(startArray, endArray, isClosed) {
            var n, start = [], end = [];
            if (startArray.length > endArray.length) {
                var temp = endArray;
                endArray = startArray;
                startArray = temp;
            }
            for (n = 0; n < startArray.length; n += 2) {
                start.push({
                    x: startArray[n],
                    y: startArray[n + 1]
                });
            }
            for (n = 0; n < endArray.length; n += 2) {
                end.push({
                    x: endArray[n],
                    y: endArray[n + 1]
                });
            }


            var newStart = [];
            end.forEach(function(point) {
                var pr = Konva.Util._getProjectionToLine(point, start, isClosed);
                newStart.push(pr.x);
                newStart.push(pr.y);
            });
            return newStart;
        }
    };
})();

(function() {
    'use strict';
    // calculate pixel ratio
    var canvas = Konva.Util.createCanvasElement(),
        context = canvas.getContext('2d'),
        _pixelRatio = (function(){
            var devicePixelRatio = Konva.window.devicePixelRatio || 1,
            backingStoreRatio = context.webkitBackingStorePixelRatio
                || context.mozBackingStorePixelRatio
                || context.msBackingStorePixelRatio
                || context.oBackingStorePixelRatio
                || context.backingStorePixelRatio
                || 1;
            return devicePixelRatio / backingStoreRatio;
        })();

    /**
     * Canvas Renderer constructor
     * @constructor
     * @abstract
     * @memberof Konva
     * @param {Object} config
     * @param {Number} config.width
     * @param {Number} config.height
     * @param {Number} config.pixelRatio KonvaJS automatically handles pixel ratio adjustments in order to render crisp drawings
     *  on all devices. Most desktops, low end tablets, and low end phones, have device pixel ratios
     *  of 1.  Some high end tablets and phones, like iPhones and iPads (not the mini) have a device pixel ratio
     *  of 2.  Some Macbook Pros, and iMacs also have a device pixel ratio of 2.  Some high end Android devices have pixel
     *  ratios of 2 or 3.  Some browsers like Firefox allow you to configure the pixel ratio of the viewport.  Unless otherwise
     *  specified, the pixel ratio will be defaulted to the actual device pixel ratio.  You can override the device pixel
     *  ratio for special situations, or, if you don't want the pixel ratio to be taken into account, you can set it to 1.
     */
    Konva.Canvas = function(config) {
        this.init(config);
    };

    Konva.Canvas.prototype = {
        init: function(config) {
            var conf = config || {};

            var pixelRatio = conf.pixelRatio || Konva.pixelRatio || _pixelRatio;

            this.pixelRatio = pixelRatio;
            this._canvas = Konva.Util.createCanvasElement();

            // set inline styles
            this._canvas.style.padding = 0;
            this._canvas.style.margin = 0;
            this._canvas.style.border = 0;
            this._canvas.style.background = 'transparent';
            this._canvas.style.position = 'absolute';
            this._canvas.style.top = 0;
            this._canvas.style.left = 0;
        },
        /**
         * get canvas context
         * @method
         * @memberof Konva.Canvas.prototype
         * @returns {CanvasContext} context
         */
        getContext: function() {
            return this.context;
        },
        /**
         * get pixel ratio
         * @method
         * @memberof Konva.Canvas.prototype
         * @returns {Number} pixel ratio
         */
        getPixelRatio: function() {
            return this.pixelRatio;
        },
        /**
         * get pixel ratio
         * @method
         * @memberof Konva.Canvas.prototype
         * @param {Number} pixelRatio KonvaJS automatically handles pixel ratio adustments in order to render crisp drawings
         *  on all devices. Most desktops, low end tablets, and low end phones, have device pixel ratios
         *  of 1.  Some high end tablets and phones, like iPhones and iPads have a device pixel ratio
         *  of 2.  Some Macbook Pros, and iMacs also have a device pixel ratio of 2.  Some high end Android devices have pixel
         *  ratios of 2 or 3.  Some browsers like Firefox allow you to configure the pixel ratio of the viewport.  Unless otherwise
         *  specificed, the pixel ratio will be defaulted to the actual device pixel ratio.  You can override the device pixel
         *  ratio for special situations, or, if you don't want the pixel ratio to be taken into account, you can set it to 1.
         */
        setPixelRatio: function(pixelRatio) {
            var previousRatio = this.pixelRatio;
            this.pixelRatio = pixelRatio;
            this.setSize(this.getWidth() / previousRatio, this.getHeight() / previousRatio);
        },
        /**
         * set width
         * @method
         * @memberof Konva.Canvas.prototype
         * @param {Number} width
         */
        setWidth: function(width) {
            // take into account pixel ratio
            this.width = this._canvas.width = width * this.pixelRatio;
            this._canvas.style.width = width + 'px';

            var pixelRatio = this.pixelRatio,
                _context = this.getContext()._context;
            _context.scale(pixelRatio, pixelRatio);
        },
        /**
         * set height
         * @method
         * @memberof Konva.Canvas.prototype
         * @param {Number} height
         */
        setHeight: function(height) {
            // take into account pixel ratio
            this.height = this._canvas.height = height * this.pixelRatio;
            this._canvas.style.height = height + 'px';
            var pixelRatio = this.pixelRatio,
                _context = this.getContext()._context;
            _context.scale(pixelRatio, pixelRatio);
        },
        /**
         * get width
         * @method
         * @memberof Konva.Canvas.prototype
         * @returns {Number} width
         */
        getWidth: function() {
            return this.width;
        },
        /**
         * get height
         * @method
         * @memberof Konva.Canvas.prototype
         * @returns {Number} height
         */
        getHeight: function() {
            return this.height;
        },
        /**
         * set size
         * @method
         * @memberof Konva.Canvas.prototype
         * @param {Number} width
         * @param {Number} height
         */
        setSize: function(width, height) {
            this.setWidth(width);
            this.setHeight(height);
        },
        /**
         * to data url
         * @method
         * @memberof Konva.Canvas.prototype
         * @param {String} mimeType
         * @param {Number} quality between 0 and 1 for jpg mime types
         * @returns {String} data url string
         */
        toDataURL: function(mimeType, quality) {
            try {
                // If this call fails (due to browser bug, like in Firefox 3.6),
                // then revert to previous no-parameter image/png behavior
                return this._canvas.toDataURL(mimeType, quality);
            }
            catch(e) {
                try {
                    return this._canvas.toDataURL();
                }
                catch(err) {
                    Konva.Util.warn('Unable to get data URL. ' + err.message);
                    return '';
                }
            }
        }
    };

    Konva.SceneCanvas = function(config) {
        var conf = config || {};
        var width = conf.width || 0,
            height = conf.height || 0;

        Konva.Canvas.call(this, conf);
        this.context = new Konva.SceneContext(this);
        this.setSize(width, height);
    };

    Konva.Util.extend(Konva.SceneCanvas, Konva.Canvas);

    Konva.HitCanvas = function(config) {
        var conf = config || {};
        var width = conf.width || 0,
            height = conf.height || 0;

        Konva.Canvas.call(this, conf);
        this.context = new Konva.HitContext(this);
        this.setSize(width, height);
        this.hitCanvas = true;
    };
    Konva.Util.extend(Konva.HitCanvas, Konva.Canvas);

})();

(function() {
    'use strict';
    var COMMA = ',',
        OPEN_PAREN = '(',
        CLOSE_PAREN = ')',
        OPEN_PAREN_BRACKET = '([',
        CLOSE_BRACKET_PAREN = '])',
        SEMICOLON = ';',
        DOUBLE_PAREN = '()',
        // EMPTY_STRING = '',
        EQUALS = '=',
        // SET = 'set',
        CONTEXT_METHODS = [
            'arc',
            'arcTo',
            'beginPath',
            'bezierCurveTo',
            'clearRect',
            'clip',
            'closePath',
            'createLinearGradient',
            'createPattern',
            'createRadialGradient',
            'drawImage',
            'fill',
            'fillText',
            'getImageData',
            'createImageData',
            'lineTo',
            'moveTo',
            'putImageData',
            'quadraticCurveTo',
            'rect',
            'restore',
            'rotate',
            'save',
            'scale',
            'setLineDash',
            'setTransform',
            'stroke',
            'strokeText',
            'transform',
            'translate'
        ];

    var CONTEXT_PROPERTIES = ['fillStyle', 'strokeStyle', 'shadowColor', 'shadowBlur', 'shadowOffsetX',
        'shadowOffsetY', 'lineCap', 'lineJoin', 'lineWidth', 'miterLimit', 'font', 'textAlign', 'textBaseline',
        'globalAlpha', 'globalCompositeOperation'];

    /**
     * Canvas Context constructor
     * @constructor
     * @abstract
     * @memberof Konva
     */
    Konva.Context = function(canvas) {
        this.init(canvas);
    };

    Konva.Context.prototype = {
        init: function(canvas) {
            this.canvas = canvas;
            this._context = canvas._canvas.getContext('2d');

            if (Konva.enableTrace) {
                this.traceArr = [];
                this._enableTrace();
            }
        },
        /**
         * fill shape
         * @method
         * @memberof Konva.Context.prototype
         * @param {Konva.Shape} shape
         */
        fillShape: function(shape) {
            if(shape.getFillEnabled()) {
                this._fill(shape);
            }
        },
        /**
         * stroke shape
         * @method
         * @memberof Konva.Context.prototype
         * @param {Konva.Shape} shape
         */
        strokeShape: function(shape) {
            if(shape.getStrokeEnabled()) {
                this._stroke(shape);
            }
        },
        /**
         * fill then stroke
         * @method
         * @memberof Konva.Context.prototype
         * @param {Konva.Shape} shape
         */
        fillStrokeShape: function(shape) {
            var fillEnabled = shape.getFillEnabled();
            if(fillEnabled) {
                this._fill(shape);
            }
            if(shape.getStrokeEnabled()) {
                this._stroke(shape);
            }
        },
        /**
         * get context trace if trace is enabled
         * @method
         * @memberof Konva.Context.prototype
         * @param {Boolean} relaxed if false, return strict context trace, which includes method names, method parameters
         *  properties, and property values.  If true, return relaxed context trace, which only returns method names and
         *  properites.
         * @returns {String}
         */
        getTrace: function(relaxed) {
            var traceArr = this.traceArr,
                len = traceArr.length,
                str = '',
                n, trace, method, args;

            for (n = 0; n < len; n++) {
                trace = traceArr[n];
                method = trace.method;

                // methods
                if (method) {
                    args = trace.args;
                    str += method;
                    if (relaxed) {
                        str += DOUBLE_PAREN;
                    }
                    else {
                        if (Konva.Util._isArray(args[0])) {
                            str += OPEN_PAREN_BRACKET + args.join(COMMA) + CLOSE_BRACKET_PAREN;
                        }
                        else {
                            str += OPEN_PAREN + args.join(COMMA) + CLOSE_PAREN;
                        }
                    }
                }
                // properties
                else {
                    str += trace.property;
                    if (!relaxed) {
                        str += EQUALS + trace.val;
                    }
                }

                str += SEMICOLON;
            }

            return str;
        },
        /**
         * clear trace if trace is enabled
         * @method
         * @memberof Konva.Context.prototype
         */
        clearTrace: function() {
            this.traceArr = [];
        },
        _trace: function(str) {
            var traceArr = this.traceArr,
                len;

            traceArr.push(str);
            len = traceArr.length;

            if (len >= Konva.traceArrMax) {
                traceArr.shift();
            }
        },
        /**
         * reset canvas context transform
         * @method
         * @memberof Konva.Context.prototype
         */
        reset: function() {
            var pixelRatio = this.getCanvas().getPixelRatio();
            this.setTransform(1 * pixelRatio, 0, 0, 1 * pixelRatio, 0, 0);
        },
        /**
         * get canvas
         * @method
         * @memberof Konva.Context.prototype
         * @returns {Konva.Canvas}
         */
        getCanvas: function() {
            return this.canvas;
        },
        /**
         * clear canvas
         * @method
         * @memberof Konva.Context.prototype
         * @param {Object} [bounds]
         * @param {Number} [bounds.x]
         * @param {Number} [bounds.y]
         * @param {Number} [bounds.width]
         * @param {Number} [bounds.height]
         */
        clear: function(bounds) {
            var canvas = this.getCanvas();

            if (bounds) {
                this.clearRect(bounds.x || 0, bounds.y || 0, bounds.width || 0, bounds.height || 0);
            }
            else {
                this.clearRect(0, 0, canvas.getWidth() / canvas.pixelRatio, canvas.getHeight() / canvas.pixelRatio);
            }
        },
        _applyLineCap: function(shape) {
            var lineCap = shape.getLineCap();
            if(lineCap) {
                this.setAttr('lineCap', lineCap);
            }
        },
        _applyOpacity: function(shape) {
            var absOpacity = shape.getAbsoluteOpacity();
            if(absOpacity !== 1) {
                this.setAttr('globalAlpha', absOpacity);
            }
        },
        _applyLineJoin: function(shape) {
            var lineJoin = shape.getLineJoin();
            if(lineJoin) {
                this.setAttr('lineJoin', lineJoin);
            }
        },
        setAttr: function(attr, val) {
            this._context[attr] = val;
        },

        // context pass through methods
        arc: function() {
            var a = arguments;
            this._context.arc(a[0], a[1], a[2], a[3], a[4], a[5]);
        },
        beginPath: function() {
            this._context.beginPath();
        },
        bezierCurveTo: function() {
            var a = arguments;
            this._context.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]);
        },
        clearRect: function() {
            var a = arguments;
            this._context.clearRect(a[0], a[1], a[2], a[3]);
        },
        clip: function() {
            this._context.clip();
        },
        closePath: function() {
            this._context.closePath();
        },
        createImageData: function() {
            var a = arguments;
            if(a.length === 2) {
                return this._context.createImageData(a[0], a[1]);
            }
            else if(a.length === 1) {
                return this._context.createImageData(a[0]);
            }
        },
        createLinearGradient: function() {
            var a = arguments;
            return this._context.createLinearGradient(a[0], a[1], a[2], a[3]);
        },
        createPattern: function() {
            var a = arguments;
            return this._context.createPattern(a[0], a[1]);
        },
        createRadialGradient: function() {
            var a = arguments;
            return this._context.createRadialGradient(a[0], a[1], a[2], a[3], a[4], a[5]);
        },
        drawImage: function() {
            var a = arguments,
                _context = this._context;

            if(a.length === 3) {
                _context.drawImage(a[0], a[1], a[2]);
            }
            else if(a.length === 5) {
                _context.drawImage(a[0], a[1], a[2], a[3], a[4]);
            }
            else if(a.length === 9) {
                _context.drawImage(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
            }
        },
        isPointInPath: function(x, y) {
            return this._context.isPointInPath(x, y);
        },
        fill: function() {
            this._context.fill();
        },
        fillRect: function(x, y, width, height) {
            this._context.fillRect(x, y, width, height);
        },
        strokeRect: function(x, y, width, height) {
            this._context.strokeRect(x, y, width, height);
        },
        fillText: function() {
            var a = arguments;
            this._context.fillText(a[0], a[1], a[2]);
        },
        measureText: function(text) {
            return this._context.measureText(text);
        },
        getImageData: function() {
            var a = arguments;
            return this._context.getImageData(a[0], a[1], a[2], a[3]);
        },
        lineTo: function() {
            var a = arguments;
            this._context.lineTo(a[0], a[1]);
        },
        moveTo: function() {
            var a = arguments;
            this._context.moveTo(a[0], a[1]);
        },
        rect: function() {
            var a = arguments;
            this._context.rect(a[0], a[1], a[2], a[3]);
        },
        putImageData: function() {
            var a = arguments;
            this._context.putImageData(a[0], a[1], a[2]);
        },
        quadraticCurveTo: function() {
            var a = arguments;
            this._context.quadraticCurveTo(a[0], a[1], a[2], a[3]);
        },
        restore: function() {
            this._context.restore();
        },
        rotate: function() {
            var a = arguments;
            this._context.rotate(a[0]);
        },
        save: function() {
            this._context.save();
        },
        scale: function() {
            var a = arguments;
            this._context.scale(a[0], a[1]);
        },
        setLineDash: function() {
            var a = arguments,
                _context = this._context;

            // works for Chrome and IE11
            if(this._context.setLineDash) {
                _context.setLineDash(a[0]);
            }
            // verified that this works in firefox
            else if('mozDash' in _context) {
                _context.mozDash = a[0];
            }
            // does not currently work for Safari
            else if('webkitLineDash' in _context) {
                _context.webkitLineDash = a[0];
            }

            // no support for IE9 and IE10
        },
        getLineDash: function() {
            return this._context.getLineDash();
        },
        setTransform: function() {
            var a = arguments;
            this._context.setTransform(a[0], a[1], a[2], a[3], a[4], a[5]);
        },
        stroke: function() {
            this._context.stroke();
        },
        strokeText: function() {
            var a = arguments;
            this._context.strokeText(a[0], a[1], a[2]);
        },
        transform: function() {
            var a = arguments;
            this._context.transform(a[0], a[1], a[2], a[3], a[4], a[5]);
        },
        translate: function() {
            var a = arguments;
            this._context.translate(a[0], a[1]);
        },
        _enableTrace: function() {
            var that = this,
                len = CONTEXT_METHODS.length,
                _simplifyArray = Konva.Util._simplifyArray,
                origSetter = this.setAttr,
                n, args;

            // to prevent creating scope function at each loop
            var func = function(methodName) {
                    var origMethod = that[methodName],
                        ret;

                    that[methodName] = function() {
                        args = _simplifyArray(Array.prototype.slice.call(arguments, 0));
                        ret = origMethod.apply(that, arguments);

                        that._trace({
                            method: methodName,
                            args: args
                        });

                        return ret;
                    };
            };
            // methods
            for (n = 0; n < len; n++) {
                func(CONTEXT_METHODS[n]);
            }

            // attrs
            that.setAttr = function() {
                origSetter.apply(that, arguments);
                that._trace({
                    property: arguments[0],
                    val: arguments[1]
                });
            };
        }
    };

    CONTEXT_PROPERTIES.forEach(function(prop) {
        Object.defineProperty(Konva.Context.prototype, prop, {
            get: function () {
                return this._context[prop];
            },
            set: function (val) {
                this._context[prop] = val;
            }
        });
    });

    Konva.SceneContext = function(canvas) {
        Konva.Context.call(this, canvas);
    };

    Konva.SceneContext.prototype = {
        _fillColor: function(shape) {
            var fill = shape.fill();

            this.setAttr('fillStyle', fill);
            shape._fillFunc(this);
        },
        _fillPattern: function(shape) {
            var fillPatternX = shape.getFillPatternX(),
                fillPatternY = shape.getFillPatternY(),
                fillPatternScale = shape.getFillPatternScale(),
                fillPatternRotation = Konva.getAngle(shape.getFillPatternRotation()),
                fillPatternOffset = shape.getFillPatternOffset();

            if(fillPatternX || fillPatternY) {
                this.translate(fillPatternX || 0, fillPatternY || 0);
            }
            if(fillPatternRotation) {
                this.rotate(fillPatternRotation);
            }
            if(fillPatternScale) {
                this.scale(fillPatternScale.x, fillPatternScale.y);
            }
            if(fillPatternOffset) {
                this.translate(-1 * fillPatternOffset.x, -1 * fillPatternOffset.y);
            }

            this.setAttr('fillStyle', this.createPattern(shape.getFillPatternImage(), shape.getFillPatternRepeat() || 'repeat'));
            this.fill();
        },
        _fillLinearGradient: function(shape) {
            var start = shape.getFillLinearGradientStartPoint(),
                end = shape.getFillLinearGradientEndPoint(),
                colorStops = shape.getFillLinearGradientColorStops(),
                grd = this.createLinearGradient(start.x, start.y, end.x, end.y);

            if (colorStops) {
                // build color stops
                for(var n = 0; n < colorStops.length; n += 2) {
                    grd.addColorStop(colorStops[n], colorStops[n + 1]);
                }
                this.setAttr('fillStyle', grd);
                shape._fillFunc(this);
            }
        },
        _fillRadialGradient: function(shape) {
            var start = shape.getFillRadialGradientStartPoint(),
                end = shape.getFillRadialGradientEndPoint(),
                startRadius = shape.getFillRadialGradientStartRadius(),
                endRadius = shape.getFillRadialGradientEndRadius(),
                colorStops = shape.getFillRadialGradientColorStops(),
                grd = this.createRadialGradient(start.x, start.y, startRadius, end.x, end.y, endRadius);

            // build color stops
            for(var n = 0; n < colorStops.length; n += 2) {
                grd.addColorStop(colorStops[n], colorStops[n + 1]);
            }
            this.setAttr('fillStyle', grd);
            this.fill();
        },
        _fill: function(shape) {
            var hasColor = shape.fill(),
                hasPattern = shape.getFillPatternImage(),
                hasLinearGradient = shape.getFillLinearGradientColorStops(),
                hasRadialGradient = shape.getFillRadialGradientColorStops(),
                fillPriority = shape.getFillPriority();

            // priority fills
            if(hasColor && fillPriority === 'color') {
                this._fillColor(shape);
            }
            else if(hasPattern && fillPriority === 'pattern') {
                this._fillPattern(shape);
            }
            else if(hasLinearGradient && fillPriority === 'linear-gradient') {
                this._fillLinearGradient(shape);
            }
            else if(hasRadialGradient && fillPriority === 'radial-gradient') {
                this._fillRadialGradient(shape);
            }
            // now just try and fill with whatever is available
            else if(hasColor) {
                this._fillColor(shape);
            }
            else if(hasPattern) {
                this._fillPattern(shape);
            }
            else if(hasLinearGradient) {
                this._fillLinearGradient(shape);
            }
            else if(hasRadialGradient) {
                this._fillRadialGradient(shape);
            }
        },
        _stroke: function(shape) {
            var dash = shape.dash(),
                // ignore strokeScaleEnabled for Text
                strokeScaleEnabled = (shape.getStrokeScaleEnabled() || (shape instanceof Konva.Text));

            if(shape.hasStroke()) {
                if (!strokeScaleEnabled) {
                    this.save();
                    this.setTransform(1, 0, 0, 1, 0, 0);
                }

                this._applyLineCap(shape);
                if(dash && shape.dashEnabled()) {
                    this.setLineDash(dash);
                }

                this.setAttr('lineWidth', shape.strokeWidth());
                this.setAttr('strokeStyle', shape.stroke());

                if (!shape.getShadowForStrokeEnabled()) {
                    this.setAttr('shadowColor', 'rgba(0,0,0,0)');
                }
                shape._strokeFunc(this);

                if (!strokeScaleEnabled) {
                    this.restore();
                }
            }
        },
        _applyShadow: function(shape) {
            var util = Konva.Util,
                color = util.get(shape.getShadowRGBA(), 'black'),
                blur = util.get(shape.getShadowBlur(), 5),
                offset = util.get(shape.getShadowOffset(), {
                    x: 0,
                    y: 0
                }),
                // TODO: get this info from transform??
                scale = shape.getAbsoluteScale(),
                scaleX = scale.x,
                scaleY = scale.y;

            this.setAttr('shadowColor', color);
            this.setAttr('shadowBlur', blur);
            this.setAttr('shadowOffsetX', offset.x * scaleX);
            this.setAttr('shadowOffsetY', offset.y * scaleY);
        }
    };
    Konva.Util.extend(Konva.SceneContext, Konva.Context);

    Konva.HitContext = function(canvas) {
        Konva.Context.call(this, canvas);
    };

    Konva.HitContext.prototype = {
        _fill: function(shape) {
            this.save();
            this.setAttr('fillStyle', shape.colorKey);
            shape._fillFuncHit(this);
            this.restore();
        },
        _stroke: function(shape) {
            if(shape.hasStroke() && shape.strokeHitEnabled()) {
                // ignore strokeScaleEnabled for Text
                var strokeScaleEnabled = (shape.getStrokeScaleEnabled() || (shape instanceof Konva.Text));
                if (!strokeScaleEnabled) {
                    this.save();
                    this.setTransform(1, 0, 0, 1, 0, 0);
                }
                this._applyLineCap(shape);
                this.setAttr('lineWidth', shape.strokeWidth());
                this.setAttr('strokeStyle', shape.colorKey);
                shape._strokeFuncHit(this);
                if (!strokeScaleEnabled) {
                    this.restore();
                }
            }
        }
    };
    Konva.Util.extend(Konva.HitContext, Konva.Context);
})();

(function() {
    'use strict';
    // CONSTANTS
    var GET = 'get',
        SET = 'set';

    Konva.Factory = {
        addGetterSetter: function(constructor, attr, def, validator, after) {
            this.addGetter(constructor, attr, def);
            this.addSetter(constructor, attr, validator, after);
            this.addOverloadedGetterSetter(constructor, attr);
        },
        addGetter: function(constructor, attr, def) {
            var method = GET + Konva.Util._capitalize(attr);

            constructor.prototype[method] = function() {
                var val = this.attrs[attr];
                return val === undefined ? def : val;
            };
        },
        addSetter: function(constructor, attr, validator, after) {
            var method = SET + Konva.Util._capitalize(attr);

            constructor.prototype[method] = function(val) {
                if (validator) {
                    val = validator.call(this, val);
                }

                this._setAttr(attr, val);

                if (after) {
                    after.call(this);
                }

                return this;
            };
        },
        addComponentsGetterSetter: function(constructor, attr, components, validator, after) {
            var len = components.length,
                capitalize = Konva.Util._capitalize,
                getter = GET + capitalize(attr),
                setter = SET + capitalize(attr),
                n, component;

            // getter
            constructor.prototype[getter] = function() {
                var ret = {};

                for (n = 0; n < len; n++) {
                    component = components[n];
                    ret[component] = this.getAttr(attr + capitalize(component));
                }

                return ret;
            };

            // setter
            constructor.prototype[setter] = function(val) {
                var oldVal = this.attrs[attr],
                    key;

                if (validator) {
                    val = validator.call(this, val);
                }

                for (key in val) {
                    if (!val.hasOwnProperty(key)) {
                        continue;
                    }
                    this._setAttr(attr + capitalize(key), val[key]);
                }

                this._fireChangeEvent(attr, oldVal, val);

                if (after) {
                    after.call(this);
                }

                return this;
            };

            this.addOverloadedGetterSetter(constructor, attr);
        },
        addOverloadedGetterSetter: function(constructor, attr) {
            var capitalizedAttr = Konva.Util._capitalize(attr),
                setter = SET + capitalizedAttr,
                getter = GET + capitalizedAttr;

            constructor.prototype[attr] = function() {
                // setting
                if (arguments.length) {
                    this[setter](arguments[0]);
                    return this;
                }
                // getting
                return this[getter]();
            };
        },
        addDeprecatedGetterSetter: function(constructor, attr, def, validator) {
            var method = GET + Konva.Util._capitalize(attr);
            var message = attr + ' property is deprecated and will be removed soon. Look at Konva change log for more information.';
            constructor.prototype[method] = function() {
                Konva.Util.error(message);
                var val = this.attrs[attr];
                return val === undefined ? def : val;
            };
            this.addSetter(constructor, attr, validator, function() {
              Konva.Util.error(message);
            });
            this.addOverloadedGetterSetter(constructor, attr);
        },
        backCompat: function(constructor, methods) {
            Konva.Util.each(methods, function(oldMethodName, newMethodName) {
                var method = constructor.prototype[newMethodName];
                constructor.prototype[oldMethodName] = function(){
                    method.apply(this, arguments);
                    Konva.Util.error(oldMethodName + ' method is deprecated and will be removed soon. Use ' + newMethodName + ' instead');
                };
            });
        },
        afterSetFilter: function() {
            this._filterUpToDate = false;
        }
    };

    Konva.Validators = {
        /**
         * @return {number}
         */
        RGBComponent: function(val) {
            if (val > 255) {
                return 255;
            } else if (val < 0) {
                return 0;
            }
            return Math.round(val);
        },
        alphaComponent: function(val) {
            if (val > 1) {
                return 1;
            }
            // chrome does not honor alpha values of 0
            else if (val < 0.0001) {
                return 0.0001;
            }

            return val;
        }
    };
})();

(function(Konva) {
    'use strict';
    // CONSTANTS
    var ABSOLUTE_OPACITY = 'absoluteOpacity',
        ABSOLUTE_TRANSFORM = 'absoluteTransform',
        ABSOLUTE_SCALE = 'absoluteScale',
        CHANGE = 'Change',
        CHILDREN = 'children',
        DOT = '.',
        EMPTY_STRING = '',
        GET = 'get',
        ID = 'id',
        KONVA = 'konva',
        LISTENING = 'listening',
        MOUSEENTER = 'mouseenter',
        MOUSELEAVE = 'mouseleave',
        NAME = 'name',
        SET = 'set',
        SHAPE = 'Shape',
        SPACE = ' ',
        STAGE = 'stage',
        TRANSFORM = 'transform',
        UPPER_STAGE = 'Stage',
        VISIBLE = 'visible',
        CLONE_BLACK_LIST = ['id'],

        TRANSFORM_CHANGE_STR = [
            'xChange.konva',
            'yChange.konva',
            'scaleXChange.konva',
            'scaleYChange.konva',
            'skewXChange.konva',
            'skewYChange.konva',
            'rotationChange.konva',
            'offsetXChange.konva',
            'offsetYChange.konva',
            'transformsEnabledChange.konva'
        ].join(SPACE),

        SCALE_CHANGE_STR = [
            'scaleXChange.konva',
            'scaleYChange.konva'
        ].join(SPACE);

    /**
     * Node constructor. Nodes are entities that can be transformed, layered,
     * and have bound events. The stage, layers, groups, and shapes all extend Node.
     * @constructor
     * @memberof Konva
     * @abstract
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     */
    Konva.Node = function(config) {
        this._init(config);
    };

    Konva.Util.addMethods(Konva.Node, {
        _init: function(config) {
            var that = this;
            this._id = Konva.idCounter++;
            this.eventListeners = {};
            this.attrs = {};
            this._cache = {};
            this._filterUpToDate = false;
            this.setAttrs(config);

            // event bindings for cache handling
            this.on(TRANSFORM_CHANGE_STR, function() {
                this._clearCache(TRANSFORM);
                that._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
            });

            this.on(SCALE_CHANGE_STR, function() {
                that._clearSelfAndDescendantCache(ABSOLUTE_SCALE);
            });

            this.on('visibleChange.konva', function() {
                that._clearSelfAndDescendantCache(VISIBLE);
            });
            this.on('listeningChange.konva', function() {
                that._clearSelfAndDescendantCache(LISTENING);
            });
            this.on('opacityChange.konva', function() {
                that._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
            });
        },
        _clearCache: function(attr){
            if (attr) {
                delete this._cache[attr];
            }
            else {
                this._cache = {};
            }
        },
        _getCache: function(attr, privateGetter){
            var cache = this._cache[attr];

            // if not cached, we need to set it using the private getter method.
            if (cache === undefined) {
                this._cache[attr] = privateGetter.call(this);
            }

            return this._cache[attr];
        },
        /*
         * when the logic for a cached result depends on ancestor propagation, use this
         * method to clear self and children cache
         */
        _clearSelfAndDescendantCache: function(attr) {
            this._clearCache(attr);

            if (this.children) {
                this.getChildren().each(function(node) {
                    node._clearSelfAndDescendantCache(attr);
                });
            }
        },
        /**
        * clear cached canvas
        * @method
        * @memberof Konva.Node.prototype
        * @returns {Konva.Node}
        * @example
        * node.clearCache();
        */
        clearCache: function() {
            delete this._cache.canvas;
            this._filterUpToDate = false;
            return this;
        },
        /**
        *  cache node to improve drawing performance, apply filters, or create more accurate
        *  hit regions. For all basic shapes size of cache canvas will be automatically detected.
        *  If you need to cache your custom `Konva.Shape` instance you have to pass shape's bounding box
        *  properties. Look at [link to demo page](link to demo page) for more information.
        * @method
        * @memberof Konva.Node.prototype
        * @param {Object} [config]
        * @param {Number} [config.x]
        * @param {Number} [config.y]
        * @param {Number} [config.width]
        * @param {Number} [config.height]
        * @param {Number} [config.offset]  increase canvas size by `offset` pixel in all directions.
        * @param {Boolean} [config.drawBorder] when set to true, a red border will be drawn around the cached
        *  region for debugging purposes
        * @returns {Konva.Node}
        * @example
        * // cache a shape with the x,y position of the bounding box at the center and
        * // the width and height of the bounding box equal to the width and height of
        * // the shape obtained from shape.width() and shape.height()
        * image.cache();
        *
        * // cache a node and define the bounding box position and size
        * node.cache({
        *   x: -30,
        *   y: -30,
        *   width: 100,
        *   height: 200
        * });
        *
        * // cache a node and draw a red border around the bounding box
        * // for debugging purposes
        * node.cache({
        *   x: -30,
        *   y: -30,
        *   width: 100,
        *   height: 200,
        *   offset : 10,
        *   drawBorder: true
        * });
        */
        cache: function(config) {
            var conf = config || {},
                rect = this.getClientRect(true),
                width = conf.width || rect.width,
                height = conf.height || rect.height,
                x = conf.x || rect.x,
                y = conf.y || rect.y,
                offset = conf.offset || 0,
                drawBorder = conf.drawBorder || false;

            if (!width || !height) {
                throw new Error('Width or height of caching configuration equals 0.');
            }

            width += offset * 2;
            height += offset * 2;

            x -= offset;
            y -= offset;


            var cachedSceneCanvas = new Konva.SceneCanvas({
                width: width,
                height: height
            }),
            cachedFilterCanvas = new Konva.SceneCanvas({
                width: width,
                height: height
            }),
            cachedHitCanvas = new Konva.HitCanvas({
                pixelRatio: 1,
                width: width,
                height: height
            }),
            sceneContext = cachedSceneCanvas.getContext(),
            hitContext = cachedHitCanvas.getContext();

            cachedHitCanvas.isCache = true;

            this.clearCache();

            sceneContext.save();
            hitContext.save();

            sceneContext.translate(-x, -y);
            hitContext.translate(-x, -y);

            this.drawScene(cachedSceneCanvas, this, true);
            this.drawHit(cachedHitCanvas, this, true);

            sceneContext.restore();
            hitContext.restore();

            // this will draw a red border around the cached box for
            // debugging purposes
            if (drawBorder) {
                sceneContext.save();
                sceneContext.beginPath();
                sceneContext.rect(0, 0, width, height);
                sceneContext.closePath();
                sceneContext.setAttr('strokeStyle', 'red');
                sceneContext.setAttr('lineWidth', 5);
                sceneContext.stroke();
                sceneContext.restore();
            }

            this._cache.canvas = {
                scene: cachedSceneCanvas,
                filter: cachedFilterCanvas,
                hit: cachedHitCanvas,
                x: x,
                y: y
            };

            return this;
        },
        /**
         * Return client rectangle {x, y, width, height} of node. This rectangle also include all styling (strokes, shadows, etc).
         * The rectangle position is relative to parent container.
         * @method
         * @memberof Konva.Node.prototype
         * @param {Boolean} [skipTransform] flag should we skip transformation to rectangle
         * @returns {Object} rect with {x, y, width, height} properties
         * @example
         * var rect = new Konva.Rect({
         *      width : 100,
         *      height : 100,
         *      x : 50,
         *      y : 50,
         *      strokeWidth : 4,
         *      stroke : 'black',
         *      offsetX : 50,
         *      scaleY : 2
         * });
         *
         * // get client rect without think off transformations (position, rotation, scale, offset, etc)
         * rect.getClientRect(true);
         * // returns {
         * //     x : -2,   // two pixels for stroke / 2
         * //     y : -2,
         * //     width : 104, // increased by 4 for stroke
         * //     height : 104
         * //}
         *
         * // get client rect with transformation applied
         * rect.getClientRect();
         * // returns Object {x: -2, y: 46, width: 104, height: 208}
         */
        getClientRect: function() {
            // abstract method
            // redefine in Container and Shape
            throw new Error('abstract "getClientRect" method call');
        },
        _transformedRect: function(rect) {
            var points = [
                {x: rect.x, y: rect.y},
                {x: rect.x + rect.width, y: rect.y},
                {x: rect.x + rect.width, y: rect.y + rect.height},
                {x: rect.x, y: rect.y + rect.height}
            ];
            var minX, minY, maxX, maxY;
            var trans = this.getTransform();
            points.forEach(function(point) {
                var transformed = trans.point(point);
                if (minX === undefined) {
                    minX = maxX = transformed.x;
                    minY = maxY = transformed.y;
                }
                minX = Math.min(minX, transformed.x);
                minY = Math.min(minY, transformed.y);
                maxX = Math.max(maxX, transformed.x);
                maxY = Math.max(maxY, transformed.y);
            });
            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        },
        _drawCachedSceneCanvas: function(context) {
            context.save();
            context._applyOpacity(this);
            context.translate(
                this._cache.canvas.x,
                this._cache.canvas.y
            );

            var cacheCanvas = this._getCachedSceneCanvas();
            var ratio = cacheCanvas.pixelRatio;

            context.drawImage(cacheCanvas._canvas, 0, 0, cacheCanvas.width / ratio, cacheCanvas.height / ratio);
            context.restore();
        },
        _drawCachedHitCanvas: function(context) {
            var cachedCanvas = this._cache.canvas,
                hitCanvas = cachedCanvas.hit;
            context.save();
            context.translate(
                this._cache.canvas.x,
                this._cache.canvas.y
            );
            context.drawImage(hitCanvas._canvas, 0, 0);
            context.restore();
        },
        _getCachedSceneCanvas: function() {
            var filters = this.filters(),
                cachedCanvas = this._cache.canvas,
                sceneCanvas = cachedCanvas.scene,
                filterCanvas = cachedCanvas.filter,
                filterContext = filterCanvas.getContext(),
                len, imageData, n, filter;

            if (filters) {
                if (!this._filterUpToDate) {
                    var ratio = sceneCanvas.pixelRatio;

                    try {
                        len = filters.length;
                        filterContext.clear();

                        // copy cached canvas onto filter context
                        filterContext.drawImage(sceneCanvas._canvas, 0, 0, sceneCanvas.getWidth() / ratio, sceneCanvas.getHeight() / ratio);
                        imageData = filterContext.getImageData(0, 0, filterCanvas.getWidth(), filterCanvas.getHeight());

                        // apply filters to filter context
                        for (n = 0; n < len; n++) {
                            filter = filters[n];
                            filter.call(this, imageData);
                            filterContext.putImageData(imageData, 0, 0);
                        }
                    }
                    catch(e) {
                        Konva.Util.warn('Unable to apply filter. ' + e.message);
                    }

                    this._filterUpToDate = true;
                }

                return filterCanvas;
            }
            return sceneCanvas;
        },
        /**
         * bind events to the node. KonvaJS supports mouseover, mousemove,
         *  mouseout, mouseenter, mouseleave, mousedown, mouseup, wheel, click, dblclick, touchstart, touchmove,
         *  touchend, tap, dbltap, dragstart, dragmove, and dragend events. The Konva Stage supports
         *  contentMouseover, contentMousemove, contentMouseout, contentMousedown, contentMouseup, contentWheel
         *  contentClick, contentDblclick, contentTouchstart, contentTouchmove, contentTouchend, contentTap,
         *  and contentDblTap.  Pass in a string of events delimmited by a space to bind multiple events at once
         *  such as 'mousedown mouseup mousemove'. Include a namespace to bind an
         *  event by name such as 'click.foobar'.
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} evtStr e.g. 'click', 'mousedown touchstart', 'mousedown.foo touchstart.foo'
         * @param {Function} handler The handler function is passed an event object
         * @returns {Konva.Node}
         * @example
         * // add click listener
         * node.on('click', function() {
         *   console.log('you clicked me!');
         * });
         *
         * // get the target node
         * node.on('click', function(evt) {
         *   console.log(evt.target);
         * });
         *
         * // stop event propagation
         * node.on('click', function(evt) {
         *   evt.cancelBubble = true;
         * });
         *
         * // bind multiple listeners
         * node.on('click touchstart', function() {
         *   console.log('you clicked/touched me!');
         * });
         *
         * // namespace listener
         * node.on('click.foo', function() {
         *   console.log('you clicked/touched me!');
         * });
         *
         * // get the event type
         * node.on('click tap', function(evt) {
         *   var eventType = evt.type;
         * });
         *
         * // get native event object
         * node.on('click tap', function(evt) {
         *   var nativeEvent = evt.evt;
         * });
         *
         * // for change events, get the old and new val
         * node.on('xChange', function(evt) {
         *   var oldVal = evt.oldVal;
         *   var newVal = evt.newVal;
         * });
         *
         * // get event targets
         * // with event delegations
         * layer.on('click', 'Group', function(evt) {
         *   var shape = evt.target;
         *   var group = evtn.currentTarger;
         * });
         */
        on: function(evtStr, handler) {
            if (arguments.length === 3) {
                return this._delegate.apply(this, arguments);
            }
            var events = evtStr.split(SPACE),
                len = events.length,
                n, event, parts, baseEvent, name;

             /*
             * loop through types and attach event listeners to
             * each one.  eg. 'click mouseover.namespace mouseout'
             * will create three event bindings
             */
            for(n = 0; n < len; n++) {
                event = events[n];
                parts = event.split(DOT);
                baseEvent = parts[0];
                name = parts[1] || EMPTY_STRING;

                // create events array if it doesn't exist
                if(!this.eventListeners[baseEvent]) {
                    this.eventListeners[baseEvent] = [];
                }

                this.eventListeners[baseEvent].push({
                    name: name,
                    handler: handler
                });
            }

            return this;
        },
        /**
         * remove event bindings from the node. Pass in a string of
         *  event types delimmited by a space to remove multiple event
         *  bindings at once such as 'mousedown mouseup mousemove'.
         *  include a namespace to remove an event binding by name
         *  such as 'click.foobar'. If you only give a name like '.foobar',
         *  all events in that namespace will be removed.
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} evtStr e.g. 'click', 'mousedown touchstart', '.foobar'
         * @returns {Konva.Node}
         * @example
         * // remove listener
         * node.off('click');
         *
         * // remove multiple listeners
         * node.off('click touchstart');
         *
         * // remove listener by name
         * node.off('click.foo');
         */
        off: function(evtStr) {
            var events = (evtStr || '').split(SPACE),
                len = events.length,
                n, t, event, parts, baseEvent, name;

            if (!evtStr) {
                // remove all events
                for(t in this.eventListeners) {
                    this._off(t);
                }
            }
            for(n = 0; n < len; n++) {
                event = events[n];
                parts = event.split(DOT);
                baseEvent = parts[0];
                name = parts[1];

                if(baseEvent) {
                    if(this.eventListeners[baseEvent]) {
                        this._off(baseEvent, name);
                    }
                }
                else {
                    for(t in this.eventListeners) {
                        this._off(t, name);
                    }
                }
            }
            return this;
        },
        // some event aliases for third party integration like HammerJS
        dispatchEvent: function(evt) {
            var e = {
              target: this,
              type: evt.type,
              evt: evt
            };
            this.fire(evt.type, e);
            return this;
        },
        addEventListener: function(type, handler) {
            // we have to pass native event to handler
            this.on(type, function(evt){
                handler.call(this, evt.evt);
            });
            return this;
        },
        removeEventListener: function(type) {
            this.off(type);
            return this;
        },
        // like node.on
        _delegate: function(event, selector, handler) {
            var stopNode = this;
            this.on(event, function(evt) {
                var targets = evt.target.findAncestors(selector, true, stopNode);
                for(var i = 0; i < targets.length; i++) {
                    evt = Konva.Util.cloneObject(evt);
                    evt.currentTarget = targets[i];
                    handler.call(targets[i], evt);
                }
            });
        },
        /**
         * remove self from parent, but don't destroy
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Node}
         * @example
         * node.remove();
         */
        remove: function() {
            var parent = this.getParent();

            if(parent && parent.children) {
                parent.children.splice(this.index, 1);
                parent._setChildrenIndices();
                delete this.parent;
            }

            // every cached attr that is calculated via node tree
            // traversal must be cleared when removing a node
            this._clearSelfAndDescendantCache(STAGE);
            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
            this._clearSelfAndDescendantCache(VISIBLE);
            this._clearSelfAndDescendantCache(LISTENING);
            this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);

            return this;
        },
        /**
         * remove and destroy self
         * @method
         * @memberof Konva.Node.prototype
         * @example
         * node.destroy();
         */
        destroy: function() {
            // remove from ids and names hashes
            Konva._removeId(this.getId());
            Konva._removeName(this.getName(), this._id);

            this.remove();
            return this;
        },
        /**
         * get attr
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} attr
         * @returns {Integer|String|Object|Array}
         * @example
         * var x = node.getAttr('x');
         */
        getAttr: function(attr) {
            var method = GET + Konva.Util._capitalize(attr);
            if(Konva.Util._isFunction(this[method])) {
                return this[method]();
            }
            // otherwise get directly
            return this.attrs[attr];
        },
        /**
        * get ancestors
        * @method
        * @memberof Konva.Node.prototype
        * @returns {Konva.Collection}
        * @example
        * shape.getAncestors().each(function(node) {
        *   console.log(node.getId());
        * })
        */
        getAncestors: function() {
            var parent = this.getParent(),
                ancestors = new Konva.Collection();

            while (parent) {
                ancestors.push(parent);
                parent = parent.getParent();
            }

            return ancestors;
        },
        /**
         * get attrs object literal
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Object}
         */
        getAttrs: function() {
            return this.attrs || {};
        },
        /**
         * set multiple attrs at once using an object literal
         * @method
         * @memberof Konva.Node.prototype
         * @param {Object} config object containing key value pairs
         * @returns {Konva.Node}
         * @example
         * node.setAttrs({
         *   x: 5,
         *   fill: 'red'
         * });
         */
        setAttrs: function(config) {
            var key, method;

            if(!config) {
                return this;
            }
            for(key in config) {
                if (key === CHILDREN) {
                    continue;
                }
                method = SET + Konva.Util._capitalize(key);
                // use setter if available
                if(Konva.Util._isFunction(this[method])) {
                    this[method](config[key]);
                }
                // otherwise set directly
                else {
                    this._setAttr(key, config[key]);
                }
            }
            return this;
        },
        /**
         * determine if node is listening for events by taking into account ancestors.
         *
         * Parent    | Self      | isListening
         * listening | listening |
         * ----------+-----------+------------
         * T         | T         | T
         * T         | F         | F
         * F         | T         | T
         * F         | F         | F
         * ----------+-----------+------------
         * T         | I         | T
         * F         | I         | F
         * I         | I         | T
         *
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Boolean}
         */
        isListening: function() {
            return this._getCache(LISTENING, this._isListening);
        },
        _isListening: function() {
            var listening = this.getListening(),
                parent = this.getParent();

            // the following conditions are a simplification of the truth table above.
            // please modify carefully
            if (listening === 'inherit') {
                if (parent) {
                    return parent.isListening();
                }
                else {
                    return true;
                }
            }
            else {
                return listening;
            }
        },
        /**
         * determine if node is visible by taking into account ancestors.
         *
         * Parent    | Self      | isVisible
         * visible   | visible   |
         * ----------+-----------+------------
         * T         | T         | T
         * T         | F         | F
         * F         | T         | T
         * F         | F         | F
         * ----------+-----------+------------
         * T         | I         | T
         * F         | I         | F
         * I         | I         | T

         * @method
         * @memberof Konva.Node.prototype
         * @returns {Boolean}
         */
        isVisible: function() {
            return this._getCache(VISIBLE, this._isVisible);
        },
        _isVisible: function() {
            var visible = this.getVisible(),
                parent = this.getParent();

            // the following conditions are a simplification of the truth table above.
            // please modify carefully
            if (visible === 'inherit') {
                if (parent) {
                    return parent.isVisible();
                }
                else {
                    return true;
                }
            }
            else {
                return visible;
            }
        },
        /**
         * determine if listening is enabled by taking into account descendants.  If self or any children
         * have _isListeningEnabled set to true, then self also has listening enabled.
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Boolean}
         */
        shouldDrawHit: function(canvas) {
            var layer = this.getLayer();
            return (canvas && canvas.isCache) || (layer && layer.hitGraphEnabled())
                && this.isListening() && this.isVisible();
        },
        /**
         * show node
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Node}
         */
        show: function() {
            this.setVisible(true);
            return this;
        },
        /**
         * hide node.  Hidden nodes are no longer detectable
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Node}
         */
        hide: function() {
            this.setVisible(false);
            return this;
        },
        /**
         * get zIndex relative to the node's siblings who share the same parent
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Integer}
         */
        getZIndex: function() {
            return this.index || 0;
        },
        /**
         * get absolute z-index which takes into account sibling
         *  and ancestor indices
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Integer}
         */
        getAbsoluteZIndex: function() {
            var depth = this.getDepth(),
                that = this,
                index = 0,
                nodes, len, n, child;

            function addChildren(children) {
                nodes = [];
                len = children.length;
                for(n = 0; n < len; n++) {
                    child = children[n];
                    index++;

                    if(child.nodeType !== SHAPE) {
                        nodes = nodes.concat(child.getChildren().toArray());
                    }

                    if(child._id === that._id) {
                        n = len;
                    }
                }

                if(nodes.length > 0 && nodes[0].getDepth() <= depth) {
                    addChildren(nodes);
                }
            }
            if(that.nodeType !== UPPER_STAGE) {
                addChildren(that.getStage().getChildren());
            }

            return index;
        },
        /**
         * get node depth in node tree.  Returns an integer.
         *  e.g. Stage depth will always be 0.  Layers will always be 1.  Groups and Shapes will always
         *  be >= 2
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Integer}
         */
        getDepth: function() {
            var depth = 0,
                parent = this.parent;

            while(parent) {
                depth++;
                parent = parent.parent;
            }
            return depth;
        },
        setPosition: function(pos) {
            this.setX(pos.x);
            this.setY(pos.y);
            return this;
        },
        getPosition: function() {
            return {
                x: this.getX(),
                y: this.getY()
            };
        },
        /**
         * get absolute position relative to the top left corner of the stage container div
         * or relative to passed node
         * @method
         * @param {Object} [top] optional parent node
         * @memberof Konva.Node.prototype
         * @returns {Object}
         */
        getAbsolutePosition: function(top) {
            var absoluteMatrix = this.getAbsoluteTransform(top).getMatrix(),
                absoluteTransform = new Konva.Transform(),
                offset = this.offset();

            // clone the matrix array
            absoluteTransform.m = absoluteMatrix.slice();
            absoluteTransform.translate(offset.x, offset.y);

            return absoluteTransform.getTranslation();
        },
        /**
         * set absolute position
         * @method
         * @memberof Konva.Node.prototype
         * @param {Object} pos
         * @param {Number} pos.x
         * @param {Number} pos.y
         * @returns {Konva.Node}
         */
        setAbsolutePosition: function(pos) {
            var origTrans = this._clearTransform(),
                it;

            // don't clear translation
            this.attrs.x = origTrans.x;
            this.attrs.y = origTrans.y;
            delete origTrans.x;
            delete origTrans.y;

            // unravel transform
            it = this.getAbsoluteTransform();

            it.invert();
            it.translate(pos.x, pos.y);
            pos = {
                x: this.attrs.x + it.getTranslation().x,
                y: this.attrs.y + it.getTranslation().y
            };

            this.setPosition({x: pos.x, y: pos.y});
            this._setTransform(origTrans);

            return this;
        },
        _setTransform: function(trans) {
            var key;

            for(key in trans) {
                this.attrs[key] = trans[key];
            }

            this._clearCache(TRANSFORM);
            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
        },
        _clearTransform: function() {
            var trans = {
                x: this.getX(),
                y: this.getY(),
                rotation: this.getRotation(),
                scaleX: this.getScaleX(),
                scaleY: this.getScaleY(),
                offsetX: this.getOffsetX(),
                offsetY: this.getOffsetY(),
                skewX: this.getSkewX(),
                skewY: this.getSkewY()
            };

            this.attrs.x = 0;
            this.attrs.y = 0;
            this.attrs.rotation = 0;
            this.attrs.scaleX = 1;
            this.attrs.scaleY = 1;
            this.attrs.offsetX = 0;
            this.attrs.offsetY = 0;
            this.attrs.skewX = 0;
            this.attrs.skewY = 0;

            this._clearCache(TRANSFORM);
            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);

            // return original transform
            return trans;
        },
        /**
         * move node by an amount relative to its current position
         * @method
         * @memberof Konva.Node.prototype
         * @param {Object} change
         * @param {Number} change.x
         * @param {Number} change.y
         * @returns {Konva.Node}
         * @example
         * // move node in x direction by 1px and y direction by 2px
         * node.move({
         *   x: 1,
         *   y: 2)
         * });
         */
        move: function(change) {
            var changeX = change.x,
                changeY = change.y,
                x = this.getX(),
                y = this.getY();

            if(changeX !== undefined) {
                x += changeX;
            }

            if(changeY !== undefined) {
                y += changeY;
            }

            this.setPosition({x: x, y: y});
            return this;
        },
        _eachAncestorReverse: function(func, top) {
            var family = [],
                parent = this.getParent(),
                len, n;

            // if top node is defined, and this node is top node,
            // there's no need to build a family tree.  just execute
            // func with this because it will be the only node
            if (top && top._id === this._id) {
                func(this);
                return true;
            }

            family.unshift(this);

            while(parent && (!top || parent._id !== top._id)) {
                family.unshift(parent);
                parent = parent.parent;
            }

            len = family.length;
            for(n = 0; n < len; n++) {
                func(family[n]);
            }
        },
        /**
         * rotate node by an amount in degrees relative to its current rotation
         * @method
         * @memberof Konva.Node.prototype
         * @param {Number} theta
         * @returns {Konva.Node}
         */
        rotate: function(theta) {
            this.setRotation(this.getRotation() + theta);
            return this;
        },
        /**
         * move node to the top of its siblings
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Boolean}
         */
        moveToTop: function() {
            if (!this.parent) {
                Konva.Util.warn('Node has no parent. moveToTop function is ignored.');
                return false;
            }
            var index = this.index;
            this.parent.children.splice(index, 1);
            this.parent.children.push(this);
            this.parent._setChildrenIndices();
            return true;
        },
        /**
         * move node up
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Boolean} flag is moved or not
         */
        moveUp: function() {
            if (!this.parent) {
                Konva.Util.warn('Node has no parent. moveUp function is ignored.');
                return false;
            }
            var index = this.index,
                len = this.parent.getChildren().length;
            if(index < len - 1) {
                this.parent.children.splice(index, 1);
                this.parent.children.splice(index + 1, 0, this);
                this.parent._setChildrenIndices();
                return true;
            }
            return false;
        },
        /**
         * move node down
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Boolean}
         */
        moveDown: function() {
            if (!this.parent) {
                Konva.Util.warn('Node has no parent. moveDown function is ignored.');
                return false;
            }
            var index = this.index;
            if(index > 0) {
                this.parent.children.splice(index, 1);
                this.parent.children.splice(index - 1, 0, this);
                this.parent._setChildrenIndices();
                return true;
            }
            return false;
        },
        /**
         * move node to the bottom of its siblings
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Boolean}
         */
        moveToBottom: function() {
            if (!this.parent) {
                Konva.Util.warn('Node has no parent. moveToBottom function is ignored.');
                return false;
            }
            var index = this.index;
            if(index > 0) {
                this.parent.children.splice(index, 1);
                this.parent.children.unshift(this);
                this.parent._setChildrenIndices();
                return true;
            }
            return false;
        },
        /**
         * set zIndex relative to siblings
         * @method
         * @memberof Konva.Node.prototype
         * @param {Integer} zIndex
         * @returns {Konva.Node}
         */
        setZIndex: function(zIndex) {
            if (!this.parent) {
                Konva.Util.warn('Node has no parent. zIndex parameter is ignored.');
                return false;
            }
            var index = this.index;
            this.parent.children.splice(index, 1);
            this.parent.children.splice(zIndex, 0, this);
            this.parent._setChildrenIndices();
            return this;
        },
        /**
         * get absolute opacity
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Number}
         */
        getAbsoluteOpacity: function() {
            return this._getCache(ABSOLUTE_OPACITY, this._getAbsoluteOpacity);
        },
        _getAbsoluteOpacity: function() {
            var absOpacity = this.getOpacity();
            if(this.getParent()) {
                absOpacity *= this.getParent().getAbsoluteOpacity();
            }
            return absOpacity;
        },
        /**
         * move node to another container
         * @method
         * @memberof Konva.Node.prototype
         * @param {Container} newContainer
         * @returns {Konva.Node}
         * @example
         * // move node from current layer into layer2
         * node.moveTo(layer2);
         */
        moveTo: function(newContainer) {
            // do nothing if new container is already parent
            if (this.getParent() !== newContainer) {
                this.remove();
                newContainer.add(this);
            }
            return this;
        },
        /**
         * convert Node into an object for serialization.  Returns an object.
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Object}
         */
        toObject: function() {
            var obj = {},
                attrs = this.getAttrs(),
                key, val, getter, defaultValue;

            obj.attrs = {};

            for(key in attrs) {
                val = attrs[key];
                // serialize only attributes that are not function, image, DOM, or objects with methods
                if (Konva.Util._isFunction(val) || Konva.Util._isElement(val) ||
                    (Konva.Util._isObject(val) || Konva.Util._hasMethods(val))) {
                    continue;
                }
                getter = this[key];
                // remove attr value so that we can extract the default value from the getter
                delete attrs[key];
                defaultValue = getter ? getter.call(this) : null;
                // restore attr value
                attrs[key] = val;
                if (defaultValue !== val) {
                    obj.attrs[key] = val;
                }
            }

            obj.className = this.getClassName();
            return obj;
        },
        /**
         * convert Node into a JSON string.  Returns a JSON string.
         * @method
         * @memberof Konva.Node.prototype
         * @returns {String}}
         */
        toJSON: function() {
            return JSON.stringify(this.toObject());
        },
        /**
         * get parent container
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Node}
         */
        getParent: function() {
            return this.parent;
        },
        /**
         * get all ancestros (parent then parent of the parent, etc) of the node
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} [selector] selector for search
         * @param {Boolean} [includeSelf] show we think that node is ancestro itself?
         * @param {Konva.Node} [stopNode] optional node where we need to stop searching (one of ancestors)
         * @returns {Array} [ancestors]
         * @example
         * // get one of the parent group
         * var parentGroups = node.findAncestors('Group');
         */
        findAncestors: function(selector, includeSelf, stopNode) {
            var res = [];

            if (includeSelf && this._isMatch(selector)) {
                res.push(this);
            }
            var ancestor = this.parent;
            while(ancestor) {
                if (ancestor === stopNode) {
                    return res;
                }
                if (ancestor._isMatch(selector)) {
                    res.push(ancestor);
                }
                ancestor = ancestor.parent;
            }
            return res;
        },
        /**
         * get ancestor (parent or parent of the parent, etc) of the node that match passed selector
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} [selector] selector for search
         * @param {Boolean} [includeSelf] show we think that node is ancestro itself?
         * @param {Konva.Node} [stopNode] optional node where we need to stop searching (one of ancestors)
         * @returns {Konva.Node} ancestor
         * @example
         * // get one of the parent group
         * var group = node.findAncestors('.mygroup');
         */
        findAncestor: function(selector, includeSelf, stopNode) {
            return this.findAncestors(selector, includeSelf, stopNode)[0];
        },
        // is current node match passed selector?
        _isMatch: function(selector) {
            if (!selector) {
                return false;
            }
            var selectorArr = selector.replace(/ /g, '').split(','),
                len = selectorArr.length,
                n, sel;

            for (n = 0; n < len; n++) {
                sel = selectorArr[n];
                if (!Konva.Util.isValidSelector(sel)) {
                    Konva.Util.warn('Selector "' + sel + '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".');
                    Konva.Util.warn('If you have a custom shape with such className, please change it to start with upper letter like "Triangle".');
                    Konva.Util.warn('Konva is awesome, right?');
                }
                // id selector
                if(sel.charAt(0) === '#') {
                    if (this.id() === sel.slice(1)) {
                        return true;
                    }
                }
                // name selector
                else if(sel.charAt(0) === '.') {
                    if (this.hasName(sel.slice(1))) {
                        return true;
                    }
                } else if (this._get(sel).length !== 0) {
                    return true;
                }
            }
            return false;
        },
        /**
         * get layer ancestor
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Layer}
         */
        getLayer: function() {
            var parent = this.getParent();
            return parent ? parent.getLayer() : null;
        },
        /**
         * get stage ancestor
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Stage}
         */
        getStage: function() {
            return this._getCache(STAGE, this._getStage);
        },
        _getStage: function() {
            var parent = this.getParent();
            if(parent) {
                return parent.getStage();
            }
            else {
                return undefined;
            }
        },
        /**
         * fire event
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} eventType event type.  can be a regular event, like click, mouseover, or mouseout, or it can be a custom event, like myCustomEvent
         * @param {Event} [evt] event object
         * @param {Boolean} [bubble] setting the value to false, or leaving it undefined, will result in the event
         *  not bubbling.  Setting the value to true will result in the event bubbling.
         * @returns {Konva.Node}
         * @example
         * // manually fire click event
         * node.fire('click');
         *
         * // fire custom event
         * node.fire('foo');
         *
         * // fire custom event with custom event object
         * node.fire('foo', {
         *   bar: 10
         * });
         *
         * // fire click event that bubbles
         * node.fire('click', null, true);
         */
        fire: function(eventType, evt, bubble) {
            evt = evt || {};
            evt.target = evt.target || this;
            // bubble
            if (bubble) {
                this._fireAndBubble(eventType, evt);
            }
            // no bubble
            else {
                this._fire(eventType, evt);
            }
            return this;
        },
        /**
         * get absolute transform of the node which takes into
         *  account its ancestor transforms
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Transform}
         */
        getAbsoluteTransform: function(top) {
            // if using an argument, we can't cache the result.
            if (top) {
                return this._getAbsoluteTransform(top);
            }
            // if no argument, we can cache the result
            else {
                return this._getCache(ABSOLUTE_TRANSFORM, this._getAbsoluteTransform);
            }
        },
        _getAbsoluteTransform: function(top) {
            var at = new Konva.Transform(),
                transformsEnabled, trans;

            // start with stage and traverse downwards to self
            this._eachAncestorReverse(function(node) {
                transformsEnabled = node.transformsEnabled();
                trans = node.getTransform();

                if (transformsEnabled === 'all') {
                    at.multiply(trans);
                }
                else if (transformsEnabled === 'position') {
                    at.translate(node.x(), node.y());
                }
            }, top);
            return at;
        },
        /**
         * get absolute scale of the node which takes into
         *  account its ancestor scales
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Transform}
         */
        getAbsoluteScale: function(top) {
            // if using an argument, we can't cache the result.
            if (top) {
                return this._getAbsoluteTransform(top);
            }
            // if no argument, we can cache the result
            else {
                return this._getCache(ABSOLUTE_SCALE, this._getAbsoluteScale);
            }
        },
        _getAbsoluteScale: function(top) {
            var scaleX = 1, scaleY = 1;

            // start with stage and traverse downwards to self
            this._eachAncestorReverse(function(node) {
                scaleX *= node.scaleX();
                scaleY *= node.scaleY();
            }, top);
            return {
                x: scaleX,
                y: scaleY
            };
        },
        /**
         * get transform of the node
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Transform}
         */
        getTransform: function() {
            return this._getCache(TRANSFORM, this._getTransform);
        },
        _getTransform: function() {
            var m = new Konva.Transform(),
                x = this.getX(),
                y = this.getY(),
                rotation = Konva.getAngle(this.getRotation()),
                scaleX = this.getScaleX(),
                scaleY = this.getScaleY(),
                skewX = this.getSkewX(),
                skewY = this.getSkewY(),
                offsetX = this.getOffsetX(),
                offsetY = this.getOffsetY();

            if(x !== 0 || y !== 0) {
                m.translate(x, y);
            }
            if(rotation !== 0) {
                m.rotate(rotation);
            }
            if(skewX !== 0 || skewY !== 0) {
                m.skew(skewX, skewY);
            }
            if(scaleX !== 1 || scaleY !== 1) {
                m.scale(scaleX, scaleY);
            }
            if(offsetX !== 0 || offsetY !== 0) {
                m.translate(-1 * offsetX, -1 * offsetY);
            }

            return m;
        },
        /**
         * clone node.  Returns a new Node instance with identical attributes.  You can also override
         *  the node properties with an object literal, enabling you to use an existing node as a template
         *  for another node
         * @method
         * @memberof Konva.Node.prototype
         * @param {Object} obj override attrs
         * @returns {Konva.Node}
         * @example
         * // simple clone
         * var clone = node.clone();
         *
         * // clone a node and override the x position
         * var clone = rect.clone({
         *   x: 5
         * });
         */
        clone: function(obj) {
            // instantiate new node
            var attrs = Konva.Util.cloneObject(this.attrs),
                key, allListeners, len, n, listener;
            // filter black attrs
            for (var i in CLONE_BLACK_LIST) {
                var blockAttr = CLONE_BLACK_LIST[i];
                delete attrs[blockAttr];
            }
            // apply attr overrides
            for (key in obj) {
                attrs[key] = obj[key];
            }

            var node = new this.constructor(attrs);
            // copy over listeners
            for(key in this.eventListeners) {
                allListeners = this.eventListeners[key];
                len = allListeners.length;
                for(n = 0; n < len; n++) {
                    listener = allListeners[n];
                    /*
                     * don't include konva namespaced listeners because
                     *  these are generated by the constructors
                     */
                    if(listener.name.indexOf(KONVA) < 0) {
                        // if listeners array doesn't exist, then create it
                        if(!node.eventListeners[key]) {
                            node.eventListeners[key] = [];
                        }
                        node.eventListeners[key].push(listener);
                    }
                }
            }
            return node;
        },
        /**
         * Creates a composite data URL. If MIME type is not
         * specified, then "image/png" will result. For "image/jpeg", specify a quality
         * level as quality (range 0.0 - 1.0)
         * @method
         * @memberof Konva.Node.prototype
         * @param {Object} config
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         * @paremt {Number} [config.pixelRatio] pixelRatio of ouput image url. Default is 1
         * @returns {String}
         */
        toDataURL: function(config) {
            config = config || {};

            var mimeType = config.mimeType || null,
                quality = config.quality || null,
                stage = this.getStage(),
                x = config.x || 0,
                y = config.y || 0,
                pixelRatio = config.pixelRatio || 1,
                canvas = new Konva.SceneCanvas({
                    width: config.width || this.getWidth() || (stage ? stage.getWidth() : 0),
                    height: config.height || this.getHeight() || (stage ? stage.getHeight() : 0),
                    pixelRatio: pixelRatio
                }),
                context = canvas.getContext();

            context.save();

            if(x || y) {
                context.translate(-1 * x, -1 * y);
            }

            this.drawScene(canvas);
            context.restore();

            return canvas.toDataURL(mimeType, quality);
        },
        /**
         * converts node into an image.  Since the toImage
         *  method is asynchronous, a callback is required.  toImage is most commonly used
         *  to cache complex drawings as an image so that they don't have to constantly be redrawn
         * @method
         * @memberof Konva.Node.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         * @paremt {Number} [config.pixelRatio] pixelRatio of ouput image.  Default is 1.
         * @example
         * var image = node.toImage({
         *   callback: function(img) {
         *     // do stuff with img
         *   }
         * });
         */
        toImage: function(config) {
            if (!config || !config.callback) {
                throw 'callback required for toImage method config argument';
            }
            Konva.Util._getImage(this.toDataURL(config), function(img) {
                config.callback(img);
            });
        },
        setSize: function(size) {
            this.setWidth(size.width);
            this.setHeight(size.height);
            return this;
        },
        getSize: function() {
            return {
                width: this.getWidth(),
                height: this.getHeight()
            };
        },
        getWidth: function() {
            return this.attrs.width || 0;
        },
        getHeight: function() {
            return this.attrs.height || 0;
        },
        /**
         * get class name, which may return Stage, Layer, Group, or shape class names like Rect, Circle, Text, etc.
         * @method
         * @memberof Konva.Node.prototype
         * @returns {String}
         */
        getClassName: function() {
            return this.className || this.nodeType;
        },
        /**
         * get the node type, which may return Stage, Layer, Group, or Node
         * @method
         * @memberof Konva.Node.prototype
         * @returns {String}
         */
        getType: function() {
            return this.nodeType;
        },
        getDragDistance: function() {
            // compare with undefined because we need to track 0 value
            if (this.attrs.dragDistance !== undefined) {
                return this.attrs.dragDistance;
            } else if (this.parent) {
                return this.parent.getDragDistance();
            } else {
                return Konva.dragDistance;
            }
        },
        _get: function(selector) {
            return this.className === selector || this.nodeType === selector ? [this] : [];
        },
        _off: function(type, name) {
            var evtListeners = this.eventListeners[type],
                i, evtName;

            for(i = 0; i < evtListeners.length; i++) {
                evtName = evtListeners[i].name;
                // the following two conditions must be true in order to remove a handler:
                // 1) the current event name cannot be konva unless the event name is konva
                //    this enables developers to force remove a konva specific listener for whatever reason
                // 2) an event name is not specified, or if one is specified, it matches the current event name
                if((evtName !== 'konva' || name === 'konva') && (!name || evtName === name)) {
                    evtListeners.splice(i, 1);
                    if(evtListeners.length === 0) {
                        delete this.eventListeners[type];
                        break;
                    }
                    i--;
                }
            }
        },
        _fireChangeEvent: function(attr, oldVal, newVal) {
            this._fire(attr + CHANGE, {
                oldVal: oldVal,
                newVal: newVal
            });
        },
        setId: function(id) {
            var oldId = this.getId();

            Konva._removeId(oldId);
            Konva._addId(this, id);
            this._setAttr(ID, id);
            return this;
        },
        setName: function(name) {
            var oldNames = (this.getName() || '').split(/\s/g);
            var newNames = (name || '').split(/\s/g);
            var subname, i;
            // remove all subnames
            for(i = 0; i < oldNames.length; i++) {
                subname = oldNames[i];
                if ((newNames.indexOf(subname)) === -1 && subname) {
                    Konva._removeName(subname, this._id);
                }
            }

            // add new names
            for(i = 0; i < newNames.length; i++) {
                subname = newNames[i];
                if ((oldNames.indexOf(subname) === -1) && subname) {
                    Konva._addName(this, subname);
                }
            }

            this._setAttr(NAME, name);
            return this;
        },
        // naming methods
        /**
         * add name to node
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} name
         * @returns {Konva.Node}
         * @example
         * node.name('red');
         * node.addName('selected');
         * node.name(); // return 'red selected'
         */
        addName: function(name) {
            if (!this.hasName(name)) {
                var oldName = this.name();
                var newName = oldName ? (oldName + ' ' + name) : name;
                this.setName(newName);
            }
            return this;
        },
        /**
         * check is node has name
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} name
         * @returns {Boolean}
         * @example
         * node.name('red');
         * node.hasName('red');   // return true
         * node.hasName('selected'); // return false
         */
        hasName: function(name) {
            var names = (this.name() || '').split(/\s/g);
            return names.indexOf(name) !== -1;
        },
        /**
         * remove name from node
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} name
         * @returns {Konva.Node}
         * @example
         * node.name('red selected');
         * node.removeName('selected');
         * node.hasName('selected'); // return false
         * node.name(); // return 'red'
         */
        removeName: function(name) {
            var names = (this.name() || '').split(/\s/g);
            var index = names.indexOf(name);
            if (index !== -1) {
                names.splice(index, 1);
                this.setName(names.join(' '));
            }
            return this;
        },
        /**
         * set attr
         * @method
         * @memberof Konva.Node.prototype
         * @param {String} attr
         * @param {*} val
         * @returns {Konva.Node}
         * @example
         * node.setAttr('x', 5);
         */
        setAttr: function(attr, val) {
            var method = SET + Konva.Util._capitalize(attr),
                func = this[method];

            if(Konva.Util._isFunction(func)) {
                func.call(this, val);
            }
            // otherwise set directly
            else {
                this._setAttr(attr, val);
            }
            return this;
        },
        _setAttr: function(key, val) {
            var oldVal;
            if(val !== undefined) {
                oldVal = this.attrs[key];
                if (oldVal === val) {
                    return;
                }
                this.attrs[key] = val;
                this._fireChangeEvent(key, oldVal, val);
            }
        },
        _setComponentAttr: function(key, component, val) {
            var oldVal;
            if(val !== undefined) {
                oldVal = this.attrs[key];

                if (!oldVal) {
                    // set value to default value using getAttr
                    this.attrs[key] = this.getAttr(key);
                }

                this.attrs[key][component] = val;
                this._fireChangeEvent(key, oldVal, val);
            }
        },
        _fireAndBubble: function(eventType, evt, compareShape) {
            var okayToRun = true;

            if(evt && this.nodeType === SHAPE) {
                evt.target = this;
            }

            if(eventType === MOUSEENTER && compareShape && (this._id === compareShape._id || (this.isAncestorOf && this.isAncestorOf(compareShape)))) {
                okayToRun = false;
            }
            else if(eventType === MOUSELEAVE && compareShape && (this._id === compareShape._id || (this.isAncestorOf && this.isAncestorOf(compareShape)))) {
                okayToRun = false;
            }
            if(okayToRun) {
                this._fire(eventType, evt);

                // simulate event bubbling
                var stopBubble = (eventType === MOUSEENTER || eventType === MOUSELEAVE) && ((compareShape && compareShape.isAncestorOf && compareShape.isAncestorOf(this)) || !!(compareShape && compareShape.isAncestorOf));
                if((evt && !evt.cancelBubble || !evt) && this.parent && this.parent.isListening() && (!stopBubble)) {
                    if(compareShape && compareShape.parent) {
                        this._fireAndBubble.call(this.parent, eventType, evt, compareShape.parent);
                    }
                    else {
                        this._fireAndBubble.call(this.parent, eventType, evt);
                    }
                }
            }
        },
        _fire: function(eventType, evt) {
            var events = this.eventListeners[eventType],
                i;

            evt = evt || {};
            evt.currentTarget = this;
            evt.type = eventType;

            if (events) {
                for(i = 0; i < events.length; i++) {
                    events[i].handler.call(this, evt);
                }
            }
        },
        /**
         * draw both scene and hit graphs.  If the node being drawn is the stage, all of the layers will be cleared and redrawn
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Konva.Node}
         */
        draw: function() {
            this.drawScene();
            this.drawHit();
            return this;
        }
    });

    /**
     * create node with JSON string or an Object.  De-serializtion does not generate custom
     *  shape drawing functions, images, or event handlers (this would make the
     *  serialized object huge).  If your app uses custom shapes, images, and
     *  event handlers (it probably does), then you need to select the appropriate
     *  shapes after loading the stage and set these properties via on(), setDrawFunc(),
     *  and setImage() methods
     * @method
     * @memberof Konva.Node
     * @param {String|Object} json string or object
     * @param {Element} [container] optional container dom element used only if you're
     *  creating a stage node
     */
    Konva.Node.create = function(data, container) {
        if (Konva.Util._isString(data)) {
            data = JSON.parse(data);
        }
        return this._createNode(data, container);
    };
    Konva.Node._createNode = function(obj, container) {
        var className = Konva.Node.prototype.getClassName.call(obj),
            children = obj.children,
            no, len, n;

        // if container was passed in, add it to attrs
        if(container) {
            obj.attrs.container = container;
        }

        no = new Konva[className](obj.attrs);
        if(children) {
            len = children.length;
            for(n = 0; n < len; n++) {
                no.add(this._createNode(children[n]));
            }
        }

        return no;
    };


    // =========================== add getters setters ===========================

    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'position');
    /**
     * get/set node position relative to parent
     * @name position
     * @method
     * @memberof Konva.Node.prototype
     * @param {Object} pos
     * @param {Number} pos.x
     * @param {Number} pos.y
     * @returns {Object}
     * @example
     * // get position
     * var position = node.position();
     *
     * // set position
     * node.position({
     *   x: 5
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'x', 0);

    /**
     * get/set x position
     * @name x
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} x
     * @returns {Object}
     * @example
     * // get x
     * var x = node.x();
     *
     * // set x
     * node.x(5);
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'y', 0);

    /**
     * get/set y position
     * @name y
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} y
     * @returns {Integer}
     * @example
     * // get y
     * var y = node.y();
     *
     * // set y
     * node.y(5);
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'opacity', 1);

    /**
     * get/set opacity.  Opacity values range from 0 to 1.
     *  A node with an opacity of 0 is fully transparent, and a node
     *  with an opacity of 1 is fully opaque
     * @name opacity
     * @method
     * @memberof Konva.Node.prototype
     * @param {Object} opacity
     * @returns {Number}
     * @example
     * // get opacity
     * var opacity = node.opacity();
     *
     * // set opacity
     * node.opacity(0.5);
     */

    Konva.Factory.addGetter(Konva.Node, 'name');
    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'name');

    /**
     * get/set name
     * @name name
     * @method
     * @memberof Konva.Node.prototype
     * @param {String} name
     * @returns {String}
     * @example
     * // get name
     * var name = node.name();
     *
     * // set name
     * node.name('foo');
     *
     * // also node may have multiple names (as css classes)
     * node.name('foo bar');
     */

    Konva.Factory.addGetter(Konva.Node, 'id');
    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'id');

    /**
     * get/set id. Id is global for whole page.
     * @name id
     * @method
     * @memberof Konva.Node.prototype
     * @param {String} id
     * @returns {String}
     * @example
     * // get id
     * var name = node.id();
     *
     * // set id
     * node.id('foo');
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'rotation', 0);

    /**
     * get/set rotation in degrees
     * @name rotation
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} rotation
     * @returns {Number}
     * @example
     * // get rotation in degrees
     * var rotation = node.rotation();
     *
     * // set rotation in degrees
     * node.rotation(45);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Node, 'scale', ['x', 'y']);

    /**
     * get/set scale
     * @name scale
     * @param {Object} scale
     * @param {Number} scale.x
     * @param {Number} scale.y
     * @method
     * @memberof Konva.Node.prototype
     * @returns {Object}
     * @example
     * // get scale
     * var scale = node.scale();
     *
     * // set scale
     * shape.scale({
     *   x: 2
     *   y: 3
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'scaleX', 1);

    /**
     * get/set scale x
     * @name scaleX
     * @param {Number} x
     * @method
     * @memberof Konva.Node.prototype
     * @returns {Number}
     * @example
     * // get scale x
     * var scaleX = node.scaleX();
     *
     * // set scale x
     * node.scaleX(2);
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'scaleY', 1);

    /**
     * get/set scale y
     * @name scaleY
     * @param {Number} y
     * @method
     * @memberof Konva.Node.prototype
     * @returns {Number}
     * @example
     * // get scale y
     * var scaleY = node.scaleY();
     *
     * // set scale y
     * node.scaleY(2);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Node, 'skew', ['x', 'y']);

    /**
     * get/set skew
     * @name skew
     * @param {Object} skew
     * @param {Number} skew.x
     * @param {Number} skew.y
     * @method
     * @memberof Konva.Node.prototype
     * @returns {Object}
     * @example
     * // get skew
     * var skew = node.skew();
     *
     * // set skew
     * node.skew({
     *   x: 20
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'skewX', 0);

    /**
     * get/set skew x
     * @name skewX
     * @param {Number} x
     * @method
     * @memberof Konva.Node.prototype
     * @returns {Number}
     * @example
     * // get skew x
     * var skewX = node.skewX();
     *
     * // set skew x
     * node.skewX(3);
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'skewY', 0);

    /**
     * get/set skew y
     * @name skewY
     * @param {Number} y
     * @method
     * @memberof Konva.Node.prototype
     * @returns {Number}
     * @example
     * // get skew y
     * var skewY = node.skewY();
     *
     * // set skew y
     * node.skewY(3);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Node, 'offset', ['x', 'y']);

    /**
     * get/set offset.  Offsets the default position and rotation point
     * @method
     * @memberof Konva.Node.prototype
     * @param {Object} offset
     * @param {Number} offset.x
     * @param {Number} offset.y
     * @returns {Object}
     * @example
     * // get offset
     * var offset = node.offset();
     *
     * // set offset
     * node.offset({
     *   x: 20
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'offsetX', 0);

    /**
     * get/set offset x
     * @name offsetX
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get offset x
     * var offsetX = node.offsetX();
     *
     * // set offset x
     * node.offsetX(3);
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'offsetY', 0);

    /**
     * get/set offset y
     * @name offsetY
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get offset y
     * var offsetY = node.offsetY();
     *
     * // set offset y
     * node.offsetY(3);
     */

    Konva.Factory.addSetter(Konva.Node, 'dragDistance');
    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'dragDistance');

    /**
     * get/set drag distance
     * @name dragDistance
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} distance
     * @returns {Number}
     * @example
     * // get drag distance
     * var dragDistance = node.dragDistance();
     *
     * // set distance
     * // node starts dragging only if pointer moved more then 3 pixels
     * node.dragDistance(3);
     * // or set globally
     * Konva.dragDistance = 3;
     */


    Konva.Factory.addSetter(Konva.Node, 'width', 0);
    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'width');
    /**
     * get/set width
     * @name width
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} width
     * @returns {Number}
     * @example
     * // get width
     * var width = node.width();
     *
     * // set width
     * node.width(100);
     */

    Konva.Factory.addSetter(Konva.Node, 'height', 0);
    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'height');
    /**
     * get/set height
     * @name height
     * @method
     * @memberof Konva.Node.prototype
     * @param {Number} height
     * @returns {Number}
     * @example
     * // get height
     * var height = node.height();
     *
     * // set height
     * node.height(100);
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'listening', 'inherit');
    /**
     * get/set listenig attr.  If you need to determine if a node is listening or not
     *   by taking into account its parents, use the isListening() method
     * @name listening
     * @method
     * @memberof Konva.Node.prototype
     * @param {Boolean|String} listening Can be "inherit", true, or false.  The default is "inherit".
     * @returns {Boolean|String}
     * @example
     * // get listening attr
     * var listening = node.listening();
     *
     * // stop listening for events
     * node.listening(false);
     *
     * // listen for events
     * node.listening(true);
     *
     * // listen to events according to the parent
     * node.listening('inherit');
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'filters', undefined, function(val) {this._filterUpToDate = false; return val; });
    /**
     * get/set filters.  Filters are applied to cached canvases
     * @name filters
     * @method
     * @memberof Konva.Node.prototype
     * @param {Array} filters array of filters
     * @returns {Array}
     * @example
     * // get filters
     * var filters = node.filters();
     *
     * // set a single filter
     * node.cache();
     * node.filters([Konva.Filters.Blur]);
     *
     * // set multiple filters
     * node.cache();
     * node.filters([
     *   Konva.Filters.Blur,
     *   Konva.Filters.Sepia,
     *   Konva.Filters.Invert
     * ]);
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'visible', 'inherit');
    /**
     * get/set visible attr.  Can be "inherit", true, or false.  The default is "inherit".
     *   If you need to determine if a node is visible or not
     *   by taking into account its parents, use the isVisible() method
     * @name visible
     * @method
     * @memberof Konva.Node.prototype
     * @param {Boolean|String} visible
     * @returns {Boolean|String}
     * @example
     * // get visible attr
     * var visible = node.visible();
     *
     * // make invisible
     * node.visible(false);
     *
     * // make visible
     * node.visible(true);
     *
     * // make visible according to the parent
     * node.visible('inherit');
     */

    Konva.Factory.addGetterSetter(Konva.Node, 'transformsEnabled', 'all');

    /**
     * get/set transforms that are enabled.  Can be "all", "none", or "position".  The default
     *  is "all"
     * @name transformsEnabled
     * @method
     * @memberof Konva.Node.prototype
     * @param {String} enabled
     * @returns {String}
     * @example
     * // enable position transform only to improve draw performance
     * node.transformsEnabled('position');
     *
     * // enable all transforms
     * node.transformsEnabled('all');
     */



    /**
     * get/set node size
     * @name size
     * @method
     * @memberof Konva.Node.prototype
     * @param {Object} size
     * @param {Number} size.width
     * @param {Number} size.height
     * @returns {Object}
     * @example
     * // get node size
     * var size = node.size();
     * var x = size.x;
     * var y = size.y;
     *
     * // set size
     * node.size({
     *   width: 100,
     *   height: 200
     * });
     */
    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'size');

    Konva.Factory.backCompat(Konva.Node, {
        rotateDeg: 'rotate',
        setRotationDeg: 'setRotation',
        getRotationDeg: 'getRotation'
    });

    Konva.Collection.mapMethods(Konva.Node);
})(Konva);

(function() {
    'use strict';
    /**
    * Grayscale Filter
    * @function
    * @memberof Konva.Filters
    * @param {Object} imageData
    * @example
    * node.cache();
    * node.filters([Konva.Filters.Grayscale]);
    */
    Konva.Filters.Grayscale = function(imageData) {
        var data = imageData.data,
            len = data.length,
            i, brightness;

        for(i = 0; i < len; i += 4) {
            brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            // red
            data[i] = brightness;
            // green
            data[i + 1] = brightness;
            // blue
            data[i + 2] = brightness;
        }
    };
})();

(function() {
    'use strict';
    /**
     * Brighten Filter.
     * @function
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Brighten]);
     * node.brightness(0.8);
     */
    Konva.Filters.Brighten = function(imageData) {
        var brightness = this.brightness() * 255,
            data = imageData.data,
            len = data.length,
            i;

        for(i = 0; i < len; i += 4) {
            // red
            data[i] += brightness;
            // green
            data[i + 1] += brightness;
            // blue
            data[i + 2] += brightness;
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'brightness', 0, null, Konva.Factory.afterSetFilter);
    /**
    * get/set filter brightness.  The brightness is a number between -1 and 1.&nbsp; Positive values
    *  brighten the pixels and negative values darken them. Use with {@link Konva.Filters.Brighten} filter.
    * @name brightness
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} brightness value between -1 and 1
    * @returns {Number}
    */

})();

(function() {
    'use strict';
    /**
    * Invert Filter
    * @function
    * @memberof Konva.Filters
    * @param {Object} imageData
    * @example
    * node.cache();
    * node.filters([Konva.Filters.Invert]);
    */
    Konva.Filters.Invert = function(imageData) {
        var data = imageData.data,
            len = data.length,
            i;

        for(i = 0; i < len; i += 4) {
            // red
            data[i] = 255 - data[i];
            // green
            data[i + 1] = 255 - data[i + 1];
            // blue
            data[i + 2] = 255 - data[i + 2];
        }
    };
})();

/*
 the Gauss filter
 master repo: https://github.com/pavelpower/kineticjsGaussFilter
*/
(function() {
    'use strict';
    /*

     StackBlur - a fast almost Gaussian Blur For Canvas

     Version:   0.5
     Author:    Mario Klingemann
     Contact:   mario@quasimondo.com
     Website:   http://www.quasimondo.com/StackBlurForCanvas
     Twitter:   @quasimondo

     In case you find this class useful - especially in commercial projects -
     I am not totally unhappy for a small donation to my PayPal account
     mario@quasimondo.de

     Or support me on flattr:
     https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

     Copyright (c) 2010 Mario Klingemann

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without
     restriction, including without limitation the rights to use,
     copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the
     Software is furnished to do so, subject to the following
     conditions:

     The above copyright notice and this permission notice shall be
     included in all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
     OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
     OTHER DEALINGS IN THE SOFTWARE.
     */

    function BlurStack() {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 0;
        this.next = null;
    }

    var mul_table = [
        512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
        454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
        482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
        437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
        497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
        320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
        446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
        329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
        505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
        399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
        324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
        268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
        451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
        385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
        332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
        289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259
    ];

    var shg_table = [
        9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
        17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
        19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
        20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
        21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
        21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
        23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24
    ];

    function filterGaussBlurRGBA( imageData, radius) {

        var pixels = imageData.data,
            width = imageData.width,
            height = imageData.height;

        var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,
            r_out_sum, g_out_sum, b_out_sum, a_out_sum,
            r_in_sum, g_in_sum, b_in_sum, a_in_sum,
            pr, pg, pb, pa, rbs;

        var div = radius + radius + 1,
            widthMinus1 = width - 1,
            heightMinus1 = height - 1,
            radiusPlus1 = radius + 1,
            sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2,
            stackStart = new BlurStack(),
            stackEnd = null,
            stack = stackStart,
            stackIn = null,
            stackOut = null,
            mul_sum = mul_table[radius],
            shg_sum = shg_table[radius];

        for ( i = 1; i < div; i++ ) {
            stack = stack.next = new BlurStack();
            if ( i === radiusPlus1 ){
                stackEnd = stack;
            }
        }

        stack.next = stackStart;

        yw = yi = 0;

        for ( y = 0; y < height; y++ )
        {
            r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

            r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
            g_out_sum = radiusPlus1 * ( pg = pixels[yi + 1] );
            b_out_sum = radiusPlus1 * ( pb = pixels[yi + 2] );
            a_out_sum = radiusPlus1 * ( pa = pixels[yi + 3] );

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;
            a_sum += sumFactor * pa;

            stack = stackStart;

            for( i = 0; i < radiusPlus1; i++ )
            {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack.a = pa;
                stack = stack.next;
            }

            for( i = 1; i < radiusPlus1; i++ )
            {
                p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
                r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
                g_sum += ( stack.g = ( pg = pixels[p + 1])) * rbs;
                b_sum += ( stack.b = ( pb = pixels[p + 2])) * rbs;
                a_sum += ( stack.a = ( pa = pixels[p + 3])) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;
                a_in_sum += pa;

                stack = stack.next;
            }


            stackIn = stackStart;
            stackOut = stackEnd;
            for ( x = 0; x < width; x++ )
            {
                pixels[yi + 3] = pa = (a_sum * mul_sum) >> shg_sum;
                if ( pa !== 0 )
                {
                    pa = 255 / pa;
                    pixels[yi] = ((r_sum * mul_sum) >> shg_sum) * pa;
                    pixels[yi + 1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                    pixels[yi + 2] = ((b_sum * mul_sum) >> shg_sum) * pa;
                } else {
                    pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
                }

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;
                a_sum -= a_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;
                a_out_sum -= stackIn.a;

                p = (yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

                r_in_sum += ( stackIn.r = pixels[p]);
                g_in_sum += ( stackIn.g = pixels[p + 1]);
                b_in_sum += ( stackIn.b = pixels[p + 2]);
                a_in_sum += ( stackIn.a = pixels[p + 3]);

                r_sum += r_in_sum;
                g_sum += g_in_sum;
                b_sum += b_in_sum;
                a_sum += a_in_sum;

                stackIn = stackIn.next;

                r_out_sum += ( pr = stackOut.r );
                g_out_sum += ( pg = stackOut.g );
                b_out_sum += ( pb = stackOut.b );
                a_out_sum += ( pa = stackOut.a );

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;
                a_in_sum -= pa;

                stackOut = stackOut.next;

                yi += 4;
            }
            yw += width;
        }


        for ( x = 0; x < width; x++ )
        {
            g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

            yi = x << 2;
            r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
            g_out_sum = radiusPlus1 * ( pg = pixels[yi + 1]);
            b_out_sum = radiusPlus1 * ( pb = pixels[yi + 2]);
            a_out_sum = radiusPlus1 * ( pa = pixels[yi + 3]);

            r_sum += sumFactor * pr;
            g_sum += sumFactor * pg;
            b_sum += sumFactor * pb;
            a_sum += sumFactor * pa;

            stack = stackStart;

            for( i = 0; i < radiusPlus1; i++ )
            {
                stack.r = pr;
                stack.g = pg;
                stack.b = pb;
                stack.a = pa;
                stack = stack.next;
            }

            yp = width;

            for( i = 1; i <= radius; i++ )
            {
                yi = ( yp + x ) << 2;

                r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
                g_sum += ( stack.g = ( pg = pixels[yi + 1])) * rbs;
                b_sum += ( stack.b = ( pb = pixels[yi + 2])) * rbs;
                a_sum += ( stack.a = ( pa = pixels[yi + 3])) * rbs;

                r_in_sum += pr;
                g_in_sum += pg;
                b_in_sum += pb;
                a_in_sum += pa;

                stack = stack.next;

                if( i < heightMinus1 )
                {
                    yp += width;
                }
            }

            yi = x;
            stackIn = stackStart;
            stackOut = stackEnd;
            for ( y = 0; y < height; y++ )
            {
                p = yi << 2;
                pixels[p + 3] = pa = (a_sum * mul_sum) >> shg_sum;
                if ( pa > 0 )
                {
                    pa = 255 / pa;
                    pixels[p] = ((r_sum * mul_sum) >> shg_sum ) * pa;
                    pixels[p + 1] = ((g_sum * mul_sum) >> shg_sum ) * pa;
                    pixels[p + 2] = ((b_sum * mul_sum) >> shg_sum ) * pa;
                } else {
                    pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
                }

                r_sum -= r_out_sum;
                g_sum -= g_out_sum;
                b_sum -= b_out_sum;
                a_sum -= a_out_sum;

                r_out_sum -= stackIn.r;
                g_out_sum -= stackIn.g;
                b_out_sum -= stackIn.b;
                a_out_sum -= stackIn.a;

                p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;

                r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
                g_sum += ( g_in_sum += ( stackIn.g = pixels[p + 1]));
                b_sum += ( b_in_sum += ( stackIn.b = pixels[p + 2]));
                a_sum += ( a_in_sum += ( stackIn.a = pixels[p + 3]));

                stackIn = stackIn.next;

                r_out_sum += ( pr = stackOut.r );
                g_out_sum += ( pg = stackOut.g );
                b_out_sum += ( pb = stackOut.b );
                a_out_sum += ( pa = stackOut.a );

                r_in_sum -= pr;
                g_in_sum -= pg;
                b_in_sum -= pb;
                a_in_sum -= pa;

                stackOut = stackOut.next;

                yi += width;
            }
        }
    }

    /**
     * Blur Filter
     * @function
     * @name Blur
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Blur]);
     * node.blurRadius(10);
     */
    Konva.Filters.Blur = function Blur(imageData) {
        var radius = Math.round(this.blurRadius());

        if (radius > 0) {
            filterGaussBlurRGBA(imageData, radius);
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'blurRadius', 0, null, Konva.Factory.afterSetFilter);

    /**
    * get/set blur radius. Use with {@link Konva.Filters.Blur} filter
    * @name blurRadius
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} radius
    * @returns {Integer}
    */
})();

/*eslint-disable  max-depth */
(function() {
	'use strict';
	function pixelAt(idata, x, y) {
		var idx = (y * idata.width + x) * 4;
		var d = [];
		d.push(idata.data[idx++], idata.data[idx++], idata.data[idx++], idata.data[idx++]);
		return d;
	}

	function rgbDistance(p1, p2) {
		return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
	}

	function rgbMean(pTab) {
		var m = [0, 0, 0];

		for (var i = 0; i < pTab.length; i++) {
			m[0] += pTab[i][0];
			m[1] += pTab[i][1];
			m[2] += pTab[i][2];
		}

		m[0] /= pTab.length;
		m[1] /= pTab.length;
		m[2] /= pTab.length;

		return m;
	}

	function backgroundMask(idata, threshold) {
		var rgbv_no = pixelAt(idata, 0, 0);
		var rgbv_ne = pixelAt(idata, idata.width - 1, 0);
		var rgbv_so = pixelAt(idata, 0, idata.height - 1);
		var rgbv_se = pixelAt(idata, idata.width - 1, idata.height - 1);


		var thres = threshold || 10;
		if (rgbDistance(rgbv_no, rgbv_ne) < thres && rgbDistance(rgbv_ne, rgbv_se) < thres && rgbDistance(rgbv_se, rgbv_so) < thres && rgbDistance(rgbv_so, rgbv_no) < thres) {

			// Mean color
			var mean = rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);

			// Mask based on color distance
			var mask = [];
			for (var i = 0; i < idata.width * idata.height; i++) {
				var d = rgbDistance(mean, [idata.data[i * 4], idata.data[i * 4 + 1], idata.data[i * 4 + 2]]);
				mask[i] = (d < thres) ? 0 : 255;
			}

			return mask;
		}
	}

	function applyMask(idata, mask) {
		for (var i = 0; i < idata.width * idata.height; i++) {
			idata.data[4 * i + 3] = mask[i];
		}
	}

	function erodeMask(mask, sw, sh) {

		var weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side / 2);

		var maskResult = [];
		for (var y = 0; y < sh; y++) {
			for (var x = 0; x < sw; x++) {

				var so = y * sw + x;
				var a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = y + cy - halfSide;
						var scx = x + cx - halfSide;

						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

							var srcOff = scy * sw + scx;
							var wt = weights[cy * side + cx];

							a += mask[srcOff] * wt;
						}
					}
				}

				maskResult[so] = (a === 255 * 8) ? 255 : 0;
			}
		}

		return maskResult;
	}

	function dilateMask(mask, sw, sh) {

		var weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side / 2);

		var maskResult = [];
		for (var y = 0; y < sh; y++) {
			for (var x = 0; x < sw; x++) {

				var so = y * sw + x;
				var a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = y + cy - halfSide;
						var scx = x + cx - halfSide;

						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

							var srcOff = scy * sw + scx;
							var wt = weights[cy * side + cx];

							a += mask[srcOff] * wt;
						}
					}
				}

				maskResult[so] = (a >= 255 * 4) ? 255 : 0;
			}
		}

		return maskResult;
	}

	function smoothEdgeMask(mask, sw, sh) {

		var weights = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side / 2);

		var maskResult = [];
		for (var y = 0; y < sh; y++) {
			for (var x = 0; x < sw; x++) {

				var so = y * sw + x;
				var a = 0;
				for (var cy = 0; cy < side; cy++) {
					for (var cx = 0; cx < side; cx++) {
						var scy = y + cy - halfSide;
						var scx = x + cx - halfSide;

						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

							var srcOff = scy * sw + scx;
							var wt = weights[cy * side + cx];

							a += mask[srcOff] * wt;
						}
					}
				}

				maskResult[so] = a;
			}
		}

		return maskResult;
	}

	/**
	 * Mask Filter
	 * @function
	 * @name Mask
	 * @memberof Konva.Filters
	 * @param {Object} imageData
	 * @example
     * node.cache();
     * node.filters([Konva.Filters.Mask]);
     * node.threshold(200);
	 */
	Konva.Filters.Mask = function(imageData) {
		// Detect pixels close to the background color
		var threshold = this.threshold(),
        mask = backgroundMask(imageData, threshold);
		if (mask) {
			// Erode
			mask = erodeMask(mask, imageData.width, imageData.height);

			// Dilate
			mask = dilateMask(mask, imageData.width, imageData.height);

			// Gradient
			mask = smoothEdgeMask(mask, imageData.width, imageData.height);

			// Apply mask
			applyMask(imageData, mask);

			// todo : Update hit region function according to mask
		}

		return imageData;
	};

	Konva.Factory.addGetterSetter(Konva.Node, 'threshold', 0, null, Konva.Factory.afterSetFilter);
})();

(function () {
    'use strict';
    /**
     * RGB Filter
     * @function
     * @name RGB
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @author ippo615
     * @example
     * node.cache();
     * node.filters([Konva.Filters.RGB]);
     * node.blue(120);
     * node.green(200);
     */
    Konva.Filters.RGB = function (imageData) {
        var data = imageData.data,
            nPixels = data.length,
            red = this.red(),
            green = this.green(),
            blue = this.blue(),
            i, brightness;

        for (i = 0; i < nPixels; i += 4) {
            brightness = (0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2]) / 255;
            data[i] = brightness * red; // r
            data[i + 1] = brightness * green; // g
            data[i + 2] = brightness * blue; // b
            data[i + 3] = data[i + 3]; // alpha
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'red', 0, function(val) {
        this._filterUpToDate = false;
        if (val > 255) {
            return 255;
        }
        else if (val < 0) {
            return 0;
        }
        else {
            return Math.round(val);
        }
    });
    /**
    * get/set filter red value. Use with {@link Konva.Filters.RGB} filter.
    * @name red
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} red value between 0 and 255
    * @returns {Integer}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'green', 0, function(val) {
        this._filterUpToDate = false;
        if (val > 255) {
            return 255;
        }
        else if (val < 0) {
            return 0;
        }
        else {
            return Math.round(val);
        }
    });
    /**
    * get/set filter green value. Use with {@link Konva.Filters.RGB} filter.
    * @name green
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} green value between 0 and 255
    * @returns {Integer}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'blue', 0, Konva.Validators.RGBComponent, Konva.Factory.afterSetFilter);
    /**
    * get/set filter blue value. Use with {@link Konva.Filters.RGB} filter.
    * @name blue
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} blue value between 0 and 255
    * @returns {Integer}
    */
})();

(function () {
    'use strict';
    /**
     * RGBA Filter
     * @function
     * @name RGBA
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @author codefo
     * @example
     * node.cache();
     * node.filters([Konva.Filters.RGBA]);
     * node.blue(120);
     * node.green(200);
     * node.alpha(0.3);
     */
    Konva.Filters.RGBA = function (imageData) {
        var data = imageData.data,
            nPixels = data.length,
            red = this.red(),
            green = this.green(),
            blue = this.blue(),
            alpha = this.alpha(),
            i, ia;

        for (i = 0; i < nPixels; i += 4) {
            ia = 1 - alpha;

            data[i] = red * alpha + data[i] * ia; // r
            data[i + 1] = green * alpha + data[i + 1] * ia; // g
            data[i + 2] = blue * alpha + data[i + 2] * ia; // b
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'red', 0, function(val) {
        this._filterUpToDate = false;
        if (val > 255) {
            return 255;
        }
        else if (val < 0) {
            return 0;
        }
        else {
            return Math.round(val);
        }
    });
    /**
    * get/set filter red value. Use with {@link Konva.Filters.RGBA} filter.
    * @name red
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} red value between 0 and 255
    * @returns {Integer}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'green', 0, function(val) {
        this._filterUpToDate = false;
        if (val > 255) {
            return 255;
        }
        else if (val < 0) {
            return 0;
        }
        else {
            return Math.round(val);
        }
    });
    /**
    * get/set filter green value. Use with {@link Konva.Filters.RGBA} filter.
    * @name green
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} green value between 0 and 255
    * @returns {Integer}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'blue', 0, Konva.Validators.RGBComponent, Konva.Factory.afterSetFilter);
    /**
    * get/set filter blue value. Use with {@link Konva.Filters.RGBA} filter.
    * @name blue
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} blue value between 0 and 255
    * @returns {Integer}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'alpha', 1, function(val) {
        this._filterUpToDate = false;
        if (val > 1) {
            return 1;
        }
        else if (val < 0) {
            return 0;
        }
        else {
            return val;
        }
    });
    /**
     * get/set filter alpha value. Use with {@link Konva.Filters.RGBA} filter.
     * @name alpha
     * @method
     * @memberof Konva.Node.prototype
     * @param {Float} alpha value between 0 and 1
     * @returns {Float}
     */
})();

(function () {
    'use strict';
    /**
    * HSV Filter. Adjusts the hue, saturation and value
    * @function
    * @name HSV
    * @memberof Konva.Filters
    * @param {Object} imageData
    * @author ippo615
    * @example
    * image.filters([Konva.Filters.HSV]);
    * image.value(200);
    */

    Konva.Filters.HSV = function (imageData) {
        var data = imageData.data,
            nPixels = data.length,
            v = Math.pow(2, this.value()),
            s = Math.pow(2, this.saturation()),
            h = Math.abs((this.hue()) + 360) % 360,
            i;

        // Basis for the technique used:
        // http://beesbuzz.biz/code/hsv_color_transforms.php
        // V is the value multiplier (1 for none, 2 for double, 0.5 for half)
        // S is the saturation multiplier (1 for none, 2 for double, 0.5 for half)
        // H is the hue shift in degrees (0 to 360)
        // vsu = V*S*cos(H*PI/180);
        // vsw = V*S*sin(H*PI/180);
        //[ .299V+.701vsu+.168vsw    .587V-.587vsu+.330vsw    .114V-.114vsu-.497vsw ] [R]
        //[ .299V-.299vsu-.328vsw    .587V+.413vsu+.035vsw    .114V-.114vsu+.292vsw ]*[G]
        //[ .299V-.300vsu+1.25vsw    .587V-.588vsu-1.05vsw    .114V+.886vsu-.203vsw ] [B]

        // Precompute the values in the matrix:
        var vsu = v * s * Math.cos(h * Math.PI / 180),
            vsw = v * s * Math.sin(h * Math.PI / 180);
        // (result spot)(source spot)
        var rr = 0.299 * v + 0.701 * vsu + 0.167 * vsw,
            rg = 0.587 * v - 0.587 * vsu + 0.330 * vsw,
            rb = 0.114 * v - 0.114 * vsu - 0.497 * vsw;
        var gr = 0.299 * v - 0.299 * vsu - 0.328 * vsw,
            gg = 0.587 * v + 0.413 * vsu + 0.035 * vsw,
            gb = 0.114 * v - 0.114 * vsu + 0.293 * vsw;
        var br = 0.299 * v - 0.300 * vsu + 1.250 * vsw,
            bg = 0.587 * v - 0.586 * vsu - 1.050 * vsw,
            bb = 0.114 * v + 0.886 * vsu - 0.200 * vsw;

        var r, g, b, a;

        for (i = 0; i < nPixels; i += 4) {
            r = data[i + 0];
            g = data[i + 1];
            b = data[i + 2];
            a = data[i + 3];

            data[i + 0] = rr * r + rg * g + rb * b;
            data[i + 1] = gr * r + gg * g + gb * b;
            data[i + 2] = br * r + bg * g + bb * b;
            data[i + 3] = a; // alpha
        }

    };

    Konva.Factory.addGetterSetter(Konva.Node, 'hue', 0, null, Konva.Factory.afterSetFilter);
    /**
    * get/set hsv hue in degrees. Use with {@link Konva.Filters.HSV} or {@link Konva.Filters.HSL} filter.
    * @name hue
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} hue value between 0 and 359
    * @returns {Number}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'saturation', 0, null, Konva.Factory.afterSetFilter);
    /**
    * get/set hsv saturation. Use with {@link Konva.Filters.HSV} or {@link Konva.Filters.HSL} filter.
    * @name saturation
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} saturation 0 is no change, -1.0 halves the saturation, 1.0 doubles, etc..
    * @returns {Number}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'value', 0, null, Konva.Factory.afterSetFilter);
    /**
    * get/set hsv value. Use with {@link Konva.Filters.HSV} filter.
    * @name value
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} value 0 is no change, -1.0 halves the value, 1.0 doubles, etc..
    * @returns {Number}
    */

})();

(function () {
    'use strict';

    Konva.Factory.addGetterSetter(Konva.Node, 'hue', 0, null, Konva.Factory.afterSetFilter);
    /**
    * get/set hsv hue in degrees. Use with {@link Konva.Filters.HSV} or {@link Konva.Filters.HSL} filter.
    * @name hue
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} hue value between 0 and 359
    * @returns {Number}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'saturation', 0, null, Konva.Factory.afterSetFilter);
    /**
    * get/set hsv saturation. Use with {@link Konva.Filters.HSV} or {@link Konva.Filters.HSL} filter.
    * @name saturation
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} saturation 0 is no change, -1.0 halves the saturation, 1.0 doubles, etc..
    * @returns {Number}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'luminance', 0, null, Konva.Factory.afterSetFilter);
    /**
    * get/set hsl luminance. Use with {@link Konva.Filters.HSL} filter.
    * @name value
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} value 0 is no change, -1.0 halves the value, 1.0 doubles, etc..
    * @returns {Number}
    */

    /**
    * HSL Filter. Adjusts the hue, saturation and luminance (or lightness)
    * @function
    * @memberof Konva.Filters
    * @param {Object} imageData
    * @author ippo615
    * @example
    * image.filters([Konva.Filters.HSL]);
    * image.luminance(200);
    */

    Konva.Filters.HSL = function (imageData) {
        var data = imageData.data,
            nPixels = data.length,
            v = 1,
            s = Math.pow(2, this.saturation()),
            h = Math.abs((this.hue()) + 360) % 360,
            l = this.luminance() * 127,
            i;

        // Basis for the technique used:
        // http://beesbuzz.biz/code/hsv_color_transforms.php
        // V is the value multiplier (1 for none, 2 for double, 0.5 for half)
        // S is the saturation multiplier (1 for none, 2 for double, 0.5 for half)
        // H is the hue shift in degrees (0 to 360)
        // vsu = V*S*cos(H*PI/180);
        // vsw = V*S*sin(H*PI/180);
        //[ .299V+.701vsu+.168vsw    .587V-.587vsu+.330vsw    .114V-.114vsu-.497vsw ] [R]
        //[ .299V-.299vsu-.328vsw    .587V+.413vsu+.035vsw    .114V-.114vsu+.292vsw ]*[G]
        //[ .299V-.300vsu+1.25vsw    .587V-.588vsu-1.05vsw    .114V+.886vsu-.203vsw ] [B]

        // Precompute the values in the matrix:
        var vsu = v * s * Math.cos(h * Math.PI / 180),
            vsw = v * s * Math.sin(h * Math.PI / 180);
        // (result spot)(source spot)
        var rr = 0.299 * v + 0.701 * vsu + 0.167 * vsw,
            rg = 0.587 * v - 0.587 * vsu + 0.330 * vsw,
            rb = 0.114 * v - 0.114 * vsu - 0.497 * vsw;
        var gr = 0.299 * v - 0.299 * vsu - 0.328 * vsw,
            gg = 0.587 * v + 0.413 * vsu + 0.035 * vsw,
            gb = 0.114 * v - 0.114 * vsu + 0.293 * vsw;
        var br = 0.299 * v - 0.300 * vsu + 1.250 * vsw,
            bg = 0.587 * v - 0.586 * vsu - 1.050 * vsw,
            bb = 0.114 * v + 0.886 * vsu - 0.200 * vsw;

        var r, g, b, a;

        for (i = 0; i < nPixels; i += 4) {
            r = data[i + 0];
            g = data[i + 1];
            b = data[i + 2];
            a = data[i + 3];

            data[i + 0] = rr * r + rg * g + rb * b + l;
            data[i + 1] = gr * r + gg * g + gb * b + l;
            data[i + 2] = br * r + bg * g + bb * b + l;
            data[i + 3] = a; // alpha
        }
    };
})();

(function () {
    'use strict';
    /**
     * Emboss Filter.
     * Pixastic Lib - Emboss filter - v0.1.0
     * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
     * License: [http://www.pixastic.com/lib/license.txt]
     * @function
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Emboss]);
     * node.embossStrength(0.8);
     * node.embossWhiteLevel(0.3);
     * node.embossDirection('right');
     * node.embossBlend(true);
     */
    Konva.Filters.Emboss = function (imageData) {

        // pixastic strength is between 0 and 10.  I want it between 0 and 1
        // pixastic greyLevel is between 0 and 255.  I want it between 0 and 1.  Also,
        // a max value of greyLevel yields a white emboss, and the min value yields a black
        // emboss.  Therefore, I changed greyLevel to whiteLevel
        var strength = this.embossStrength() * 10,
            greyLevel = this.embossWhiteLevel() * 255,
            direction = this.embossDirection(),
            blend = this.embossBlend(),
            dirY = 0,
            dirX = 0,
            data = imageData.data,
            w = imageData.width,
            h = imageData.height,
            w4 = w * 4,
            y = h;

        switch (direction) {
            case 'top-left':
                dirY = -1;
                dirX = -1;
                break;
            case 'top':
                dirY = -1;
                dirX = 0;
                break;
            case 'top-right':
                dirY = -1;
                dirX = 1;
                break;
            case 'right':
                dirY = 0;
                dirX = 1;
                break;
            case 'bottom-right':
                dirY = 1;
                dirX = 1;
                break;
            case 'bottom':
                dirY = 1;
                dirX = 0;
                break;
            case 'bottom-left':
                dirY = 1;
                dirX = -1;
                break;
            case 'left':
                dirY = 0;
                dirX = -1;
                break;
        }

        do {
            var offsetY = (y - 1) * w4;

            var otherY = dirY;
            if (y + otherY < 1){
                otherY = 0;
            }
            if (y + otherY > h) {
                otherY = 0;
            }

            var offsetYOther = (y - 1 + otherY) * w * 4;

            var x = w;
            do {
                var offset = offsetY + (x - 1) * 4;

                var otherX = dirX;
                if (x + otherX < 1){
                    otherX = 0;
                }
                if (x + otherX > w) {
                    otherX = 0;
                }

                var offsetOther = offsetYOther + (x - 1 + otherX) * 4;

                var dR = data[offset] - data[offsetOther];
                var dG = data[offset + 1] - data[offsetOther + 1];
                var dB = data[offset + 2] - data[offsetOther + 2];

                var dif = dR;
                var absDif = dif > 0 ? dif : -dif;

                var absG = dG > 0 ? dG : -dG;
                var absB = dB > 0 ? dB : -dB;

                if (absG > absDif) {
                    dif = dG;
                }
                if (absB > absDif) {
                    dif = dB;
                }

                dif *= strength;

                if (blend) {
                    var r = data[offset] + dif;
                    var g = data[offset + 1] + dif;
                    var b = data[offset + 2] + dif;

                    data[offset] = (r > 255) ? 255 : (r < 0 ? 0 : r);
                    data[offset + 1] = (g > 255) ? 255 : (g < 0 ? 0 : g);
                    data[offset + 2] = (b > 255) ? 255 : (b < 0 ? 0 : b);
                } else {
                    var grey = greyLevel - dif;
                    if (grey < 0) {
                        grey = 0;
                    } else if (grey > 255) {
                        grey = 255;
                    }

                    data[offset] = data[offset + 1] = data[offset + 2] = grey;
                }

            } while (--x);
        } while (--y);
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'embossStrength', 0.5, null, Konva.Factory.afterSetFilter);
    /**
    * get/set emboss strength. Use with {@link Konva.Filters.Emboss} filter.
    * @name embossStrength
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} level between 0 and 1.  Default is 0.5
    * @returns {Number}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'embossWhiteLevel', 0.5, null, Konva.Factory.afterSetFilter);
    /**
    * get/set emboss white level. Use with {@link Konva.Filters.Emboss} filter.
    * @name embossWhiteLevel
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} embossWhiteLevel between 0 and 1.  Default is 0.5
    * @returns {Number}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'embossDirection', 'top-left', null, Konva.Factory.afterSetFilter);
    /**
    * get/set emboss direction. Use with {@link Konva.Filters.Emboss} filter.
    * @name embossDirection
    * @method
    * @memberof Konva.Node.prototype
    * @param {String} embossDirection can be top-left, top, top-right, right, bottom-right, bottom, bottom-left or left
    *   The default is top-left
    * @returns {String}
    */

    Konva.Factory.addGetterSetter(Konva.Node, 'embossBlend', false, null, Konva.Factory.afterSetFilter);
    /**
    * get/set emboss blend. Use with {@link Konva.Filters.Emboss} filter.
    * @name embossBlend
    * @method
    * @memberof Konva.Node.prototype
    * @param {Boolean} embossBlend
    * @returns {Boolean}
    */
})();

(function () {
    'use strict';
    function remap(fromValue, fromMin, fromMax, toMin, toMax) {
        // Compute the range of the data
        var fromRange = fromMax - fromMin,
          toRange = toMax - toMin,
          toValue;

        // If either range is 0, then the value can only be mapped to 1 value
        if (fromRange === 0) {
            return toMin + toRange / 2;
        }
        if (toRange === 0) {
            return toMin;
        }

        // (1) untranslate, (2) unscale, (3) rescale, (4) retranslate
        toValue = (fromValue - fromMin) / fromRange;
        toValue = (toRange * toValue) + toMin;

        return toValue;
    }


    /**
    * Enhance Filter. Adjusts the colors so that they span the widest
    *  possible range (ie 0-255). Performs w*h pixel reads and w*h pixel
    *  writes.
    * @function
    * @name Enhance
    * @memberof Konva.Filters
    * @param {Object} imageData
    * @author ippo615
    * @example
    * node.cache();
    * node.filters([Konva.Filters.Enhance]);
    * node.enhance(0.4);
    */
    Konva.Filters.Enhance = function (imageData) {
        var data = imageData.data,
            nSubPixels = data.length,
            rMin = data[0], rMax = rMin, r,
            gMin = data[1], gMax = gMin, g,
            bMin = data[2], bMax = bMin, b,
            i;

        // If we are not enhancing anything - don't do any computation
        var enhanceAmount = this.enhance();
        if( enhanceAmount === 0 ){ return; }

        // 1st Pass - find the min and max for each channel:
        for (i = 0; i < nSubPixels; i += 4) {
            r = data[i + 0];
            if (r < rMin) { rMin = r; }
            else if (r > rMax) { rMax = r; }
            g = data[i + 1];
            if (g < gMin) { gMin = g; } else
            if (g > gMax) { gMax = g; }
            b = data[i + 2];
            if (b < bMin) { bMin = b; } else
            if (b > bMax) { bMax = b; }
            //a = data[i + 3];
            //if (a < aMin) { aMin = a; } else
            //if (a > aMax) { aMax = a; }
        }

        // If there is only 1 level - don't remap
        if( rMax === rMin ){ rMax = 255; rMin = 0; }
        if( gMax === gMin ){ gMax = 255; gMin = 0; }
        if( bMax === bMin ){ bMax = 255; bMin = 0; }

        var rMid, rGoalMax, rGoalMin,
            gMid, gGoalMax, gGoalMin,
            bMid, bGoalMax, bGoalMin;

        // If the enhancement is positive - stretch the histogram
        if ( enhanceAmount > 0 ){
            rGoalMax = rMax + enhanceAmount * (255 - rMax);
            rGoalMin = rMin - enhanceAmount * (rMin - 0);
            gGoalMax = gMax + enhanceAmount * (255 - gMax);
            gGoalMin = gMin - enhanceAmount * (gMin - 0);
            bGoalMax = bMax + enhanceAmount * (255 - bMax);
            bGoalMin = bMin - enhanceAmount * (bMin - 0);
        // If the enhancement is negative -   compress the histogram
        } else {
            rMid = (rMax + rMin) * 0.5;
            rGoalMax = rMax + enhanceAmount * (rMax - rMid);
            rGoalMin = rMin + enhanceAmount * (rMin - rMid);
            gMid = (gMax + gMin) * 0.5;
            gGoalMax = gMax + enhanceAmount * (gMax - gMid);
            gGoalMin = gMin + enhanceAmount * (gMin - gMid);
            bMid = (bMax + bMin) * 0.5;
            bGoalMax = bMax + enhanceAmount * (bMax - bMid);
            bGoalMin = bMin + enhanceAmount * (bMin - bMid);
        }

        // Pass 2 - remap everything, except the alpha
        for (i = 0; i < nSubPixels; i += 4) {
            data[i + 0] = remap(data[i + 0], rMin, rMax, rGoalMin, rGoalMax);
            data[i + 1] = remap(data[i + 1], gMin, gMax, gGoalMin, gGoalMax);
            data[i + 2] = remap(data[i + 2], bMin, bMax, bGoalMin, bGoalMax);
            //data[i + 3] = remap(data[i + 3], aMin, aMax, aGoalMin, aGoalMax);
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'enhance', 0, null, Konva.Factory.afterSetFilter);

    /**
    * get/set enhance. Use with {@link Konva.Filters.Enhance} filter.
    * @name enhance
    * @method
    * @memberof Konva.Node.prototype
    * @param {Float} amount
    * @returns {Float}
    */
})();

(function () {
    'use strict';
    /**
     * Posterize Filter. Adjusts the channels so that there are no more
     *  than n different values for that channel. This is also applied
     *  to the alpha channel.
     * @function
     * @name Posterize
     * @author ippo615
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Posterize]);
     * node.levels(0.8);
     */

    Konva.Filters.Posterize = function (imageData) {
        // level must be between 1 and 255
        var levels = Math.round(this.levels() * 254) + 1,
            data = imageData.data,
            len = data.length,
            scale = (255 / levels),
            i;

        for (i = 0; i < len; i += 1) {
            data[i] = Math.floor(data[i] / scale) * scale;
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'levels', 0.5, null, Konva.Factory.afterSetFilter);

    /**
    * get/set levels.  Must be a number between 0 and 1.  Use with {@link Konva.Filters.Posterize} filter.
    * @name levels
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} level between 0 and 1
    * @returns {Number}
    */
})();

(function () {
    'use strict';

    /**
     * Noise Filter. Randomly adds or substracts to the color channels
     * @function
     * @name Noise
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @author ippo615
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Noise]);
     * node.noise(0.8);
     */
    Konva.Filters.Noise = function (imageData) {
        var amount = this.noise() * 255,
            data = imageData.data,
            nPixels = data.length,
            half = amount / 2,
            i;

        for (i = 0; i < nPixels; i += 4) {
            data[i + 0] += half - 2 * half * Math.random();
            data[i + 1] += half - 2 * half * Math.random();
            data[i + 2] += half - 2 * half * Math.random();
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'noise', 0.2, null, Konva.Factory.afterSetFilter);

    /**
    * get/set noise amount.  Must be a value between 0 and 1. Use with {@link Konva.Filters.Noise} filter.
    * @name noise
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} noise
    * @returns {Number}
    */
})();

/*eslint-disable max-depth */
(function () {
    'use strict';
    /**
     * Pixelate Filter. Averages groups of pixels and redraws
     *  them as larger pixels
     * @function
     * @name Pixelate
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @author ippo615
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Pixelate]);
     * node.pixelSize(10);
     */

    Konva.Filters.Pixelate = function (imageData) {

        var pixelSize = Math.ceil(this.pixelSize()),
            width = imageData.width,
            height = imageData.height,
            x, y, i,
            //pixelsPerBin = pixelSize * pixelSize,
            red, green, blue, alpha,
            nBinsX = Math.ceil(width / pixelSize),
            nBinsY = Math.ceil(height / pixelSize),
            xBinStart, xBinEnd, yBinStart, yBinEnd,
            xBin, yBin, pixelsInBin;
        imageData = imageData.data;

        for (xBin = 0; xBin < nBinsX; xBin += 1) {
            for (yBin = 0; yBin < nBinsY; yBin += 1) {

                // Initialize the color accumlators to 0
                red = 0;
                green = 0;
                blue = 0;
                alpha = 0;

                // Determine which pixels are included in this bin
                xBinStart = xBin * pixelSize;
                xBinEnd = xBinStart + pixelSize;
                yBinStart = yBin * pixelSize;
                yBinEnd = yBinStart + pixelSize;

                // Add all of the pixels to this bin!
                pixelsInBin = 0;
                for (x = xBinStart; x < xBinEnd; x += 1) {
                    if( x >= width ){ continue; }
                    for (y = yBinStart; y < yBinEnd; y += 1) {
                        if( y >= height ){ continue; }
                        i = (width * y + x) * 4;
                        red += imageData[i + 0];
                        green += imageData[i + 1];
                        blue += imageData[i + 2];
                        alpha += imageData[i + 3];
                        pixelsInBin += 1;
                    }
                }

                // Make sure the channels are between 0-255
                red = red / pixelsInBin;
                green = green / pixelsInBin;
                blue = blue / pixelsInBin;

                // Draw this bin
                for (x = xBinStart; x < xBinEnd; x += 1) {
                    if( x >= width ){ continue; }
                    for (y = yBinStart; y < yBinEnd; y += 1) {
                        if( y >= height ){ continue; }
                        i = (width * y + x) * 4;
                        imageData[i + 0] = red;
                        imageData[i + 1] = green;
                        imageData[i + 2] = blue;
                        imageData[i + 3] = alpha;
                    }
                }
            }
        }

    };

    Konva.Factory.addGetterSetter(Konva.Node, 'pixelSize', 8, null, Konva.Factory.afterSetFilter);

    /**
    * get/set pixel size. Use with {@link Konva.Filters.Pixelate} filter.
    * @name pixelSize
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} pixelSize
    * @returns {Integer}
    */
})();

(function () {
    'use strict';
    /**
     * Threshold Filter. Pushes any value above the mid point to
     *  the max and any value below the mid point to the min.
     *  This affects the alpha channel.
     * @function
     * @name Threshold
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @author ippo615
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Threshold]);
     * node.threshold(0.1);
     */

    Konva.Filters.Threshold = function (imageData) {
        var level = this.threshold() * 255,
            data = imageData.data,
            len = data.length,
            i;

        for (i = 0; i < len; i += 1) {
            data[i] = data[i] < level ? 0 : 255;
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'threshold', 0.5, null, Konva.Factory.afterSetFilter);

    /**
    * get/set threshold.  Must be a value between 0 and 1. Use with {@link Konva.Filters.Threshold} or {@link Konva.Filters.Mask} filter.
    * @name threshold
    * @method
    * @memberof Konva.Node.prototype
    * @param {Number} threshold
    * @returns {Number}
    */
})();

(function() {
    'use strict';
    /**
     * Sepia Filter
     * Based on: Pixastic Lib - Sepia filter - v0.1.0
     * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
     * @function
     * @name Sepia
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @author Jacob Seidelin <jseidelin@nihilogic.dk>
     * @license MPL v1.1 [http://www.pixastic.com/lib/license.txt]
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Sepia]);
     */
    Konva.Filters.Sepia = function (imageData) {
        var data = imageData.data,
            w = imageData.width,
            y = imageData.height,
            w4 = w * 4,
            offsetY, x, offset, or, og, ob, r, g, b;

        do {
            offsetY = (y - 1) * w4;
            x = w;
            do {
                offset = offsetY + (x - 1) * 4;

                or = data[offset];
                og = data[offset + 1];
                ob = data[offset + 2];

                r = or * 0.393 + og * 0.769 + ob * 0.189;
                g = or * 0.349 + og * 0.686 + ob * 0.168;
                b = or * 0.272 + og * 0.534 + ob * 0.131;

                data[offset] = r > 255 ? 255 : r;
                data[offset + 1] = g > 255 ? 255 : g;
                data[offset + 2] = b > 255 ? 255 : b;
                data[offset + 3] = data[offset + 3];
            } while (--x);
        } while (--y);
    };
})();

(function () {
    'use strict';
    /**
     * Solarize Filter
     * Pixastic Lib - Solarize filter - v0.1.0
     * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
     * License: [http://www.pixastic.com/lib/license.txt]
     * @function
     * @name Solarize
     * @memberof Konva.Filters
     * @param {Object} imageData
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Solarize]);
     */
    Konva.Filters.Solarize = function (imageData) {
        var data = imageData.data,
            w = imageData.width,
            h = imageData.height,
            w4 = w * 4,
            y = h;

        do {
            var offsetY = (y - 1) * w4;
            var x = w;
            do {
                var offset = offsetY + (x - 1) * 4;
                var r = data[offset];
                var g = data[offset + 1];
                var b = data[offset + 2];

                if (r > 127) {
                    r = 255 - r;
                }
                if (g > 127) {
                    g = 255 - g;
                }
                if (b > 127) {
                    b = 255 - b;
                }

                data[offset] = r;
                data[offset + 1] = g;
                data[offset + 2] = b;
            } while (--x);
        } while (--y);
    };
})();



(function () {
    'use strict';

  /*
   * ToPolar Filter. Converts image data to polar coordinates. Performs
   *  w*h*4 pixel reads and w*h pixel writes. The r axis is placed along
   *  what would be the y axis and the theta axis along the x axis.
   * @function
   * @author ippo615
   * @memberof Konva.Filters
   * @param {ImageData} src, the source image data (what will be transformed)
   * @param {ImageData} dst, the destination image data (where it will be saved)
   * @param {Object} opt
   * @param {Number} [opt.polarCenterX] horizontal location for the center of the circle,
   *  default is in the middle
   * @param {Number} [opt.polarCenterY] vertical location for the center of the circle,
   *  default is in the middle
   */

    var ToPolar = function(src, dst, opt){

        var srcPixels = src.data,
            dstPixels = dst.data,
            xSize = src.width,
            ySize = src.height,
            xMid = opt.polarCenterX || xSize / 2,
            yMid = opt.polarCenterY || ySize / 2,
            i, x, y, r = 0, g = 0, b = 0, a = 0;

        // Find the largest radius
        var rad, rMax = Math.sqrt( xMid * xMid + yMid * yMid );
        x = xSize - xMid;
        y = ySize - yMid;
        rad = Math.sqrt( x * x + y * y );
        rMax = (rad > rMax) ? rad : rMax;

        // We'll be uisng y as the radius, and x as the angle (theta=t)
        var rSize = ySize,
            tSize = xSize,
            radius, theta;

        // We want to cover all angles (0-360) and we need to convert to
        // radians (*PI/180)
        var conversion = 360 / tSize * Math.PI / 180, sin, cos;

        // var x1, x2, x1i, x2i, y1, y2, y1i, y2i, scale;

        for( theta = 0; theta < tSize; theta += 1 ){
            sin = Math.sin(theta * conversion);
            cos = Math.cos(theta * conversion);
            for( radius = 0; radius < rSize; radius += 1 ){
                x = Math.floor(xMid + rMax * radius / rSize * cos);
                y = Math.floor(yMid + rMax * radius / rSize * sin);
                i = (y * xSize + x) * 4;
                r = srcPixels[i + 0];
                g = srcPixels[i + 1];
                b = srcPixels[i + 2];
                a = srcPixels[i + 3];

                // Store it
                //i = (theta * xSize  +  radius) * 4;
                i = (theta + radius * xSize) * 4;
                dstPixels[i + 0] = r;
                dstPixels[i + 1] = g;
                dstPixels[i + 2] = b;
                dstPixels[i + 3] = a;

            }
        }
    };

    /*
     * FromPolar Filter. Converts image data from polar coordinates back to rectangular.
     *  Performs w*h*4 pixel reads and w*h pixel writes.
     * @function
     * @author ippo615
     * @memberof Konva.Filters
     * @param {ImageData} src, the source image data (what will be transformed)
     * @param {ImageData} dst, the destination image data (where it will be saved)
     * @param {Object} opt
     * @param {Number} [opt.polarCenterX] horizontal location for the center of the circle,
     *  default is in the middle
     * @param {Number} [opt.polarCenterY] vertical location for the center of the circle,
     *  default is in the middle
     * @param {Number} [opt.polarRotation] amount to rotate the image counterclockwis,
     *  0 is no rotation, 360 degrees is a full rotation
     */

    var FromPolar = function(src, dst, opt){

        var srcPixels = src.data,
            dstPixels = dst.data,
            xSize = src.width,
            ySize = src.height,
            xMid = opt.polarCenterX || xSize / 2,
            yMid = opt.polarCenterY || ySize / 2,
            i, x, y, dx, dy, r = 0, g = 0, b = 0, a = 0;


        // Find the largest radius
        var rad, rMax = Math.sqrt( xMid * xMid + yMid * yMid );
        x = xSize - xMid;
        y = ySize - yMid;
        rad = Math.sqrt( x * x + y * y );
        rMax = (rad > rMax) ? rad : rMax;

        // We'll be uisng x as the radius, and y as the angle (theta=t)
        var rSize = ySize,
        tSize = xSize,
        radius, theta,
        phaseShift = opt.polarRotation || 0;

        // We need to convert to degrees and we need to make sure
        // it's between (0-360)
        // var conversion = tSize/360*180/Math.PI;
        //var conversion = tSize/360*180/Math.PI;

        var x1, y1;

        for( x = 0; x < xSize; x += 1 ){
            for( y = 0; y < ySize; y += 1 ){
                dx = x - xMid;
                dy = y - yMid;
                radius = Math.sqrt(dx * dx + dy * dy) * rSize / rMax;
                theta = (Math.atan2(dy, dx) * 180 / Math.PI + 360 + phaseShift) % 360;
                theta = theta * tSize / 360;
                x1 = Math.floor(theta);
                y1 = Math.floor(radius);
                i = (y1 * xSize + x1) * 4;
                r = srcPixels[i + 0];
                g = srcPixels[i + 1];
                b = srcPixels[i + 2];
                a = srcPixels[i + 3];

                // Store it
                i = (y * xSize + x) * 4;
                dstPixels[i + 0] = r;
                dstPixels[i + 1] = g;
                dstPixels[i + 2] = b;
                dstPixels[i + 3] = a;
            }
        }

    };

    //Konva.Filters.ToPolar = Konva.Util._FilterWrapDoubleBuffer(ToPolar);
    //Konva.Filters.FromPolar = Konva.Util._FilterWrapDoubleBuffer(FromPolar);

    // create a temporary canvas for working - shared between multiple calls
    var tempCanvas = Konva.Util.createCanvasElement();

    /*
     * Kaleidoscope Filter.
     * @function
     * @name Kaleidoscope
     * @author ippo615
     * @memberof Konva.Filters
     * @example
     * node.cache();
     * node.filters([Konva.Filters.Kaleidoscope]);
     * node.kaleidoscopePower(3);
     * node.kaleidoscopeAngle(45);
     */
    Konva.Filters.Kaleidoscope = function(imageData){
        var xSize = imageData.width,
            ySize = imageData.height;

        var x, y, xoff, i, r, g, b, a, srcPos, dstPos;
        var power = Math.round( this.kaleidoscopePower() );
        var angle = Math.round( this.kaleidoscopeAngle() );
        var offset = Math.floor(xSize * (angle % 360) / 360);

        if( power < 1 ){return; }

        // Work with our shared buffer canvas
        tempCanvas.width = xSize;
        tempCanvas.height = ySize;
        var scratchData = tempCanvas.getContext('2d').getImageData(0, 0, xSize, ySize);

        // Convert thhe original to polar coordinates
        ToPolar( imageData, scratchData, {
            polarCenterX: xSize / 2,
            polarCenterY: ySize / 2
        });

        // Determine how big each section will be, if it's too small
        // make it bigger
        var minSectionSize = xSize / Math.pow(2, power);
        while( minSectionSize <= 8){
            minSectionSize = minSectionSize * 2;
            power -= 1;
        }
        minSectionSize = Math.ceil(minSectionSize);
        var sectionSize = minSectionSize;

        // Copy the offset region to 0
        // Depending on the size of filter and location of the offset we may need
        // to copy the section backwards to prevent it from rewriting itself
        var xStart = 0,
          xEnd = sectionSize,
          xDelta = 1;
        if( offset + minSectionSize > xSize ){
            xStart = sectionSize;
            xEnd = 0;
            xDelta = -1;
        }
        for( y = 0; y < ySize; y += 1 ){
            for( x = xStart; x !== xEnd; x += xDelta ){
                xoff = Math.round(x + offset) % xSize;
                srcPos = (xSize * y + xoff) * 4;
                r = scratchData.data[srcPos + 0];
                g = scratchData.data[srcPos + 1];
                b = scratchData.data[srcPos + 2];
                a = scratchData.data[srcPos + 3];
                dstPos = (xSize * y + x) * 4;
                scratchData.data[dstPos + 0] = r;
                scratchData.data[dstPos + 1] = g;
                scratchData.data[dstPos + 2] = b;
                scratchData.data[dstPos + 3] = a;
            }
        }

        // Perform the actual effect
        for( y = 0; y < ySize; y += 1 ){
            sectionSize = Math.floor( minSectionSize );
            for( i = 0; i < power; i += 1 ){
                for( x = 0; x < sectionSize + 1; x += 1 ){
                    srcPos = (xSize * y + x) * 4;
                    r = scratchData.data[srcPos + 0];
                    g = scratchData.data[srcPos + 1];
                    b = scratchData.data[srcPos + 2];
                    a = scratchData.data[srcPos + 3];
                    dstPos = (xSize * y + sectionSize * 2 - x - 1) * 4;
                    scratchData.data[dstPos + 0] = r;
                    scratchData.data[dstPos + 1] = g;
                    scratchData.data[dstPos + 2] = b;
                    scratchData.data[dstPos + 3] = a;
                }
                sectionSize *= 2;
            }
        }

        // Convert back from polar coordinates
        FromPolar(scratchData, imageData, {polarRotation: 0});
    };

    /**
    * get/set kaleidoscope power. Use with {@link Konva.Filters.Kaleidoscope} filter.
    * @name kaleidoscopePower
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} power of kaleidoscope
    * @returns {Integer}
    */
    Konva.Factory.addGetterSetter(Konva.Node, 'kaleidoscopePower', 2, null, Konva.Factory.afterSetFilter);

    /**
    * get/set kaleidoscope angle. Use with {@link Konva.Filters.Kaleidoscope} filter.
    * @name kaleidoscopeAngle
    * @method
    * @memberof Konva.Node.prototype
    * @param {Integer} degrees
    * @returns {Integer}
    */
    Konva.Factory.addGetterSetter(Konva.Node, 'kaleidoscopeAngle', 0, null, Konva.Factory.afterSetFilter);

})();

(function() {
    'use strict';
    /**
     * Container constructor.&nbsp; Containers are used to contain nodes or other containers
     * @constructor
     * @memberof Konva
     * @augments Konva.Node
     * @abstract
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * * @param {Object} [config.clip] set clip
     * @param {Number} [config.clipX] set clip x
     * @param {Number} [config.clipY] set clip y
     * @param {Number} [config.clipWidth] set clip width
     * @param {Number} [config.clipHeight] set clip height

     */
    Konva.Container = function(config) {
        this.__init(config);
    };

    Konva.Util.addMethods(Konva.Container, {
        __init: function(config) {
            this.children = new Konva.Collection();
            Konva.Node.call(this, config);
        },
        /**
         * returns a {@link Konva.Collection} of direct descendant nodes
         * @method
         * @memberof Konva.Container.prototype
         * @param {Function} [filterFunc] filter function
         * @returns {Konva.Collection}
         * @example
         * // get all children
         * var children = layer.getChildren();
         *
         * // get only circles
         * var circles = layer.getChildren(function(node){
         *    return node.getClassName() === 'Circle';
         * });
         */
        getChildren: function(filterFunc) {
            if (!filterFunc) {
                return this.children;
            }

            var results = new Konva.Collection();
            this.children.each(function(child){
                if (filterFunc(child)) {
                    results.push(child);
                }
            });
            return results;
        },
        /**
         * determine if node has children
         * @method
         * @memberof Konva.Container.prototype
         * @returns {Boolean}
         */
        hasChildren: function() {
            return this.getChildren().length > 0;
        },
        /**
         * remove all children
         * @method
         * @memberof Konva.Container.prototype
         */
        removeChildren: function() {
            var children = Konva.Collection.toCollection(this.children);
            var child;
            for (var i = 0; i < children.length; i++) {
                child = children[i];
                // reset parent to prevent many _setChildrenIndices calls
                delete child.parent;
                child.index = 0;
                if (child.hasChildren()) {
                    child.removeChildren();
                }
                child.remove();
            }
            children = null;
            this.children = new Konva.Collection();
            return this;
        },
        /**
         * destroy all children
         * @method
         * @memberof Konva.Container.prototype
         */
        destroyChildren: function() {
           var children = Konva.Collection.toCollection(this.children);
            var child;
            for (var i = 0; i < children.length; i++) {
                child = children[i];
                // reset parent to prevent many _setChildrenIndices calls
                delete child.parent;
                child.index = 0;
                child.destroy();
            }
            children = null;
            this.children = new Konva.Collection();
            return this;
        },
        /**
         * Add node or nodes to container.
         * @method
         * @memberof Konva.Container.prototype
         * @param {...Konva.Node} child
         * @returns {Container}
         * @example
         * layer.add(shape1, shape2, shape3);
         */
        add: function(child) {
            if (arguments.length > 1) {
                for (var i = 0; i < arguments.length; i++) {
                    this.add(arguments[i]);
                }
                return this;
            }
            if (child.getParent()) {
                child.moveTo(this);
                return this;
            }
            var children = this.children;
            this._validateAdd(child);
            child.index = children.length;
            child.parent = this;
            children.push(child);
            this._fire('add', {
                child: child
            });

            // if node under drag we need to update drag animation
            if (Konva.DD && child.isDragging()) {
                Konva.DD.anim.setLayers(child.getLayer());
            }

            // chainable
            return this;
        },
        destroy: function() {
            // destroy children
            if (this.hasChildren()) {
                this.destroyChildren();
            }
            // then destroy self
            Konva.Node.prototype.destroy.call(this);
            return this;
        },
        /**
         * return a {@link Konva.Collection} of nodes that match the selector.  Use '#' for id selections
         * and '.' for name selections.  You can also select by type or class name. Pass multiple selectors
         * separated by a space.
         * @method
         * @memberof Konva.Container.prototype
         * @param {String} selector
         * @returns {Collection}
         * @example
         * // select node with id foo
         * var node = stage.find('#foo');
         *
         * // select nodes with name bar inside layer
         * var nodes = layer.find('.bar');
         *
         * // select all groups inside layer
         * var nodes = layer.find('Group');
         *
         * // select all rectangles inside layer
         * var nodes = layer.find('Rect');
         *
         * // select node with an id of foo or a name of bar inside layer
         * var nodes = layer.find('#foo, .bar');
         */
        find: function(selector) {
            var retArr = [],
                selectorArr = selector.replace(/ /g, '').split(','),
                len = selectorArr.length,
                n, i, sel, arr, node, children, clen;

            for (n = 0; n < len; n++) {
                sel = selectorArr[n];
                if (!Konva.Util.isValidSelector(sel)) {
                    Konva.Util.warn('Selector "' + sel + '" is invalid. Allowed selectors examples are "#foo", ".bar" or "Group".');
                    Konva.Util.warn('If you have a custom shape with such className, please change it to start with upper letter like "Triangle".');
                    Konva.Util.warn('Konva is awesome, right?');
                }
                // id selector
                if(sel.charAt(0) === '#') {
                    node = this._getNodeById(sel.slice(1));
                    if(node) {
                        retArr.push(node);
                    }
                }
                // name selector
                else if(sel.charAt(0) === '.') {
                    arr = this._getNodesByName(sel.slice(1));
                    retArr = retArr.concat(arr);
                }
                // unrecognized selector, pass to children
                else {
                    children = this.getChildren();
                    clen = children.length;
                    for(i = 0; i < clen; i++) {
                        retArr = retArr.concat(children[i]._get(sel));
                    }
                }
            }

            return Konva.Collection.toCollection(retArr);
        },
        /**
         * return a first node from `find` method
         * @method
         * @memberof Konva.Container.prototype
         * @param {String} selector
         * @returns {Konva.Node}
         * @example
         * // select node with id foo
         * var node = stage.findOne('#foo');
         *
         * // select node with name bar inside layer
         * var nodes = layer.findOne('.bar');
         */
        findOne: function(selector) {
            return this.find(selector)[0];
        },
        _getNodeById: function(key) {
            var node = Konva.ids[key];

            if(node !== undefined && this.isAncestorOf(node)) {
                return node;
            }
            return null;
        },
        _getNodesByName: function(key) {
            var arr = Konva.names[key] || [];
            return this._getDescendants(arr);
        },
        _get: function(selector) {
            var retArr = Konva.Node.prototype._get.call(this, selector);
            var children = this.getChildren();
            var len = children.length;
            for(var n = 0; n < len; n++) {
                retArr = retArr.concat(children[n]._get(selector));
            }
            return retArr;
        },
        // extenders
        toObject: function() {
            var obj = Konva.Node.prototype.toObject.call(this);

            obj.children = [];

            var children = this.getChildren();
            var len = children.length;
            for(var n = 0; n < len; n++) {
                var child = children[n];
                obj.children.push(child.toObject());
            }

            return obj;
        },
        _getDescendants: function(arr) {
            var retArr = [];
            var len = arr.length;
            for(var n = 0; n < len; n++) {
                var node = arr[n];
                if(this.isAncestorOf(node)) {
                    retArr.push(node);
                }
            }

            return retArr;
        },
        /**
         * determine if node is an ancestor
         * of descendant
         * @method
         * @memberof Konva.Container.prototype
         * @param {Konva.Node} node
         */
        isAncestorOf: function(node) {
            var parent = node.getParent();
            while(parent) {
                if(parent._id === this._id) {
                    return true;
                }
                parent = parent.getParent();
            }

            return false;
        },
        clone: function(obj) {
            // call super method
            var node = Konva.Node.prototype.clone.call(this, obj);

            this.getChildren().each(function(no) {
                node.add(no.clone());
            });
            return node;
        },
        /**
         * get all shapes that intersect a point.  Note: because this method must clear a temporary
         * canvas and redraw every shape inside the container, it should only be used for special sitations
         * because it performs very poorly.  Please use the {@link Konva.Stage#getIntersection} method if at all possible
         * because it performs much better
         * @method
         * @memberof Konva.Container.prototype
         * @param {Object} pos
         * @param {Number} pos.x
         * @param {Number} pos.y
         * @returns {Array} array of shapes
         */
        getAllIntersections: function(pos) {
            var arr = [];

            this.find('Shape').each(function(shape) {
                if(shape.isVisible() && shape.intersects(pos)) {
                    arr.push(shape);
                }
            });

            return arr;
        },
        _setChildrenIndices: function() {
            this.children.each(function(child, n) {
                child.index = n;
            });
        },
        drawScene: function(can, top, caching) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.getCanvas()),
                context = canvas && canvas.getContext(),
                cachedCanvas = this._cache.canvas,
                cachedSceneCanvas = cachedCanvas && cachedCanvas.scene;

            if (this.isVisible()) {
                if (!caching && cachedSceneCanvas) {
                    context.save();
                    layer._applyTransform(this, context, top);
                    this._drawCachedSceneCanvas(context);
                    context.restore();
                }
                else {
                    this._drawChildren(canvas, 'drawScene', top, false, caching);
                }
            }
            return this;
        },
        drawHit: function(can, top, caching) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.hitCanvas),
                context = canvas && canvas.getContext(),
                cachedCanvas = this._cache.canvas,
                cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

            if (this.shouldDrawHit(canvas)) {
                if (layer) {
                    layer.clearHitCache();
                }
                if (!caching && cachedHitCanvas) {
                    context.save();
                    layer._applyTransform(this, context, top);
                    this._drawCachedHitCanvas(context);
                    context.restore();
                }
                else {
                    this._drawChildren(canvas, 'drawHit', top);
                }
            }
            return this;
        },
        _drawChildren: function(canvas, drawMethod, top, caching, skipBuffer) {
            var layer = this.getLayer(),
                context = canvas && canvas.getContext(),
                clipWidth = this.getClipWidth(),
                clipHeight = this.getClipHeight(),
                hasClip = clipWidth && clipHeight,
                clipX, clipY;

            if (hasClip && layer) {
                clipX = this.getClipX();
                clipY = this.getClipY();

                context.save();
                layer._applyTransform(this, context);
                context.beginPath();
                context.rect(clipX, clipY, clipWidth, clipHeight);
                context.clip();
                context.reset();
            }

            this.children.each(function(child) {
                child[drawMethod](canvas, top, caching, skipBuffer);
            });

            if (hasClip) {
                context.restore();
            }
        },
        shouldDrawHit: function(canvas) {
            var layer = this.getLayer();
            var dd = Konva.DD;
            var layerUnderDrag = dd && Konva.isDragging() && (Konva.DD.anim.getLayers().indexOf(layer) !== -1);
            return (canvas && canvas.isCache) || (layer && layer.hitGraphEnabled())
                && this.isVisible() && !layerUnderDrag;
        },
        getClientRect: function(skipTransform) {
            var minX, minY, maxX, maxY;
            var selfRect = {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
            this.children.each(function(child) {
                var rect = child.getClientRect();

                // skip invisible children (like empty groups)
                // or don't skip... hmmm...
                // if (rect.width === 0 && rect.height === 0) {
                //     return;
                // }

                if (minX === undefined) { // initial value for first child
                    minX = rect.x;
                    minY = rect.y;
                    maxX = rect.x + rect.width;
                    maxY = rect.y + rect.height;
                } else {
                    minX = Math.min(minX, rect.x);
                    minY = Math.min(minY, rect.y);
                    maxX = Math.max(maxX, rect.x + rect.width);
                    maxY = Math.max(maxY, rect.y + rect.height);
                }

            });

            if (this.children.length !== 0) {
                selfRect = {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
            }

            if (!skipTransform) {
                return this._transformedRect(selfRect);
            }
            return selfRect;
        }
    });

    Konva.Util.extend(Konva.Container, Konva.Node);
    // deprecated methods
    Konva.Container.prototype.get = Konva.Container.prototype.find;

    // add getters setters
    Konva.Factory.addComponentsGetterSetter(Konva.Container, 'clip', ['x', 'y', 'width', 'height']);
    /**
     * get/set clip
     * @method
     * @name clip
     * @memberof Konva.Container.prototype
     * @param {Object} clip
     * @param {Number} clip.x
     * @param {Number} clip.y
     * @param {Number} clip.width
     * @param {Number} clip.height
     * @returns {Object}
     * @example
     * // get clip
     * var clip = container.clip();
     *
     * // set clip
     * container.setClip({
     *   x: 20,
     *   y: 20,
     *   width: 20,
     *   height: 20
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Container, 'clipX');
    /**
     * get/set clip x
     * @name clipX
     * @method
     * @memberof Konva.Container.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get clip x
     * var clipX = container.clipX();
     *
     * // set clip x
     * container.clipX(10);
     */

    Konva.Factory.addGetterSetter(Konva.Container, 'clipY');
    /**
     * get/set clip y
     * @name clipY
     * @method
     * @memberof Konva.Container.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get clip y
     * var clipY = container.clipY();
     *
     * // set clip y
     * container.clipY(10);
     */

    Konva.Factory.addGetterSetter(Konva.Container, 'clipWidth');
    /**
     * get/set clip width
     * @name clipWidth
     * @method
     * @memberof Konva.Container.prototype
     * @param {Number} width
     * @returns {Number}
     * @example
     * // get clip width
     * var clipWidth = container.clipWidth();
     *
     * // set clip width
     * container.clipWidth(100);
     */

    Konva.Factory.addGetterSetter(Konva.Container, 'clipHeight');
    /**
     * get/set clip height
     * @name clipHeight
     * @method
     * @memberof Konva.Container.prototype
     * @param {Number} height
     * @returns {Number}
     * @example
     * // get clip height
     * var clipHeight = container.clipHeight();
     *
     * // set clip height
     * container.clipHeight(100);
     */

    Konva.Collection.mapMethods(Konva.Container);
})();

(function(Konva) {
    'use strict';
    var HAS_SHADOW = 'hasShadow';
    var SHADOW_RGBA = 'shadowRGBA';

    function _fillFunc(context) {
        context.fill();
    }
    function _strokeFunc(context) {
        context.stroke();
    }
    function _fillFuncHit(context) {
        context.fill();
    }
    function _strokeFuncHit(context) {
        context.stroke();
    }

    function _clearHasShadowCache() {
        this._clearCache(HAS_SHADOW);
    }

    function _clearGetShadowRGBACache() {
        this._clearCache(SHADOW_RGBA);
    }

    /**
     * Shape constructor.  Shapes are primitive objects such as rectangles,
     *  circles, text, lines, etc.
     * @constructor
     * @memberof Konva
     * @augments Konva.Node
     * @param {Object} config
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var customShape = new Konva.Shape({
         *   x: 5,
         *   y: 10,
         *   fill: 'red',
         *   // a Konva.Canvas renderer is passed into the drawFunc function
         *   drawFunc: function(context) {
         *     context.beginPath();
         *     context.moveTo(200, 50);
         *     context.lineTo(420, 80);
         *     context.quadraticCurveTo(300, 100, 260, 170);
         *     context.closePath();
         *     context.fillStrokeShape(this);
         *   }
         *});
     */
    Konva.Shape = function(config) {
        this.__init(config);
    };

    Konva.Util.addMethods(Konva.Shape, {
        __init: function(config) {
            this.nodeType = 'Shape';
            this._fillFunc = _fillFunc;
            this._strokeFunc = _strokeFunc;
            this._fillFuncHit = _fillFuncHit;
            this._strokeFuncHit = _strokeFuncHit;

            // set colorKey
            var shapes = Konva.shapes;
            var key;

            while(true) {
                key = Konva.Util.getRandomColor();
                if(key && !( key in shapes)) {
                    break;
                }
            }

            this.colorKey = key;
            shapes[key] = this;

            // call super constructor
            Konva.Node.call(this, config);

            this.on('shadowColorChange.konva shadowBlurChange.konva shadowOffsetChange.konva shadowOpacityChange.konva shadowEnabledChange.konva', _clearHasShadowCache);

            this.on('shadowColorChange.konva shadowOpacityChange.konva shadowEnabledChange.konva', _clearGetShadowRGBACache);
        },
        hasChildren: function() {
            return false;
        },
        getChildren: function() {
            return [];
        },
        /**
         * get canvas context tied to the layer
         * @method
         * @memberof Konva.Shape.prototype
         * @returns {Konva.Context}
         */
        getContext: function() {
            return this.getLayer().getContext();
        },
        /**
         * get canvas renderer tied to the layer.  Note that this returns a canvas renderer, not a canvas element
         * @method
         * @memberof Konva.Shape.prototype
         * @returns {Konva.Canvas}
         */
        getCanvas: function() {
            return this.getLayer().getCanvas();
        },
        /**
         * returns whether or not a shadow will be rendered
         * @method
         * @memberof Konva.Shape.prototype
         * @returns {Boolean}
         */
        hasShadow: function() {
            return this._getCache(HAS_SHADOW, this._hasShadow);
        },
        _hasShadow: function() {
            return this.getShadowEnabled() && (this.getShadowOpacity() !== 0 && !!(this.getShadowColor() || this.getShadowBlur() || this.getShadowOffsetX() || this.getShadowOffsetY()));
        },
        getShadowRGBA: function() {
            return this._getCache(SHADOW_RGBA, this._getShadowRGBA);
        },
        _getShadowRGBA: function() {
            if (this.hasShadow()) {
                var rgba = Konva.Util.colorToRGBA(this.shadowColor());
                return 'rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + (rgba.a * (this.getShadowOpacity() || 1)) + ')';
            }
        },
        /**
         * returns whether or not the shape will be filled
         * @method
         * @memberof Konva.Shape.prototype
         * @returns {Boolean}
         */
        hasFill: function() {
            return !!(this.getFill() || this.getFillPatternImage() || this.getFillLinearGradientColorStops() || this.getFillRadialGradientColorStops());
        },
        /**
         * returns whether or not the shape will be stroked
         * @method
         * @memberof Konva.Shape.prototype
         * @returns {Boolean}
         */
        hasStroke: function() {
            return !!(this.stroke());
        },
        /**
         * determines if point is in the shape, regardless if other shapes are on top of it.  Note: because
         *  this method clears a temporary canvas and then redraws the shape, it performs very poorly if executed many times
         *  consecutively.  Please use the {@link Konva.Stage#getIntersection} method if at all possible
         *  because it performs much better
         * @method
         * @memberof Konva.Shape.prototype
         * @param {Object} point
         * @param {Number} point.x
         * @param {Number} point.y
         * @returns {Boolean}
         */
        intersects: function(point) {
            var stage = this.getStage(),
                bufferHitCanvas = stage.bufferHitCanvas,
                p;

            bufferHitCanvas.getContext().clear();
            this.drawScene(bufferHitCanvas);
            p = bufferHitCanvas.context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
            return p[3] > 0;
        },
        // extends Node.prototype.destroy
        destroy: function() {
            Konva.Node.prototype.destroy.call(this);
            delete Konva.shapes[this.colorKey];
            return this;
        },
        _useBufferCanvas: function(caching) {
            return !caching && (this.perfectDrawEnabled() && (this.getAbsoluteOpacity() !== 1) && this.hasFill() && this.hasStroke() && this.getStage()) ||
                   (this.perfectDrawEnabled() && this.hasShadow() && (this.getAbsoluteOpacity() !== 1) && this.hasFill() && this.hasStroke() && this.getStage());
        },
        /**
         * return self rectangle (x, y, width, height) of shape.
         * This method are not taken into account transformation and styles.
         * @method
         * @memberof Konva.Node.prototype
         * @returns {Object} rect with {x, y, width, height} properties
         * @example
         *
         * rect.getSelfRect();  // return {x:0, y:0, width:rect.width(), height:rect.height()}
         * circle.getSelfRect();  // return {x: - circle.width() / 2, y: - circle.height() / 2, width:circle.width(), height:circle.height()}
         *
         */
        getSelfRect: function() {
            var size = this.getSize();
            return {
                x: this._centroid ? Math.round(-size.width / 2) : 0,
                y: this._centroid ? Math.round(-size.height / 2) : 0,
                width: size.width,
                height: size.height
            };
        },
        getClientRect: function(skipTransform) {
            var fillRect = this.getSelfRect();

            var strokeWidth = (this.hasStroke() && this.strokeWidth()) || 0;
            var fillAndStrokeWidth = fillRect.width + strokeWidth;
            var fillAndStrokeHeight = fillRect.height + strokeWidth;

            var shadowOffsetX = this.shadowOffsetX();
            var shadowOffsetY = this.shadowOffsetY();

            var preWidth = fillAndStrokeWidth + Math.abs(shadowOffsetX);
            var preHeight = fillAndStrokeHeight + Math.abs(shadowOffsetY);

            var blurRadius = (this.hasShadow() && this.shadowBlur() || 0);

            var width = preWidth + blurRadius * 2;
            var height = preHeight + blurRadius * 2;

            // if stroke, for example = 3
            // we need to set x to 1.5, but after Math.round it will be 2
            // as we have additional offset we need to increase width and height by 1 pixel
            var roundingOffset = 0;
            if (Math.round(strokeWidth / 2) !== strokeWidth / 2) {
                roundingOffset = 1;
            }
            var rect = {
                width: width + roundingOffset,
                height: height + roundingOffset,
                x: -Math.round(strokeWidth / 2 + blurRadius) + Math.min(shadowOffsetX, 0) + fillRect.x,
                y: -Math.round(strokeWidth / 2 + blurRadius) + Math.min(shadowOffsetY, 0) + fillRect.y
            };
            if (!skipTransform) {
                return this._transformedRect(rect);
            }
            return rect;
        },
        drawScene: function(can, top, caching, skipBuffer) {
            var layer = this.getLayer(),
                canvas = can || layer.getCanvas(),
                context = canvas.getContext(),
                cachedCanvas = this._cache.canvas,
                drawFunc = this.sceneFunc(),
                hasShadow = this.hasShadow(),
                hasStroke = this.hasStroke(),
                stage, bufferCanvas, bufferContext;

            if(!this.isVisible()) {
                return this;
            }
            if (cachedCanvas) {
                context.save();
                layer._applyTransform(this, context, top);
                this._drawCachedSceneCanvas(context);
                context.restore();
                return this;
            }
            if (!drawFunc) {
                return this;
            }
            context.save();
            // if buffer canvas is needed
            if (this._useBufferCanvas(caching) && !skipBuffer) {
                stage = this.getStage();
                bufferCanvas = stage.bufferCanvas;
                bufferContext = bufferCanvas.getContext();
                bufferContext.clear();
                bufferContext.save();
                bufferContext._applyLineJoin(this);
                // layer might be undefined if we are using cache before adding to layer
                if (!caching) {
                    if (layer) {
                        layer._applyTransform(this, bufferContext, top);
                    } else {
                        var m = this.getAbsoluteTransform(top).getMatrix();
                        context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
                    }
                }

                drawFunc.call(this, bufferContext);
                bufferContext.restore();

                var ratio = bufferCanvas.pixelRatio;
                if (hasShadow && !canvas.hitCanvas) {
                        context.save();
                        context._applyShadow(this);
                        context._applyOpacity(this);
                        context.drawImage(bufferCanvas._canvas, 0, 0, bufferCanvas.width / ratio, bufferCanvas.height / ratio);
                        context.restore();
                } else {
                    context._applyOpacity(this);
                    context.drawImage(bufferCanvas._canvas, 0, 0, bufferCanvas.width / ratio, bufferCanvas.height / ratio);
                }
            }
            // if buffer canvas is not needed
            else {
                context._applyLineJoin(this);
                // layer might be undefined if we are using cache before adding to layer
                if (!caching) {
                    if (layer) {
                        layer._applyTransform(this, context, top);
                    } else {
                        var o = this.getAbsoluteTransform(top).getMatrix();
                        context.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
                    }
                }

                if (hasShadow && hasStroke && !canvas.hitCanvas) {
                    context.save();
                    // apply shadow
                    if (!caching) {
                        context._applyOpacity(this);
                    }
                    context._applyShadow(this);
                    drawFunc.call(this, context);
                    context.restore();
                    // if shape has stroke we need to redraw shape
                    // otherwise we will see a shadow under stroke (and over fill)
                    // but I think this is unexpected behavior
                    if (this.hasFill() && this.getShadowForStrokeEnabled()) {
                        drawFunc.call(this, context);
                    }
                } else if (hasShadow && !canvas.hitCanvas) {
                    context.save();
                    if (!caching) {
                        context._applyOpacity(this);
                    }
                    context._applyShadow(this);
                    drawFunc.call(this, context);
                    context.restore();
                } else {
                    if (!caching) {
                        context._applyOpacity(this);
                    }
                    drawFunc.call(this, context);
                }
            }
            context.restore();
            return this;
        },
        drawHit: function(can, top, caching) {
            var layer = this.getLayer(),
                canvas = can || layer.hitCanvas,
                context = canvas.getContext(),
                drawFunc = this.hitFunc() || this.sceneFunc(),
                cachedCanvas = this._cache.canvas,
                cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

            if(!this.shouldDrawHit(canvas)) {
                return this;
            }
            if (layer) {
                layer.clearHitCache();
            }
            if (cachedHitCanvas) {
                context.save();
                layer._applyTransform(this, context, top);
                this._drawCachedHitCanvas(context);
                context.restore();
                return this;
            }
            if (!drawFunc) {
                return this;
            }
            context.save();
            context._applyLineJoin(this);
            if (!caching) {
                if (layer) {
                    layer._applyTransform(this, context, top);
                } else {
                    var o = this.getAbsoluteTransform(top).getMatrix();
                    context.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
                }
            }
            drawFunc.call(this, context);
            context.restore();
            return this;
        },
        /**
        * draw hit graph using the cached scene canvas
        * @method
        * @memberof Konva.Shape.prototype
        * @param {Integer} alphaThreshold alpha channel threshold that determines whether or not
        *  a pixel should be drawn onto the hit graph.  Must be a value between 0 and 255.
        *  The default is 0
        * @returns {Konva.Shape}
        * @example
        * shape.cache();
        * shape.drawHitFromCache();
        */
        drawHitFromCache: function(alphaThreshold) {
            var threshold = alphaThreshold || 0,
                cachedCanvas = this._cache.canvas,
                sceneCanvas = this._getCachedSceneCanvas(),
                hitCanvas = cachedCanvas.hit,
                hitContext = hitCanvas.getContext(),
                hitWidth = hitCanvas.getWidth(),
                hitHeight = hitCanvas.getHeight(),
                hitImageData, hitData, len, rgbColorKey, i, alpha;

            hitContext.clear();
            hitContext.drawImage(sceneCanvas._canvas, 0, 0, hitWidth, hitHeight);

            try {
                hitImageData = hitContext.getImageData(0, 0, hitWidth, hitHeight);
                hitData = hitImageData.data;
                len = hitData.length;
                rgbColorKey = Konva.Util._hexToRgb(this.colorKey);

                // replace non transparent pixels with color key
                for(i = 0; i < len; i += 4) {
                    alpha = hitData[i + 3];
                    if (alpha > threshold) {
                        hitData[i] = rgbColorKey.r;
                        hitData[i + 1] = rgbColorKey.g;
                        hitData[i + 2] = rgbColorKey.b;
                        hitData[i + 3] = 255;
                    }
                    else {
                        hitData[i + 3] = 0;
                    }
                }
                hitContext.putImageData(hitImageData, 0, 0);
            }
            catch(e) {
                Konva.Util.error('Unable to draw hit graph from cached scene canvas. ' + e.message);
            }

            return this;
        }
    });
    Konva.Util.extend(Konva.Shape, Konva.Node);

    // add getters and setters
    Konva.Factory.addGetterSetter(Konva.Shape, 'stroke');

    /**
     * get/set stroke color
     * @name stroke
     * @method
     * @memberof Konva.Shape.prototype
     * @param {String} color
     * @returns {String}
     * @example
     * // get stroke color
     * var stroke = shape.stroke();
     *
     * // set stroke color with color string
     * shape.stroke('green');
     *
     * // set stroke color with hex
     * shape.stroke('#00ff00');
     *
     * // set stroke color with rgb
     * shape.stroke('rgb(0,255,0)');
     *
     * // set stroke color with rgba and make it 50% opaque
     * shape.stroke('rgba(0,255,0,0.5');
     */

    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'strokeRed', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'strokeGreen', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'strokeBlue', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'strokeAlpha', 1, Konva.Validators.alphaComponent);


    Konva.Factory.addGetterSetter(Konva.Shape, 'strokeWidth', 2);

    /**
     * get/set stroke width
     * @name strokeWidth
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} strokeWidth
     * @returns {Number}
     * @example
     * // get stroke width
     * var strokeWidth = shape.strokeWidth();
     *
     * // set stroke width
     * shape.strokeWidth();
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'strokeHitEnabled', true);

    /**
     * get/set strokeHitEnabled property. Useful for performance optimization.
     * You may set `shape.strokeHitEnabled(false)`. In this case stroke will be no draw on hit canvas, so hit area
     * of shape will be decreased (by lineWidth / 2). Remember that non closed line with `strokeHitEnabled = false`
     * will be not drawn on hit canvas, that is mean line will no trigger pointer events (like mouseover)
     * Default value is true
     * @name strokeHitEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} strokeHitEnabled
     * @returns {Boolean}
     * @example
     * // get strokeHitEnabled
     * var strokeHitEnabled = shape.strokeHitEnabled();
     *
     * // set strokeHitEnabled
     * shape.strokeHitEnabled();
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'perfectDrawEnabled', true);

    /**
     * get/set perfectDrawEnabled. If a shape has fill, stroke and opacity you may set `perfectDrawEnabled` to improve performance.
     * See http://konvajs.github.io/docs/performance/Disable_Perfect_Draw.html for more information.
     * Default value is true
     * @name perfectDrawEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} perfectDrawEnabled
     * @returns {Boolean}
     * @example
     * // get perfectDrawEnabled
     * var perfectDrawEnabled = shape.perfectDrawEnabled();
     *
     * // set perfectDrawEnabled
     * shape.perfectDrawEnabled();
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'shadowForStrokeEnabled', true);

    /**
     * get/set shadowForStrokeEnabled. Useful for performance optimization.
     * You may set `shape.shadowForStrokeEnabled(false)`. In this case stroke will be no draw shadow for stroke.
     * Remember if you set `shadowForStrokeEnabled = false` for non closed line - that line with have no shadow!.
     * Default value is true
     * @name shadowForStrokeEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} shadowForStrokeEnabled
     * @returns {Boolean}
     * @example
     * // get shadowForStrokeEnabled
     * var shadowForStrokeEnabled = shape.shadowForStrokeEnabled();
     *
     * // set shadowForStrokeEnabled
     * shape.shadowForStrokeEnabled();
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'lineJoin');

    /**
     * get/set line join.  Can be miter, round, or bevel.  The
     *  default is miter
     * @name lineJoin
     * @method
     * @memberof Konva.Shape.prototype
     * @param {String} lineJoin
     * @returns {String}
     * @example
     * // get line join
     * var lineJoin = shape.lineJoin();
     *
     * // set line join
     * shape.lineJoin('round');
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'lineCap');

    /**
     * get/set line cap.  Can be butt, round, or square
     * @name lineCap
     * @method
     * @memberof Konva.Shape.prototype
     * @param {String} lineCap
     * @returns {String}
     * @example
     * // get line cap
     * var lineCap = shape.lineCap();
     *
     * // set line cap
     * shape.lineCap('round');
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'sceneFunc');

    /**
     * get/set scene draw function
     * @name sceneFunc
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Function} drawFunc drawing function
     * @returns {Function}
     * @example
     * // get scene draw function
     * var sceneFunc = shape.sceneFunc();
     *
     * // set scene draw function
     * shape.sceneFunc(function(context) {
     *   context.beginPath();
     *   context.rect(0, 0, this.width(), this.height());
     *   context.closePath();
     *   context.fillStrokeShape(this);
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'hitFunc');

    /**
     * get/set hit draw function
     * @name hitFunc
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Function} drawFunc drawing function
     * @returns {Function}
     * @example
     * // get hit draw function
     * var hitFunc = shape.hitFunc();
     *
     * // set hit draw function
     * shape.hitFunc(function(context) {
     *   context.beginPath();
     *   context.rect(0, 0, this.width(), this.height());
     *   context.closePath();
     *   context.fillStrokeShape(this);
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'dash');

    /**
     * get/set dash array for stroke.
     * @name dash
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Array} dash
     * @returns {Array}
     * @example
     *  // apply dashed stroke that is 10px long and 5 pixels apart
     *  line.dash([10, 5]);
     *  // apply dashed stroke that is made up of alternating dashed
     *  // lines that are 10px long and 20px apart, and dots that have
     *  // a radius of 5px and are 20px apart
     *  line.dash([10, 20, 0.001, 20]);
     */


    Konva.Factory.addGetterSetter(Konva.Shape, 'shadowColor');

    /**
     * get/set shadow color
     * @name shadowColor
     * @method
     * @memberof Konva.Shape.prototype
     * @param {String} color
     * @returns {String}
     * @example
     * // get shadow color
     * var shadow = shape.shadowColor();
     *
     * // set shadow color with color string
     * shape.shadowColor('green');
     *
     * // set shadow color with hex
     * shape.shadowColor('#00ff00');
     *
     * // set shadow color with rgb
     * shape.shadowColor('rgb(0,255,0)');
     *
     * // set shadow color with rgba and make it 50% opaque
     * shape.shadowColor('rgba(0,255,0,0.5');
     */

    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'shadowRed', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'shadowGreen', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'shadowBlue', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'shadowAlpha', 1, Konva.Validators.alphaComponent);

    Konva.Factory.addGetterSetter(Konva.Shape, 'shadowBlur');

    /**
     * get/set shadow blur
     * @name shadowBlur
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} blur
     * @returns {Number}
     * @example
     * // get shadow blur
     * var shadowBlur = shape.shadowBlur();
     *
     * // set shadow blur
     * shape.shadowBlur(10);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'shadowOpacity');

    /**
     * get/set shadow opacity.  must be a value between 0 and 1
     * @name shadowOpacity
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} opacity
     * @returns {Number}
     * @example
     * // get shadow opacity
     * var shadowOpacity = shape.shadowOpacity();
     *
     * // set shadow opacity
     * shape.shadowOpacity(0.5);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Shape, 'shadowOffset', ['x', 'y']);

    /**
     * get/set shadow offset
     * @name shadowOffset
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Object} offset
     * @param {Number} offset.x
     * @param {Number} offset.y
     * @returns {Object}
     * @example
     * // get shadow offset
     * var shadowOffset = shape.shadowOffset();
     *
     * // set shadow offset
     * shape.shadowOffset({
     *   x: 20
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'shadowOffsetX', 0);

     /**
     * get/set shadow offset x
     * @name shadowOffsetX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get shadow offset x
     * var shadowOffsetX = shape.shadowOffsetX();
     *
     * // set shadow offset x
     * shape.shadowOffsetX(5);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'shadowOffsetY', 0);

     /**
     * get/set shadow offset y
     * @name shadowOffsetY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get shadow offset y
     * var shadowOffsetY = shape.shadowOffsetY();
     *
     * // set shadow offset y
     * shape.shadowOffsetY(5);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternImage');

    /**
     * get/set fill pattern image
     * @name fillPatternImage
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Image} image object
     * @returns {Image}
     * @example
     * // get fill pattern image
     * var fillPatternImage = shape.fillPatternImage();
     *
     * // set fill pattern image
     * var imageObj = new Image();
     * imageObj.onload = function() {
     *   shape.fillPatternImage(imageObj);
     * };
     * imageObj.src = 'path/to/image/jpg';
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fill');

    /**
     * get/set fill color
     * @name fill
     * @method
     * @memberof Konva.Shape.prototype
     * @param {String} color
     * @returns {String}
     * @example
     * // get fill color
     * var fill = shape.fill();
     *
     * // set fill color with color string
     * shape.fill('green');
     *
     * // set fill color with hex
     * shape.fill('#00ff00');
     *
     * // set fill color with rgb
     * shape.fill('rgb(0,255,0)');
     *
     * // set fill color with rgba and make it 50% opaque
     * shape.fill('rgba(0,255,0,0.5');
     *
     * // shape without fill
     * shape.fill(null);
     */

    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'fillRed', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'fillGreen', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'fillBlue', 0, Konva.Validators.RGBComponent);
    Konva.Factory.addDeprecatedGetterSetter(Konva.Shape, 'fillAlpha', 1, Konva.Validators.alphaComponent);

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternX', 0);

    /**
     * get/set fill pattern x
     * @name fillPatternX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get fill pattern x
     * var fillPatternX = shape.fillPatternX();
     * // set fill pattern x
     * shape.fillPatternX(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternY', 0);

    /**
     * get/set fill pattern y
     * @name fillPatternY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get fill pattern y
     * var fillPatternY = shape.fillPatternY();
     * // set fill pattern y
     * shape.fillPatternY(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillLinearGradientColorStops');

    /**
     * get/set fill linear gradient color stops
     * @name fillLinearGradientColorStops
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Array} colorStops
     * @returns {Array} colorStops
     * @example
     * // get fill linear gradient color stops
     * var colorStops = shape.fillLinearGradientColorStops();
     *
     * // create a linear gradient that starts with red, changes to blue
     * // halfway through, and then changes to green
     * shape.fillLinearGradientColorStops(0, 'red', 0.5, 'blue', 1, 'green');
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillRadialGradientStartRadius', 0);

    /**
     * get/set fill radial gradient start radius
     * @name fillRadialGradientStartRadius
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} radius
     * @returns {Number}
     * @example
     * // get radial gradient start radius
     * var startRadius = shape.fillRadialGradientStartRadius();
     *
     * // set radial gradient start radius
     * shape.fillRadialGradientStartRadius(0);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillRadialGradientEndRadius', 0);

    /**
     * get/set fill radial gradient end radius
     * @name fillRadialGradientEndRadius
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} radius
     * @returns {Number}
     * @example
     * // get radial gradient end radius
     * var endRadius = shape.fillRadialGradientEndRadius();
     *
     * // set radial gradient end radius
     * shape.fillRadialGradientEndRadius(100);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillRadialGradientColorStops');

    /**
     * get/set fill radial gradient color stops
     * @name fillRadialGradientColorStops
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} colorStops
     * @returns {Array}
     * @example
     * // get fill radial gradient color stops
     * var colorStops = shape.fillRadialGradientColorStops();
     *
     * // create a radial gradient that starts with red, changes to blue
     * // halfway through, and then changes to green
     * shape.fillRadialGradientColorStops(0, 'red', 0.5, 'blue', 1, 'green');
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternRepeat', 'repeat');

    /**
     * get/set fill pattern repeat.  Can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'repeat'
     * @name fillPatternRepeat
     * @method
     * @memberof Konva.Shape.prototype
     * @param {String} repeat
     * @returns {String}
     * @example
     * // get fill pattern repeat
     * var repeat = shape.fillPatternRepeat();
     *
     * // repeat pattern in x direction only
     * shape.fillPatternRepeat('repeat-x');
     *
     * // do not repeat the pattern
     * shape.fillPatternRepeat('no repeat');
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillEnabled', true);

    /**
     * get/set fill enabled flag
     * @name fillEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} enabled
     * @returns {Boolean}
     * @example
     * // get fill enabled flag
     * var fillEnabled = shape.fillEnabled();
     *
     * // disable fill
     * shape.fillEnabled(false);
     *
     * // enable fill
     * shape.fillEnabled(true);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'strokeEnabled', true);

    /**
     * get/set stroke enabled flag
     * @name strokeEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} enabled
     * @returns {Boolean}
     * @example
     * // get stroke enabled flag
     * var strokeEnabled = shape.strokeEnabled();
     *
     * // disable stroke
     * shape.strokeEnabled(false);
     *
     * // enable stroke
     * shape.strokeEnabled(true);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'shadowEnabled', true);

    /**
     * get/set shadow enabled flag
     * @name shadowEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} enabled
     * @returns {Boolean}
     * @example
     * // get shadow enabled flag
     * var shadowEnabled = shape.shadowEnabled();
     *
     * // disable shadow
     * shape.shadowEnabled(false);
     *
     * // enable shadow
     * shape.shadowEnabled(true);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'dashEnabled', true);

    /**
     * get/set dash enabled flag
     * @name dashEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} enabled
     * @returns {Boolean}
     * @example
     * // get dash enabled flag
     * var dashEnabled = shape.dashEnabled();
     *
     * // disable dash
     * shape.dashEnabled(false);
     *
     * // enable dash
     * shape.dashEnabled(true);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'strokeScaleEnabled', true);

    /**
     * get/set strokeScale enabled flag
     * @name strokeScaleEnabled
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Boolean} enabled
     * @returns {Boolean}
     * @example
     * // get stroke scale enabled flag
     * var strokeScaleEnabled = shape.strokeScaleEnabled();
     *
     * // disable stroke scale
     * shape.strokeScaleEnabled(false);
     *
     * // enable stroke scale
     * shape.strokeScaleEnabled(true);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPriority', 'color');

    /**
     * get/set fill priority.  can be color, pattern, linear-gradient, or radial-gradient.  The default is color.
     *   This is handy if you want to toggle between different fill types.
     * @name fillPriority
     * @method
     * @memberof Konva.Shape.prototype
     * @param {String} priority
     * @returns {String}
     * @example
     * // get fill priority
     * var fillPriority = shape.fillPriority();
     *
     * // set fill priority
     * shape.fillPriority('linear-gradient');
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Shape, 'fillPatternOffset', ['x', 'y']);

    /**
     * get/set fill pattern offset
     * @name fillPatternOffset
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Object} offset
     * @param {Number} offset.x
     * @param {Number} offset.y
     * @returns {Object}
     * @example
     * // get fill pattern offset
     * var patternOffset = shape.fillPatternOffset();
     *
     * // set fill pattern offset
     * shape.fillPatternOffset({
     *   x: 20
     *   y: 10
     * });
     */


    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternOffsetX', 0);
    /**
     * get/set fill pattern offset x
     * @name fillPatternOffsetX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get fill pattern offset x
     * var patternOffsetX = shape.fillPatternOffsetX();
     *
     * // set fill pattern offset x
     * shape.fillPatternOffsetX(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternOffsetY', 0);
    /**
     * get/set fill pattern offset y
     * @name fillPatternOffsetY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get fill pattern offset y
     * var patternOffsetY = shape.fillPatternOffsetY();
     *
     * // set fill pattern offset y
     * shape.fillPatternOffsetY(10);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Shape, 'fillPatternScale', ['x', 'y']);

    /**
     * get/set fill pattern scale
     * @name fillPatternScale
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Object} scale
     * @param {Number} scale.x
     * @param {Number} scale.y
     * @returns {Object}
     * @example
     * // get fill pattern scale
     * var patternScale = shape.fillPatternScale();
     *
     * // set fill pattern scale
     * shape.fillPatternScale({
     *   x: 2
     *   y: 2
     * });
     */


    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternScaleX', 1);
    /**
     * get/set fill pattern scale x
     * @name fillPatternScaleX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get fill pattern scale x
     * var patternScaleX = shape.fillPatternScaleX();
     *
     * // set fill pattern scale x
     * shape.fillPatternScaleX(2);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternScaleY', 1);
    /**
     * get/set fill pattern scale y
     * @name fillPatternScaleY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get fill pattern scale y
     * var patternScaleY = shape.fillPatternScaleY();
     *
     * // set fill pattern scale y
     * shape.fillPatternScaleY(2);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Shape, 'fillLinearGradientStartPoint', ['x', 'y']);

    /**
     * get/set fill linear gradient start point
     * @name fillLinearGradientStartPoint
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Object} startPoint
     * @param {Number} startPoint.x
     * @param {Number} startPoint.y
     * @returns {Object}
     * @example
     * // get fill linear gradient start point
     * var startPoint = shape.fillLinearGradientStartPoint();
     *
     * // set fill linear gradient start point
     * shape.fillLinearGradientStartPoint({
     *   x: 20
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillLinearGradientStartPointX', 0);
    /**
     * get/set fill linear gradient start point x
     * @name fillLinearGradientStartPointX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get fill linear gradient start point x
     * var startPointX = shape.fillLinearGradientStartPointX();
     *
     * // set fill linear gradient start point x
     * shape.fillLinearGradientStartPointX(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillLinearGradientStartPointY', 0);
    /**
     * get/set fill linear gradient start point y
     * @name fillLinearGradientStartPointY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get fill linear gradient start point y
     * var startPointY = shape.fillLinearGradientStartPointY();
     *
     * // set fill linear gradient start point y
     * shape.fillLinearGradientStartPointY(20);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Shape, 'fillLinearGradientEndPoint', ['x', 'y']);

    /**
     * get/set fill linear gradient end point
     * @name fillLinearGradientEndPoint
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Object} endPoint
     * @param {Number} endPoint.x
     * @param {Number} endPoint.y
     * @returns {Object}
     * @example
     * // get fill linear gradient end point
     * var endPoint = shape.fillLinearGradientEndPoint();
     *
     * // set fill linear gradient end point
     * shape.fillLinearGradientEndPoint({
     *   x: 20
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillLinearGradientEndPointX', 0);
    /**
     * get/set fill linear gradient end point x
     * @name fillLinearGradientEndPointX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get fill linear gradient end point x
     * var endPointX = shape.fillLinearGradientEndPointX();
     *
     * // set fill linear gradient end point x
     * shape.fillLinearGradientEndPointX(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillLinearGradientEndPointY', 0);
    /**
     * get/set fill linear gradient end point y
     * @name fillLinearGradientEndPointY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get fill linear gradient end point y
     * var endPointY = shape.fillLinearGradientEndPointY();
     *
     * // set fill linear gradient end point y
     * shape.fillLinearGradientEndPointY(20);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Shape, 'fillRadialGradientStartPoint', ['x', 'y']);

    /**
     * get/set fill radial gradient start point
     * @name fillRadialGradientStartPoint
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Object} startPoint
     * @param {Number} startPoint.x
     * @param {Number} startPoint.y
     * @returns {Object}
     * @example
     * // get fill radial gradient start point
     * var startPoint = shape.fillRadialGradientStartPoint();
     *
     * // set fill radial gradient start point
     * shape.fillRadialGradientStartPoint({
     *   x: 20
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillRadialGradientStartPointX', 0);
    /**
     * get/set fill radial gradient start point x
     * @name fillRadialGradientStartPointX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get fill radial gradient start point x
     * var startPointX = shape.fillRadialGradientStartPointX();
     *
     * // set fill radial gradient start point x
     * shape.fillRadialGradientStartPointX(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillRadialGradientStartPointY', 0);
    /**
     * get/set fill radial gradient start point y
     * @name fillRadialGradientStartPointY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get fill radial gradient start point y
     * var startPointY = shape.fillRadialGradientStartPointY();
     *
     * // set fill radial gradient start point y
     * shape.fillRadialGradientStartPointY(20);
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Shape, 'fillRadialGradientEndPoint', ['x', 'y']);

    /**
     * get/set fill radial gradient end point
     * @name fillRadialGradientEndPoint
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Object} endPoint
     * @param {Number} endPoint.x
     * @param {Number} endPoint.y
     * @returns {Object}
     * @example
     * // get fill radial gradient end point
     * var endPoint = shape.fillRadialGradientEndPoint();
     *
     * // set fill radial gradient end point
     * shape.fillRadialGradientEndPoint({
     *   x: 20
     *   y: 10
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillRadialGradientEndPointX', 0);
    /**
     * get/set fill radial gradient end point x
     * @name fillRadialGradientEndPointX
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get fill radial gradient end point x
     * var endPointX = shape.fillRadialGradientEndPointX();
     *
     * // set fill radial gradient end point x
     * shape.fillRadialGradientEndPointX(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillRadialGradientEndPointY', 0);
    /**
     * get/set fill radial gradient end point y
     * @name fillRadialGradientEndPointY
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get fill radial gradient end point y
     * var endPointY = shape.fillRadialGradientEndPointY();
     *
     * // set fill radial gradient end point y
     * shape.fillRadialGradientEndPointY(20);
     */

    Konva.Factory.addGetterSetter(Konva.Shape, 'fillPatternRotation', 0);

    /**
     * get/set fill pattern rotation in degrees
     * @name fillPatternRotation
     * @method
     * @memberof Konva.Shape.prototype
     * @param {Number} rotation
     * @returns {Konva.Shape}
     * @example
     * // get fill pattern rotation
     * var patternRotation = shape.fillPatternRotation();
     *
     * // set fill pattern rotation
     * shape.fillPatternRotation(20);
     */


    Konva.Factory.backCompat(Konva.Shape, {
        dashArray: 'dash',
        getDashArray: 'getDash',
        setDashArray: 'getDash',

        drawFunc: 'sceneFunc',
        getDrawFunc: 'getSceneFunc',
        setDrawFunc: 'setSceneFunc',

        drawHitFunc: 'hitFunc',
        getDrawHitFunc: 'getHitFunc',
        setDrawHitFunc: 'setHitFunc'
    });

    Konva.Collection.mapMethods(Konva.Shape);
})(Konva);

(function() {
    'use strict';
    // CONSTANTS
    var STAGE = 'Stage',
        STRING = 'string',
        PX = 'px',

        MOUSEOUT = 'mouseout',
        MOUSELEAVE = 'mouseleave',
        MOUSEOVER = 'mouseover',
        MOUSEENTER = 'mouseenter',
        MOUSEMOVE = 'mousemove',
        MOUSEDOWN = 'mousedown',
        MOUSEUP = 'mouseup',
        CLICK = 'click',
        DBL_CLICK = 'dblclick',
        TOUCHSTART = 'touchstart',
        TOUCHEND = 'touchend',
        TAP = 'tap',
        DBL_TAP = 'dbltap',
        TOUCHMOVE = 'touchmove',
        DOMMOUSESCROLL = 'DOMMouseScroll',
        MOUSEWHEEL = 'mousewheel',
        WHEEL = 'wheel',

        CONTENT_MOUSEOUT = 'contentMouseout',
        CONTENT_MOUSEOVER = 'contentMouseover',
        CONTENT_MOUSEMOVE = 'contentMousemove',
        CONTENT_MOUSEDOWN = 'contentMousedown',
        CONTENT_MOUSEUP = 'contentMouseup',
        CONTENT_CLICK = 'contentClick',
        CONTENT_DBL_CLICK = 'contentDblclick',
        CONTENT_TOUCHSTART = 'contentTouchstart',
        CONTENT_TOUCHEND = 'contentTouchend',
        CONTENT_DBL_TAP = 'contentDbltap',
        CONTENT_TAP = 'contentTap',
        CONTENT_TOUCHMOVE = 'contentTouchmove',
        CONTENT_WHEEL = 'contentWheel',

        DIV = 'div',
        RELATIVE = 'relative',
        KONVA_CONTENT = 'konvajs-content',
        SPACE = ' ',
        UNDERSCORE = '_',
        CONTAINER = 'container',
        EMPTY_STRING = '',
        EVENTS = [MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSEOUT, TOUCHSTART, TOUCHMOVE, TOUCHEND, MOUSEOVER, DOMMOUSESCROLL, MOUSEWHEEL, WHEEL],

        // cached variables
        eventsLength = EVENTS.length;

    function addEvent(ctx, eventName) {
        ctx.content.addEventListener(eventName, function(evt) {
            ctx[UNDERSCORE + eventName](evt);
        }, false);
    }

    /**
     * Stage constructor.  A stage is used to contain multiple layers
     * @constructor
     * @memberof Konva
     * @augments Konva.Container
     * @param {Object} config
     * @param {String|Element} config.container Container selector or DOM element
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var stage = new Konva.Stage({
         *   width: 500,
         *   height: 800,
         *   container: 'containerId' // or "#containerId" or ".containerClass"
         * });
     */
    Konva.Stage = function(config) {
        this.___init(config);
    };

    Konva.Util.addMethods(Konva.Stage, {
        ___init: function(config) {
            this.nodeType = STAGE;
            // call super constructor
            Konva.Container.call(this, config);
            this._id = Konva.idCounter++;
            this._buildDOM();
            this._bindContentEvents();
            this._enableNestedTransforms = false;
            Konva.stages.push(this);
        },
        _validateAdd: function(child) {
            if (child.getType() !== 'Layer') {
                Konva.Util.throw('You may only add layers to the stage.');
            }
        },
        /**
         * set container dom element which contains the stage wrapper div element
         * @method
         * @memberof Konva.Stage.prototype
         * @param {DomElement} container can pass in a dom element or id string
         */
        setContainer: function (container) {
            if (typeof container === STRING) {
                if (container.charAt(0) === '.') {
                    var className = container.slice(1);
                    container = Konva.document.getElementsByClassName(className)[0];
                } else {
                    var id;
                    if (container.charAt(0) !== '#') {
                        id = container;
                    } else {
                        id = container.slice(1);
                    }
                    container = Konva.document.getElementById(id);
                }
                if (!container) {
                    throw 'Can not find container in document with id ' + id;
                }
            }
            this._setAttr(CONTAINER, container);
            return this;
        },
        shouldDrawHit: function() {
            return true;
        },
        draw: function() {
            Konva.Node.prototype.draw.call(this);
            return this;
        },
        /**
         * draw layer scene graphs
         * @name draw
         * @method
         * @memberof Konva.Stage.prototype
         */

        /**
         * draw layer hit graphs
         * @name drawHit
         * @method
         * @memberof Konva.Stage.prototype
         */

        /**
         * set height
         * @method
         * @memberof Konva.Stage.prototype
         * @param {Number} height
         */
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            this._resizeDOM();
            return this;
        },
        /**
         * set width
         * @method
         * @memberof Konva.Stage.prototype
         * @param {Number} width
         */
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            this._resizeDOM();
            return this;
        },
        /**
         * clear all layers
         * @method
         * @memberof Konva.Stage.prototype
         */
        clear: function() {
            var layers = this.children,
                len = layers.length,
                n;

            for(n = 0; n < len; n++) {
                layers[n].clear();
            }
            return this;
        },
        clone: function(obj) {
            if (!obj) {
                obj = {};
            }
            obj.container = Konva.document.createElement(DIV);
            return Konva.Container.prototype.clone.call(this, obj);
        },
        /**
         * destroy stage
         * @method
         * @memberof Konva.Stage.prototype
         */
        destroy: function() {
            var content = this.content;
            Konva.Container.prototype.destroy.call(this);

            if(content && Konva.Util._isInDocument(content)) {
                this.getContainer().removeChild(content);
            }
            var index = Konva.stages.indexOf(this);
            if (index > -1) {
                Konva.stages.splice(index, 1);
            }
            return this;
        },
        /**
         * get pointer position which can be a touch position or mouse position
         * @method
         * @memberof Konva.Stage.prototype
         * @returns {Object}
         */
        getPointerPosition: function() {
            return this.pointerPos;
        },
        getStage: function() {
            return this;
        },
        /**
         * get stage content div element which has the
         *  the class name "konvajs-content"
         * @method
         * @memberof Konva.Stage.prototype
         */
        getContent: function() {
            return this.content;
        },
        /**
         * Creates a composite data URL
         * @method
         * @memberof Konva.Stage.prototype
         * @param {Object} config
         * @param {Function} [config.callback] function executed when the composite has completed. Deprecated as method is sync now.
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         */
        toDataURL: function(config) {
            config = config || {};

            var mimeType = config.mimeType || null,
                quality = config.quality || null,
                x = config.x || 0,
                y = config.y || 0,
                canvas = new Konva.SceneCanvas({
                    width: config.width || this.getWidth(),
                    height: config.height || this.getHeight(),
                    pixelRatio: config.pixelRatio
                }),
                _context = canvas.getContext()._context,
                layers = this.children;

            if(x || y) {
                _context.translate(-1 * x, -1 * y);
            }


            layers.each(function(layer) {
                var width = layer.getCanvas().getWidth();
                var height = layer.getCanvas().getHeight();
                var ratio = layer.getCanvas().getPixelRatio();
                _context.drawImage(layer.getCanvas()._canvas, 0, 0, width / ratio, height / ratio);
            });
            var src = canvas.toDataURL(mimeType, quality);

            if (config.callback) {
                config.callback(src);
            }

            return src;
        },
        /**
         * converts stage into an image.
         * @method
         * @memberof Konva.Stage.prototype
         * @param {Object} config
         * @param {Function} config.callback function executed when the composite has completed
         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
         *  "image/png" is the default
         * @param {Number} [config.x] x position of canvas section
         * @param {Number} [config.y] y position of canvas section
         * @param {Number} [config.width] width of canvas section
         * @param {Number} [config.height] height of canvas section
         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
         *  is very high quality
         */
        toImage: function(config) {
            var cb = config.callback;

            config.callback = function(dataUrl) {
                Konva.Util._getImage(dataUrl, function(img) {
                    cb(img);
                });
            };
            this.toDataURL(config);
        },
        /**
         * get visible intersection shape. This is the preferred
         *  method for determining if a point intersects a shape or not
         * @method
         * @memberof Konva.Stage.prototype
         * @param {Object} pos
         * @param {Number} pos.x
         * @param {Number} pos.y
         * @param {String} [selector]
         * @returns {Konva.Node}
         * @example
         * var shape = stage.getIntersection({x: 50, y: 50});
         * // or if you interested in shape parent:
         * var group = stage.getIntersection({x: 50, y: 50}, 'Group');
         */
        getIntersection: function(pos, selector) {
            var layers = this.getChildren(),
                len = layers.length,
                end = len - 1,
                n, shape;

            for(n = end; n >= 0; n--) {
                shape = layers[n].getIntersection(pos, selector);
                if (shape) {
                    return shape;
                }
            }

            return null;
        },
        _resizeDOM: function() {
            if(this.content) {
                var width = this.getWidth(),
                    height = this.getHeight(),
                    layers = this.getChildren(),
                    len = layers.length,
                    n, layer;

                // set content dimensions
                this.content.style.width = width + PX;
                this.content.style.height = height + PX;

                this.bufferCanvas.setSize(width, height);
                this.bufferHitCanvas.setSize(width, height);

                // set layer dimensions
                for(n = 0; n < len; n++) {
                    layer = layers[n];
                    layer.setSize(width, height);
                    layer.draw();
                }
            }
        },
        /**
         * add layer or layers to stage
         * @method
         * @memberof Konva.Stage.prototype
         * @param {...Konva.Layer} layer
         * @example
         * stage.add(layer1, layer2, layer3);
         */
        add: function(layer) {
            if (arguments.length > 1) {
                for (var i = 0; i < arguments.length; i++) {
                    this.add(arguments[i]);
                }
                return this;
            }
            Konva.Container.prototype.add.call(this, layer);
            layer._setCanvasSize(this.width(), this.height());

            // draw layer and append canvas to container
            layer.draw();
            this.content.appendChild(layer.canvas._canvas);

            // chainable
            return this;
        },
        getParent: function() {
            return null;
        },
        getLayer: function() {
            return null;
        },
        /**
         * returns a {@link Konva.Collection} of layers
         * @method
         * @memberof Konva.Stage.prototype
         */
        getLayers: function() {
            return this.getChildren();
        },
        _bindContentEvents: function() {
            for (var n = 0; n < eventsLength; n++) {
                addEvent(this, EVENTS[n]);
            }
        },
        _mouseover: function(evt) {
            if (!Konva.UA.mobile) {
                this._setPointerPosition(evt);
                this._fire(CONTENT_MOUSEOVER, {evt: evt});
            }
        },
        _mouseout: function(evt) {
            if (!Konva.UA.mobile) {
                this._setPointerPosition(evt);
                var targetShape = this.targetShape;

                if(targetShape && !Konva.isDragging()) {
                    targetShape._fireAndBubble(MOUSEOUT, {evt: evt});
                    targetShape._fireAndBubble(MOUSELEAVE, {evt: evt});
                    this.targetShape = null;
                }
                this.pointerPos = undefined;

                this._fire(CONTENT_MOUSEOUT, {evt: evt});
            }
        },
        _mousemove: function(evt) {
            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event
            if (Konva.UA.ieMobile) {
                return this._touchmove(evt);
            }
            // workaround fake mousemove event in chrome browser https://code.google.com/p/chromium/issues/detail?id=161464
            if ((typeof evt.movementX !== 'undefined' || typeof evt.movementY !== 'undefined') && evt.movementY === 0 && evt.movementX === 0) {
                return null;
            }
            if (Konva.UA.mobile) {
                return null;
            }
            this._setPointerPosition(evt);
            var shape;

            if (!Konva.isDragging()) {
                shape = this.getIntersection(this.getPointerPosition());
                if(shape && shape.isListening()) {
                    if(!Konva.isDragging() && (!this.targetShape || this.targetShape._id !== shape._id)) {
                        if(this.targetShape) {
                            this.targetShape._fireAndBubble(MOUSEOUT, {evt: evt}, shape);
                            this.targetShape._fireAndBubble(MOUSELEAVE, {evt: evt}, shape);
                        }
                        shape._fireAndBubble(MOUSEOVER, {evt: evt}, this.targetShape);
                        shape._fireAndBubble(MOUSEENTER, {evt: evt}, this.targetShape);
                        this.targetShape = shape;
                    }
                    else {
                        shape._fireAndBubble(MOUSEMOVE, {evt: evt});
                    }
                }
                /*
                 * if no shape was detected, clear target shape and try
                 * to run mouseout from previous target shape
                 */
                else {
                    if(this.targetShape && !Konva.isDragging()) {
                        this.targetShape._fireAndBubble(MOUSEOUT, {evt: evt});
                        this.targetShape._fireAndBubble(MOUSELEAVE, {evt: evt});
                        this.targetShape = null;
                    }

                }

                // content event
                this._fire(CONTENT_MOUSEMOVE, {evt: evt});
            }

            // always call preventDefault for desktop events because some browsers
            // try to drag and drop the canvas element
            if (evt.preventDefault) {
                evt.preventDefault();
            }
        },
        _mousedown: function(evt) {
            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event
            if (Konva.UA.ieMobile) {
                return this._touchstart(evt);
            }
            if (!Konva.UA.mobile) {
                this._setPointerPosition(evt);
                var shape = this.getIntersection(this.getPointerPosition());

                Konva.listenClickTap = true;

                if (shape && shape.isListening()) {
                    this.clickStartShape = shape;
                    shape._fireAndBubble(MOUSEDOWN, {evt: evt});
                }

                // content event
                this._fire(CONTENT_MOUSEDOWN, {evt: evt});
            }

            // always call preventDefault for desktop events because some browsers
            // try to drag and drop the canvas element
            if (evt.preventDefault) {
                evt.preventDefault();
            }
        },
        _mouseup: function(evt) {

            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event
            if (Konva.UA.ieMobile) {
                return this._touchend(evt);
            }
            if (!Konva.UA.mobile) {
                this._setPointerPosition(evt);
                var shape = this.getIntersection(this.getPointerPosition()),
                    clickStartShape = this.clickStartShape,
                    fireDblClick = false,
                    dd = Konva.DD;

                if(Konva.inDblClickWindow) {
                    fireDblClick = true;
                    Konva.inDblClickWindow = false;
                }
                // don't set inDblClickWindow after dragging
                else if (!dd || !dd.justDragged) {
                    Konva.inDblClickWindow = true;
                } else if (dd) {
                    dd.justDragged = false;
                }

                setTimeout(function() {
                    Konva.inDblClickWindow = false;
                }, Konva.dblClickWindow);

                if (shape && shape.isListening()) {
                    shape._fireAndBubble(MOUSEUP, {evt: evt});

                    // detect if click or double click occurred
                    if(Konva.listenClickTap && clickStartShape && clickStartShape._id === shape._id) {
                        shape._fireAndBubble(CLICK, {evt: evt});

                        if(fireDblClick) {
                            shape._fireAndBubble(DBL_CLICK, {evt: evt});
                        }
                    }
                }
                // content events
                this._fire(CONTENT_MOUSEUP, {evt: evt});
                if (Konva.listenClickTap) {
                    this._fire(CONTENT_CLICK, {evt: evt});
                    if(fireDblClick) {
                        this._fire(CONTENT_DBL_CLICK, {evt: evt});
                    }
                }

                Konva.listenClickTap = false;
            }

            // always call preventDefault for desktop events because some browsers
            // try to drag and drop the canvas element
            if (evt.preventDefault) {
                evt.preventDefault();
            }
        },
        _touchstart: function(evt) {
            this._setPointerPosition(evt);
            var shape = this.getIntersection(this.getPointerPosition());

            Konva.listenClickTap = true;

            if (shape && shape.isListening()) {
                this.tapStartShape = shape;
                shape._fireAndBubble(TOUCHSTART, {evt: evt});

                // only call preventDefault if the shape is listening for events
                if (shape.isListening() && evt.preventDefault) {
                    evt.preventDefault();
                }
            }
            // content event
            this._fire(CONTENT_TOUCHSTART, {evt: evt});
        },
        _touchend: function(evt) {
            this._setPointerPosition(evt);
            var shape = this.getIntersection(this.getPointerPosition()),
                fireDblClick = false;

            if(Konva.inDblClickWindow) {
                fireDblClick = true;
                Konva.inDblClickWindow = false;
            }
            else {
                Konva.inDblClickWindow = true;
            }

            setTimeout(function() {
                Konva.inDblClickWindow = false;
            }, Konva.dblClickWindow);

            if (shape && shape.isListening()) {
                shape._fireAndBubble(TOUCHEND, {evt: evt});

                // detect if tap or double tap occurred
                if(Konva.listenClickTap && shape._id === this.tapStartShape._id) {
                    shape._fireAndBubble(TAP, {evt: evt});

                    if(fireDblClick) {
                        shape._fireAndBubble(DBL_TAP, {evt: evt});
                    }
                }
                // only call preventDefault if the shape is listening for events
                if (shape.isListening() && evt.preventDefault) {
                    evt.preventDefault();
                }
            }
            // content events
            this._fire(CONTENT_TOUCHEND, {evt: evt});
            if (Konva.listenClickTap) {
                this._fire(CONTENT_TAP, {evt: evt});
                if(fireDblClick) {
                    this._fire(CONTENT_DBL_TAP, {evt: evt});
                }
            }

            Konva.listenClickTap = false;
        },
        _touchmove: function(evt) {
            this._setPointerPosition(evt);
            var dd = Konva.DD,
                shape;
            if (!Konva.isDragging()) {
                shape = this.getIntersection(this.getPointerPosition());
                if (shape && shape.isListening()) {
                    shape._fireAndBubble(TOUCHMOVE, {evt: evt});
                    // only call preventDefault if the shape is listening for events
                    if (shape.isListening() && evt.preventDefault) {
                        evt.preventDefault();
                    }
                }
                this._fire(CONTENT_TOUCHMOVE, {evt: evt});
            }
            if(dd) {
                if (Konva.isDragging()) {
                    evt.preventDefault();
                }
            }
        },
        _DOMMouseScroll: function(evt) {
            this._mousewheel(evt);
        },
        _mousewheel: function(evt) {
            this._setPointerPosition(evt);
            var shape = this.getIntersection(this.getPointerPosition());

            if (shape && shape.isListening()) {
                shape._fireAndBubble(WHEEL, {evt: evt});
            }
            this._fire(CONTENT_WHEEL, {evt: evt});
        },
        _wheel: function(evt) {
            this._mousewheel(evt);
        },
        _setPointerPosition: function(evt) {
            var contentPosition = this._getContentPosition(),
                x = null,
                y = null;
            evt = evt ? evt : window.event;

            // touch events
            if(evt.touches !== undefined) {
                // currently, only handle one finger
                if (evt.touches.length > 0) {

                    var touch = evt.touches[0];
                    // get the information for finger #1
                    x = touch.clientX - contentPosition.left;
                    y = touch.clientY - contentPosition.top;
                }
            }
            // mouse events
            else {
                x = evt.clientX - contentPosition.left;
                y = evt.clientY - contentPosition.top;
            }
            if (x !== null && y !== null) {
                this.pointerPos = {
                    x: x,
                    y: y
                };
            }
        },
        _getContentPosition: function() {
            var rect = this.content.getBoundingClientRect ? this.content.getBoundingClientRect() : { top: 0, left: 0 };
            return {
                top: rect.top,
                left: rect.left
            };
        },
        _buildDOM: function() {
            var container = this.getContainer();
            if (!container) {
                if (Konva.Util.isBrowser()) {
                    throw 'Stage has no container. A container is required.';
                } else {
                    // automatically create element for jsdom in nodejs env
                    container = Konva.document.createElement(DIV);
                }
            }
            // clear content inside container
            container.innerHTML = EMPTY_STRING;

            // content
            this.content = Konva.document.createElement(DIV);
            this.content.style.position = RELATIVE;
            this.content.className = KONVA_CONTENT;
            this.content.setAttribute('role', 'presentation');
            container.appendChild(this.content);

            // the buffer canvas pixel ratio must be 1 because it is used as an
            // intermediate canvas before copying the result onto a scene canvas.
            // not setting it to 1 will result in an over compensation
            this.bufferCanvas = new Konva.SceneCanvas();
            this.bufferHitCanvas = new Konva.HitCanvas({pixelRatio: 1});

            this._resizeDOM();
        },
        _onContent: function(typesStr, handler) {
            var types = typesStr.split(SPACE),
                len = types.length,
                n, baseEvent;

            for(n = 0; n < len; n++) {
                baseEvent = types[n];
                this.content.addEventListener(baseEvent, handler, false);
            }
        },
        // currently cache function is now working for stage, because stage has no its own canvas element
        // TODO: may be it is better to cache all children layers?
        cache: function() {
            Konva.Util.warn('Cache function is not allowed for stage. You may use cache only for layers, groups and shapes.');
        },
        clearCache: function() {
        }
    });
    Konva.Util.extend(Konva.Stage, Konva.Container);

    // add getters and setters
    Konva.Factory.addGetter(Konva.Stage, 'container');
    Konva.Factory.addOverloadedGetterSetter(Konva.Stage, 'container');

    /**
     * get container DOM element
     * @name container
     * @method
     * @memberof Konva.Stage.prototype
     * @returns {DomElement} container
     * @example
     * // get container
     * var container = stage.container();
     * // set container
     * var container = document.createElement('div');
     * body.appendChild(container);
     * stage.container(container);
     */

})();

(function() {
    'use strict';
    /**
     * BaseLayer constructor.
     * @constructor
     * @memberof Konva
     * @augments Konva.Container
     * @param {Object} config
     * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
     * to clear the canvas before each layer draw.  The default value is true.
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * * @param {Object} [config.clip] set clip
     * @param {Number} [config.clipX] set clip x
     * @param {Number} [config.clipY] set clip y
     * @param {Number} [config.clipWidth] set clip width
     * @param {Number} [config.clipHeight] set clip height

     * @example
     * var layer = new Konva.Layer();
     */
    Konva.BaseLayer = function(config) {
        this.___init(config);
    };

    Konva.Util.addMethods(Konva.BaseLayer, {
        ___init: function(config) {
            this.nodeType = 'Layer';
            Konva.Container.call(this, config);
        },
        createPNGStream: function() {
            return this.canvas._canvas.createPNGStream();
        },
        /**
         * get layer canvas
         * @method
         * @memberof Konva.BaseLayer.prototype
         */
        getCanvas: function() {
            return this.canvas;
        },
        /**
         * get layer hit canvas
         * @method
         * @memberof Konva.BaseLayer.prototype
         */
        getHitCanvas: function() {
            return this.hitCanvas;
        },
        /**
         * get layer canvas context
         * @method
         * @memberof Konva.BaseLayer.prototype
         */
        getContext: function() {
            return this.getCanvas().getContext();
        },
        /**
         * clear scene and hit canvas contexts tied to the layer
         * @method
         * @memberof Konva.BaseLayer.prototype
         * @param {Object} [bounds]
         * @param {Number} [bounds.x]
         * @param {Number} [bounds.y]
         * @param {Number} [bounds.width]
         * @param {Number} [bounds.height]
         * @example
         * layer.clear();
         * layer.clear({
         *   x : 0,
         *   y : 0,
         *   width : 100,
         *   height : 100
         * });
         */
        clear: function(bounds) {
            this.getContext().clear(bounds);
            return this;
        },
        clearHitCache: function() {
            this._hitImageData = undefined;
        },
        // extend Node.prototype.setZIndex
        setZIndex: function(index) {
            Konva.Node.prototype.setZIndex.call(this, index);
            var stage = this.getStage();
            if(stage) {
                stage.content.removeChild(this.getCanvas()._canvas);

                if(index < stage.getChildren().length - 1) {
                    stage.content.insertBefore(this.getCanvas()._canvas, stage.getChildren()[index + 1].getCanvas()._canvas);
                }
                else {
                    stage.content.appendChild(this.getCanvas()._canvas);
                }
            }
            return this;
        },
        // extend Node.prototype.moveToTop
        moveToTop: function() {
            Konva.Node.prototype.moveToTop.call(this);
            var stage = this.getStage();
            if(stage) {
                stage.content.removeChild(this.getCanvas()._canvas);
                stage.content.appendChild(this.getCanvas()._canvas);
            }
            return this;
        },
        // extend Node.prototype.moveUp
        moveUp: function() {
            var moved = Konva.Node.prototype.moveUp.call(this);
            if (!moved){
                return this;
            }
            var stage = this.getStage();
            if(!stage) {
                return this;
            }
            stage.content.removeChild(this.getCanvas()._canvas);

            if(this.index < stage.getChildren().length - 1) {
                stage.content.insertBefore(this.getCanvas()._canvas, stage.getChildren()[this.index + 1].getCanvas()._canvas);
            } else {
                stage.content.appendChild(this.getCanvas()._canvas);
            }
            return this;
        },
        // extend Node.prototype.moveDown
        moveDown: function() {
            if(Konva.Node.prototype.moveDown.call(this)) {
                var stage = this.getStage();
                if(stage) {
                    var children = stage.getChildren();
                    stage.content.removeChild(this.getCanvas()._canvas);
                    stage.content.insertBefore(this.getCanvas()._canvas, children[this.index + 1].getCanvas()._canvas);
                }
            }
            return this;
        },
        // extend Node.prototype.moveToBottom
        moveToBottom: function() {
            if(Konva.Node.prototype.moveToBottom.call(this)) {
                var stage = this.getStage();
                if(stage) {
                    var children = stage.getChildren();
                    stage.content.removeChild(this.getCanvas()._canvas);
                    stage.content.insertBefore(this.getCanvas()._canvas, children[1].getCanvas()._canvas);
                }
            }
            return this;
        },
        getLayer: function() {
            return this;
        },
        remove: function() {
            var _canvas = this.getCanvas()._canvas;

            Konva.Node.prototype.remove.call(this);

            if(_canvas && _canvas.parentNode && Konva.Util._isInDocument(_canvas)) {
                _canvas.parentNode.removeChild(_canvas);
            }
            return this;
        },
        getStage: function() {
            return this.parent;
        },
        setSize: function(width, height) {
            this.canvas.setSize(width, height);
            return this;
        },
        /**
         * get/set width of layer.getter return width of stage. setter doing nothing.
         * if you want change width use `stage.width(value);`
         * @name width
         * @method
         * @memberof Konva.BaseLayer.prototype
         * @returns {Number}
         * @example
         * var width = layer.width();
         */
        getWidth: function() {
            if (this.parent) {
                return this.parent.getWidth();
            }
        },
        setWidth: function() {
            Konva.Util.warn('Can not change width of layer. Use "stage.width(value)" function instead.');
        },
        /**
         * get/set height of layer.getter return height of stage. setter doing nothing.
         * if you want change height use `stage.height(value);`
         * @name height
         * @method
         * @memberof Konva.BaseLayer.prototype
         * @returns {Number}
         * @example
         * var height = layer.height();
         */
        getHeight: function() {
            if (this.parent) {
                return this.parent.getHeight();
            }
        },
        setHeight: function() {
            Konva.Util.warn('Can not change height of layer. Use "stage.height(value)" function instead.');
        },
        // the apply transform method is handled by the Layer and FastLayer class
        // because it is up to the layer to decide if an absolute or relative transform
        // should be used
        _applyTransform: function(shape, context, top) {
            var m = shape.getAbsoluteTransform(top).getMatrix();
            context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        }
    });
    Konva.Util.extend(Konva.BaseLayer, Konva.Container);

    // add getters and setters
    Konva.Factory.addGetterSetter(Konva.BaseLayer, 'clearBeforeDraw', true);
    /**
     * get/set clearBeforeDraw flag which determines if the layer is cleared or not
     *  before drawing
     * @name clearBeforeDraw
     * @method
     * @memberof Konva.BaseLayer.prototype
     * @param {Boolean} clearBeforeDraw
     * @returns {Boolean}
     * @example
     * // get clearBeforeDraw flag
     * var clearBeforeDraw = layer.clearBeforeDraw();
     *
     * // disable clear before draw
     * layer.clearBeforeDraw(false);
     *
     * // enable clear before draw
     * layer.clearBeforeDraw(true);
     */

    Konva.Collection.mapMethods(Konva.BaseLayer);
})();

(function() {
    'use strict';
    // constants
    var HASH = '#',
        BEFORE_DRAW = 'beforeDraw',
        DRAW = 'draw',

        /*
         * 2 - 3 - 4
         * |       |
         * 1 - 0   5
         *         |
         * 8 - 7 - 6
         */
        INTERSECTION_OFFSETS = [
            {x: 0, y: 0},  // 0
            {x: -1, y: 0}, // 1
            {x: -1, y: -1}, // 2
            {x: 0, y: -1}, // 3
            {x: 1, y: -1}, // 4
            {x: 1, y: 0}, // 5
            {x: 1, y: 1}, // 6
            {x: 0, y: 1}, // 7
            {x: -1, y: 1}  // 8
        ],
        INTERSECTION_OFFSETS_LEN = INTERSECTION_OFFSETS.length;

    /**
     * Layer constructor.  Layers are tied to their own canvas element and are used
     * to contain groups or shapes.
     * @constructor
     * @memberof Konva
     * @augments Konva.BaseLayer
     * @param {Object} config
     * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
     * to clear the canvas before each layer draw.  The default value is true.
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * * @param {Object} [config.clip] set clip
     * @param {Number} [config.clipX] set clip x
     * @param {Number} [config.clipY] set clip y
     * @param {Number} [config.clipWidth] set clip width
     * @param {Number} [config.clipHeight] set clip height

     * @example
     * var layer = new Konva.Layer();
     */
    Konva.Layer = function(config) {
        this.____init(config);
    };

    Konva.Util.addMethods(Konva.Layer, {
        ____init: function(config) {
            this.nodeType = 'Layer';
            this.canvas = new Konva.SceneCanvas();
            this.hitCanvas = new Konva.HitCanvas({
                pixelRatio: 1
            });
            // call super constructor
            Konva.BaseLayer.call(this, config);
        },
        _setCanvasSize: function(width, height) {
            this.canvas.setSize(width, height);
            this.hitCanvas.setSize(width, height);
        },
        _validateAdd: function(child) {
            var type = child.getType();
            if (type !== 'Group' && type !== 'Shape') {
                Konva.Util.throw('You may only add groups and shapes to a layer.');
            }
        },
        /**
         * get visible intersection shape. This is the preferred
         * method for determining if a point intersects a shape or not
         * also you may pass optional selector parametr to return ancestor of intersected shape
         * @method
         * @memberof Konva.Layer.prototype
         * @param {Object} pos
         * @param {Number} pos.x
         * @param {Number} pos.y
         * @param {String} [selector]
         * @returns {Konva.Node}
         * @example
         * var shape = layer.getIntersection({x: 50, y: 50});
         * // or if you interested in shape parent:
         * var group = layer.getIntersection({x: 50, y: 50}, 'Group');
         */
        getIntersection: function(pos, selector) {
            var obj, i, intersectionOffset, shape;

            if(!this.hitGraphEnabled() || !this.isVisible()) {
                return null;
            }
            // in some cases antialiased area may be bigger than 1px
            // it is possible if we will cache node, then scale it a lot
            // TODO: check { 0; 0 } point before loop, and remove it from INTERSECTION_OFFSETS.
            var spiralSearchDistance = 1;
            var continueSearch = false;
            while (true) {
                for (i = 0; i < INTERSECTION_OFFSETS_LEN; i++) {
                    intersectionOffset = INTERSECTION_OFFSETS[i];
                    obj = this._getIntersection({
                        x: pos.x + intersectionOffset.x * spiralSearchDistance,
                        y: pos.y + intersectionOffset.y * spiralSearchDistance
                    });
                    shape = obj.shape;
                    if (shape && selector) {
                        return shape.findAncestor(selector, true);
                    } else if (shape) {
                        return shape;
                    }
                    // we should continue search if we found antialiased pixel
                    // that means our node somewhere very close
                    continueSearch = !!obj.antialiased;
                    // stop search if found empty pixel
                    if (!obj.antialiased) {
                        break;
                    }
                }
                // if no shape, and no antialiased pixel, we should end searching
                if (continueSearch) {
                    spiralSearchDistance += 1;
                } else {
                    return null;
                }
            }
        },
        _getImageData: function(x, y) {
            var width = this.hitCanvas.width || 1,
                height = this.hitCanvas.height || 1,
                index = (Math.round(y) * width ) + Math.round(x);

            if (!this._hitImageData) {
                this._hitImageData = this.hitCanvas.context.getImageData(0, 0, width, height);
            }

            return [
                this._hitImageData.data[4 * index + 0], // Red
                this._hitImageData.data[4 * index + 1], // Green
                this._hitImageData.data[4 * index + 2], // Blue
                this._hitImageData.data[4 * index + 3] // Alpha
            ];
        },
        _getIntersection: function(pos) {
            var ratio = this.hitCanvas.pixelRatio;
            var p = this.hitCanvas.context.getImageData(Math.round(pos.x * ratio), Math.round(pos.y * ratio), 1, 1).data,
                p3 = p[3],
                colorKey, shape;
            // fully opaque pixel
            if(p3 === 255) {
                colorKey = Konva.Util._rgbToHex(p[0], p[1], p[2]);
                shape = Konva.shapes[HASH + colorKey];
                if (shape) {
                    return {
                        shape: shape
                    };
                }
                return {
                    antialiased: true
                };
            }
            // antialiased pixel
            else if(p3 > 0) {
                return {
                    antialiased: true
                };
            }
            // empty pixel
            return {};
        },
        drawScene: function(can, top) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.getCanvas());

            this._fire(BEFORE_DRAW, {
                node: this
            });

            if(this.getClearBeforeDraw()) {
                canvas.getContext().clear();
            }

            Konva.Container.prototype.drawScene.call(this, canvas, top);

            this._fire(DRAW, {
                node: this
            });

            return this;
        },
        drawHit: function(can, top) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.hitCanvas);

            if(layer && layer.getClearBeforeDraw()) {
                layer.getHitCanvas().getContext().clear();
            }

            Konva.Container.prototype.drawHit.call(this, canvas, top);
            this.imageData = null; // Clear imageData cache
            return this;
        },
        clear: function(bounds) {
            Konva.BaseLayer.prototype.clear.call(this, bounds);
            this.getHitCanvas().getContext().clear(bounds);
            this.imageData = null; // Clear getImageData cache
            return this;
        },
        // extend Node.prototype.setVisible
        setVisible: function(visible) {
            Konva.Node.prototype.setVisible.call(this, visible);
            if(visible) {
                this.getCanvas()._canvas.style.display = 'block';
                this.hitCanvas._canvas.style.display = 'block';
            }
            else {
                this.getCanvas()._canvas.style.display = 'none';
                this.hitCanvas._canvas.style.display = 'none';
            }
            return this;
        },
        /**
         * enable hit graph
         * @name enableHitGraph
         * @method
         * @memberof Konva.Layer.prototype
         * @returns {Layer}
         */
        enableHitGraph: function() {
            this.setHitGraphEnabled(true);
            return this;
        },
        /**
         * disable hit graph
         * @name disableHitGraph
         * @method
         * @memberof Konva.Layer.prototype
         * @returns {Layer}
         */
        disableHitGraph: function() {
            this.setHitGraphEnabled(false);
            return this;
        },
        setSize: function(width, height) {
            Konva.BaseLayer.prototype.setSize.call(this, width, height);
            this.hitCanvas.setSize(width, height);
            return this;
        }
    });
    Konva.Util.extend(Konva.Layer, Konva.BaseLayer);

    Konva.Factory.addGetterSetter(Konva.Layer, 'hitGraphEnabled', true);
    /**
     * get/set hitGraphEnabled flag.  Disabling the hit graph will greatly increase
     *  draw performance because the hit graph will not be redrawn each time the layer is
     *  drawn.  This, however, also disables mouse/touch event detection
     * @name hitGraphEnabled
     * @method
     * @memberof Konva.Layer.prototype
     * @param {Boolean} enabled
     * @returns {Boolean}
     * @example
     * // get hitGraphEnabled flag
     * var hitGraphEnabled = layer.hitGraphEnabled();
     *
     * // disable hit graph
     * layer.hitGraphEnabled(false);
     *
     * // enable hit graph
     * layer.hitGraphEnabled(true);
     */
    Konva.Collection.mapMethods(Konva.Layer);
})();

(function() {
    'use strict';
    /**
     * FastLayer constructor. Layers are tied to their own canvas element and are used
     * to contain shapes only.  If you don't need node nesting, mouse and touch interactions,
     * or event pub/sub, you should use FastLayer instead of Layer to create your layers.
     * It renders about 2x faster than normal layers.
     * @constructor
     * @memberof Konva
     * @augments Konva.BaseLayer
     * @param {Object} config
     * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
     * to clear the canvas before each layer draw.  The default value is true.
     * @param {Boolean} [config.visible]
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * * @param {Object} [config.clip] set clip
     * @param {Number} [config.clipX] set clip x
     * @param {Number} [config.clipY] set clip y
     * @param {Number} [config.clipWidth] set clip width
     * @param {Number} [config.clipHeight] set clip height

     * @example
     * var layer = new Konva.FastLayer();
     */
    Konva.FastLayer = function(config) {
        this.____init(config);
    };

    Konva.Util.addMethods(Konva.FastLayer, {
        ____init: function(config) {
            this.nodeType = 'Layer';
            this.canvas = new Konva.SceneCanvas();
            // call super constructor
            Konva.BaseLayer.call(this, config);
        },
        _validateAdd: function(child) {
            var type = child.getType();
            if (type !== 'Shape') {
                Konva.Util.throw('You may only add shapes to a fast layer.');
            }
        },
        _setCanvasSize: function(width, height) {
            this.canvas.setSize(width, height);
        },
        hitGraphEnabled: function() {
            return false;
        },
        getIntersection: function() {
            return null;
        },
        drawScene: function(can) {
            var layer = this.getLayer(),
                canvas = can || (layer && layer.getCanvas());

            if(this.getClearBeforeDraw()) {
                canvas.getContext().clear();
            }

            Konva.Container.prototype.drawScene.call(this, canvas);

            return this;
        },
        draw: function() {
            this.drawScene();
            return this;
        },
        // extend Node.prototype.setVisible
        setVisible: function(visible) {
            Konva.Node.prototype.setVisible.call(this, visible);
            if(visible) {
                this.getCanvas()._canvas.style.display = 'block';
            }
            else {
                this.getCanvas()._canvas.style.display = 'none';
            }
            return this;
        }
    });
    Konva.Util.extend(Konva.FastLayer, Konva.BaseLayer);

    Konva.Collection.mapMethods(Konva.FastLayer);
})();

(function() {
    'use strict';
    /**
     * Group constructor.  Groups are used to contain shapes or other groups.
     * @constructor
     * @memberof Konva
     * @augments Konva.Container
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * * @param {Object} [config.clip] set clip
     * @param {Number} [config.clipX] set clip x
     * @param {Number} [config.clipY] set clip y
     * @param {Number} [config.clipWidth] set clip width
     * @param {Number} [config.clipHeight] set clip height

     * @example
     * var group = new Konva.Group();
     */
    Konva.Group = function(config) {
        this.___init(config);
    };

    Konva.Util.addMethods(Konva.Group, {
        ___init: function(config) {
            this.nodeType = 'Group';
            // call super constructor
            Konva.Container.call(this, config);
        },
        _validateAdd: function(child) {
            var type = child.getType();
            if (type !== 'Group' && type !== 'Shape') {
                Konva.Util.throw('You may only add groups and shapes to groups.');
            }
        }
    });
    Konva.Util.extend(Konva.Group, Konva.Container);

    Konva.Collection.mapMethods(Konva.Group);
})();

(function(Konva) {
    'use strict';

    var now = (function() {
        if (Konva.global.performance && Konva.global.performance.now) {
            return function() {
                return Konva.global.performance.now();
            };
        }

        return function() {
            return new Date().getTime();
        };
    })();

    function FRAF(callback) {
        setTimeout(callback, 1000 / 60);
    }

    var RAF = (function(){
        return Konva.global.requestAnimationFrame
            || Konva.global.webkitRequestAnimationFrame
            || Konva.global.mozRequestAnimationFrame
            || Konva.global.oRequestAnimationFrame
            || Konva.global.msRequestAnimationFrame
            || FRAF;
    })();



    function requestAnimFrame() {
        return RAF.apply(Konva.global, arguments);
    }

    /**
     * Animation constructor.  A stage is used to contain multiple layers and handle
     * @constructor
     * @memberof Konva
     * @param {Function} func function executed on each animation frame.  The function is passed a frame object, which contains
     *  timeDiff, lastTime, time, and frameRate properties.  The timeDiff property is the number of milliseconds that have passed
     *  since the last animation frame.  The lastTime property is time in milliseconds that elapsed from the moment the animation started
     *  to the last animation frame.  The time property is the time in milliseconds that ellapsed from the moment the animation started
     *  to the current animation frame.  The frameRate property is the current frame rate in frames / second. Return false from function,
     *  if you don't need to redraw layer/layers on some frames.
     * @param {Konva.Layer|Array} [layers] layer(s) to be redrawn on each animation frame. Can be a layer, an array of layers, or null.
     *  Not specifying a node will result in no redraw.
     * @example
     * // move a node to the right at 50 pixels / second
     * var velocity = 50;
     *
     * var anim = new Konva.Animation(function(frame) {
     *   var dist = velocity * (frame.timeDiff / 1000);
     *   node.move(dist, 0);
     * }, layer);
     *
     * anim.start();
     */
    Konva.Animation = function(func, layers) {
        var Anim = Konva.Animation;
        this.func = func;
        this.setLayers(layers);
        this.id = Anim.animIdCounter++;
        this.frame = {
            time: 0,
            timeDiff: 0,
            lastTime: now()
        };
    };
    /*
     * Animation methods
     */
    Konva.Animation.prototype = {
        /**
         * set layers to be redrawn on each animation frame
         * @method
         * @memberof Konva.Animation.prototype
         * @param {Konva.Layer|Array} [layers] layer(s) to be redrawn.&nbsp; Can be a layer, an array of layers, or null.  Not specifying a node will result in no redraw.
         * @return {Konva.Animation} this
         */
        setLayers: function(layers) {
            var lays = [];
            // if passing in no layers
            if (!layers) {
                lays = [];
            }
            // if passing in an array of Layers
            // NOTE: layers could be an array or Konva.Collection.  for simplicity, I'm just inspecting
            // the length property to check for both cases
            else if (layers.length > 0) {
                lays = layers;
            }
            // if passing in a Layer
            else {
                lays = [layers];
            }

            this.layers = lays;
            return this;
        },
        /**
         * get layers
         * @method
         * @memberof Konva.Animation.prototype
         * @return {Array} Array of Konva.Layer
         */
        getLayers: function() {
            return this.layers;
        },
        /**
         * add layer.  Returns true if the layer was added, and false if it was not
         * @method
         * @memberof Konva.Animation.prototype
         * @param {Konva.Layer} layer to add
         * @return {Bool} true if layer is added to animation, otherwise false
         */
        addLayer: function(layer) {
            var layers = this.layers,
                len = layers.length, n;

            // don't add the layer if it already exists
            for (n = 0; n < len; n++) {
                if (layers[n]._id === layer._id){
                    return false;
                }
            }

            this.layers.push(layer);
            return true;
        },
        /**
         * determine if animation is running or not.  returns true or false
         * @method
         * @memberof Konva.Animation.prototype
         * @return {Bool} is animation running?
         */
        isRunning: function() {
            var a = Konva.Animation,
                animations = a.animations,
                len = animations.length,
                n;

            for (n = 0; n < len; n++) {
                if (animations[n].id === this.id) {
                    return true;
                }
            }
            return false;
        },
        /**
         * start animation
         * @method
         * @memberof Konva.Animation.prototype
         * @return {Konva.Animation} this
         */
        start: function() {
            var Anim = Konva.Animation;
            this.stop();
            this.frame.timeDiff = 0;
            this.frame.lastTime = now();
            Anim._addAnimation(this);
            return this;
        },
        /**
         * stop animation
         * @method
         * @memberof Konva.Animation.prototype
         * @return {Konva.Animation} this
         */
        stop: function() {
            Konva.Animation._removeAnimation(this);
            return this;
        },
        _updateFrameObject: function(time) {
            this.frame.timeDiff = time - this.frame.lastTime;
            this.frame.lastTime = time;
            this.frame.time += this.frame.timeDiff;
            this.frame.frameRate = 1000 / this.frame.timeDiff;
        }
    };
    Konva.Animation.animations = [];
    Konva.Animation.animIdCounter = 0;
    Konva.Animation.animRunning = false;

    Konva.Animation._addAnimation = function(anim) {
        this.animations.push(anim);
        this._handleAnimation();
    };
    Konva.Animation._removeAnimation = function(anim) {
        var id = anim.id,
            animations = this.animations,
            len = animations.length,
            n;

        for(n = 0; n < len; n++) {
            if(animations[n].id === id) {
                this.animations.splice(n, 1);
                break;
            }
        }
    };

    Konva.Animation._runFrames = function() {
        var layerHash = {},
            animations = this.animations,
            anim, layers, func, n, i, layersLen, layer, key, needRedraw;
        /*
         * loop through all animations and execute animation
         *  function.  if the animation object has specified node,
         *  we can add the node to the nodes hash to eliminate
         *  drawing the same node multiple times.  The node property
         *  can be the stage itself or a layer
         */
        /*
         * WARNING: don't cache animations.length because it could change while
         * the for loop is running, causing a JS error
         */

        for(n = 0; n < animations.length; n++) {
            anim = animations[n];
            layers = anim.layers;
            func = anim.func;


            anim._updateFrameObject(now());
            layersLen = layers.length;

            // if animation object has a function, execute it
            if (func) {
                // allow anim bypassing drawing
                needRedraw = (func.call(anim, anim.frame) !== false);
            } else {
                needRedraw = true;
            }
            if (!needRedraw) {
                continue;
            }
            for (i = 0; i < layersLen; i++) {
                layer = layers[i];

                if (layer._id !== undefined) {
                    layerHash[layer._id] = layer;
                }
            }
        }

        for (key in layerHash) {
            if (!layerHash.hasOwnProperty(key)) {
                continue;
            }
            layerHash[key].draw();
        }
    };
    Konva.Animation._animationLoop = function() {
        var Anim = Konva.Animation;
        if(Anim.animations.length) {
            requestAnimFrame(Anim._animationLoop);
            Anim._runFrames();
        }
        else {
            Anim.animRunning = false;
        }
    };
    Konva.Animation._handleAnimation = function() {
        if(!this.animRunning) {
            this.animRunning = true;
            this._animationLoop();
        }
    };

    /**
     * batch draw. this function will not do immediate draw
     * but it will schedule drawing to next tick (requestAnimFrame)
     * @method
     * @return {Konva.Layer} this
     * @memberof Konva.Base.prototype
     */
    Konva.BaseLayer.prototype.batchDraw = function() {
        var that = this,
            Anim = Konva.Animation;

        if (!this.batchAnim) {
            this.batchAnim = new Anim(function() {
                // stop animation after first tick
                that.batchAnim.stop();
            }, this);
        }

        this.lastBatchDrawTime = now();

        if (!this.batchAnim.isRunning()) {
            this.batchAnim.start();
        }
        return this;
    };

    /**
     * batch draw
     * @method
     * @return {Konva.Stage} this
     * @memberof Konva.Stage.prototype
     */
    Konva.Stage.prototype.batchDraw = function() {
        this.getChildren().each(function(layer) {
            layer.batchDraw();
        });
        return this;
    };
})(Konva);

(function() {
    'use strict';
    var blacklist = {
        node: 1,
        duration: 1,
        easing: 1,
        onFinish: 1,
        yoyo: 1
    },

    PAUSED = 1,
    PLAYING = 2,
    REVERSING = 3,

    idCounter = 0,
    colorAttrs = ['fill', 'stroke', 'shadowColor'];

    var Tween = function(prop, propFunc, func, begin, finish, duration, yoyo) {
        this.prop = prop;
        this.propFunc = propFunc;
        this.begin = begin;
        this._pos = begin;
        this.duration = duration;
        this._change = 0;
        this.prevPos = 0;
        this.yoyo = yoyo;
        this._time = 0;
        this._position = 0;
        this._startTime = 0;
        this._finish = 0;
        this.func = func;
        this._change = finish - this.begin;
        this.pause();
    };
    /*
     * Tween methods
     */
    Tween.prototype = {
        fire: function(str) {
            var handler = this[str];
            if (handler) {
                handler();
            }
        },
        setTime: function(t) {
            if(t > this.duration) {
                if(this.yoyo) {
                    this._time = this.duration;
                    this.reverse();
                }
                else {
                    this.finish();
                }
            }
            else if(t < 0) {
                if(this.yoyo) {
                    this._time = 0;
                    this.play();
                }
                else {
                    this.reset();
                }
            }
            else {
                this._time = t;
                this.update();
            }
        },
        getTime: function() {
            return this._time;
        },
        setPosition: function(p) {
            this.prevPos = this._pos;
            this.propFunc(p);
            this._pos = p;
        },
        getPosition: function(t) {
            if(t === undefined) {
                t = this._time;
            }
            return this.func(t, this.begin, this._change, this.duration);
        },
        play: function() {
            this.state = PLAYING;
            this._startTime = this.getTimer() - this._time;
            this.onEnterFrame();
            this.fire('onPlay');
        },
        reverse: function() {
            this.state = REVERSING;
            this._time = this.duration - this._time;
            this._startTime = this.getTimer() - this._time;
            this.onEnterFrame();
            this.fire('onReverse');
        },
        seek: function(t) {
            this.pause();
            this._time = t;
            this.update();
            this.fire('onSeek');
        },
        reset: function() {
            this.pause();
            this._time = 0;
            this.update();
            this.fire('onReset');
        },
        finish: function() {
            this.pause();
            this._time = this.duration;
            this.update();
            this.fire('onFinish');
        },
        update: function() {
            this.setPosition(this.getPosition(this._time));
        },
        onEnterFrame: function() {
            var t = this.getTimer() - this._startTime;
            if(this.state === PLAYING) {
                this.setTime(t);
            }
            else if (this.state === REVERSING) {
                this.setTime(this.duration - t);
            }
        },
        pause: function() {
            this.state = PAUSED;
            this.fire('onPause');
        },
        getTimer: function() {
            return new Date().getTime();
        }
    };

    /**
     * Tween constructor.  Tweens enable you to animate a node between the current state and a new state.
     *  You can play, pause, reverse, seek, reset, and finish tweens.  By default, tweens are animated using
     *  a linear easing.  For more tweening options, check out {@link Konva.Easings}
     * @constructor
     * @memberof Konva
     * @example
     * // instantiate new tween which fully rotates a node in 1 second
     * var tween = new Konva.Tween({
     *   node: node,
     *   rotationDeg: 360,
     *   duration: 1,
     *   easing: Konva.Easings.EaseInOut
     * });
     *
     * // play tween
     * tween.play();
     *
     * // pause tween
     * tween.pause();
     */
    Konva.Tween = function(config) {
        var that = this,
            node = config.node,
            nodeId = node._id,
            duration,
            easing = config.easing || Konva.Easings.Linear,
            yoyo = !!config.yoyo,
            key;

        if (typeof config.duration === 'undefined') {
            duration = 1;
        } else if (config.duration === 0) {  // zero is bad value for duration
            duration = 0.001;
        } else {
            duration = config.duration;
        }
        this.node = node;
        this._id = idCounter++;

        this.anim = new Konva.Animation(function() {
            that.tween.onEnterFrame();
        }, node.getLayer() || ((node instanceof Konva.Stage) ? node.getLayers() : null));

        this.tween = new Tween(key, function(i) {
            that._tweenFunc(i);
        }, easing, 0, 1, duration * 1000, yoyo);

        this._addListeners();

        // init attrs map
        if (!Konva.Tween.attrs[nodeId]) {
            Konva.Tween.attrs[nodeId] = {};
        }
        if (!Konva.Tween.attrs[nodeId][this._id]) {
            Konva.Tween.attrs[nodeId][this._id] = {};
        }
        // init tweens map
        if (!Konva.Tween.tweens[nodeId]) {
            Konva.Tween.tweens[nodeId] = {};
        }

        for (key in config) {
            if (blacklist[key] === undefined) {
                this._addAttr(key, config[key]);
            }
        }

        this.reset();

        // callbacks
        this.onFinish = config.onFinish;
        this.onReset = config.onReset;
    };

    // start/diff object = attrs.nodeId.tweenId.attr
    Konva.Tween.attrs = {};
    // tweenId = tweens.nodeId.attr
    Konva.Tween.tweens = {};

    Konva.Tween.prototype = {
        _addAttr: function(key, end) {
            var node = this.node,
                nodeId = node._id,
                start, diff, tweenId, n, len, trueEnd, trueStart;

            // remove conflict from tween map if it exists
            tweenId = Konva.Tween.tweens[nodeId][key];

            if (tweenId) {
                delete Konva.Tween.attrs[nodeId][tweenId][key];
            }

            // add to tween map
            start = node.getAttr(key);

            if (Konva.Util._isArray(end)) {
                diff = [];
                len = Math.max(end.length, start.length);

                if (key === 'points' && end.length !== start.length) {
                    // before tweening points we need to make sure that start.length === end.length
                    // Konva.Util._prepareArrayForTween thinking that end.length > start.length

                    if (end.length > start.length) {
                        // so in this case we will increase number of starting points
                        trueStart = start;
                        start = Konva.Util._prepareArrayForTween(start, end, node.closed());
                    } else {
                        // in this case we will increase number of eding points
                        trueEnd = end;
                        end = Konva.Util._prepareArrayForTween(end, start, node.closed());
                    }
                }

                for (n = 0; n < len; n++) {
                    diff.push((end[n]) - (start[n]));
                }

            } else if (colorAttrs.indexOf(key) !== -1) {
                start = Konva.Util.colorToRGBA(start);
                var endRGBA = Konva.Util.colorToRGBA(end);
                diff = {
                    r: endRGBA.r - start.r,
                    g: endRGBA.g - start.g,
                    b: endRGBA.b - start.b,
                    a: endRGBA.a - start.a
                };
            } else {
                diff = end - start;
            }

            Konva.Tween.attrs[nodeId][this._id][key] = {
                start: start,
                diff: diff,
                end: end,
                trueEnd: trueEnd,
                trueStart: trueStart
            };
            Konva.Tween.tweens[nodeId][key] = this._id;
        },
        _tweenFunc: function(i) {
            var node = this.node,
                attrs = Konva.Tween.attrs[node._id][this._id],
                key, attr, start, diff, newVal, n, len, end;

            for (key in attrs) {
                attr = attrs[key];
                start = attr.start;
                diff = attr.diff;
                end = attr.end;

                if (Konva.Util._isArray(start)) {
                    newVal = [];
                    len = Math.max(start.length, end.length);
                    for (n = 0; n < len; n++) {
                        newVal.push((start[n] || 0) + (diff[n] * i));
                    }
                } else if (colorAttrs.indexOf(key) !== -1) {
                    newVal = 'rgba(' +
                            Math.round(start.r + diff.r * i) + ',' +
                            Math.round(start.g + diff.g * i) + ',' +
                            Math.round(start.b + diff.b * i) + ',' +
                            (start.a + diff.a * i) + ')';
                } else {
                    newVal = start + (diff * i);
                }

                node.setAttr(key, newVal);
            }
        },
        _addListeners: function() {
            var that = this;

            // start listeners
            this.tween.onPlay = function() {
                that.anim.start();
            };
            this.tween.onReverse = function() {
                that.anim.start();
            };

            // stop listeners
            this.tween.onPause = function() {
                that.anim.stop();
            };
            this.tween.onFinish = function() {
                var node = that.node;

                // after tweening  points of line we need to set original end
                var attrs = Konva.Tween.attrs[node._id][that._id];
                if (attrs.points && attrs.points.trueEnd) {
                    node.points(attrs.points.trueEnd);
                }

                if (that.onFinish) {
                    that.onFinish.call(that);
                }
            };
            this.tween.onReset = function() {
                var node = that.node;
                // after tweening  points of line we need to set original start
                var attrs = Konva.Tween.attrs[node._id][that._id];
                if (attrs.points && attrs.points.trueStart) {
                    node.points(attrs.points.trueStart);
                }

                if (that.onReset) {
                    that.onReset();
                }
            };
        },
        /**
         * play
         * @method
         * @memberof Konva.Tween.prototype
         * @returns {Tween}
         */
        play: function() {
            this.tween.play();
            return this;
        },
        /**
         * reverse
         * @method
         * @memberof Konva.Tween.prototype
         * @returns {Tween}
         */
        reverse: function() {
            this.tween.reverse();
            return this;
        },
        /**
         * reset
         * @method
         * @memberof Konva.Tween.prototype
         * @returns {Tween}
         */
        reset: function() {
            this.tween.reset();
            return this;
        },
        /**
         * seek
         * @method
         * @memberof Konva.Tween.prototype
         * @param {Integer} t time in seconds between 0 and the duration
         * @returns {Tween}
         */
        seek: function(t) {
            this.tween.seek(t * 1000);
            return this;
        },
        /**
         * pause
         * @method
         * @memberof Konva.Tween.prototype
         * @returns {Tween}
         */
        pause: function() {
            this.tween.pause();
            return this;
        },
        /**
         * finish
         * @method
         * @memberof Konva.Tween.prototype
         * @returns {Tween}
         */
        finish: function() {
            this.tween.finish();
            return this;
        },
        /**
         * destroy
         * @method
         * @memberof Konva.Tween.prototype
         */
        destroy: function() {
            var nodeId = this.node._id,
                thisId = this._id,
                attrs = Konva.Tween.tweens[nodeId],
                key;

            this.pause();

            for (key in attrs) {
                delete Konva.Tween.tweens[nodeId][key];
            }

            delete Konva.Tween.attrs[nodeId][thisId];
        }
    };

    /**
     * Tween node properties. Shorter usage of {@link Konva.Tween} object.
     *
     * @method Konva.Node#to
     * @memberof Konva.Node
     * @param {Object} [params] tween params
     * @example
     *
     * circle.to({
     *  x : 50,
     *  duration : 0.5
     * });
     */
    Konva.Node.prototype.to = function(params) {
        var onFinish = params.onFinish;
        params.node = this;
        params.onFinish = function() {
            this.destroy();
            if (onFinish) {
                onFinish();
            }
        };
        var tween = new Konva.Tween(params);
        tween.play();
    };

    /*
    * These eases were ported from an Adobe Flash tweening library to JavaScript
    * by Xaric
    */

    /**
     * @namespace Easings
     * @memberof Konva
     */
    Konva.Easings = {
        /**
        * back ease in
        * @function
        * @memberof Konva.Easings
        */
        'BackEaseIn': function(t, b, c, d) {
            var s = 1.70158;
            return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        /**
        * back ease out
        * @function
        * @memberof Konva.Easings
        */
        'BackEaseOut': function(t, b, c, d) {
            var s = 1.70158;
            return c * (( t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        /**
        * back ease in out
        * @function
        * @memberof Konva.Easings
        */
        'BackEaseInOut': function(t, b, c, d) {
            var s = 1.70158;
            if((t /= d / 2) < 1) {
                return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
            }
            return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        },
        /**
        * elastic ease in
        * @function
        * @memberof Konva.Easings
        */
        'ElasticEaseIn': function(t, b, c, d, a, p) {
            // added s = 0
            var s = 0;
            if(t === 0) {
                return b;
            }
            if((t /= d) === 1) {
                return b + c;
            }
            if(!p) {
                p = d * 0.3;
            }
            if(!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            }
            else {
                s = p / (2 * Math.PI) * Math.asin(c / a);
            }
            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        },
        /**
        * elastic ease out
        * @function
        * @memberof Konva.Easings
        */
        'ElasticEaseOut': function(t, b, c, d, a, p) {
            // added s = 0
            var s = 0;
            if(t === 0) {
                return b;
            }
            if((t /= d) === 1) {
                return b + c;
            }
            if(!p) {
                p = d * 0.3;
            }
            if(!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            }
            else {
                s = p / (2 * Math.PI) * Math.asin(c / a);
            }
            return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
        },
        /**
        * elastic ease in out
        * @function
        * @memberof Konva.Easings
        */
        'ElasticEaseInOut': function(t, b, c, d, a, p) {
            // added s = 0
            var s = 0;
            if(t === 0) {
                return b;
            }
            if((t /= d / 2) === 2) {
                return b + c;
            }
            if(!p) {
                p = d * (0.3 * 1.5);
            }
            if(!a || a < Math.abs(c)) {
                a = c;
                s = p / 4;
            }
            else {
                s = p / (2 * Math.PI) * Math.asin(c / a);
            }
            if(t < 1) {
                return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            }
            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
        },
        /**
        * bounce ease out
        * @function
        * @memberof Konva.Easings
        */
        'BounceEaseOut': function(t, b, c, d) {
            if((t /= d) < (1 / 2.75)) {
                return c * (7.5625 * t * t) + b;
            }
            else if(t < (2 / 2.75)) {
                return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
            }
            else if(t < (2.5 / 2.75)) {
                return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
            }
            else {
                return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
            }
        },
        /**
        * bounce ease in
        * @function
        * @memberof Konva.Easings
        */
        'BounceEaseIn': function(t, b, c, d) {
            return c - Konva.Easings.BounceEaseOut(d - t, 0, c, d) + b;
        },
        /**
        * bounce ease in out
        * @function
        * @memberof Konva.Easings
        */
        'BounceEaseInOut': function(t, b, c, d) {
            if(t < d / 2) {
                return Konva.Easings.BounceEaseIn(t * 2, 0, c, d) * 0.5 + b;
            }
            else {
                return Konva.Easings.BounceEaseOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
            }
        },
        /**
        * ease in
        * @function
        * @memberof Konva.Easings
        */
        'EaseIn': function(t, b, c, d) {
            return c * (t /= d) * t + b;
        },
        /**
        * ease out
        * @function
        * @memberof Konva.Easings
        */
        'EaseOut': function(t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b;
        },
        /**
        * ease in out
        * @function
        * @memberof Konva.Easings
        */
        'EaseInOut': function(t, b, c, d) {
            if((t /= d / 2) < 1) {
                return c / 2 * t * t + b;
            }
            return -c / 2 * ((--t) * (t - 2) - 1) + b;
        },
        /**
        * strong ease in
        * @function
        * @memberof Konva.Easings
        */
        'StrongEaseIn': function(t, b, c, d) {
            return c * (t /= d) * t * t * t * t + b;
        },
        /**
        * strong ease out
        * @function
        * @memberof Konva.Easings
        */
        'StrongEaseOut': function(t, b, c, d) {
            return c * (( t = t / d - 1) * t * t * t * t + 1) + b;
        },
        /**
        * strong ease in out
        * @function
        * @memberof Konva.Easings
        */
        'StrongEaseInOut': function(t, b, c, d) {
            if((t /= d / 2) < 1) {
                return c / 2 * t * t * t * t * t + b;
            }
            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        },
        /**
        * linear
        * @function
        * @memberof Konva.Easings
        */
        'Linear': function(t, b, c, d) {
            return c * t / d + b;
        }
    };
})();

(function() {
    'use strict';
    Konva.DD = {
        // properties
        anim: new Konva.Animation(function() {
            var b = this.dirty;
            this.dirty = false;
            return b;
        }),
        isDragging: false,
        justDragged: false,
        offset: {
            x: 0,
            y: 0
        },
        node: null,

        // methods
        _drag: function(evt) {
            var dd = Konva.DD,
                node = dd.node;

            if(node) {
               if(!dd.isDragging) {
                    var pos = node.getStage().getPointerPosition();
                    var dragDistance = node.dragDistance();
                    var distance = Math.max(
                        Math.abs(pos.x - dd.startPointerPos.x),
                        Math.abs(pos.y - dd.startPointerPos.y)
                    );
                    if (distance < dragDistance) {
                        return;
                    }
                }


                node.getStage()._setPointerPosition(evt);
                node._setDragPosition(evt);
                if(!dd.isDragging) {
                    dd.isDragging = true;
                    node.fire('dragstart', {
                        type: 'dragstart',
                        target: node,
                        evt: evt
                    }, true);
                }

                // execute ondragmove if defined
                node.fire('dragmove', {
                    type: 'dragmove',
                    target: node,
                    evt: evt
                }, true);
            }
        },
        _endDragBefore: function(evt) {
            var dd = Konva.DD,
                node = dd.node,
                layer;

            if(node) {
                layer = node.getLayer();
                dd.anim.stop();

                // only fire dragend event if the drag and drop
                // operation actually started.
                if(dd.isDragging) {
                    dd.isDragging = false;
                    dd.justDragged = true;
                    Konva.listenClickTap = false;

                    if (evt) {
                        evt.dragEndNode = node;
                    }
                }

                delete dd.node;

                (layer || node).draw();
            }
        },
        _endDragAfter: function(evt) {
            evt = evt || {};
            var dragEndNode = evt.dragEndNode;

            if (evt && dragEndNode) {
                dragEndNode.fire('dragend', {
                    type: 'dragend',
                    target: dragEndNode,
                    evt: evt
                }, true);
            }
        }
    };

    // Node extenders

    /**
     * initiate drag and drop
     * @method
     * @memberof Konva.Node.prototype
     */
    Konva.Node.prototype.startDrag = function() {
        var dd = Konva.DD,
            stage = this.getStage(),
            layer = this.getLayer(),
            pos = stage.getPointerPosition(),
            ap = this.getAbsolutePosition();

        if(pos) {
            if (dd.node) {
                dd.node.stopDrag();
            }

            dd.node = this;
            dd.startPointerPos = pos;
            dd.offset.x = pos.x - ap.x;
            dd.offset.y = pos.y - ap.y;
            dd.anim.setLayers(layer || this.getLayers());
            dd.anim.start();

            this._setDragPosition();
        }
    };

    Konva.Node.prototype._setDragPosition = function(evt) {
        var dd = Konva.DD,
            pos = this.getStage().getPointerPosition(),
            dbf = this.getDragBoundFunc();
        if (!pos) {
            return;
        }
        var newNodePos = {
            x: pos.x - dd.offset.x,
            y: pos.y - dd.offset.y
        };

        if(dbf !== undefined) {
            newNodePos = dbf.call(this, newNodePos, evt);
        }
        this.setAbsolutePosition(newNodePos);

        if (!this._lastPos || this._lastPos.x !== newNodePos.x ||
            this._lastPos.y !== newNodePos.y) {
            dd.anim.dirty = true;
        }

        this._lastPos = newNodePos;
    };

    /**
     * stop drag and drop
     * @method
     * @memberof Konva.Node.prototype
     */
    Konva.Node.prototype.stopDrag = function() {
        var dd = Konva.DD,
            evt = {};
        dd._endDragBefore(evt);
        dd._endDragAfter(evt);
    };

    Konva.Node.prototype.setDraggable = function(draggable) {
        this._setAttr('draggable', draggable);
        this._dragChange();
    };

    var origDestroy = Konva.Node.prototype.destroy;

    Konva.Node.prototype.destroy = function() {
        var dd = Konva.DD;

        // stop DD
        if(dd.node && dd.node._id === this._id) {

            this.stopDrag();
        }

        origDestroy.call(this);
    };

    /**
     * determine if node is currently in drag and drop mode
     * @method
     * @memberof Konva.Node.prototype
     */
    Konva.Node.prototype.isDragging = function() {
        var dd = Konva.DD;
        return !!(dd.node && dd.node._id === this._id && dd.isDragging);
    };

    Konva.Node.prototype._listenDrag = function() {
        var that = this;

        this._dragCleanup();

        if (this.getClassName() === 'Stage') {
            this.on('contentMousedown.konva contentTouchstart.konva', function(evt) {
                if(!Konva.DD.node) {
                    that.startDrag(evt);
                }
            });
        }
        else {
            this.on('mousedown.konva touchstart.konva', function(evt) {
                // ignore right and middle buttons
                if (evt.evt.button === 1 || evt.evt.button === 2) {
                    return;
                }
                if(!Konva.DD.node) {
                    that.startDrag(evt);
                }
            });
        }

        // listening is required for drag and drop
        /*
        this._listeningEnabled = true;
        this._clearSelfAndAncestorCache('listeningEnabled');
        */
    };

    Konva.Node.prototype._dragChange = function() {
        if(this.attrs.draggable) {
            this._listenDrag();
        }
        else {
            // remove event listeners
            this._dragCleanup();

            /*
             * force drag and drop to end
             * if this node is currently in
             * drag and drop mode
             */
            var stage = this.getStage();
            var dd = Konva.DD;
            if(stage && dd.node && dd.node._id === this._id) {
                dd.node.stopDrag();
            }
        }
    };

    Konva.Node.prototype._dragCleanup = function() {
        if (this.getClassName() === 'Stage') {
            this.off('contentMousedown.konva');
            this.off('contentTouchstart.konva');
        } else {
            this.off('mousedown.konva');
            this.off('touchstart.konva');
        }
    };

    Konva.Factory.addGetterSetter(Konva.Node, 'dragBoundFunc');

    /**
     * get/set drag bound function.  This is used to override the default
     *  drag and drop position
     * @name dragBoundFunc
     * @method
     * @memberof Konva.Node.prototype
     * @param {Function} dragBoundFunc
     * @returns {Function}
     * @example
     * // get drag bound function
     * var dragBoundFunc = node.dragBoundFunc();
     *
     * // create vertical drag and drop
     * node.dragBoundFunc(function(pos){
     *   return {
     *     x: this.getAbsolutePosition().x,
     *     y: pos.y
     *   };
     * });
     */

    Konva.Factory.addGetter(Konva.Node, 'draggable', false);
    Konva.Factory.addOverloadedGetterSetter(Konva.Node, 'draggable');

     /**
     * get/set draggable flag
     * @name draggable
     * @method
     * @memberof Konva.Node.prototype
     * @param {Boolean} draggable
     * @returns {Boolean}
     * @example
     * // get draggable flag
     * var draggable = node.draggable();
     *
     * // enable drag and drop
     * node.draggable(true);
     *
     * // disable drag and drop
     * node.draggable(false);
     */

    var html = Konva.document.documentElement;
    html.addEventListener('mouseup', Konva.DD._endDragBefore, true);
    html.addEventListener('touchend', Konva.DD._endDragBefore, true);

    html.addEventListener('mousemove', Konva.DD._drag);
    html.addEventListener('touchmove', Konva.DD._drag);

    html.addEventListener('mouseup', Konva.DD._endDragAfter, false);
    html.addEventListener('touchend', Konva.DD._endDragAfter, false);

})();

(function() {
    'use strict';
    /**
     * Rect constructor
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Number} [config.cornerRadius]
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var rect = new Konva.Rect({
     *   width: 100,
     *   height: 50,
     *   fill: 'red',
     *   stroke: 'black',
     *   strokeWidth: 5
     * });
     */
    Konva.Rect = function(config) {
        this.___init(config);
    };

    Konva.Rect.prototype = {
        ___init: function(config) {
            Konva.Shape.call(this, config);
            this.className = 'Rect';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            var cornerRadius = this.getCornerRadius(),
                width = this.getWidth(),
                height = this.getHeight();

            context.beginPath();

            if(!cornerRadius) {
                // simple rect - don't bother doing all that complicated maths stuff.
                context.rect(0, 0, width, height);
            } else {
                // arcTo would be nicer, but browser support is patchy (Opera)
                cornerRadius = Math.min(cornerRadius, width / 2, height / 2);
                context.moveTo(cornerRadius, 0);
                context.lineTo(width - cornerRadius, 0);
                context.arc(width - cornerRadius, cornerRadius, cornerRadius, Math.PI * 3 / 2, 0, false);
                context.lineTo(width, height - cornerRadius);
                context.arc(width - cornerRadius, height - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
                context.lineTo(cornerRadius, height);
                context.arc(cornerRadius, height - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
                context.lineTo(0, cornerRadius);
                context.arc(cornerRadius, cornerRadius, cornerRadius, Math.PI, Math.PI * 3 / 2, false);
            }
            context.closePath();
            context.fillStrokeShape(this);
        }
    };

    Konva.Util.extend(Konva.Rect, Konva.Shape);

    Konva.Factory.addGetterSetter(Konva.Rect, 'cornerRadius', 0);
    /**
     * get/set corner radius
     * @name cornerRadius
     * @method
     * @memberof Konva.Rect.prototype
     * @param {Number} cornerRadius
     * @returns {Number}
     * @example
     * // get corner radius
     * var cornerRadius = rect.cornerRadius();
     *
     * // set corner radius
     * rect.cornerRadius(10);
     */

    Konva.Collection.mapMethods(Konva.Rect);
})();

(function() {
    'use strict';
    // the 0.0001 offset fixes a bug in Chrome 27
    var PIx2 = (Math.PI * 2) - 0.0001,
        CIRCLE = 'Circle';

    /**
     * Circle constructor
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Number} config.radius
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // create circle
     * var circle = new Konva.Circle({
     *   radius: 40,
     *   fill: 'red',
     *   stroke: 'black'
     *   strokeWidth: 5
     * });
     */
    Konva.Circle = function(config) {
        this.___init(config);
    };

    Konva.Circle.prototype = {
        _centroid: true,
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = CIRCLE;
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            context.beginPath();
            context.arc(0, 0, this.getRadius(), 0, PIx2, false);
            context.closePath();
            context.fillStrokeShape(this);
        },
        // implements Shape.prototype.getWidth()
        getWidth: function() {
            return this.getRadius() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight: function() {
            return this.getRadius() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            if (this.radius() !== width / 2) {
                this.setRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            if (this.radius() !== height / 2) {
                this.setRadius(height / 2);
            }
        }
    };
    Konva.Util.extend(Konva.Circle, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Circle, 'radius', 0);
    Konva.Factory.addOverloadedGetterSetter(Konva.Circle, 'radius');

    /**
     * get/set radius
     * @name radius
     * @method
     * @memberof Konva.Circle.prototype
     * @param {Number} radius
     * @returns {Number}
     * @example
     * // get radius
     * var radius = circle.radius();
     *
     * // set radius
     * circle.radius(10);
     */

    Konva.Collection.mapMethods(Konva.Circle);
})();

(function() {
    'use strict';
    // the 0.0001 offset fixes a bug in Chrome 27
    var PIx2 = (Math.PI * 2) - 0.0001,
        ELLIPSE = 'Ellipse';

    /**
     * Ellipse constructor
     * @constructor
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Object} config.radius defines x and y radius
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var ellipse = new Konva.Ellipse({
     *   radius : {
     *     x : 50,
     *     y : 50
     *   },
     *   fill: 'red'
     * });
     */
    Konva.Ellipse = function(config) {
        this.___init(config);
    };

    Konva.Ellipse.prototype = {
        _centroid: true,
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = ELLIPSE;
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            var rx = this.getRadiusX(),
                ry = this.getRadiusY();

            context.beginPath();
            context.save();
            if(rx !== ry) {
                context.scale(1, ry / rx);
            }
            context.arc(0, 0, rx, 0, PIx2, false);
            context.restore();
            context.closePath();
            context.fillStrokeShape(this);
        },
        // implements Shape.prototype.getWidth()
        getWidth: function() {
            return this.getRadiusX() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight: function() {
            return this.getRadiusY() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            this.setRadius({
                x: width / 2
            });
        },
        // implements Shape.prototype.setHeight()
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            this.setRadius({
                y: height / 2
            });
        }
    };
    Konva.Util.extend(Konva.Ellipse, Konva.Shape);

    // add getters setters
    Konva.Factory.addComponentsGetterSetter(Konva.Ellipse, 'radius', ['x', 'y']);

    /**
     * get/set radius
     * @name radius
     * @method
     * @memberof Konva.Ellipse.prototype
     * @param {Object} radius
     * @param {Number} radius.x
     * @param {Number} radius.y
     * @returns {Object}
     * @example
     * // get radius
     * var radius = ellipse.radius();
     *
     * // set radius
     * ellipse.radius({
     *   x: 200,
     *   y: 100
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Ellipse, 'radiusX', 0);
    /**
     * get/set radius x
     * @name radiusX
     * @method
     * @memberof Konva.Ellipse.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get radius x
     * var radiusX = ellipse.radiusX();
     *
     * // set radius x
     * ellipse.radiusX(200);
     */

    Konva.Factory.addGetterSetter(Konva.Ellipse, 'radiusY', 0);
    /**
     * get/set radius y
     * @name radiusY
     * @method
     * @memberof Konva.Ellipse.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get radius y
     * var radiusY = ellipse.radiusY();
     *
     * // set radius y
     * ellipse.radiusY(200);
     */

    Konva.Collection.mapMethods(Konva.Ellipse);

})();

(function() {
    'use strict';
    // the 0.0001 offset fixes a bug in Chrome 27
    var PIx2 = (Math.PI * 2) - 0.0001;
    /**
     * Ring constructor
     * @constructor
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Number} config.innerRadius
     * @param {Number} config.outerRadius
     * @param {Boolean} [config.clockwise]
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var ring = new Konva.Ring({
     *   innerRadius: 40,
     *   outerRadius: 80,
     *   fill: 'red',
     *   stroke: 'black',
     *   strokeWidth: 5
     * });
     */
    Konva.Ring = function(config) {
        this.___init(config);
    };

    Konva.Ring.prototype = {
        _centroid: true,
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'Ring';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            context.beginPath();
            context.arc(0, 0, this.getInnerRadius(), 0, PIx2, false);
            context.moveTo(this.getOuterRadius(), 0);
            context.arc(0, 0, this.getOuterRadius(), PIx2, 0, true);
            context.closePath();
            context.fillStrokeShape(this);
        },
        // implements Shape.prototype.getWidth()
        getWidth: function() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight: function() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            if (this.outerRadius() !== width / 2) {
                this.setOuterRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            if (this.outerRadius() !== height / 2) {
                this.setOuterRadius(height / 2);
            }
        },
        setOuterRadius: function(val) {
            this._setAttr('outerRadius', val);
            this.setWidth(val * 2);
            this.setHeight(val * 2);
        }
    };
    Konva.Util.extend(Konva.Ring, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Ring, 'innerRadius', 0);

    /**
     * get/set innerRadius
     * @name innerRadius
     * @method
     * @memberof Konva.Ring.prototype
     * @param {Number} innerRadius
     * @returns {Number}
     * @example
     * // get inner radius
     * var innerRadius = ring.innerRadius();
     *
     * // set inner radius
     * ring.innerRadius(20);
     */
    Konva.Factory.addGetter(Konva.Ring, 'outerRadius', 0);
    Konva.Factory.addOverloadedGetterSetter(Konva.Ring, 'outerRadius');

    /**
     * get/set outerRadius
     * @name outerRadius
     * @method
     * @memberof Konva.Ring.prototype
     * @param {Number} outerRadius
     * @returns {Number}
     * @example
     * // get outer radius
     * var outerRadius = ring.outerRadius();
     *
     * // set outer radius
     * ring.outerRadius(20);
     */

    Konva.Collection.mapMethods(Konva.Ring);
})();

(function() {
    'use strict';
    /**
     * Wedge constructor
     * @constructor
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Number} config.angle in degrees
     * @param {Number} config.radius
     * @param {Boolean} [config.clockwise]
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // draw a wedge that's pointing downwards
     * var wedge = new Konva.Wedge({
     *   radius: 40,
     *   fill: 'red',
     *   stroke: 'black'
     *   strokeWidth: 5,
     *   angleDeg: 60,
     *   rotationDeg: -120
     * });
     */
    Konva.Wedge = function(config) {
        this.___init(config);
    };

    Konva.Wedge.prototype = {
        _centroid: true,
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'Wedge';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            context.beginPath();
            context.arc(0, 0, this.getRadius(), 0, Konva.getAngle(this.getAngle()), this.getClockwise());
            context.lineTo(0, 0);
            context.closePath();
            context.fillStrokeShape(this);
        },
        // implements Shape.prototype.getWidth()
        getWidth: function() {
            return this.getRadius() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight: function() {
            return this.getRadius() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            if (this.radius() !== width / 2) {
                this.setRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            if (this.radius() !== height / 2) {
                this.setRadius(height / 2);
            }
        }
    };
    Konva.Util.extend(Konva.Wedge, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Wedge, 'radius', 0);

    /**
     * get/set radius
     * @name radius
     * @method
     * @memberof Konva.Wedge.prototype
     * @param {Number} radius
     * @returns {Number}
     * @example
     * // get radius
     * var radius = wedge.radius();
     *
     * // set radius
     * wedge.radius(10);
     */

    Konva.Factory.addGetterSetter(Konva.Wedge, 'angle', 0);

    /**
     * get/set angle in degrees
     * @name angle
     * @method
     * @memberof Konva.Wedge.prototype
     * @param {Number} angle
     * @returns {Number}
     * @example
     * // get angle
     * var angle = wedge.angle();
     *
     * // set angle
     * wedge.angle(20);
     */

    Konva.Factory.addGetterSetter(Konva.Wedge, 'clockwise', false);

    /**
     * get/set clockwise flag
     * @name clockwise
     * @method
     * @memberof Konva.Wedge.prototype
     * @param {Number} clockwise
     * @returns {Number}
     * @example
     * // get clockwise flag
     * var clockwise = wedge.clockwise();
     *
     * // draw wedge counter-clockwise
     * wedge.clockwise(false);
     *
     * // draw wedge clockwise
     * wedge.clockwise(true);
     */

    Konva.Factory.backCompat(Konva.Wedge, {
        angleDeg: 'angle',
        getAngleDeg: 'getAngle',
        setAngleDeg: 'setAngle'
    });

    Konva.Collection.mapMethods(Konva.Wedge);
})();

(function() {
    'use strict';
    /**
     * Arc constructor
     * @constructor
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Number} config.angle in degrees
     * @param {Number} config.innerRadius
     * @param {Number} config.outerRadius
     * @param {Boolean} [config.clockwise]
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // draw a Arc that's pointing downwards
     * var arc = new Konva.Arc({
     *   innerRadius: 40,
     *   outerRadius: 80,
     *   fill: 'red',
     *   stroke: 'black'
     *   strokeWidth: 5,
     *   angle: 60,
     *   rotationDeg: -120
     * });
     */
    Konva.Arc = function(config) {
        this.___init(config);
    };

    Konva.Arc.prototype = {
        _centroid: true,
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'Arc';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            var angle = Konva.getAngle(this.angle()),
                clockwise = this.clockwise();

            context.beginPath();
            context.arc(0, 0, this.getOuterRadius(), 0, angle, clockwise);
            context.arc(0, 0, this.getInnerRadius(), angle, 0, !clockwise);
            context.closePath();
            context.fillStrokeShape(this);
        },
        // implements Shape.prototype.getWidth()
        getWidth: function() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight: function() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            if (this.getOuterRadius() !== width / 2) {
                this.setOuterRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            if (this.getOuterRadius() !== height / 2) {
                this.setOuterRadius(height / 2);
            }
        }
    };
    Konva.Util.extend(Konva.Arc, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Arc, 'innerRadius', 0);

    /**
     * get/set innerRadius
     * @name innerRadius
     * @method
     * @memberof Konva.Arc.prototype
     * @param {Number} innerRadius
     * @returns {Number}
     * @example
     * // get inner radius
     * var innerRadius = arc.innerRadius();
     *
     * // set inner radius
     * arc.innerRadius(20);
     */

    Konva.Factory.addGetterSetter(Konva.Arc, 'outerRadius', 0);

    /**
     * get/set outerRadius
     * @name outerRadius
     * @method
     * @memberof Konva.Arc.prototype
     * @param {Number} outerRadius
     * @returns {Number}
     * @example
     * // get outer radius
     * var outerRadius = arc.outerRadius();
     *
     * // set outer radius
     * arc.outerRadius(20);
     */

    Konva.Factory.addGetterSetter(Konva.Arc, 'angle', 0);

    /**
     * get/set angle in degrees
     * @name angle
     * @method
     * @memberof Konva.Arc.prototype
     * @param {Number} angle
     * @returns {Number}
     * @example
     * // get angle
     * var angle = arc.angle();
     *
     * // set angle
     * arc.angle(20);
     */

    Konva.Factory.addGetterSetter(Konva.Arc, 'clockwise', false);

    /**
     * get/set clockwise flag
     * @name clockwise
     * @method
     * @memberof Konva.Arc.prototype
     * @param {Boolean} clockwise
     * @returns {Boolean}
     * @example
     * // get clockwise flag
     * var clockwise = arc.clockwise();
     *
     * // draw arc counter-clockwise
     * arc.clockwise(false);
     *
     * // draw arc clockwise
     * arc.clockwise(true);
     */

    Konva.Collection.mapMethods(Konva.Arc);
})();

(function() {
    'use strict';
    // CONSTANTS
    var IMAGE = 'Image';

    /**
     * Image constructor
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Image} config.image
     * @param {Object} [config.crop]
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var imageObj = new Image();
     * imageObj.onload = function() {
     *   var image = new Konva.Image({
     *     x: 200,
     *     y: 50,
     *     image: imageObj,
     *     width: 100,
     *     height: 100
     *   });
     * };
     * imageObj.src = '/path/to/image.jpg'
     */
    Konva.Image = function(config) {
        this.___init(config);
    };

    Konva.Image.prototype = {
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = IMAGE;
            this.sceneFunc(this._sceneFunc);
            this.hitFunc(this._hitFunc);
        },
        _useBufferCanvas: function() {
            return (this.hasShadow() || this.getAbsoluteOpacity() !== 1) && this.hasStroke() && this.getStage();
        },
        _sceneFunc: function(context) {
            var width = this.getWidth(),
                height = this.getHeight(),
                image = this.getImage(),
                cropWidth, cropHeight, params;

            if (image) {
                cropWidth = this.getCropWidth();
                cropHeight = this.getCropHeight();
                if (cropWidth && cropHeight) {
                    params = [image, this.getCropX(), this.getCropY(), cropWidth, cropHeight, 0, 0, width, height];
                } else {
                    params = [image, 0, 0, width, height];
                }
            }

            if (this.hasFill() || this.hasStroke()) {
                context.beginPath();
                context.rect(0, 0, width, height);
                context.closePath();
                context.fillStrokeShape(this);
            }

            if (image) {
                context.drawImage.apply(context, params);
            }
        },
        _hitFunc: function(context) {
            var width = this.getWidth(),
                height = this.getHeight();

            context.beginPath();
            context.rect(0, 0, width, height);
            context.closePath();
            context.fillStrokeShape(this);
        },
        getWidth: function() {
            var image = this.getImage();
            return this.attrs.width || (image ? image.width : 0);
        },
        getHeight: function() {
            var image = this.getImage();
            return this.attrs.height || (image ? image.height : 0);
        }
    };
    Konva.Util.extend(Konva.Image, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Image, 'image');

    /**
     * set image
     * @name setImage
     * @method
     * @memberof Konva.Image.prototype
     * @param {Image} image
     */

    /**
     * get image
     * @name getImage
     * @method
     * @memberof Konva.Image.prototype
     * @returns {Image}
     */

    Konva.Factory.addComponentsGetterSetter(Konva.Image, 'crop', ['x', 'y', 'width', 'height']);
    /**
     * get/set crop
     * @method
     * @name crop
     * @memberof Konva.Image.prototype
     * @param {Object} crop
     * @param {Number} crop.x
     * @param {Number} crop.y
     * @param {Number} crop.width
     * @param {Number} crop.height
     * @returns {Object}
     * @example
     * // get crop
     * var crop = image.crop();
     *
     * // set crop
     * image.crop({
     *   x: 20,
     *   y: 20,
     *   width: 20,
     *   height: 20
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Image, 'cropX', 0);
    /**
     * get/set crop x
     * @method
     * @name cropX
     * @memberof Konva.Image.prototype
     * @param {Number} x
     * @returns {Number}
     * @example
     * // get crop x
     * var cropX = image.cropX();
     *
     * // set crop x
     * image.cropX(20);
     */

    Konva.Factory.addGetterSetter(Konva.Image, 'cropY', 0);
    /**
     * get/set crop y
     * @name cropY
     * @method
     * @memberof Konva.Image.prototype
     * @param {Number} y
     * @returns {Number}
     * @example
     * // get crop y
     * var cropY = image.cropY();
     *
     * // set crop y
     * image.cropY(20);
     */

    Konva.Factory.addGetterSetter(Konva.Image, 'cropWidth', 0);
    /**
     * get/set crop width
     * @name cropWidth
     * @method
     * @memberof Konva.Image.prototype
     * @param {Number} width
     * @returns {Number}
     * @example
     * // get crop width
     * var cropWidth = image.cropWidth();
     *
     * // set crop width
     * image.cropWidth(20);
     */

    Konva.Factory.addGetterSetter(Konva.Image, 'cropHeight', 0);
    /**
     * get/set crop height
     * @name cropHeight
     * @method
     * @memberof Konva.Image.prototype
     * @param {Number} height
     * @returns {Number}
     * @example
     * // get crop height
     * var cropHeight = image.cropHeight();
     *
     * // set crop height
     * image.cropHeight(20);
     */

    Konva.Collection.mapMethods(Konva.Image);

    /**
     * load image from given url and create `Konva.Image` instance
     * @method
     * @memberof Konva.Image
     * @param {String} url image source
     * @param {Function} callback with Konva.Image instance as first argument
     * @example
     *  Konva.Image.fromURL(imageURL, function(image){
     *    // image is Konva.Image instance
     *    layer.add(image);
     *    layer.draw();
     *  });
     */
    Konva.Image.fromURL = function(url, callback) {
        var img = new Image();
        img.onload = function() {
          var image = new Konva.Image({
            image: img
          });
          callback(image);
        };
        img.src = url;
    };
})();

/*eslint-disable max-depth */
(function() {
    'use strict';
    // constants
    var AUTO = 'auto',
        //CANVAS = 'canvas',
        CENTER = 'center',
        CHANGE_KONVA = 'Change.konva',
        CONTEXT_2D = '2d',
        DASH = '-',
        EMPTY_STRING = '',
        LEFT = 'left',
        TEXT = 'text',
        TEXT_UPPER = 'Text',
        MIDDLE = 'middle',
        NORMAL = 'normal',
        PX_SPACE = 'px ',
        SPACE = ' ',
        RIGHT = 'right',
        WORD = 'word',
        CHAR = 'char',
        NONE = 'none',
        ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'fontVariant', 'padding', 'align', 'lineHeight', 'text', 'width', 'height', 'wrap'],

        // cached variables
        attrChangeListLen = ATTR_CHANGE_LIST.length,
        dummyContext = Konva.Util.createCanvasElement().getContext(CONTEXT_2D);

    /**
     * Text constructor
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {String} [config.fontFamily] default is Arial
     * @param {Number} [config.fontSize] in pixels.  Default is 12
     * @param {String} [config.fontStyle] can be normal, bold, or italic.  Default is normal
     * @param {String} [config.fontVariant] can be normal or small-caps.  Default is normal
     * @param {String} config.text
     * @param {String} [config.align] can be left, center, or right
     * @param {Number} [config.padding]
     * @param {Number} [config.width] default is auto
     * @param {Number} [config.height] default is auto
     * @param {Number} [config.lineHeight] default is 1
     * @param {String} [config.wrap] can be word, char, or none. Default is word
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var text = new Konva.Text({
     *   x: 10,
     *   y: 15,
     *   text: 'Simple Text',
     *   fontSize: 30,
     *   fontFamily: 'Calibri',
     *   fill: 'green'
     * });
     */
    Konva.Text = function(config) {
        this.___init(config);
    };
    function _fillFunc(context) {
        context.fillText(this.partialText, 0, 0);
    }
    function _strokeFunc(context) {
        context.strokeText(this.partialText, 0, 0);
    }

    Konva.Text.prototype = {
        ___init: function(config) {
            config = config || {};

            // set default color to black
            if (!config.fillLinearGradientColorStops && !config.fillRadialGradientColorStops) {
                config.fill = config.fill || 'black';
            }

            if (config.width === undefined) {
                config.width = AUTO;
            }
            if (config.height === undefined) {
                config.height = AUTO;
            }

            // call super constructor
            Konva.Shape.call(this, config);

            this._fillFunc = _fillFunc;
            this._strokeFunc = _strokeFunc;
            this.className = TEXT_UPPER;

            // update text data for certain attr changes
            for(var n = 0; n < attrChangeListLen; n++) {
                this.on(ATTR_CHANGE_LIST[n] + CHANGE_KONVA, this._setTextData);
            }

            this._setTextData();
            this.sceneFunc(this._sceneFunc);
            this.hitFunc(this._hitFunc);
        },
        _sceneFunc: function(context) {
            var p = this.getPadding(),
                textHeight = this.getTextHeight(),
                lineHeightPx = this.getLineHeight() * textHeight,
                textArr = this.textArr,
                textArrLen = textArr.length,
                totalWidth = this.getWidth(),
                n;

            context.setAttr('font', this._getContextFont());

            context.setAttr('textBaseline', MIDDLE);
            context.setAttr('textAlign', LEFT);
            context.save();
            if (p) {
                context.translate(p, 0);
                context.translate(0, p + textHeight / 2);
            } else {
                context.translate(0, textHeight / 2);
            }


            // draw text lines
            for(n = 0; n < textArrLen; n++) {
                var obj = textArr[n],
                    text = obj.text,
                    width = obj.width;

                // horizontal alignment
                context.save();
                if(this.getAlign() === RIGHT) {
                    context.translate(totalWidth - width - p * 2, 0);
                }
                else if(this.getAlign() === CENTER) {
                    context.translate((totalWidth - width - p * 2) / 2, 0);
                }

                this.partialText = text;

                context.fillStrokeShape(this);
                context.restore();
                context.translate(0, lineHeightPx);
            }
            context.restore();
        },
        _hitFunc: function(context) {
            var width = this.getWidth(),
                height = this.getHeight();

            context.beginPath();
            context.rect(0, 0, width, height);
            context.closePath();
            context.fillStrokeShape(this);
        },
        setText: function(text) {
            var str = Konva.Util._isString(text) ? text : text.toString();
            this._setAttr(TEXT, str);
            return this;
        },
        /**
         * get width of text area, which includes padding
         * @method
         * @memberof Konva.Text.prototype
         * @returns {Number}
         */
        getWidth: function() {
            return this.attrs.width === AUTO ? this.getTextWidth() + this.getPadding() * 2 : this.attrs.width;
        },
        /**
         * get the height of the text area, which takes into account multi-line text, line heights, and padding
         * @method
         * @memberof Konva.Text.prototype
         * @returns {Number}
         */
        getHeight: function() {
            return this.attrs.height === AUTO ? (this.getTextHeight() * this.textArr.length * this.getLineHeight()) + this.getPadding() * 2 : this.attrs.height;
        },
        /**
         * get text width
         * @method
         * @memberof Konva.Text.prototype
         * @returns {Number}
         */
        getTextWidth: function() {
            return this.textWidth;
        },
        /**
         * get text height
         * @method
         * @memberof Konva.Text.prototype
         * @returns {Number}
         */
        getTextHeight: function() {
            return this.textHeight;
        },
        _getTextSize: function(text) {
            var _context = dummyContext,
                fontSize = this.getFontSize(),
                metrics;

            _context.save();
            _context.font = this._getContextFont();

            metrics = _context.measureText(text);
            _context.restore();
            return {
                width: metrics.width,
                height: parseInt(fontSize, 10)
            };
        },
        _getContextFont: function() {
            return this.getFontStyle() + SPACE + this.getFontVariant() + SPACE + this.getFontSize() + PX_SPACE + this.getFontFamily();
        },
        _addTextLine: function (line, width) {
            return this.textArr.push({text: line, width: width});
        },
        _getTextWidth: function (text) {
            return dummyContext.measureText(text).width;
        },
        _setTextData: function () {
            var lines = this.getText().split('\n'),
                fontSize = +this.getFontSize(),
                textWidth = 0,
                lineHeightPx = this.getLineHeight() * fontSize,
                width = this.attrs.width,
                height = this.attrs.height,
                fixedWidth = width !== AUTO,
                fixedHeight = height !== AUTO,
                padding = this.getPadding(),
                maxWidth = width - padding * 2,
                maxHeightPx = height - padding * 2,
                currentHeightPx = 0,
                wrap = this.getWrap(),
                shouldWrap = wrap !== NONE,
                wrapAtWord = wrap !== CHAR && shouldWrap;

            this.textArr = [];
            dummyContext.save();
            dummyContext.font = this._getContextFont();
            for (var i = 0, max = lines.length; i < max; ++i) {
                var line = lines[i],
                    lineWidth = this._getTextWidth(line);
                if (fixedWidth && lineWidth > maxWidth) {
                    /*
                     * if width is fixed and line does not fit entirely
                     * break the line into multiple fitting lines
                     */
                    while (line.length > 0) {
                        /*
                         * use binary search to find the longest substring that
                         * that would fit in the specified width
                         */
                        var low = 0, high = line.length,
                            match = '', matchWidth = 0;
                        while (low < high) {
                            var mid = (low + high) >>> 1,
                                substr = line.slice(0, mid + 1),
                                substrWidth = this._getTextWidth(substr);
                            if (substrWidth <= maxWidth) {
                                low = mid + 1;
                                match = substr;
                                matchWidth = substrWidth;
                            } else {
                                high = mid;
                            }
                        }
                        /*
                         * 'low' is now the index of the substring end
                         * 'match' is the substring
                         * 'matchWidth' is the substring width in px
                         */
                        if (match) {
                            // a fitting substring was found
                            if (wrapAtWord) {
                                // try to find a space or dash where wrapping could be done
                                var wrapIndex = Math.max(match.lastIndexOf(SPACE),
                                                          match.lastIndexOf(DASH)) + 1;
                                if (wrapIndex > 0) {
                                    // re-cut the substring found at the space/dash position
                                    low = wrapIndex;
                                    match = match.slice(0, low);
                                    matchWidth = this._getTextWidth(match);
                                }
                            }
                            this._addTextLine(match, matchWidth);
                            textWidth = Math.max(textWidth, matchWidth);
                            currentHeightPx += lineHeightPx;
                            if (!shouldWrap ||
                                (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx)) {
                                /*
                                 * stop wrapping if wrapping is disabled or if adding
                                 * one more line would overflow the fixed height
                                 */
                                break;
                            }
                            line = line.slice(low);
                            if (line.length > 0) {
                                // Check if the remaining text would fit on one line
                                lineWidth = this._getTextWidth(line);
                                if (lineWidth <= maxWidth) {
                                    // if it does, add the line and break out of the loop
                                    this._addTextLine(line, lineWidth);
                                    currentHeightPx += lineHeightPx;
                                    textWidth = Math.max(textWidth, lineWidth);
                                    break;
                                }
                            }
                        } else {
                            // not even one character could fit in the element, abort
                            break;
                        }
                    }
                } else {
                    // element width is automatically adjusted to max line width
                    this._addTextLine(line, lineWidth);
                    currentHeightPx += lineHeightPx;
                    textWidth = Math.max(textWidth, lineWidth);
                }
                // if element height is fixed, abort if adding one more line would overflow
                if (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx) {
                    break;
                }
            }
            dummyContext.restore();
            this.textHeight = fontSize;
            this.textWidth = textWidth;
        }
    };
    Konva.Util.extend(Konva.Text, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Text, 'fontFamily', 'Arial');

    /**
     * get/set font family
     * @name fontFamily
     * @method
     * @memberof Konva.Text.prototype
     * @param {String} fontFamily
     * @returns {String}
     * @example
     * // get font family
     * var fontFamily = text.fontFamily();
     *
     * // set font family
     * text.fontFamily('Arial');
     */

    Konva.Factory.addGetterSetter(Konva.Text, 'fontSize', 12);

    /**
     * get/set font size in pixels
     * @name fontSize
     * @method
     * @memberof Konva.Text.prototype
     * @param {Number} fontSize
     * @returns {Number}
     * @example
     * // get font size
     * var fontSize = text.fontSize();
     *
     * // set font size to 22px
     * text.fontSize(22);
     */

    Konva.Factory.addGetterSetter(Konva.Text, 'fontStyle', NORMAL);

    /**
     * set font style.  Can be 'normal', 'italic', or 'bold'.  'normal' is the default.
     * @name fontStyle
     * @method
     * @memberof Konva.Text.prototype
     * @param {String} fontStyle
     * @returns {String}
     * @example
     * // get font style
     * var fontStyle = text.fontStyle();
     *
     * // set font style
     * text.fontStyle('bold');
     */

    Konva.Factory.addGetterSetter(Konva.Text, 'fontVariant', NORMAL);

    /**
     * set font variant.  Can be 'normal' or 'small-caps'.  'normal' is the default.
     * @name fontVariant
     * @method
     * @memberof Konva.Text.prototype
     * @param {String} fontVariant
     * @returns {String}
     * @example
     * // get font variant
     * var fontVariant = text.fontVariant();
     *
     * // set font variant
     * text.fontVariant('small-caps');
     */

    Konva.Factory.addGetterSetter(Konva.Text, 'padding', 0);

    /**
     * set padding
     * @name padding
     * @method
     * @memberof Konva.Text.prototype
     * @param {Number} padding
     * @returns {Number}
     * @example
     * // get padding
     * var padding = text.padding();
     *
     * // set padding to 10 pixels
     * text.padding(10);
     */

    Konva.Factory.addGetterSetter(Konva.Text, 'align', LEFT);

    /**
     * get/set horizontal align of text.  Can be 'left', 'center', or 'right'
     * @name align
     * @method
     * @memberof Konva.Text.prototype
     * @param {String} align
     * @returns {String}
     * @example
     * // get text align
     * var align = text.align();
     *
     * // center text
     * text.align('center');
     *
     * // align text to right
     * text.align('right');
     */

    Konva.Factory.addGetterSetter(Konva.Text, 'lineHeight', 1);

    /**
     * get/set line height.  The default is 1.
     * @name lineHeight
     * @method
     * @memberof Konva.Text.prototype
     * @param {Number} lineHeight
     * @returns {Number}
     * @example
     * // get line height
     * var lineHeight = text.lineHeight();
     *
     * // set the line height
     * text.lineHeight(2);
     */

    Konva.Factory.addGetterSetter(Konva.Text, 'wrap', WORD);

    /**
     * get/set wrap.  Can be word, char, or none. Default is word.
     * @name wrap
     * @method
     * @memberof Konva.Text.prototype
     * @param {String} wrap
     * @returns {String}
     * @example
     * // get wrap
     * var wrap = text.wrap();
     *
     * // set wrap
     * text.wrap('word');
     */

    Konva.Factory.addGetter(Konva.Text, 'text', EMPTY_STRING);
    Konva.Factory.addOverloadedGetterSetter(Konva.Text, 'text');

    /**
     * get/set text
     * @name getText
     * @method
     * @memberof Konva.Text.prototype
     * @param {String} text
     * @returns {String}
     * @example
     * // get text
     * var text = text.text();
     *
     * // set text
     * text.text('Hello world!');
     */

    Konva.Collection.mapMethods(Konva.Text);
})();

(function () {
    'use strict';
    /**
     * Line constructor.&nbsp; Lines are defined by an array of points and
     *  a tension
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Array} config.points
     * @param {Number} [config.tension] Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
     *   The default is 0
     * @param {Boolean} [config.closed] defines whether or not the line shape is closed, creating a polygon or blob
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var line = new Konva.Line({
     *   x: 100,
     *   y: 50,
     *   points: [73, 70, 340, 23, 450, 60, 500, 20],
     *   stroke: 'red',
     *   tension: 1
     * });
     */
    Konva.Line = function (config) {
        this.___init(config);
    };

    Konva.Line.prototype = {
        ___init: function (config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'Line';

            this.on('pointsChange.konva tensionChange.konva closedChange.konva', function () {
                this._clearCache('tensionPoints');
            });

            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function (context) {
            var points = this.getPoints(),
                length = points.length,
                tension = this.getTension(),
                closed = this.getClosed(),
                tp, len, n;

            if (!length) {
                return;
            }

            context.beginPath();
            context.moveTo(points[0], points[1]);

            // tension
            if (tension !== 0 && length > 4) {
                tp = this.getTensionPoints();
                len = tp.length;
                n = closed ? 0 : 4;

                if (!closed) {
                    context.quadraticCurveTo(tp[0], tp[1], tp[2], tp[3]);
                }

                while (n < len - 2) {
                    context.bezierCurveTo(tp[n++], tp[n++], tp[n++], tp[n++], tp[n++], tp[n++]);
                }

                if (!closed) {
                    context.quadraticCurveTo(tp[len - 2], tp[len - 1], points[length - 2], points[length - 1]);
                }
            }
            // no tension
            else {
                for (n = 2; n < length; n += 2) {
                    context.lineTo(points[n], points[n + 1]);
                }
            }

            // closed e.g. polygons and blobs
            if (closed) {
                context.closePath();
                context.fillStrokeShape(this);
            }
            // open e.g. lines and splines
            else {
                context.strokeShape(this);
            }
        },
        getTensionPoints: function () {
            return this._getCache('tensionPoints', this._getTensionPoints);
        },
        _getTensionPoints: function () {
            if (this.getClosed()) {
                return this._getTensionPointsClosed();
            } else {
                return Konva.Util._expandPoints(this.getPoints(), this.getTension());
            }
        },
        _getTensionPointsClosed: function () {
            var p = this.getPoints(),
                len = p.length,
                tension = this.getTension(),
                util = Konva.Util,
                firstControlPoints = util._getControlPoints(
                    p[len - 2],
                    p[len - 1],
                    p[0],
                    p[1],
                    p[2],
                    p[3],
                    tension
                ),
                lastControlPoints = util._getControlPoints(
                    p[len - 4],
                    p[len - 3],
                    p[len - 2],
                    p[len - 1],
                    p[0],
                    p[1],
                    tension
                ),
                middle = Konva.Util._expandPoints(p, tension),
                tp = [
                    firstControlPoints[2],
                    firstControlPoints[3]
                ]
                .concat(middle)
                .concat([
                    lastControlPoints[0],
                    lastControlPoints[1],
                    p[len - 2],
                    p[len - 1],
                    lastControlPoints[2],
                    lastControlPoints[3],
                    firstControlPoints[0],
                    firstControlPoints[1],
                    p[0],
                    p[1]
                ]);

            return tp;
        },
        getWidth: function () {
            return this.getSelfRect().width;
        },
        getHeight: function () {
            return this.getSelfRect().height;
        },
        // overload size detection
        getSelfRect: function () {
            var points;
            if (this.getTension() !== 0) {
                points = this._getTensionPoints();
            } else {
                points = this.getPoints();
            }
            var minX = points[0];
            var maxX = points[0];
            var minY = points[1];
            var maxY = points[1];
            var x, y;
            for (var i = 0; i < points.length / 2; i++) {
                x = points[i * 2];
                y = points[i * 2 + 1];
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
            return {
                x: Math.round(minX),
                y: Math.round(minY),
                width: Math.round(maxX - minX),
                height: Math.round(maxY - minY)
            };
        }
    };
    Konva.Util.extend(Konva.Line, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Line, 'closed', false);

    /**
     * get/set closed flag.  The default is false
     * @name closed
     * @method
     * @memberof Konva.Line.prototype
     * @param {Boolean} closed
     * @returns {Boolean}
     * @example
     * // get closed flag
     * var closed = line.closed();
     *
     * // close the shape
     * line.closed(true);
     *
     * // open the shape
     * line.closed(false);
     */

    Konva.Factory.addGetterSetter(Konva.Line, 'tension', 0);

    /**
     * get/set tension
     * @name tension
     * @method
     * @memberof Konva.Line.prototype
     * @param {Number} Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
     *   The default is 0
     * @returns {Number}
     * @example
     * // get tension
     * var tension = line.tension();
     *
     * // set tension
     * line.tension(3);
     */

    Konva.Factory.addGetterSetter(Konva.Line, 'points', []);
    /**
     * get/set points array
     * @name points
     * @method
     * @memberof Konva.Line.prototype
     * @param {Array} points
     * @returns {Array}
     * @example
     * // get points
     * var points = line.points();
     *
     * // set points
     * line.points([10, 20, 30, 40, 50, 60]);
     *
     * // push a new point
     * line.points(line.points().concat([70, 80]));
     */

    Konva.Collection.mapMethods(Konva.Line);
})();

(function() {
    'use strict';
    /**
     * Sprite constructor
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {String} config.animation animation key
     * @param {Object} config.animations animation map
     * @param {Integer} [config.frameIndex] animation frame index
     * @param {Image} config.image image object
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var imageObj = new Image();
     * imageObj.onload = function() {
     *   var sprite = new Konva.Sprite({
     *     x: 200,
     *     y: 100,
     *     image: imageObj,
     *     animation: 'standing',
     *     animations: {
     *       standing: [
     *         // x, y, width, height (6 frames)
     *         0, 0, 49, 109,
     *         52, 0, 49, 109,
     *         105, 0, 49, 109,
     *         158, 0, 49, 109,
     *         210, 0, 49, 109,
     *         262, 0, 49, 109
     *       ],
     *       kicking: [
     *         // x, y, width, height (6 frames)
     *         0, 109, 45, 98,
     *         45, 109, 45, 98,
     *         95, 109, 63, 98,
     *         156, 109, 70, 98,
     *         229, 109, 60, 98,
     *         287, 109, 41, 98
     *       ]
     *     },
     *     frameRate: 7,
     *     frameIndex: 0
     *   });
     * };
     * imageObj.src = '/path/to/image.jpg'
     */
    Konva.Sprite = function(config) {
        this.___init(config);
    };

    Konva.Sprite.prototype = {
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'Sprite';

            this._updated = true;
            var that = this;
            this.anim = new Konva.Animation(function() {
                // if we don't need to redraw layer we should return false
                var updated = that._updated;
                that._updated = false;
                return updated;
            });
            this.on('animationChange.konva', function() {
                // reset index when animation changes
                this.frameIndex(0);
            });
            this.on('frameIndexChange.konva', function() {
                this._updated = true;
            });
            // smooth change for frameRate
            this.on('frameRateChange.konva', function() {
                if (!this.anim.isRunning()) {
                    return;
                }
                clearInterval(this.interval);
                this._setInterval();
            });

            this.sceneFunc(this._sceneFunc);
            this.hitFunc(this._hitFunc);
        },
        _sceneFunc: function(context) {
            var anim = this.getAnimation(),
                index = this.frameIndex(),
                ix4 = index * 4,
                set = this.getAnimations()[anim],
                offsets = this.frameOffsets(),
                x = set[ix4 + 0],
                y = set[ix4 + 1],
                width = set[ix4 + 2],
                height = set[ix4 + 3],
                image = this.getImage();

            if (this.hasFill() || this.hasStroke()) {
                context.beginPath();
                context.rect(0, 0, width, height);
                context.closePath();
                context.fillStrokeShape(this);
            }

            if(image) {
                if (offsets) {
                    var offset = offsets[anim],
                    ix2 = index * 2;
                    context.drawImage(image, x, y, width, height, offset[ix2 + 0], offset[ix2 + 1], width, height);
                } else {
                    context.drawImage(image, x, y, width, height, 0, 0, width, height);
                }
            }
        },
        _hitFunc: function(context) {
            var anim = this.getAnimation(),
                index = this.frameIndex(),
                ix4 = index * 4,
                set = this.getAnimations()[anim],
                offsets = this.frameOffsets(),
                width = set[ix4 + 2],
                height = set[ix4 + 3];

            context.beginPath();
            if (offsets) {
                var offset = offsets[anim];
                var ix2 = index * 2;
                context.rect(offset[ix2 + 0], offset[ix2 + 1], width, height);
            } else {
                context.rect(0, 0, width, height);
            }
            context.closePath();
            context.fillShape(this);
        },
        _useBufferCanvas: function() {
            return (this.hasShadow() || this.getAbsoluteOpacity() !== 1) && this.hasStroke();
        },
        _setInterval: function() {
            var that = this;
            this.interval = setInterval(function() {
                that._updateIndex();
            }, 1000 / this.getFrameRate());
        },
        /**
         * start sprite animation
         * @method
         * @memberof Konva.Sprite.prototype
         */
        start: function() {
            var layer = this.getLayer();

            /*
             * animation object has no executable function because
             *  the updates are done with a fixed FPS with the setInterval
             *  below.  The anim object only needs the layer reference for
             *  redraw
             */
            this.anim.setLayers(layer);
            this._setInterval();
            this.anim.start();
        },
        /**
         * stop sprite animation
         * @method
         * @memberof Konva.Sprite.prototype
         */
        stop: function() {
            this.anim.stop();
            clearInterval(this.interval);
        },
        /**
         * determine if animation of sprite is running or not.  returns true or false
         * @method
         * @memberof Konva.Animation.prototype
         * @returns {Boolean}
         */
        isRunning: function() {
            return this.anim.isRunning();
        },
        _updateIndex: function() {
            var index = this.frameIndex(),
                animation = this.getAnimation(),
                animations = this.getAnimations(),
                anim = animations[animation],
                len = anim.length / 4;

            if(index < len - 1) {
                this.frameIndex(index + 1);
            }
            else {
                this.frameIndex(0);
            }
        }
    };
    Konva.Util.extend(Konva.Sprite, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Sprite, 'animation');

    /**
     * get/set animation key
     * @name animation
     * @method
     * @memberof Konva.Sprite.prototype
     * @param {String} anim animation key
     * @returns {String}
     * @example
     * // get animation key
     * var animation = sprite.animation();
     *
     * // set animation key
     * sprite.animation('kicking');
     */

    Konva.Factory.addGetterSetter(Konva.Sprite, 'animations');

    /**
     * get/set animations map
     * @name animations
     * @method
     * @memberof Konva.Sprite.prototype
     * @param {Object} animations
     * @returns {Object}
     * @example
     * // get animations map
     * var animations = sprite.animations();
     *
     * // set animations map
     * sprite.animations({
     *   standing: [
     *     // x, y, width, height (6 frames)
     *     0, 0, 49, 109,
     *     52, 0, 49, 109,
     *     105, 0, 49, 109,
     *     158, 0, 49, 109,
     *     210, 0, 49, 109,
     *     262, 0, 49, 109
     *   ],
     *   kicking: [
     *     // x, y, width, height (6 frames)
     *     0, 109, 45, 98,
     *     45, 109, 45, 98,
     *     95, 109, 63, 98,
     *     156, 109, 70, 98,
     *     229, 109, 60, 98,
     *     287, 109, 41, 98
     *   ]
     * });
     */

    Konva.Factory.addGetterSetter(Konva.Sprite, 'frameOffsets');

    /**
    * get/set offsets map
    * @name offsets
    * @method
    * @memberof Konva.Sprite.prototype
    * @param {Object} offsets
    * @returns {Object}
    * @example
    * // get offsets map
    * var offsets = sprite.offsets();
    *
    * // set offsets map
    * sprite.offsets({
    *   standing: [
    *     // x, y (6 frames)
    *     0, 0,
    *     0, 0,
    *     5, 0,
    *     0, 0,
    *     0, 3,
    *     2, 0
    *   ],
    *   kicking: [
    *     // x, y (6 frames)
    *     0, 5,
    *     5, 0,
    *     10, 0,
    *     0, 0,
    *     2, 1,
    *     0, 0
    *   ]
    * });
    */

    Konva.Factory.addGetterSetter(Konva.Sprite, 'image');

    /**
     * get/set image
     * @name image
     * @method
     * @memberof Konva.Sprite.prototype
     * @param {Image} image
     * @returns {Image}
     * @example
     * // get image
     * var image = sprite.image();
     *
     * // set image
     * sprite.image(imageObj);
     */

    Konva.Factory.addGetterSetter(Konva.Sprite, 'frameIndex', 0);

    /**
     * set/set animation frame index
     * @name frameIndex
     * @method
     * @memberof Konva.Sprite.prototype
     * @param {Integer} frameIndex
     * @returns {Integer}
     * @example
     * // get animation frame index
     * var frameIndex = sprite.frameIndex();
     *
     * // set animation frame index
     * sprite.frameIndex(3);
     */

    Konva.Factory.addGetterSetter(Konva.Sprite, 'frameRate', 17);

    /**
     * get/set frame rate in frames per second.  Increase this number to make the sprite
     *  animation run faster, and decrease the number to make the sprite animation run slower
     *  The default is 17 frames per second
     * @name frameRate
     * @method
     * @memberof Konva.Sprite.prototype
     * @param {Integer} frameRate
     * @returns {Integer}
     * @example
     * // get frame rate
     * var frameRate = sprite.frameRate();
     *
     * // set frame rate to 2 frames per second
     * sprite.frameRate(2);
     */

    Konva.Factory.backCompat(Konva.Sprite, {
        index: 'frameIndex',
        getIndex: 'getFrameIndex',
        setIndex: 'setFrameIndex'
    });

    Konva.Collection.mapMethods(Konva.Sprite);
})();

/*eslint-disable  no-shadow, max-len, max-depth */
(function () {
    'use strict';
    /**
     * Path constructor.
     * @author Jason Follas
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {String} config.data SVG data string
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var path = new Konva.Path({
     *   x: 240,
     *   y: 40,
     *   data: 'M12.582,9.551C3.251,16.237,0.921,29.021,7.08,38.564l-2.36,1.689l4.893,2.262l4.893,2.262l-0.568-5.36l-0.567-5.359l-2.365,1.694c-4.657-7.375-2.83-17.185,4.352-22.33c7.451-5.338,17.817-3.625,23.156,3.824c5.337,7.449,3.625,17.813-3.821,23.152l2.857,3.988c9.617-6.893,11.827-20.277,4.935-29.896C35.591,4.87,22.204,2.658,12.582,9.551z',
     *   fill: 'green',
     *   scale: 2
     * });
     */
    Konva.Path = function (config) {
        this.___init(config);
    };

    Konva.Path.prototype = {
        ___init: function (config) {
            this.dataArray = [];
            var that = this;

            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'Path';

            this.dataArray = Konva.Path.parsePathData(this.getData());
            this.on('dataChange.konva', function () {
                that.dataArray = Konva.Path.parsePathData(this.getData());
            });

            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            var ca = this.dataArray,
                closedPath = false;

            // context position
            context.beginPath();
            for (var n = 0; n < ca.length; n++) {
                var c = ca[n].command;
                var p = ca[n].points;
                switch (c) {
                    case 'L':
                        context.lineTo(p[0], p[1]);
                        break;
                    case 'M':
                        context.moveTo(p[0], p[1]);
                        break;
                    case 'C':
                        context.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
                        break;
                    case 'Q':
                        context.quadraticCurveTo(p[0], p[1], p[2], p[3]);
                        break;
                    case 'A':
                        var cx = p[0], cy = p[1], rx = p[2], ry = p[3], theta = p[4], dTheta = p[5], psi = p[6], fs = p[7];

                        var r = (rx > ry) ? rx : ry;
                        var scaleX = (rx > ry) ? 1 : rx / ry;
                        var scaleY = (rx > ry) ? ry / rx : 1;

                        context.translate(cx, cy);
                        context.rotate(psi);
                        context.scale(scaleX, scaleY);
                        context.arc(0, 0, r, theta, theta + dTheta, 1 - fs);
                        context.scale(1 / scaleX, 1 / scaleY);
                        context.rotate(-psi);
                        context.translate(-cx, -cy);

                        break;
                    case 'z':
                        context.closePath();
                        closedPath = true;
                        break;
                }
            }

            if (closedPath) {
                context.fillStrokeShape(this);
            }
            else {
                context.strokeShape(this);
            }
        },
        getSelfRect: function() {
            var points = [];
            this.dataArray.forEach(function(data) {
                points = points.concat(data.points);
            });
            var minX = points[0];
            var maxX = points[0];
            var minY = points[1];
            var maxY = points[1];
            var x, y;
            for (var i = 0; i < points.length / 2; i++) {
                x = points[i * 2]; y = points[i * 2 + 1];
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
            return {
                x: Math.round(minX),
                y: Math.round(minY),
                width: Math.round(maxX - minX),
                height: Math.round(maxY - minY)
            };
        }
    };
    Konva.Util.extend(Konva.Path, Konva.Shape);

    Konva.Path.getLineLength = function(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    };
    Konva.Path.getPointOnLine = function(dist, P1x, P1y, P2x, P2y, fromX, fromY) {
        if(fromX === undefined) {
            fromX = P1x;
        }
        if(fromY === undefined) {
            fromY = P1y;
        }

        var m = (P2y - P1y) / ((P2x - P1x) + 0.00000001);
        var run = Math.sqrt(dist * dist / (1 + m * m));
        if(P2x < P1x) {
            run *= -1;
        }
        var rise = m * run;
        var pt;

        if (P2x === P1x) { // vertical line
            pt = {
                x: fromX,
                y: fromY + rise
            };
        } else if((fromY - P1y) / ((fromX - P1x) + 0.00000001) === m) {
            pt = {
                x: fromX + run,
                y: fromY + rise
            };
        }
        else {
            var ix, iy;

            var len = this.getLineLength(P1x, P1y, P2x, P2y);
            if(len < 0.00000001) {
                return undefined;
            }
            var u = (((fromX - P1x) * (P2x - P1x)) + ((fromY - P1y) * (P2y - P1y)));
            u = u / (len * len);
            ix = P1x + u * (P2x - P1x);
            iy = P1y + u * (P2y - P1y);

            var pRise = this.getLineLength(fromX, fromY, ix, iy);
            var pRun = Math.sqrt(dist * dist - pRise * pRise);
            run = Math.sqrt(pRun * pRun / (1 + m * m));
            if(P2x < P1x) {
                run *= -1;
            }
            rise = m * run;
            pt = {
                x: ix + run,
                y: iy + rise
            };
        }

        return pt;
    };

    Konva.Path.getPointOnCubicBezier = function(pct, P1x, P1y, P2x, P2y, P3x, P3y, P4x, P4y) {
        function CB1(t) {
            return t * t * t;
        }
        function CB2(t) {
            return 3 * t * t * (1 - t);
        }
        function CB3(t) {
            return 3 * t * (1 - t) * (1 - t);
        }
        function CB4(t) {
            return (1 - t) * (1 - t) * (1 - t);
        }
        var x = P4x * CB1(pct) + P3x * CB2(pct) + P2x * CB3(pct) + P1x * CB4(pct);
        var y = P4y * CB1(pct) + P3y * CB2(pct) + P2y * CB3(pct) + P1y * CB4(pct);

        return {
            x: x,
            y: y
        };
    };
    Konva.Path.getPointOnQuadraticBezier = function(pct, P1x, P1y, P2x, P2y, P3x, P3y) {
        function QB1(t) {
            return t * t;
        }
        function QB2(t) {
            return 2 * t * (1 - t);
        }
        function QB3(t) {
            return (1 - t) * (1 - t);
        }
        var x = P3x * QB1(pct) + P2x * QB2(pct) + P1x * QB3(pct);
        var y = P3y * QB1(pct) + P2y * QB2(pct) + P1y * QB3(pct);

        return {
            x: x,
            y: y
        };
    };
    Konva.Path.getPointOnEllipticalArc = function(cx, cy, rx, ry, theta, psi) {
        var cosPsi = Math.cos(psi), sinPsi = Math.sin(psi);
        var pt = {
            x: rx * Math.cos(theta),
            y: ry * Math.sin(theta)
        };
        return {
            x: cx + (pt.x * cosPsi - pt.y * sinPsi),
            y: cy + (pt.x * sinPsi + pt.y * cosPsi)
        };
    };
    /*
     * get parsed data array from the data
     *  string.  V, v, H, h, and l data are converted to
     *  L data for the purpose of high performance Path
     *  rendering
     */
    Konva.Path.parsePathData = function(data) {
        // Path Data Segment must begin with a moveTo
        //m (x y)+  Relative moveTo (subsequent points are treated as lineTo)
        //M (x y)+  Absolute moveTo (subsequent points are treated as lineTo)
        //l (x y)+  Relative lineTo
        //L (x y)+  Absolute LineTo
        //h (x)+    Relative horizontal lineTo
        //H (x)+    Absolute horizontal lineTo
        //v (y)+    Relative vertical lineTo
        //V (y)+    Absolute vertical lineTo
        //z (closepath)
        //Z (closepath)
        //c (x1 y1 x2 y2 x y)+ Relative Bezier curve
        //C (x1 y1 x2 y2 x y)+ Absolute Bezier curve
        //q (x1 y1 x y)+       Relative Quadratic Bezier
        //Q (x1 y1 x y)+       Absolute Quadratic Bezier
        //t (x y)+    Shorthand/Smooth Relative Quadratic Bezier
        //T (x y)+    Shorthand/Smooth Absolute Quadratic Bezier
        //s (x2 y2 x y)+       Shorthand/Smooth Relative Bezier curve
        //S (x2 y2 x y)+       Shorthand/Smooth Absolute Bezier curve
        //a (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+     Relative Elliptical Arc
        //A (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+  Absolute Elliptical Arc

        // return early if data is not defined
        if(!data) {
            return [];
        }

        // command string
        var cs = data;

        // command chars
        var cc = ['m', 'M', 'l', 'L', 'v', 'V', 'h', 'H', 'z', 'Z', 'c', 'C', 'q', 'Q', 't', 'T', 's', 'S', 'a', 'A'];
        // convert white spaces to commas
        cs = cs.replace(new RegExp(' ', 'g'), ',');
        // create pipes so that we can split the data
        for(var n = 0; n < cc.length; n++) {
            cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
        }
        // create array
        var arr = cs.split('|');
        var ca = [];
        // init context point
        var cpx = 0;
        var cpy = 0;
        for( n = 1; n < arr.length; n++) {
            var str = arr[n];
            var c = str.charAt(0);
            str = str.slice(1);
            // remove ,- for consistency
            str = str.replace(new RegExp(',-', 'g'), '-');
            // add commas so that it's easy to split
            str = str.replace(new RegExp('-', 'g'), ',-');
            str = str.replace(new RegExp('e,-', 'g'), 'e-');
            var p = str.split(',');
            if(p.length > 0 && p[0] === '') {
                p.shift();
            }
            // convert strings to floats
            for(var i = 0; i < p.length; i++) {
                p[i] = parseFloat(p[i]);
            }
            while(p.length > 0) {
                if(isNaN(p[0])) {// case for a trailing comma before next command
                    break;
                }

                var cmd = null;
                var points = [];
                var startX = cpx, startY = cpy;
                // Move var from within the switch to up here (jshint)
                var prevCmd, ctlPtx, ctlPty;     // Ss, Tt
                var rx, ry, psi, fa, fs, x1, y1; // Aa


                // convert l, H, h, V, and v to L
                switch (c) {

                    // Note: Keep the lineTo's above the moveTo's in this switch
                    case 'l':
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'L':
                        cpx = p.shift();
                        cpy = p.shift();
                        points.push(cpx, cpy);
                        break;

                    // Note: lineTo handlers need to be above this point
                    case 'm':
                        var dx = p.shift();
                        var dy = p.shift();
                        cpx += dx;
                        cpy += dy;
                        cmd = 'M';
                        // After closing the path move the current position
                        // to the the first point of the path (if any).
                        if(ca.length > 2 && ca[ca.length - 1].command === 'z'){
                            for(var idx = ca.length - 2; idx >= 0; idx--){
                                if(ca[idx].command === 'M'){
                                    cpx = ca[idx].points[0] + dx;
                                    cpy = ca[idx].points[1] + dy;
                                    break;
                                }
                            }
                        }
                        points.push(cpx, cpy);
                        c = 'l';
                        // subsequent points are treated as relative lineTo
                        break;
                    case 'M':
                        cpx = p.shift();
                        cpy = p.shift();
                        cmd = 'M';
                        points.push(cpx, cpy);
                        c = 'L';
                        // subsequent points are treated as absolute lineTo
                        break;

                    case 'h':
                        cpx += p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'H':
                        cpx = p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'v':
                        cpy += p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'V':
                        cpy = p.shift();
                        cmd = 'L';
                        points.push(cpx, cpy);
                        break;
                    case 'C':
                        points.push(p.shift(), p.shift(), p.shift(), p.shift());
                        cpx = p.shift();
                        cpy = p.shift();
                        points.push(cpx, cpy);
                        break;
                    case 'c':
                        points.push(cpx + p.shift(), cpy + p.shift(), cpx + p.shift(), cpy + p.shift());
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'C';
                        points.push(cpx, cpy);
                        break;
                    case 'S':
                        ctlPtx = cpx;
                        ctlPty = cpy;
                        prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'C') {
                            ctlPtx = cpx + (cpx - prevCmd.points[2]);
                            ctlPty = cpy + (cpy - prevCmd.points[3]);
                        }
                        points.push(ctlPtx, ctlPty, p.shift(), p.shift());
                        cpx = p.shift();
                        cpy = p.shift();
                        cmd = 'C';
                        points.push(cpx, cpy);
                        break;
                    case 's':
                        ctlPtx = cpx;
                        ctlPty = cpy;
                        prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'C') {
                            ctlPtx = cpx + (cpx - prevCmd.points[2]);
                            ctlPty = cpy + (cpy - prevCmd.points[3]);
                        }
                        points.push(ctlPtx, ctlPty, cpx + p.shift(), cpy + p.shift());
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'C';
                        points.push(cpx, cpy);
                        break;
                    case 'Q':
                        points.push(p.shift(), p.shift());
                        cpx = p.shift();
                        cpy = p.shift();
                        points.push(cpx, cpy);
                        break;
                    case 'q':
                        points.push(cpx + p.shift(), cpy + p.shift());
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'Q';
                        points.push(cpx, cpy);
                        break;
                    case 'T':
                        ctlPtx = cpx;
                        ctlPty = cpy;
                        prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'Q') {
                            ctlPtx = cpx + (cpx - prevCmd.points[0]);
                            ctlPty = cpy + (cpy - prevCmd.points[1]);
                        }
                        cpx = p.shift();
                        cpy = p.shift();
                        cmd = 'Q';
                        points.push(ctlPtx, ctlPty, cpx, cpy);
                        break;
                    case 't':
                        ctlPtx = cpx;
                        ctlPty = cpy;
                        prevCmd = ca[ca.length - 1];
                        if(prevCmd.command === 'Q') {
                            ctlPtx = cpx + (cpx - prevCmd.points[0]);
                            ctlPty = cpy + (cpy - prevCmd.points[1]);
                        }
                        cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'Q';
                        points.push(ctlPtx, ctlPty, cpx, cpy);
                        break;
                    case 'A':
                        rx = p.shift();
                        ry = p.shift();
                        psi = p.shift();
                        fa = p.shift();
                        fs = p.shift();
                        x1 = cpx;
                        y1 = cpy;
                        cpx = p.shift();
                        cpy = p.shift();
                        cmd = 'A';
                        points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
                        break;
                    case 'a':
                        rx = p.shift();
                        ry = p.shift();
                        psi = p.shift();
                        fa = p.shift();
                        fs = p.shift();
                        x1 = cpx;
                        y1 = cpy; cpx += p.shift();
                        cpy += p.shift();
                        cmd = 'A';
                        points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
                        break;
                }

                ca.push({
                    command: cmd || c,
                    points: points,
                    start: {
                        x: startX,
                        y: startY
                    },
                    pathLength: this.calcLength(startX, startY, cmd || c, points)
                });
            }

            if(c === 'z' || c === 'Z') {
                ca.push({
                    command: 'z',
                    points: [],
                    start: undefined,
                    pathLength: 0
                });
            }
        }

        return ca;
    };
    Konva.Path.calcLength = function(x, y, cmd, points) {
        var len, p1, p2, t;
        var path = Konva.Path;

        switch (cmd) {
            case 'L':
                return path.getLineLength(x, y, points[0], points[1]);
            case 'C':
                // Approximates by breaking curve into 100 line segments
                len = 0.0;
                p1 = path.getPointOnCubicBezier(0, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);
                for( t = 0.01; t <= 1; t += 0.01) {
                    p2 = path.getPointOnCubicBezier(t, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);
                    len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                    p1 = p2;
                }
                return len;
            case 'Q':
                // Approximates by breaking curve into 100 line segments
                len = 0.0;
                p1 = path.getPointOnQuadraticBezier(0, x, y, points[0], points[1], points[2], points[3]);
                for( t = 0.01; t <= 1; t += 0.01) {
                    p2 = path.getPointOnQuadraticBezier(t, x, y, points[0], points[1], points[2], points[3]);
                    len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                    p1 = p2;
                }
                return len;
            case 'A':
                // Approximates by breaking curve into line segments
                len = 0.0;
                var start = points[4];
                // 4 = theta
                var dTheta = points[5];
                // 5 = dTheta
                var end = points[4] + dTheta;
                var inc = Math.PI / 180.0;
                // 1 degree resolution
                if(Math.abs(start - end) < inc) {
                    inc = Math.abs(start - end);
                }
                // Note: for purpose of calculating arc length, not going to worry about rotating X-axis by angle psi
                p1 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], start, 0);
                if(dTheta < 0) {// clockwise
                    for( t = start - inc; t > end; t -= inc) {
                        p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
                        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                        p1 = p2;
                    }
                }
                else {// counter-clockwise
                    for( t = start + inc; t < end; t += inc) {
                        p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
                        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
                        p1 = p2;
                    }
                }
                p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], end, 0);
                len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);

                return len;
        }

        return 0;
    };
    Konva.Path.convertEndpointToCenterParameterization = function(x1, y1, x2, y2, fa, fs, rx, ry, psiDeg) {
        // Derived from: http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
        var psi = psiDeg * (Math.PI / 180.0);
        var xp = Math.cos(psi) * (x1 - x2) / 2.0 + Math.sin(psi) * (y1 - y2) / 2.0;
        var yp = -1 * Math.sin(psi) * (x1 - x2) / 2.0 + Math.cos(psi) * (y1 - y2) / 2.0;

        var lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);

        if(lambda > 1) {
            rx *= Math.sqrt(lambda);
            ry *= Math.sqrt(lambda);
        }

        var f = Math.sqrt((((rx * rx) * (ry * ry)) - ((rx * rx) * (yp * yp)) - ((ry * ry) * (xp * xp))) / ((rx * rx) * (yp * yp) + (ry * ry) * (xp * xp)));

        if(fa === fs) {
            f *= -1;
        }
        if(isNaN(f)) {
            f = 0;
        }

        var cxp = f * rx * yp / ry;
        var cyp = f * -ry * xp / rx;

        var cx = (x1 + x2) / 2.0 + Math.cos(psi) * cxp - Math.sin(psi) * cyp;
        var cy = (y1 + y2) / 2.0 + Math.sin(psi) * cxp + Math.cos(psi) * cyp;

        var vMag = function(v) {
            return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        };
        var vRatio = function(u, v) {
            return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
        };
        var vAngle = function(u, v) {
            return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(vRatio(u, v));
        };
        var theta = vAngle([1, 0], [(xp - cxp) / rx, (yp - cyp) / ry]);
        var u = [(xp - cxp) / rx, (yp - cyp) / ry];
        var v = [(-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry];
        var dTheta = vAngle(u, v);

        if(vRatio(u, v) <= -1) {
            dTheta = Math.PI;
        }
        if(vRatio(u, v) >= 1) {
            dTheta = 0;
        }
        if(fs === 0 && dTheta > 0) {
            dTheta = dTheta - 2 * Math.PI;
        }
        if(fs === 1 && dTheta < 0) {
            dTheta = dTheta + 2 * Math.PI;
        }
        return [cx, cy, rx, ry, theta, dTheta, psi, fs];
    };
    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Path, 'data');

    /**
     * set SVG path data string.  This method
     *  also automatically parses the data string
     *  into a data array.  Currently supported SVG data:
     *  M, m, L, l, H, h, V, v, Q, q, T, t, C, c, S, s, A, a, Z, z
     * @name setData
     * @method
     * @memberof Konva.Path.prototype
     * @param {String} SVG path command string
     */

    /**
     * get SVG path data string
     * @name getData
     * @method
     * @memberof Konva.Path.prototype
     */

    Konva.Collection.mapMethods(Konva.Path);
})();

(function() {
    'use strict';
    var EMPTY_STRING = '',
        //CALIBRI = 'Calibri',
        NORMAL = 'normal';

    /**
     * Path constructor.
     * @author Jason Follas
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {String} [config.fontFamily] default is Calibri
     * @param {Number} [config.fontSize] default is 12
     * @param {String} [config.fontStyle] can be normal, bold, or italic.  Default is normal
     * @param {String} [config.fontVariant] can be normal or small-caps.  Default is normal
     * @param {String} config.text
     * @param {String} config.data SVG data string
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var textpath = new Konva.TextPath({
     *   x: 100,
     *   y: 50,
     *   fill: '#333',
     *   fontSize: '24',
     *   fontFamily: 'Arial',
     *   text: 'All the world\'s a stage, and all the men and women merely players.',
     *   data: 'M10,10 C0,0 10,150 100,100 S300,150 400,50'
     * });
     */
    Konva.TextPath = function(config) {
        this.___init(config);
    };

    function _fillFunc(context) {
        context.fillText(this.partialText, 0, 0);
    }
    function _strokeFunc(context) {
        context.strokeText(this.partialText, 0, 0);
    }

    Konva.TextPath.prototype = {
        ___init: function(config) {
            var that = this;
            this.dummyCanvas = Konva.Util.createCanvasElement();
            this.dataArray = [];

            // call super constructor
            Konva.Shape.call(this, config);

            // overrides
            // TODO: shouldn't this be on the prototype?
            this._fillFunc = _fillFunc;
            this._strokeFunc = _strokeFunc;
            this._fillFuncHit = _fillFunc;
            this._strokeFuncHit = _strokeFunc;

            this.className = 'TextPath';

            this.dataArray = Konva.Path.parsePathData(this.attrs.data);
            this.on('dataChange.konva', function() {
                that.dataArray = Konva.Path.parsePathData(this.attrs.data);
            });

            // update text data for certain attr changes
            this.on('textChange.konva textStroke.konva textStrokeWidth.konva', that._setTextData);
            that._setTextData();
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            context.setAttr('font', this._getContextFont());
            context.setAttr('textBaseline', 'middle');
            context.setAttr('textAlign', 'left');
            context.save();

            var glyphInfo = this.glyphInfo;
            for(var i = 0; i < glyphInfo.length; i++) {
                context.save();

                var p0 = glyphInfo[i].p0;

                context.translate(p0.x, p0.y);
                context.rotate(glyphInfo[i].rotation);
                this.partialText = glyphInfo[i].text;

                context.fillStrokeShape(this);
                context.restore();

                //// To assist with debugging visually, uncomment following
                // context.beginPath();
                // if (i % 2)
                // context.strokeStyle = 'cyan';
                // else
                // context.strokeStyle = 'green';
                // var p1 = glyphInfo[i].p1;
                // context.moveTo(p0.x, p0.y);
                // context.lineTo(p1.x, p1.y);
                // context.stroke();
            }
            context.restore();
        },
        /**
         * get text width in pixels
         * @method
         * @memberof Konva.TextPath.prototype
         */
        getTextWidth: function() {
            return this.textWidth;
        },
        /**
         * get text height in pixels
         * @method
         * @memberof Konva.TextPath.prototype
         */
        getTextHeight: function() {
            return this.textHeight;
        },
        /**
         * set text
         * @method
         * @memberof Konva.TextPath.prototype
         * @param {String} text
         */
        setText: function(text) {
            Konva.Text.prototype.setText.call(this, text);
        },
        _getTextSize: function(text) {
            var dummyCanvas = this.dummyCanvas;
            var _context = dummyCanvas.getContext('2d');

            _context.save();

            _context.font = this._getContextFont();
            var metrics = _context.measureText(text);

            _context.restore();

            return {
                width: metrics.width,
                height: parseInt(this.attrs.fontSize, 10)
            };
        },
        _setTextData: function() {

            var that = this;
            var size = this._getTextSize(this.attrs.text);
            this.textWidth = size.width;
            this.textHeight = size.height;

            this.glyphInfo = [];

            var charArr = this.attrs.text.split('');

            var p0, p1, pathCmd;

            var pIndex = -1;
            var currentT = 0;

            var getNextPathSegment = function() {
                currentT = 0;
                var pathData = that.dataArray;

                for(var j = pIndex + 1; j < pathData.length; j++) {
                    if(pathData[j].pathLength > 0) {
                        pIndex = j;

                        return pathData[j];
                    }
                    else if(pathData[j].command === 'M') {
                        p0 = {
                            x: pathData[j].points[0],
                            y: pathData[j].points[1]
                        };
                    }
                }

                return {};
            };
            var findSegmentToFitCharacter = function(c) {

                var glyphWidth = that._getTextSize(c).width;

                var currLen = 0;
                var attempts = 0;

                p1 = undefined;
                while(Math.abs(glyphWidth - currLen) / glyphWidth > 0.01 && attempts < 25) {
                    attempts++;
                    var cumulativePathLength = currLen;
                    while(pathCmd === undefined) {
                        pathCmd = getNextPathSegment();

                        if(pathCmd && cumulativePathLength + pathCmd.pathLength < glyphWidth) {
                            cumulativePathLength += pathCmd.pathLength;
                            pathCmd = undefined;
                        }
                    }

                    if(pathCmd === {} || p0 === undefined) {
                        return undefined;
                    }

                    var needNewSegment = false;

                    switch (pathCmd.command) {
                        case 'L':
                            if(Konva.Path.getLineLength(p0.x, p0.y, pathCmd.points[0], pathCmd.points[1]) > glyphWidth) {
                                p1 = Konva.Path.getPointOnLine(glyphWidth, p0.x, p0.y, pathCmd.points[0], pathCmd.points[1], p0.x, p0.y);
                            }
                            else {
                                pathCmd = undefined;
                            }
                            break;
                        case 'A':

                            var start = pathCmd.points[4];
                            // 4 = theta
                            var dTheta = pathCmd.points[5];
                            // 5 = dTheta
                            var end = pathCmd.points[4] + dTheta;

                            if(currentT === 0){
                                currentT = start + 0.00000001;
                            }
                            // Just in case start is 0
                            else if(glyphWidth > currLen) {
                                currentT += (Math.PI / 180.0) * dTheta / Math.abs(dTheta);
                            }
                            else {
                                currentT -= Math.PI / 360.0 * dTheta / Math.abs(dTheta);
                            }

                            // Credit for bug fix: @therth https://github.com/ericdrowell/KonvaJS/issues/249
                            // Old code failed to render text along arc of this path: "M 50 50 a 150 50 0 0 1 250 50 l 50 0"
                            if(dTheta < 0 && currentT < end || dTheta >= 0 && currentT > end) {
                                currentT = end;
                                needNewSegment = true;
                            }
                            p1 = Konva.Path.getPointOnEllipticalArc(pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], currentT, pathCmd.points[6]);
                            break;
                        case 'C':
                            if(currentT === 0) {
                                if(glyphWidth > pathCmd.pathLength) {
                                    currentT = 0.00000001;
                                }
                                else {
                                    currentT = glyphWidth / pathCmd.pathLength;
                                }
                            }
                            else if(glyphWidth > currLen) {
                                currentT += (glyphWidth - currLen) / pathCmd.pathLength;
                            }
                            else {
                                currentT -= (currLen - glyphWidth) / pathCmd.pathLength;
                            }

                            if(currentT > 1.0) {
                                currentT = 1.0;
                                needNewSegment = true;
                            }
                            p1 = Konva.Path.getPointOnCubicBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], pathCmd.points[4], pathCmd.points[5]);
                            break;
                        case 'Q':
                            if(currentT === 0) {
                                currentT = glyphWidth / pathCmd.pathLength;
                            }
                            else if(glyphWidth > currLen) {
                                currentT += (glyphWidth - currLen) / pathCmd.pathLength;
                            }
                            else {
                                currentT -= (currLen - glyphWidth) / pathCmd.pathLength;
                            }

                            if(currentT > 1.0) {
                                currentT = 1.0;
                                needNewSegment = true;
                            }
                            p1 = Konva.Path.getPointOnQuadraticBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3]);
                            break;

                    }

                    if(p1 !== undefined) {
                        currLen = Konva.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);
                    }

                    if(needNewSegment) {
                        needNewSegment = false;
                        pathCmd = undefined;
                    }
                }
            };
            for(var i = 0; i < charArr.length; i++) {

                // Find p1 such that line segment between p0 and p1 is approx. width of glyph
                findSegmentToFitCharacter(charArr[i]);

                if(p0 === undefined || p1 === undefined) {
                    break;
                }

                var width = Konva.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);

                // Note: Since glyphs are rendered one at a time, any kerning pair data built into the font will not be used.
                // Can foresee having a rough pair table built in that the developer can override as needed.

                var kern = 0;
                // placeholder for future implementation

                var midpoint = Konva.Path.getPointOnLine(kern + width / 2.0, p0.x, p0.y, p1.x, p1.y);

                var rotation = Math.atan2((p1.y - p0.y), (p1.x - p0.x));
                this.glyphInfo.push({
                    transposeX: midpoint.x,
                    transposeY: midpoint.y,
                    text: charArr[i],
                    rotation: rotation,
                    p0: p0,
                    p1: p1
                });
                p0 = p1;
            }
        },
        getSelfRect: function() {
            var points = [];
            var fontSize = this.fontSize();

            this.glyphInfo.forEach(function(info) {
                points.push(info.p0.x);
                points.push(info.p0.y);
                points.push(info.p1.x);
                points.push(info.p1.y);
            });
            var minX = points[0];
            var maxX = points[0];
            var minY = points[0];
            var maxY = points[0];
            var x, y;
            for (var i = 0; i < points.length / 2; i++) {
                x = points[i * 2]; y = points[i * 2 + 1];
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
            return {
                x: Math.round(minX) - fontSize,
                y: Math.round(minY) - fontSize,
                width: Math.round(maxX - minX) + fontSize * 2,
                height: Math.round(maxY - minY) + fontSize * 2
            };
        }
    };

    // map TextPath methods to Text
    Konva.TextPath.prototype._getContextFont = Konva.Text.prototype._getContextFont;

    Konva.Util.extend(Konva.TextPath, Konva.Shape);

    // add setters and getters
    Konva.Factory.addGetterSetter(Konva.TextPath, 'fontFamily', 'Arial');

    /**
     * set font family
     * @name setFontFamily
     * @method
     * @memberof Konva.TextPath.prototype
     * @param {String} fontFamily
     */

     /**
     * get font family
     * @name getFontFamily
     * @method
     * @memberof Konva.TextPath.prototype
     */

    Konva.Factory.addGetterSetter(Konva.TextPath, 'fontSize', 12);

    /**
     * set font size
     * @name setFontSize
     * @method
     * @memberof Konva.TextPath.prototype
     * @param {int} fontSize
     */

     /**
     * get font size
     * @name getFontSize
     * @method
     * @memberof Konva.TextPath.prototype
     */

    Konva.Factory.addGetterSetter(Konva.TextPath, 'fontStyle', NORMAL);

    /**
     * set font style.  Can be 'normal', 'italic', or 'bold'.  'normal' is the default.
     * @name setFontStyle
     * @method
     * @memberof Konva.TextPath.prototype
     * @param {String} fontStyle
     */

     /**
     * get font style
     * @name getFontStyle
     * @method
     * @memberof Konva.TextPath.prototype
     */

    Konva.Factory.addGetterSetter(Konva.TextPath, 'fontVariant', NORMAL);

    /**
     * set font variant.  Can be 'normal' or 'small-caps'.  'normal' is the default.
     * @name setFontVariant
     * @method
     * @memberof Konva.TextPath.prototype
     * @param {String} fontVariant
     */

    /**
     * @get font variant
     * @name getFontVariant
     * @method
     * @memberof Konva.TextPath.prototype
     */

    Konva.Factory.addGetter(Konva.TextPath, 'text', EMPTY_STRING);

    /**
     * get text
     * @name getText
     * @method
     * @memberof Konva.TextPath.prototype
     */

    Konva.Collection.mapMethods(Konva.TextPath);
})();

(function() {
    'use strict';
    /**
     * RegularPolygon constructor.&nbsp; Examples include triangles, squares, pentagons, hexagons, etc.
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Number} config.sides
     * @param {Number} config.radius
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var hexagon = new Konva.RegularPolygon({
     *   x: 100,
     *   y: 200,
     *   sides: 6,
     *   radius: 70,
     *   fill: 'red',
     *   stroke: 'black',
     *   strokeWidth: 4
     * });
     */
    Konva.RegularPolygon = function(config) {
        this.___init(config);
    };

    Konva.RegularPolygon.prototype = {
        _centroid: true,
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'RegularPolygon';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            var sides = this.attrs.sides,
                radius = this.attrs.radius,
                n, x, y;

            context.beginPath();
            context.moveTo(0, 0 - radius);

            for(n = 1; n < sides; n++) {
                x = radius * Math.sin(n * 2 * Math.PI / sides);
                y = -1 * radius * Math.cos(n * 2 * Math.PI / sides);
                context.lineTo(x, y);
            }
            context.closePath();
            context.fillStrokeShape(this);
        },
        getWidth: function() {
            return this.getRadius() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight: function() {
            return this.getRadius() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            if (this.radius() !== width / 2) {
                this.setRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            if (this.radius() !== height / 2) {
                this.setRadius(height / 2);
            }
        }
    };
    Konva.Util.extend(Konva.RegularPolygon, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.RegularPolygon, 'radius', 0);

    /**
     * set radius
     * @name setRadius
     * @method
     * @memberof Konva.RegularPolygon.prototype
     * @param {Number} radius
     */

     /**
     * get radius
     * @name getRadius
     * @method
     * @memberof Konva.RegularPolygon.prototype
     */

    Konva.Factory.addGetterSetter(Konva.RegularPolygon, 'sides', 0);

    /**
     * set number of sides
     * @name setSides
     * @method
     * @memberof Konva.RegularPolygon.prototype
     * @param {int} sides
     */

    /**
     * get number of sides
     * @name getSides
     * @method
     * @memberof Konva.RegularPolygon.prototype
     */

    Konva.Collection.mapMethods(Konva.RegularPolygon);
})();

(function() {
    'use strict';
    /**
     * Star constructor
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Integer} config.numPoints
     * @param {Number} config.innerRadius
     * @param {Number} config.outerRadius
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var star = new Konva.Star({
     *   x: 100,
     *   y: 200,
     *   numPoints: 5,
     *   innerRadius: 70,
     *   outerRadius: 70,
     *   fill: 'red',
     *   stroke: 'black',
     *   strokeWidth: 4
     * });
     */
    Konva.Star = function(config) {
        this.___init(config);
    };

    Konva.Star.prototype = {
        _centroid: true,
        ___init: function(config) {
            // call super constructor
            Konva.Shape.call(this, config);
            this.className = 'Star';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            var innerRadius = this.innerRadius(),
                outerRadius = this.outerRadius(),
                numPoints = this.numPoints();

            context.beginPath();
            context.moveTo(0, 0 - outerRadius);

            for(var n = 1; n < numPoints * 2; n++) {
                var radius = n % 2 === 0 ? outerRadius : innerRadius;
                var x = radius * Math.sin(n * Math.PI / numPoints);
                var y = -1 * radius * Math.cos(n * Math.PI / numPoints);
                context.lineTo(x, y);
            }
            context.closePath();

            context.fillStrokeShape(this);
        },
        // implements Shape.prototype.getWidth()
        getWidth: function() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.getHeight()
        getHeight: function() {
            return this.getOuterRadius() * 2;
        },
        // implements Shape.prototype.setWidth()
        setWidth: function(width) {
            Konva.Node.prototype.setWidth.call(this, width);
            if (this.outerRadius() !== width / 2) {
                this.setOuterRadius(width / 2);
            }
        },
        // implements Shape.prototype.setHeight()
        setHeight: function(height) {
            Konva.Node.prototype.setHeight.call(this, height);
            if (this.outerRadius() !== height / 2) {
                this.setOuterRadius(height / 2);
            }
        }
    };
    Konva.Util.extend(Konva.Star, Konva.Shape);

    // add getters setters
    Konva.Factory.addGetterSetter(Konva.Star, 'numPoints', 5);

    /**
     * set number of points
     * @name setNumPoints
     * @method
     * @memberof Konva.Star.prototype
     * @param {Integer} points
     */

     /**
     * get number of points
     * @name getNumPoints
     * @method
     * @memberof Konva.Star.prototype
     */

    Konva.Factory.addGetterSetter(Konva.Star, 'innerRadius', 0);

    /**
     * set inner radius
     * @name setInnerRadius
     * @method
     * @memberof Konva.Star.prototype
     * @param {Number} radius
     */

     /**
     * get inner radius
     * @name getInnerRadius
     * @method
     * @memberof Konva.Star.prototype
     */

    Konva.Factory.addGetterSetter(Konva.Star, 'outerRadius', 0);

    /**
     * set outer radius
     * @name setOuterRadius
     * @method
     * @memberof Konva.Star.prototype
     * @param {Number} radius
     */

     /**
     * get outer radius
     * @name getOuterRadius
     * @method
     * @memberof Konva.Star.prototype
     */

    Konva.Collection.mapMethods(Konva.Star);
})();

(function() {
    'use strict';
    // constants
    var ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'padding', 'lineHeight', 'text'],
        CHANGE_KONVA = 'Change.konva',
        NONE = 'none',
        UP = 'up',
        RIGHT = 'right',
        DOWN = 'down',
        LEFT = 'left',
        LABEL = 'Label',

     // cached variables
     attrChangeListLen = ATTR_CHANGE_LIST.length;

    /**
     * Label constructor.&nbsp; Labels are groups that contain a Text and Tag shape
     * @constructor
     * @memberof Konva
     * @param {Object} config
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * // create label
     * var label = new Konva.Label({
     *   x: 100,
     *   y: 100,
     *   draggable: true
     * });
     *
     * // add a tag to the label
     * label.add(new Konva.Tag({
     *   fill: '#bbb',
     *   stroke: '#333',
     *   shadowColor: 'black',
     *   shadowBlur: 10,
     *   shadowOffset: [10, 10],
     *   shadowOpacity: 0.2,
     *   lineJoin: 'round',
     *   pointerDirection: 'up',
     *   pointerWidth: 20,
     *   pointerHeight: 20,
     *   cornerRadius: 5
     * }));
     *
     * // add text to the label
     * label.add(new Konva.Text({
     *   text: 'Hello World!',
     *   fontSize: 50,
     *   lineHeight: 1.2,
     *   padding: 10,
     *   fill: 'green'
     *  }));
     */
    Konva.Label = function(config) {
        this.____init(config);
    };

    Konva.Label.prototype = {
        ____init: function(config) {
            var that = this;

            Konva.Group.call(this, config);
            this.className = LABEL;

            this.on('add.konva', function(evt) {
                that._addListeners(evt.child);
                that._sync();
            });
        },
        /**
         * get Text shape for the label.  You need to access the Text shape in order to update
         * the text properties
         * @name getText
         * @method
         * @memberof Konva.Label.prototype
         */
        getText: function() {
            return this.find('Text')[0];
        },
        /**
         * get Tag shape for the label.  You need to access the Tag shape in order to update
         * the pointer properties and the corner radius
         * @name getTag
         * @method
         * @memberof Konva.Label.prototype
         */
        getTag: function() {
            return this.find('Tag')[0];
        },
        _addListeners: function(text) {
            var that = this,
                n;
            var func = function(){
                    that._sync();
                };

            // update text data for certain attr changes
            for(n = 0; n < attrChangeListLen; n++) {
                text.on(ATTR_CHANGE_LIST[n] + CHANGE_KONVA, func);
            }
        },
        getWidth: function() {
            return this.getText().getWidth();
        },
        getHeight: function() {
            return this.getText().getHeight();
        },
        _sync: function() {
            var text = this.getText(),
                tag = this.getTag(),
                width, height, pointerDirection, pointerWidth, x, y, pointerHeight;

            if (text && tag) {
                width = text.getWidth();
                height = text.getHeight();
                pointerDirection = tag.getPointerDirection();
                pointerWidth = tag.getPointerWidth();
                pointerHeight = tag.getPointerHeight();
                x = 0;
                y = 0;

                switch(pointerDirection) {
                    case UP:
                        x = width / 2;
                        y = -1 * pointerHeight;
                        break;
                    case RIGHT:
                        x = width + pointerWidth;
                        y = height / 2;
                        break;
                    case DOWN:
                        x = width / 2;
                        y = height + pointerHeight;
                        break;
                    case LEFT:
                        x = -1 * pointerWidth;
                        y = height / 2;
                        break;
                }

                tag.setAttrs({
                    x: -1 * x,
                    y: -1 * y,
                    width: width,
                    height: height
                });

                text.setAttrs({
                    x: -1 * x,
                    y: -1 * y
                });
            }
        }
    };

    Konva.Util.extend(Konva.Label, Konva.Group);

    Konva.Collection.mapMethods(Konva.Label);

    /**
     * Tag constructor.&nbsp; A Tag can be configured
     *  to have a pointer element that points up, right, down, or left
     * @constructor
     * @memberof Konva
     * @param {Object} config
     * @param {String} [config.pointerDirection] can be up, right, down, left, or none; the default
     *  is none.  When a pointer is present, the positioning of the label is relative to the tip of the pointer.
     * @param {Number} [config.pointerWidth]
     * @param {Number} [config.pointerHeight]
     * @param {Number} [config.cornerRadius]
     */
    Konva.Tag = function(config) {
        this.___init(config);
    };

    Konva.Tag.prototype = {
        ___init: function(config) {
            Konva.Shape.call(this, config);
            this.className = 'Tag';
            this.sceneFunc(this._sceneFunc);
        },
        _sceneFunc: function(context) {
            var width = this.getWidth(),
                height = this.getHeight(),
                pointerDirection = this.getPointerDirection(),
                pointerWidth = this.getPointerWidth(),
                pointerHeight = this.getPointerHeight(),
                cornerRadius = Math.min(this.getCornerRadius(), width / 2, height / 2);

            context.beginPath();
            if (!cornerRadius) {
                context.moveTo(0, 0);
            } else {
                context.moveTo(cornerRadius, 0);
            }

            if (pointerDirection === UP) {
                context.lineTo((width - pointerWidth) / 2, 0);
                context.lineTo(width / 2, -1 * pointerHeight);
                context.lineTo((width + pointerWidth) / 2, 0);
            }

            if(!cornerRadius) {
                context.lineTo(width, 0);
            } else {
                context.lineTo(width - cornerRadius, 0);
                context.arc(width - cornerRadius, cornerRadius, cornerRadius, Math.PI * 3 / 2, 0, false);
            }

            if (pointerDirection === RIGHT) {
                context.lineTo(width, (height - pointerHeight) / 2);
                context.lineTo(width + pointerWidth, height / 2);
                context.lineTo(width, (height + pointerHeight) / 2);
            }

            if(!cornerRadius) {
                context.lineTo(width, height);
            } else {
                context.lineTo(width, height - cornerRadius);
                context.arc(width - cornerRadius, height - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
            }

            if (pointerDirection === DOWN) {
                context.lineTo((width + pointerWidth) / 2, height);
                context.lineTo(width / 2, height + pointerHeight);
                context.lineTo((width - pointerWidth) / 2, height);
            }

            if(!cornerRadius) {
                context.lineTo(0, height);
            } else {
                context.lineTo(cornerRadius, height);
                context.arc(cornerRadius, height - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
            }

            if (pointerDirection === LEFT) {
                context.lineTo(0, (height + pointerHeight) / 2);
                context.lineTo(-1 * pointerWidth, height / 2);
                context.lineTo(0, (height - pointerHeight) / 2);
            }

            if(cornerRadius) {
                context.lineTo(0, cornerRadius);
                context.arc(cornerRadius, cornerRadius, cornerRadius, Math.PI, Math.PI * 3 / 2, false);
            }

            context.closePath();
            context.fillStrokeShape(this);
        },
        getSelfRect: function() {
            var x = 0,
                y = 0,
                pointerWidth = this.getPointerWidth(),
                pointerHeight = this.getPointerHeight(),
                direction = this.pointerDirection(),
                width = this.getWidth(),
                height = this.getHeight();

            if (direction === UP) {
                y -= pointerHeight;
                height += pointerHeight;
            } else if (direction === DOWN) {
                height += pointerHeight;
            } else if (direction === LEFT) {
                // ARGH!!! I have no idea why should I used magic 1.5!!!!!!!!!
                x -= pointerWidth * 1.5;
                width += pointerWidth;
            } else if (direction === RIGHT) {
                width += pointerWidth * 1.5;
            }
            return {
                x: x,
                y: y,
                width: width,
                height: height
            };
        }
    };

    Konva.Util.extend(Konva.Tag, Konva.Shape);
    Konva.Factory.addGetterSetter(Konva.Tag, 'pointerDirection', NONE);

    /**
     * set pointer Direction
     * @name setPointerDirection
     * @method
     * @memberof Konva.Tag.prototype
     * @param {String} pointerDirection can be up, right, down, left, or none.  The
     *  default is none
     */

     /**
     * get pointer Direction
     * @name getPointerDirection
     * @method
     * @memberof Konva.Tag.prototype
     */

    Konva.Factory.addGetterSetter(Konva.Tag, 'pointerWidth', 0);

    /**
     * set pointer width
     * @name setPointerWidth
     * @method
     * @memberof Konva.Tag.prototype
     * @param {Number} pointerWidth
     */

     /**
     * get pointer width
     * @name getPointerWidth
     * @method
     * @memberof Konva.Tag.prototype
     */

    Konva.Factory.addGetterSetter(Konva.Tag, 'pointerHeight', 0);

    /**
     * set pointer height
     * @name setPointerHeight
     * @method
     * @memberof Konva.Tag.prototype
     * @param {Number} pointerHeight
     */

     /**
     * get pointer height
     * @name getPointerHeight
     * @method
     * @memberof Konva.Tag.prototype
     */

    Konva.Factory.addGetterSetter(Konva.Tag, 'cornerRadius', 0);

    /**
     * set corner radius
     * @name setCornerRadius
     * @method
     * @memberof Konva.Tag.prototype
     * @param {Number} corner radius
     */

    /**
     * get corner radius
     * @name getCornerRadius
     * @method
     * @memberof Konva.Tag.prototype
     */

    Konva.Collection.mapMethods(Konva.Tag);
})();

(function() {
    'use strict';
    /**
     * Arrow constructor
     * @constructor
     * @memberof Konva
     * @augments Konva.Shape
     * @param {Object} config
     * @param {Array} config.points
     * @param {Number} [config.tension] Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
     *   The default is 0
     * @param {Number} config.pointerLength
     * @param {Number} config.pointerWidth
     * @param {String} [config.fill] fill color
     * @param {Image} [config.fillPatternImage] fill pattern image
     * @param {Number} [config.fillPatternX]
     * @param {Number} [config.fillPatternY]
     * @param {Object} [config.fillPatternOffset] object with x and y component
     * @param {Number} [config.fillPatternOffsetX] 
     * @param {Number} [config.fillPatternOffsetY] 
     * @param {Object} [config.fillPatternScale] object with x and y component
     * @param {Number} [config.fillPatternScaleX]
     * @param {Number} [config.fillPatternScaleY]
     * @param {Number} [config.fillPatternRotation]
     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientStartPointX]
     * @param {Number} [config.fillLinearGradientStartPointY]
     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
     * @param {Number} [config.fillLinearGradientEndPointX]
     * @param {Number} [config.fillLinearGradientEndPointY]
     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientStartPointX]
     * @param {Number} [config.fillRadialGradientStartPointY]
     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
     * @param {Number} [config.fillRadialGradientEndPointX] 
     * @param {Number} [config.fillRadialGradientEndPointY] 
     * @param {Number} [config.fillRadialGradientStartRadius]
     * @param {Number} [config.fillRadialGradientEndRadius]
     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
     * @param {String} [config.stroke] stroke color
     * @param {Number} [config.strokeWidth] stroke width
     * @param {Boolean} [config.strokeHitEnabled] flag which enables or disables stroke hit region.  The default is true
     * @param {Boolean} [config.perfectDrawEnabled] flag which enables or disables using buffer canvas.  The default is true
     * @param {Boolean} [config.shadowForStrokeEnabled] flag which enables or disables shasow for stroke.  The default is true
     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
     *  is miter
     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
     *  is butt
     * @param {String} [config.shadowColor]
     * @param {Number} [config.shadowBlur]
     * @param {Object} [config.shadowOffset] object with x and y component
     * @param {Number} [config.shadowOffsetX]
     * @param {Number} [config.shadowOffsetY]
     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
     *  between 0 and 1
     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
     * @param {Array} [config.dash]
     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
     * @param {Number} [config.x]
     * @param {Number} [config.y]
     * @param {Number} [config.width]
     * @param {Number} [config.height]
     * @param {Boolean} [config.visible]
     * @param {Boolean} [config.listening] whether or not the node is listening for events
     * @param {String} [config.id] unique id
     * @param {String} [config.name] non-unique name
     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
     * @param {Object} [config.scale] set scale
     * @param {Number} [config.scaleX] set scale x
     * @param {Number} [config.scaleY] set scale y
     * @param {Number} [config.rotation] rotation in degrees
     * @param {Object} [config.offset] offset from center point and rotation point
     * @param {Number} [config.offsetX] set offset x
     * @param {Number} [config.offsetY] set offset y
     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
     *  the entire stage by dragging any portion of the stage
     * @param {Number} [config.dragDistance]
     * @param {Function} [config.dragBoundFunc]
     * @example
     * var line = new Konva.Line({
     *   points: [73, 70, 340, 23, 450, 60, 500, 20],
     *   stroke: 'red',
     *   tension: 1,
     *   pointerLength : 10,
     *   pointerWidth : 12
     * });
     */
    Konva.Arrow = function(config) {
        this.____init(config);
    };

    Konva.Arrow.prototype = {
        ____init: function(config) {
            // call super constructor
            Konva.Line.call(this, config);
            this.className = 'Arrow';
        },
        _sceneFunc: function(ctx) {
            Konva.Line.prototype._sceneFunc.apply(this, arguments);
            var PI2 = Math.PI * 2;
            var points = this.points();
            var n = points.length;
            var dx = points[n - 2] - points[n - 4];
            var dy = points[n - 1] - points[n - 3];
            var radians = (Math.atan2(dy, dx) + PI2) % PI2;
            var length = this.pointerLength();
            var width = this.pointerWidth();

            ctx.save();
            ctx.beginPath();
            ctx.translate(points[n - 2], points[n - 1]);
            ctx.rotate(radians);
            ctx.moveTo(0, 0);
            ctx.lineTo(-length, width / 2);
            ctx.lineTo(-length, -width / 2);
            ctx.closePath();
            ctx.restore();

            if (this.pointerAtBeginning()) {
                ctx.save();
                ctx.translate(points[0], points[1]);
                dx = points[2] - points[0];
                dy = points[3] - points[1];
                ctx.rotate((Math.atan2(-dy, -dx) + PI2) % PI2);
                ctx.moveTo(0, 0);
                ctx.lineTo(-length, width / 2);
                ctx.lineTo(-length, -width / 2);
                ctx.closePath();
                ctx.restore();
            }
            ctx.fillStrokeShape(this);
        }
    };

    Konva.Util.extend(Konva.Arrow, Konva.Line);
    /**
     * get/set pointerLength
     * @name pointerLength
     * @method
     * @memberof Konva.Arrow.prototype
     * @param {Number} Length of pointer of arrow.
     *   The default is 10.
     * @returns {Number}
     * @example
     * // get tension
     * var pointerLength = line.pointerLength();
     *
     * // set tension
     * line.pointerLength(15);
     */

    Konva.Factory.addGetterSetter(Konva.Arrow, 'pointerLength', 10);
    /**
     * get/set pointerWidth
     * @name pointerWidth
     * @method
     * @memberof Konva.Arrow.prototype
     * @param {Number} Width of pointer of arrow.
     *   The default is 10.
     * @returns {Number}
     * @example
     * // get tension
     * var pointerWidth = line.pointerWidth();
     *
     * // set tension
     * line.pointerWidth(15);
     */

    Konva.Factory.addGetterSetter(Konva.Arrow, 'pointerWidth', 10);
    /**
     * get/set pointerAtBeginning
     * @name pointerAtBeginning
     * @method
     * @memberof Konva.Arrow.prototype
     * @param {Number} Should pointer displayed at beginning of arrow.
     *   The default is false.
     * @returns {Boolean}
     * @example
     * // get tension
     * var pointerAtBeginning = line.pointerAtBeginning();
     *
     * // set tension
     * line.pointerAtBeginning(true);
     */

    Konva.Factory.addGetterSetter(Konva.Arrow, 'pointerAtBeginning', false);
    Konva.Collection.mapMethods(Konva.Arrow);

})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"canvas":36,"jsdom":36}],31:[function(require,module,exports){
'use strict'

var numberIsFinite = require('is-finite')
var isInteger = require('is-integer')

module.exports = function toPrecision (value, places) {
  if (!numberIsFinite(value)) {
    throw new Error('Value must be a finite number')
  }
  if (!isInteger(places) || places < 0) {
    throw new Error('Precision must be a non-negative integer')
  }
  return parseFloat(value.toFixed(places))
}

},{"is-finite":32,"is-integer":34}],32:[function(require,module,exports){
'use strict';
var numberIsNan = require('number-is-nan');

module.exports = Number.isFinite || function (val) {
	return !(typeof val !== 'number' || numberIsNan(val) || val === Infinity || val === -Infinity);
};

},{"number-is-nan":33}],33:[function(require,module,exports){
'use strict';
module.exports = Number.isNaN || function (x) {
	return x !== x;
};

},{}],34:[function(require,module,exports){
// https://github.com/paulmillr/es6-shim
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isinteger
var isFinite = require("is-finite");
module.exports = Number.isInteger || function(val) {
  return typeof val === "number" &&
    isFinite(val) &&
    Math.floor(val) === val;
};

},{"is-finite":32}],35:[function(require,module,exports){
var Katex = require('katex');
var Konva = require('konva');

var debounce = require('debounce');
var bezier2 = require('./bezier2');
var linearTween = require('./linear-tween');
var roundPrecision = require('round-precision');

var recycleBin = document.createElement('div');

function createHiddenElement(templateId) {
  recycleBin.innerHTML = document.getElementById(templateId).textContent;
  var tableNode = recycleBin.children[0];
  recycleBin.innerHTML = '';
  tableNode.style.display = 'none';

  return tableNode;
}

module.exports = function(callback) {

  // Override pixelRatio
  Konva.pixelRatio = window.devicePixelRatio;

  var App = function(containerId, sketchpadId, tableviewId, sliderviewId, width, height) {
    this._containerId = containerId;
    this._sliderviewId = sliderviewId;
    this._sketchpadId = sketchpadId;
    this._tableviewId = tableviewId;

    this.height = height;
    this.width = width;

    this._pipes = [];

    this._stage = new Konva.Stage({
      container: containerId,
      height: height,
      width: width,
    });

    this._freeAnimationLayers = [];
    this._usedAnimationLayers = [];
    this._pipeLayer = new Konva.Layer();

    this._stage.add(this._pipeLayer);

    this._registerHandlers();
  };

  App.prototype.getSketchpadHeight = function() {
    return this._sketchpadHeight;
  };

  App.prototype.getStageHeight = function() {
    return this._stageHeight;
  };

  App.prototype._registerHandlers = function() {
    var container = this._stage.getContainer();
    container.addEventListener('touchmove', function(event) {
      event.preventDefault();
    });
  };

  App.prototype.addPipe = function(pipe) {
    this._pipes.push(pipe);
    this._pipeLayer.add(pipe.getGroup());
    this._pipeLayer.draw();
  };

  App.prototype.createPipeAt = function(x, y) {
    if (!this._pipeLayer.getIntersection({x: x, y: y})) {

      var formulaNode = document.createElement('div');
      formulaNode.className = 'formula';

      var sketchpad = document.getElementById(this._sketchpadId);
      sketchpad.appendChild(formulaNode);

      var sliderNode = createHiddenElement('slider-tmpl');
      var sliderview = document.getElementById('sliderview');
      sliderview.appendChild(sliderNode);

      var tableNode = createHiddenElement('table-tmpl');
      var tableview = document.getElementById(this._tableviewId);
      tableview.appendChild(tableNode);

      var pipe = new QuadraticPipe(
        this,
        this._pipeLayer,
        formulaNode,
        sliderNode,
        tableNode,
        x,
        y,
        x + 50,
        y + 50,
        x + 100,
        y + 100
      );

      this.addPipe(pipe);
    }
  };

  App.prototype.draw = function() {
    this._stage.draw();
  };

  App.prototype.getPipeCount = function() {
    return this._pipes.length;
  };

  App.prototype.setCursor = function(cursor) {
    this._oldCursor = document.body.style.cursor || 'default';
    document.body.style.cursor = cursor;
  };

  App.prototype.resize = debounce(function(width, height) {
    this.height = height;
    this.width = width;

    this._stage.setSize({
      height: height,
      width: width
    });

    this._stage.draw();
  }, 300);

  App.prototype.revertCursor = function() {
    if (this._oldCursor) {
      document.body.style.cursor = this._oldCursor;
    }
  };

  App.prototype.requestAnimationLayer = function(callback) {
    var animLayer = this._freeAnimationLayers.length
      ? this._freeAnimationLayers.shift()
      : new Konva.Layer();
    
    this._stage.add(animLayer);

    function destroy() { 
      animLayer.removeChildren();
      animLayer.draw();
      this._freeAnimationLayers.push(animLayer);
    }

    callback(animLayer, destroy.bind(this));
  };

  var QuadraticPipe = function(app, layer, formulaNode, sliderNode, tableNode, x0, y0, x1, y1, x2, y2) {
    this._app = app;
    this._formulaNode = formulaNode;
    this._layer = layer;
    this._sliderNode = sliderNode;
    this._tableNode = tableNode;

    this._controlPoint = {x: x1, y: y1};
    this._endPoint = {x: x2, y: y2};
    this._startPoint = {x: x0, y: y0};

    var xMax = Math.max(x0, x1, x2);
    var xMin = Math.min(x0, x1, x2);
    var yMax = Math.max(y0, y1, y2);
    var yMin = Math.min(y0, y1, y2);

    var height = Math.abs(yMin - yMax);
    var width = Math.abs(xMin - xMax);

    this._curve = new Konva.Shape({
      sceneFunc: function(ctx) {
        var controlPoint = this.attrs.controlPoint;
        var endPoint = this.attrs.endPoint; 
        var startPoint = this.attrs.startPoint;

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
        ctx.strokeShape(this);
      },
      stroke: '#222',
      startPoint: {x: x0, y: y0},
      controlPoint: {x: x1, y: y1},
      endPoint: {x: x2, y: y2}
    });

    this._boundingBox = new Konva.Rect({
      height: height,
      width: width,
      x: xMin,
      y: yMin,
      dash: [1, 2],
      stroke: '#ccc',
      strokeWidth: 1,      
    });
    
    this._controlAnchor = new Konva.Circle({
      draggable: true,
      fill: 'pink',
      radius: 5,
      stroke: 'red',
      strokeWidth: 1,
      x: x1,
      y: y1
    });

    this._endAnchor = new Konva.Circle({
      draggable: true,
      fill: 'lightblue',
      radius: 5,
      stroke: 'blue',
      strokeWidth: 1,
      x: x2,
      y: y2
    });

    this._startAnchor = new Konva.Circle({
      draggable: true,    
      fill: 'lightgreen',
      radius: 5,
      stroke: 'green',
      strokeWidth: 1,
      x: x0,
      y: y0
    });

    this._animButtonGroup = new Konva.Group()
      .setX(xMax + 10)
      .setY(yMin);

    this._animButton = new Konva.Rect({
      fill: 'green',
      height: 24,
      width: 24,
      x: 0, 
      y: 0
    });

    this._animTriangle = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      text: '\u25B6',
      x: 4,
      y: 5
    });

    this._animButtonGroup
      .add(this._animButton)
      .add(this._animTriangle);

    this._group = new Konva.Group({draggable: true});

    this._group.add(this._curve);
    this._group.add(this._boundingBox);
    this._group.add(this._controlAnchor);
    this._group.add(this._endAnchor);
    this._group.add(this._startAnchor);
    this._group.add(this._animButtonGroup);  

    this._boundingBox.on('mouseenter', function(event) {
      this._app.setCursor('move');        
    }.bind(this));

    this._group.on('mouseout', function(event) {
      this._app.revertCursor();
    }.bind(this));

    this._animButtonGroup.on('click', this.animate.bind(this));

    var pointMouseEnterHandler = function(event) {
      event.target.setStrokeWidth(2).setRadius(7);
      this._app.setCursor('default');
      this._app.draw();
    }.bind(this);

    var pointMouseOutHandler = function(event) {
      event.target.setStrokeWidth(1).setRadius(5);
      this._app.draw();
    }.bind(this);

    this._controlAnchor.on('mouseenter', pointMouseEnterHandler);
    this._endAnchor.on('mouseenter', pointMouseEnterHandler);
    this._startAnchor.on('mouseenter', pointMouseEnterHandler); 

    this._controlAnchor.on('mouseout', pointMouseOutHandler);
    this._endAnchor.on('mouseout', pointMouseOutHandler);
    this._startAnchor.on('mouseout', pointMouseOutHandler);

    this._controlAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setControlPoint({x: x, y: y});
      this.updateBoundingBox();
      this.updateCurve();
      this.updateFormulaNode();
      this.updateSliderNode();

      this._app.draw();
    }.bind(this));

    this._endAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setEndPoint({x: x, y: y});
      this.updateBoundingBox();
      this.updateCurve();
      this.updateFormulaNode();
      this.updateSliderNode();

      this._app.draw();
    }.bind(this));

    this._startAnchor.on('dragmove', function(event) {
      var x = event.target.x();
      var y = event.target.y();

      this.setStartPoint({x: x, y: y});
      this.updateBoundingBox();
      this.updateCurve();
      this.updateFormulaNode();
      this.updateSliderNode();

      this._app.draw();
    }.bind(this));

    this._group.on('dragmove', this.updateFormulaNode.bind(this));
    this._group.on('dragmove', this.updateSliderNode.bind(this));
  };

  QuadraticPipe.prototype.animate = function() {
    this._group.hide();
    this._app.draw();

    var x = this._group.x();
    var y = this._group.y();

    this._app.requestAnimationLayer(function(layer, destroy) {
      var anim = new QuadraticPipeAnimation(
        layer,
        this._formulaNode,
        this._sliderNode,
        this._tableNode,
        {x: x + this._controlPoint.x, y: y + this._controlPoint.y},
        {x: x + this._startPoint.x, y: y + this._startPoint.y},
        {x: x + this._endPoint.x, y: y + this._endPoint.y},
        function() {
          destroy();
          this._formulaNode.style.display = 'block';
          this._sliderNode.style.display = 'none';
          this._tableNode.style.display = 'none';
          this.updateFormulaNode();
          this._group.show();
          this._app.draw();
        }.bind(this)
      );

      anim.play();
    }.bind(this));
  };

  QuadraticPipe.prototype.getAbsolutePosition = function() {
    var controlPosition = this._controlAnchor.getAbsolutePosition();
    var endPosition = this._endAnchor.getAbsolutePosition();
    var startPosition = this._startAnchor.getAbsolutePosition();

    return {
      x: Math.min(controlPosition.x, endPosition.x, startPosition.x),
      y: Math.max(controlPosition.y, endPosition.y, startPosition.y)
    };
  };

  QuadraticPipe.prototype.getGroup = function() {
    return this._group;
  };
  
  QuadraticPipe.prototype.getControlPoint = function() {
    return this._controlPoint;
  };

  QuadraticPipe.prototype.getEndPoint = function() {
    return this._endPoint;
  };

  QuadraticPipe.prototype.getStartPoint = function() {
    return this._startPoint;
  };

  QuadraticPipe.prototype.hide = function() {
    this._group.hide();
  };

  QuadraticPipe.prototype.setControlPoint = function(point) {
    this._controlPoint = point;
  }

  QuadraticPipe.prototype.setEndPoint = function(point) {
    this._endPoint = point;
  };

  QuadraticPipe.prototype.setStartPoint = function(point) {
    this._startPoint = point;
  };

  QuadraticPipe.prototype.show = function() {
    this._group.show();
  };

  QuadraticPipe.prototype.updateBoundingBox = function() {
    var xMax = Math.max(this._controlPoint.x, this._endPoint.x, this._startPoint.x);
    var xMin = Math.min(this._controlPoint.x, this._endPoint.x, this._startPoint.x);
    var yMax = Math.max(this._controlPoint.y, this._endPoint.y, this._startPoint.y);
    var yMin = Math.min(this._controlPoint.y, this._endPoint.y, this._startPoint.y);

    var height = Math.abs(yMin - yMax);
    var width = Math.abs(xMin - xMax);

    this._boundingBox
      .setHeight(height)
      .setWidth(width)
      .setX(xMin)
      .setY(yMin);

    this._animButtonGroup
      .setX(xMax + 10)
      .setY(yMin);
  };

  QuadraticPipe.prototype.updateCurve = function() {
    this._curve.setAttrs({
      controlPoint: this._controlPoint,
      endPoint: this._endPoint,
      startPoint: this._startPoint
    });
  };

  QuadraticPipe.prototype.updateFormulaNode = debounce(function() {
    var position = this.getAbsolutePosition();
    var x = this._group.x();
    var y = this._group.y();    

    this._formulaNode.style.left = position.x + 'px';
    this._formulaNode.style.top = position.y + 40 + 'px';

    var b = bezier2(
      {x: x + this._controlPoint.x, y: y + this._controlPoint.y},
      {x: x + this._startPoint.x, y: y + this._startPoint.y},
      {x: x + this._endPoint.x, y: y + this._endPoint.y}
    );
    
    Katex.render(
      '\\begin{cases}' +
      b.x.toTex() + '\\\\' +
      b.y.toTex() +
      '\\end{cases}',
      this._formulaNode
    );
  }, 10);

  QuadraticPipe.prototype.updateSliderNode = debounce(function() {
    var position = this.getAbsolutePosition();

    this._sliderNode.style.left = position.x + 'px';
    this._sliderNode.style.top = position.y + 10 + 'px';
  }, 10);

  QuadraticPipeAnimation = function(
    layer,
    formulaNode,
    sliderNode,
    tableNode,
    controlPoint,
    startPoint,
    endPoint,
    destroy
  ) {
    var xMax = Math.max(controlPoint.x, endPoint.x, startPoint.x);
    var xMin = Math.min(controlPoint.x, endPoint.x, startPoint.x);
    var yMax = Math.max(controlPoint.y, endPoint.y, startPoint.y);
    var yMin = Math.min(controlPoint.y, endPoint.y, startPoint.y);

    this._bezier = bezier2(controlPoint, startPoint, endPoint);
    this._controlPoint = controlPoint;
    this._destroy = destroy;
    this._endPoint = endPoint;
    this._formulaNode = formulaNode;
    this._i = 0;
    this._layer = layer;
    this._mode = 'formula';
    this._progress = 0;
    this._startPoint = startPoint;
    this._slider = sliderNode.querySelector('input');
    this._sliderNode = sliderNode;
    this._sliderTValueNode = sliderNode.querySelector('.t-value');
    this._state = 'play';
    this._tableNode = tableNode;
    this._tableBody = tableNode.querySelector('tbody');

    sliderNode.style.display = '';
    this._sliderTValueNode.textContent = 't = 0.0';

    tableNode.style.left = xMax + 60 + 'px';
    tableNode.style.top = yMin + 'px';

    this._controlAnchor = new Konva.Circle({
      fill: 'pink',
      radius: 5,
      stroke: 'red',
      strokeWidth: 1,
      x: controlPoint.x,
      y: controlPoint.y
    });

    this._endAnchor = new Konva.Circle({
      fill: 'lightblue',
      radius: 5,
      stroke: 'blue',
      strokeWidth: 1,
      x: endPoint.x,
      y: endPoint.y
    });

    this._startAnchor = new Konva.Circle({
      fill: 'lightgreen',
      radius: 5,
      stroke: 'green',
      strokeWidth: 1,
      x: startPoint.x,
      y: startPoint.y
    });

    this._controlPointText = new Konva.Text({
      fill: 'red',
      text: '(' + controlPoint.x + ', ' + controlPoint.y + ')',
      x: controlPoint.x + 10,
      y: controlPoint.y - 5
    });

    this._endPointText = new Konva.Text({
      fill: 'blue',
      text: '(' + endPoint.x + ', ' + endPoint.y + ')',
      x: endPoint.x + 10,
      y: endPoint.y - 5
    });

    this._startPointText = new Konva.Text({
      fill: 'green',
      text: '(' + startPoint.x + ', ' + startPoint.y + ')',
      x: startPoint.x + 10,
      y: startPoint.y - 5
    });

    this._curve = new Konva.Shape({
      sceneFunc: function(ctx) {
        var controlPoint = this.attrs.controlPoint;
        var endPoint = this.attrs.endPoint; 
        var startPoint = this.attrs.startPoint;

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
        ctx.strokeShape(this);
      },
      stroke: 'red',
      strokeWidth: 3,
      startPoint: {x: startPoint.x, y: startPoint.y},
      controlPoint: {x: startPoint.x, y: startPoint.y},
      endPoint: {x: startPoint.x, y: startPoint.y}
    });

    this._lineA = new Konva.Line({
      points: [
        this._startPoint.x, this._startPoint.y,
        this._controlPoint.x, this._controlPoint.y
      ],
      stroke: '#222',
      strokeWidth: 1,
    });

    this._lineB = new Konva.Line({
      points: [
        this._controlPoint.x, this._controlPoint.y,
        this._endPoint.x, this._endPoint.y
      ],
      stroke: '#222',
      strokeWidth: 1,
    });

    this._animPointA = {x: startPoint.x, y: startPoint.y};
    this._animPointB = {x: controlPoint.x, y: controlPoint.y};

    this._tweenAB = linearTween(startPoint.x, startPoint.y, controlPoint.x, controlPoint.y);
    this._tweenBC = linearTween(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);

    this._animAnchorA = new Konva.Circle({
      fill: 'green',
      radius: 3,
      strokeWidth: 0,
      x: startPoint.x,
      y: startPoint.y
    });

    this._animAnchorB = new Konva.Circle({
      fill: 'green',
      radius: 3,
      strokeWidth: 0,
      x: controlPoint.x,
      y: controlPoint.y
    }); 

    this._animAnchorC = new Konva.Circle({
      fill: 'red',
      radius: 5,
      strokeWidth: 0,
      x: startPoint.x,
      y: startPoint.y
    });

    this._animLine = new Konva.Line({
      points: [
        this._animPointA.x, this._animPointA.y,
        this._animPointB.x, this._animPointB.y
      ],
      stroke: 'green',
      strokeWidth: 1,
    });

    this._pausePlayButtonGroup = new Konva.Group({
      x: xMax + 10,
      y: yMin,
    });

    this._pausePlayButton = new Konva.Rect({
      height: 24,
      width: 24,
    });

    this._pausePlayButtonText = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      x: 5,
      y: 4
    });

    this._pausePlayButtonGroup
      .add(this._pausePlayButton)
      .add(this._pausePlayButtonText);
    
    this._modeButtonGroup = new Konva.Group()
      .setX(xMax + 10)
      .setY(yMin + 28);

    this._modeButton = new Konva.Rect({
      fill: 'blue',
      height: 24,
      width: 24,
      x: 0, 
      y: 0
    });    

    this._modeSymbol = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      text: '\u25a4',
      x: 4,
      y: 4
    });

    this._modeButtonGroup
      .add(this._modeButton)
      .add(this._modeSymbol);

    this._backButtonGroup = new Konva.Group({
      x: xMax + 10,
      y: yMin + 56
    });

    this._backButton = new Konva.Rect({
      fill: '#777',
      height: 24,
      width: 24
    });

    this._backButtonText = new Konva.Text({
      fill: '#FFF',
      fontSize: 18,
      rotation: 180,
      text: '\u27A5',
      x: 20,
      y: 21
    });

    this._backButtonGroup
      .add(this._backButton)
      .add(this._backButtonText);

    this._layer.add(this._lineA);
    this._layer.add(this._lineB);
    this._layer.add(this._curve);
    this._layer.add(this._animLine);
    this._layer.add(this._animAnchorA);
    this._layer.add(this._animAnchorB);
    this._layer.add(this._animAnchorC);
    this._layer.add(this._controlAnchor);
    this._layer.add(this._endAnchor);
    this._layer.add(this._startAnchor);
    this._layer.add(this._pausePlayButtonGroup);
    this._layer.add(this._modeButtonGroup);
    this._layer.add(this._backButtonGroup);
    this._layer.add(this._controlPointText);
    this._layer.add(this._endPointText);
    this._layer.add(this._startPointText);

    this._backButtonGroup.on('click', this.destroy.bind(this));
    this._modeButtonGroup.on('click', function() {
      if (this._mode === 'formula') {
        this.tableMode();
      } else {
        this.formulaMode();
      }
    }.bind(this));

    this._slider.addEventListener('click', this.handleSliderClick.bind(this));
    this._slider.addEventListener('mousedown', this.handleSliderMouseDown.bind(this));
    this._slider.addEventListener('mouseup', this.handleSliderMouseUp.bind(this));

    this._anim = new Konva.Animation(
      this._tick.bind(this),
      layer
    ); 
  };

  QuadraticPipeAnimation.prototype._tick = function(frame) {
    var rate = this._mode === 'table' ? 0.002 : 0.005;
    var progress = this._progress = (this._progress + rate) % 1;

    this.draw(progress);
  };

  QuadraticPipeAnimation.prototype.destroy = function() {
    this._anim.stop();
    this._destroy();
  };

  QuadraticPipeAnimation.prototype.draw = function(progress) {
    var roundProgress = roundPrecision(progress, 2);
    this._slider.value = roundProgress;
    this._sliderTValueNode.textContent = 't = ' + roundProgress;

    var ab = this._tweenAB(progress);
    var bc = this._tweenBC(progress);

    var penTween = linearTween(ab.x, ab.y, bc.x, bc.y);
    var pen = penTween(progress);

    this._animAnchorA.setX(ab.x).setY(ab.y);
    this._animAnchorB.setX(bc.x).setY(bc.y);
    this._animAnchorC.setX(pen.x).setY(pen.y);
    this._animLine.setPoints([ab.x, ab.y, bc.x, bc.y]);
    this._curve.setAttrs({
      endPoint: {x: pen.x, y: pen.y},
      controlPoint: {x: ab.x, y: ab.y}
    });

    if (this._mode === 'table') {
      this._i = roundPrecision(progress / 0.05, 0);
      var curr = this._i;
      var prev = curr - 1;
      if (prev < 0) {
        prev = this._tableRows.length - 1;
      }

      this._tableRows[curr].style.color = 'red';
      this._tableRows[prev].style.color = '';
    }

    Katex.render(
      '\\begin{cases}' +
      this._bezier.x.toTex(progress) + '\\\\' +
      this._bezier.y.toTex(progress) +
      '\\end{cases}',
      this._formulaNode
    );
  };

  QuadraticPipeAnimation.prototype.formulaMode = function() {
    this._mode = 'formula';
    this._formulaNode.style.display = 'block';
    this._tableNode.style.display = 'none';
  };

  QuadraticPipeAnimation.prototype.handleSliderChange = function(event) {
    if (this._state === 'play') {
      this.stop();
    }

    var progress = parseFloat(event.target.value);
    this._progress = progress;
    this._sliderTValueNode.textContent = 't = ' + roundPrecision(progress, 2);

    this.draw(progress);
    this._layer.draw();
  };

  QuadraticPipeAnimation.prototype.handleSliderClick = function(event) {
    if (this._state === 'play') {
      this.stop();
    }
  };

  QuadraticPipeAnimation.prototype.handleSliderMouseDown = function(event) {
    this._mouseMoveHandler = this.handleSliderChange.bind(this);
    this._slider.addEventListener('mousemove', this._mouseMoveHandler);
  };

  QuadraticPipeAnimation.prototype.handleSliderMouseUp = function(event) {
    this._mouseMoveHandler(event);
    this._slider.removeEventListener('mousemove', this._mouseMoveHandler);
  };

  QuadraticPipeAnimation.prototype.tableMode = function() {
    this._mode = 'table';
    this._formulaNode.style.display = 'none';
    this._tableNode.style.display = 'block';

    var fragment = document.createDocumentFragment();
    for (var i = 0.0; i < 1.05; i += 0.05) {
      var ab = this._tweenAB(i);
      var bc = this._tweenBC(i);
      
      var penTween = linearTween(ab.x, ab.y, bc.x, bc.y);
      var pen = penTween(i);

      var row = document.createElement('tr');
      var t = document.createElement('td');
      var x = document.createElement('td');
      var y = document.createElement('td');

      t.textContent = roundPrecision(i, 2);
      x.textContent = roundPrecision(pen.x, 0);
      y.textContent = roundPrecision(pen.y, 0);

      row.appendChild(t);
      row.appendChild(x);
      row.appendChild(y);

      fragment.appendChild(row);
    }

    this._tableBody.innerHTML = '';
    this._tableBody.appendChild(fragment);
    this._tableRows = this._tableBody.querySelectorAll('tr');
  };

  QuadraticPipeAnimation.prototype.play = function() {
    this._state = 'play';
    this._pausePlayButton.setFill('red');
    this._pausePlayButtonGroup.off('click');
    this._pausePlayButtonGroup.on('click', this.stop.bind(this));
    this._pausePlayButtonText.setText('\u23F8');

    this._pausePlayButtonGroup.draw();
    this._anim.start();
  };

  QuadraticPipeAnimation.prototype.stop = function() {
    this._state = 'stop';
    this._pausePlayButton.setFill('green');
    this._pausePlayButtonGroup.off('click');
    this._pausePlayButtonGroup.on('click', this.play.bind(this));
    this._pausePlayButtonText.setText('\u25B6');

  this._pausePlayButtonGroup.draw();
    this._anim.stop();
  };

  callback({
    App: App,
  });
};

},{"./bezier2":2,"./linear-tween":3,"debounce":4,"katex":7,"konva":30,"round-precision":31}],36:[function(require,module,exports){

},{}]},{},[1]);
