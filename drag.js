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

var drag = {
    isDragging: false,
    init: function(elm, handler){
        this.draggable = (typeof elm == 'string')?
            document.getElementById(elm):
            elm;
        this.handler = (typeof handler == 'undefined')?
            elm:
            (typeof handler == 'string')?
                document.getElementById(handler):
                handler;

        // attach the event callbacks
        this.evtObserve('mousemove', this.watchMouse);
        this.evtObserve('mousedown', this.initDrag, this.handler);
        this.evtObserve('mouseup', this.endDrag);

        // prevent text selection on the handler
        // moz
        this.handler.onmousedown = function(){return false;}
        // ie
        this.handler.onselectstart = function(){return false;}

        // viewport stuff
        // from jibbering FAQ <http://www.jibbering.com/faq/#getWindowSize>
        var docEl = document.documentElement;
        this.IS_BODY_ACTING_ROOT = docEl && docEl.clientHeight === 0;
        this.IS_DOCUMENT_ELEMENT_HEIGHT_OFF = this.isDocumentElementHeightOff();
        // setupping the dimensions function
        // because it is unreliable before body load
        this.getWinDimensions = this.getWinDimensions();
    },
    isDocumentElementHeightOff: function(){
        var d = document,
            div = d.createElement('div');
        div.style.height = "2500px";
        d.body.insertBefore(div, d.body.firstChild);
        var r = d.documentElement.clientHeight > 2400;
        d.body.removeChild(div);
        return r;
    },
    getWinDimensions: function(){
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
    },
    getOffsets: function(){
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
    },
    _drag: function(){
        drag.newLeft = parseInt(drag.draggable.style.left, 10) -
            (drag.lastMouseCoords[0] - drag.mouseCoords[0]);
        drag.newTop = parseInt(drag.draggable.style.top, 10) -
            (drag.lastMouseCoords[1] - drag.mouseCoords[1]);

        if(drag.newLeft < 0)
            drag.draggable.style.left = 0 + 'px';
        else
            drag.draggable.style.left = drag.newLeft + 'px';

        if(drag.newTop < 0)
            drag.draggable.style.top = 0 + 'px';
        else
            drag.draggable.style.top = drag.newTop + 'px';

        drag.lastMouseCoords = drag.mouseCoords;

        if(drag.isDragging){
            setTimeout(drag._drag, 10);
        }
    },
    initDrag: function(){
        drag.isDragging = true;
        drag.lastMouseCoords = [
            drag.mouseCoords[0],
            drag.mouseCoords[1]
        ];
        if(!drag.draggable.style.left || !drag.draggable.style.top){
            var offsets = drag.getOffsets();
            drag.draggable.style.left = offsets[0] + 'px';
            drag.draggable.style.top = offsets[1] + 'px';
        }
        drag.windowDimensions = drag.getWinDimensions();
        drag._drag();
    },
    endDrag: function(){
        drag.isDragging = false;
    },
    watchMouse: function(e){
        e = e || window.event;

        drag.mouseCoords = [
            e.pageX ||
            e.clientX +
                document.body.scrollLeft +
                document.documentElement.scrollLeft,
            e.pageY ||
            e.clientY +
                document.body.scrollTop +
                document.documentElement.scrollTop
        ];
    },
    evtObserve: (function(){
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
};