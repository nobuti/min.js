(function(){

  'use strict';

  var querySelectorAllPolyfill = function() {
    if (!document.querySelectorAll) {
      document.querySelectorAll = function(selectors) {
        var style = document.createElement('style'), elements = [], element;
        document.documentElement.firstChild.appendChild(style);
        document._qsa = [];

        style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
        window.scrollBy(0, 0);
        style.parentNode.removeChild(style);

        while (document._qsa.length) {
          element = document._qsa.shift();
          element.style.removeAttribute('x-qsa');
          elements.push(element);
        }
        document._qsa = null;
        return elements;
      };
    }
  }

  var eventListenerPolyfill = function() {
    if (!Event.prototype.preventDefault) {
      Event.prototype.preventDefault=function() {
        this.returnValue=false;
      };
    }
    if (!Event.prototype.stopPropagation) {
      Event.prototype.stopPropagation=function() {
        this.cancelBubble=true;
      };
    }
    if (!Element.prototype.addEventListener) {
      var eventListeners=[];
      
      var addEventListener=function(type,listener /*, useCapture (will be ignored) */) {
        var self=this;
        var wrapper=function(e) {
          e.target=e.srcElement;
          e.currentTarget=self;
          if (listener.handleEvent) {
            listener.handleEvent(e);
          } else {
            listener.call(self,e);
          }
        };
        if (type=="DOMContentLoaded") {
          var wrapper2=function(e) {
            if (document.readyState=="complete") {
              wrapper(e);
            }
          };
          document.attachEvent("onreadystatechange",wrapper2);
          eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper2});
          
          if (document.readyState=="complete") {
            var e=new Event();
            e.srcElement=window;
            wrapper2(e);
          }
        } else {
          this.attachEvent("on"+type,wrapper);
          eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper});
        }
      };
      var removeEventListener=function(type,listener /*, useCapture (will be ignored) */) {
        var counter=0;
        while (counter<eventListeners.length) {
          var eventListener=eventListeners[counter];
          if (eventListener.object==this && eventListener.type==type && eventListener.listener==listener) {
            if (type=="DOMContentLoaded") {
              this.detachEvent("onreadystatechange",eventListener.wrapper);
            } else {
              this.detachEvent("on"+type,eventListener.wrapper);
            }
            eventListeners.splice(counter, 1);
            break;
          }
          ++counter;
        }
      };
      
      Element.prototype.addEventListener=addEventListener;
      Element.prototype.removeEventListener=removeEventListener;

      if (HTMLDocument) {
        HTMLDocument.prototype.addEventListener=addEventListener;
        HTMLDocument.prototype.removeEventListener=removeEventListener;
      }

      if (Window) {
        Window.prototype.addEventListener=addEventListener;
        Window.prototype.removeEventListener=removeEventListener;
      }
    }
  };

  var getComputedStylePolyfill = function() {
    if (!('getComputedStyle' in window)){
      window.getComputedStyle = (function () {
        function getPixelSize(element, style, property, fontSize) {
          var
          sizeWithSuffix = style[property],
          size = parseFloat(sizeWithSuffix),
          suffix = sizeWithSuffix.split(/\d/)[0],
          rootSize;

          fontSize = fontSize != null ? fontSize : /%|em/.test(suffix) && element.parentElement ? getPixelSize(element.parentElement, element.parentElement.currentStyle, 'fontSize', null) : 16;
          rootSize = property == 'fontSize' ? fontSize : /width/i.test(property) ? element.clientWidth : element.clientHeight;

          return (suffix == 'em') ? size * fontSize : (suffix == 'in') ? size * 96 : (suffix == 'pt') ? size * 96 / 72 : (suffix == '%') ? size / 100 * rootSize : size;
        }

        function setShortStyleProperty(style, property) {
          var
          borderSuffix = property == 'border' ? 'Width' : '',
          t = property + 'Top' + borderSuffix,
          r = property + 'Right' + borderSuffix,
          b = property + 'Bottom' + borderSuffix,
          l = property + 'Left' + borderSuffix;

          style[property] = (style[t] == style[r] == style[b] == style[l] ? [style[t]]
          : style[t] == style[b] && style[l] == style[r] ? [style[t], style[r]]
          : style[l] == style[r] ? [style[t], style[r], style[b]]
          : [style[t], style[r], style[b], style[l]]).join(' ');
        }

        function CSSStyleDeclaration(element) {
          var
          currentStyle = element.currentStyle,
          style = this,
          fontSize = getPixelSize(element, currentStyle, 'fontSize', null);

          for (property in currentStyle) {
            if (/width|height|margin.|padding.|border.+W/.test(property) && style[property] !== 'auto') {
              style[property] = getPixelSize(element, currentStyle, property, fontSize) + 'px';
            } else if (property === 'styleFloat') {
              style['float'] = currentStyle[property];
            } else {
              style[property] = currentStyle[property];
            }
          }

          setShortStyleProperty(style, 'margin');
          setShortStyleProperty(style, 'padding');
          setShortStyleProperty(style, 'border');

          style.fontSize = fontSize + 'px';

          return style;
        }

        CSSStyleDeclaration.prototype = {
          constructor: CSSStyleDeclaration,
          getPropertyPriority: function () {},
          getPropertyValue: function ( prop ) {
            return this[prop] || '';
          },
          item: function () {},
          removeProperty: function () {},
          setProperty: function () {},
          getPropertyCSSValue: function () {}
        };

        function getComputedStyle(element) {
          return new CSSStyleDeclaration(element);
        }

        return getComputedStyle;
      })();
    }
  }

  var objectKeysPolyfill = function() {
    if (!Object.keys) {
      Object.keys = (function() {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
            dontEnums = [
              'toString',
              'toLocaleString',
              'valueOf',
              'hasOwnProperty',
              'isPrototypeOf',
              'propertyIsEnumerable',
              'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function(obj) {
          if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
            throw new TypeError('Object.keys called on non-object');
          }

          var result = [], prop, i;

          for (prop in obj) {
            if (hasOwnProperty.call(obj, prop)) {
              result.push(prop);
            }
          }

          if (hasDontEnumBug) {
            for (i = 0; i < dontEnumsLength; i++) {
              if (hasOwnProperty.call(obj, dontEnums[i])) {
                result.push(dontEnums[i]);
              }
            }
          }
          return result;
        };
      }());
    }
  }

  querySelectorAllPolyfill();
  eventListenerPolyfill();
  getComputedStylePolyfill();
  objectKeysPolyfill();
}());