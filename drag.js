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

function Drag(elm, handler){
    this.isDragging = false;
    this.draggable = (typeof elm == 'string')?
        document.getElementById(elm):
        elm;
    this.handler = (typeof handler == 'undefined')?
        this.draggable:
        (typeof handler == 'string')?
            document.getElementById(handler):
            handler;
    // attach the event callbacks

    this.evtObserve = (function(){
        if(document.addEventListener){
            return function(evt, callbackFn, elm){
                elm = (typeof elm == 'undefined')?document:elm;
                elm.addEventListener(evt, callbackFn, false);
            }
        }else if(document.attachEvent){
            return function(evt, callbackFn, elm){
                elm = (typeof elm == 'undefined')?document:elm;
                elm.attachEvent('on'+evt, callbackFn);
            }
        }else{
            return function(evt, callbackFn, elm){
                elm = (typeof elm == 'undefined')?document:elm;
                if(elm['on'+evt]){
                    elm['on'+evt] = callbackFn;
                }
            }
        }
    })()
    // prevent text selection on the handler
    // moz
    this.handler.onmousedown = function(){return false;}
    // ie
    this.handler.onselectstart = function(){return false;}

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
    this.getWinDimensions = (function(){
        if(typeof document.clientWidth == "number") {
            return function(){
                return [document.clientWidth, document.clientHeight];
            }
        }
        else if(this.IS_BODY_ACTING_ROOT || this.IS_DOCUMENT_ELEMENT_HEIGHT_OFF) {
            return function(){
                return [document.body.clientWidth, document.body.clientHeight];
            }
        } else {
            return function(){
                return [document.documentElement.clientWidth, document.documentElement.clientHeight];
            }
        }
    })();

    this.getOffsets = function(){
        var offLeft =
            offTop = 0;
        var elm = this.draggable;
        if(elm.offsetParent){
            do{
                offLeft += elm.offsetLeft;
                offTop += elm.offsetTop;
            }while(elm = elm.offsetParent)
        }
        return [offLeft, offTop];
    }

    this._drag = function(){
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

        if(this.isDragging){
            setTimeout(callback(this._drag, {bind: this}), 10);
        }
    }

    this.initDrag = function(){
        this.isDragging = true;
        this.lastMouseCoords = [
            this.mouseCoords[0],
            this.mouseCoords[1]
        ];
        if(!this.draggable.style.left || !this.draggable.style.top){
            var offsets = this.getOffsets();
            this.draggable.style.left = offsets[0] + 'px';
            this.draggable.style.top = offsets[1] + 'px';
        }
        this.windowDimensions = this.getWinDimensions();
        this.draggable.style.zIndex = this.handler.style.zIndex = '1000';
        this._drag();
    }

    this.endDrag = function(){
        this.isDragging = false;
        this.draggable.style.zIndex = this.handler.style.zIndex = '';
    }

    this.watchMouse = function(e){
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
    }

    this.evtObserve('mousemove', callback(this.watchMouse, {bind: this}));
    this.evtObserve('mousedown', callback(this.initDrag, {bind: this}), this.handler);
    this.evtObserve('mouseup', callback(this.endDrag, {bind: this}));
}

// Adapted from http://onemarco.com/2008/11/12/callbacks-and-binding-and-callback-arguments-and-references/
function callback(func,opts){
    opts = opts || {};
    var cb = function(){
        var args = opts.args ? opts.args : [];
        var bind = opts.bind ? opts.bind : this;
        var fargs = opts.supressArgs === true ?
            [] : toArray(arguments);

        func.apply(bind,fargs.concat(args));
    }
    return cb;
}

function toArray(arrayLike){
    var arr = [];
    for(var i = 0; i < arrayLike.length; i++){
        arr.push(arrayLike[i]);
    }
    return arr;
}