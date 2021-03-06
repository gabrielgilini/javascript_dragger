// Copyright (c) 2008 Gabriel Gilini
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// - A simple reference on the code and it's cool :)
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

function Drag(elm, options){
    this.options = options || {};
    this.timerID = null;

    this.draggable = (typeof elm == 'string')?
        document.getElementById(elm):
        elm;
    this.handler = (typeof this.options.handler == 'undefined')?
        this.draggable:
        (typeof this.options.handler == 'string')?
            document.getElementById(this.options.handler):
            this.options.handler;

    if(this.options.resize){
        this.resizeHandler = this.options.resize.handler || null;
    }

    this.evtObserve = (function(){
        if(document.addEventListener){
            return function(evt, callbackFn, elm){
                elm = (typeof elm == 'undefined')?document:elm;
                elm.addEventListener(evt, callbackFn, false);
            };
        }else if(document.attachEvent){
            return function(evt, callbackFn, elm){
                elm = (typeof elm == 'undefined')?document:elm;
                elm.attachEvent('on'+evt, callbackFn);
            };
        }else{
            return function(evt, callbackFn, elm){
                elm = (typeof elm == 'undefined')?document:elm;
                if(elm['on'+evt]){
                    elm['on'+evt] = callbackFn;
                }
            };
        }
    })();
    // prevent text selection on the handler
    this.handler.onmousedown = function(){return false;};
    this.handler.onselectstart = function(){return false;};
    if(this.resizeHandler){
        this.resizeHandler.onmousedown = function(){return false;};
        this.resizeHandler.onselectstart = function(){return false;};
    }

    // viewport stuff
    // from jibbering FAQ <http://www.jibbering.com/faq/#getWindowSize>
    var docEl = document.documentElement;
    this.IS_BODY_ACTING_ROOT = docEl && docEl.clientHeight === 0;
    this.IS_DOCUMENT_ELEMENT_HEIGHT_OFF = (function(){
        var d = document,
            div = d.createElement('div');
        div.style.height = "2500px";
        d.body.insertBefore(div, d.body.firstChild);
        var r = d.documentElement.clientHeight > 2400;
        d.body.removeChild(div);
        return r;
    })();

    // setupping the dimensions function
    // because it is unreliable before body load
//     this.getWinDimensions = (function(){
//         if(typeof document.clientWidth == "number") {
//             return function(){
//                 return [document.clientWidth, document.clientHeight];
//             }
//         }
//         else if(this.IS_BODY_ACTING_ROOT || this.IS_DOCUMENT_ELEMENT_HEIGHT_OFF) {
//             return function(){
//                 return [document.body.clientWidth, document.body.clientHeight];
//             }
//         } else {
//             return function(){
//                 return [document.documentElement.clientWidth, document.documentElement.clientHeight];
//             }
//         }
//     })();

    this.getOffsets = function(){
        var offLeft = 0,
            offTop = 0;
        var elm = this.draggable;
        if(elm.offsetParent){
            do{
                offLeft += elm.offsetLeft;
                offTop += elm.offsetTop;
            }while(!!(elm = elm.offsetParent));
        }
        return [offLeft, offTop];
    }
    this.evtObserve = (function(){
        if(document.addEventListener){
            return function(evt, callbackFn, elm){
                elm = elm || document;
                elm.addEventListener(evt, callbackFn, false);
            }
        }else if(document.attachEvent){
            return function(evt, callbackFn, elm){
                elm = elm || document;
                elm.attachEvent('on'+evt, callbackFn);
            }
        }else{
            return function(evt, callbackFn, elm){
                elm = elm || document;
                elm['on'+evt] = callbackFn;
            }
        }
    })();

    // Adapted from http://onemarco.com/2008/11/12/callbacks-and-binding-and-callback-arguments-and-references/
    this.callback = function(fn, opts){
        opts = opts || {};
        var cb = function(){
            var args = opts.args ? opts.args : [];
            var bind = opts.bind ? opts.bind : this;
            var fargs = opts.supressArgs === true ?
                [] : Array.prototype.slice.call(arguments);
                  // This converts the arguments array-like
                  // object to an actual array

            fn.apply(bind,fargs.concat(args));
        }
        return cb;
    }

    // Start of the actual dragging code
    this.initDrag = this.callback(function(){
        this.lastMouseCoords = [
            this.mouseCoords[0],
            this.mouseCoords[1]
        ];
        if(!this.draggable.style.left || !this.draggable.style.top){
            var offsets = this.getOffsets();
            this.draggable.style.left = offsets[0] + 'px';
            this.draggable.style.top = offsets[1] + 'px';
        }
        //this.windowDimensions = this.getWinDimensions();
        this.draggable.style.zIndex = this.handler.style.zIndex = '1000';
        this.timerID = window.setInterval(this._drag, 30);
    }, {bind: this});

    this._drag = this.callback(function(){
        this.newLeft = parseInt(this.draggable.style.left, 10) -
            (this.lastMouseCoords[0] - this.mouseCoords[0]);
        this.newTop = parseInt(this.draggable.style.top, 10) -
            (this.lastMouseCoords[1] - this.mouseCoords[1]);

        if(this.newLeft < 0)
            this.draggable.style.left = 0 + 'px';
        else
            this.draggable.style.left = this.newLeft + 'px';

        if(this.newTop < 0)
            this.draggable.style.top = 0 + 'px';
        else
            this.draggable.style.top = this.newTop + 'px';

        this.lastMouseCoords = this.mouseCoords;
    }, {bind: this});

    this.endDrag = this.callback(function(){
        window.clearInterval(this.timerID);
        this.draggable.style.zIndex = this.handler.style.zIndex = '';
    }, {bind: this});

    this.watchMouse = this.callback(function(e){
        e = e || window.event;

        this.mouseCoords = [
            e.pageX ||
            e.clientX +
                document.body.scrollLeft +
                document.documentElement.scrollLeft,
            e.pageY ||
            e.clientY +
                document.body.scrollTop +
                document.documentElement.scrollTop
        ];
    }, {bind: this});

    // prevent text selection on the handler
    // ie
    this.handler.onselectstart = function(){return false;}
    // others
    this.handler.onmousedown = function(){return false;}

    // attach the event callbacks
    this.evtObserve('mousemove', this.watchMouse);
    this.evtObserve('mousedown', this.initDrag, this.handler);
    this.evtObserve('mouseup', this.endDrag);
}