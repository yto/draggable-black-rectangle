// content.js
(() => {
    if (window.draggableBlackRectangleInit) return;
    window.draggableBlackRectangleInit = true;

    //
    // 1. Inject CSS via <style> with MutationObserver fallback
    //
    const style = document.createElement('style');
    style.textContent = `
.rect {
  position: fixed;
  background-color: #000;
  user-select: none;
  cursor: move;
  z-index: 10000;
}
.rect .handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #fff;
  right: 0;
  bottom: 0;
  cursor: se-resize;
}
.rect .controls {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
}
.rect .controls button {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background-color: #fff;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}
`;
    if (document.head) {
        document.head.appendChild(style);
    } else {
        const obs = new MutationObserver((mutations, observer) => {
            if (document.head) {
                document.head.appendChild(style);
                observer.disconnect();
            }
        });
        obs.observe(document.documentElement, { childList: true });
    }

    //
    // 2. State messaging helpers
    //
    function sendState(id, state) {
        chrome.runtime.sendMessage({ type: 'saveState', id, state });
    }

    //
    // 3. Create rectangle element
    //
    function makeRect(id, { left, top, width, height }) {
        // ID 重複ガード：既に同じ data-rect-id を持つ要素があれば何もしない
        if (document.querySelector(`.rect[data-rect-id="${id}"]`)) return;

        const rect = document.createElement('div');
        rect.className = 'rect';
        rect.dataset.rectId = id;
        rect.style.left = left;
        rect.style.top = top;
        rect.style.width = width;
        rect.style.height = height;

        // controls
        const controls = document.createElement('div');
        controls.className = 'controls';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Copy';
        copyBtn.textContent = '📄';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '✖';
        controls.appendChild(copyBtn);
        controls.appendChild(deleteBtn);
        rect.appendChild(controls);

        // resize handle
        const handle = document.createElement('div');
        handle.className = 'handle';
        rect.appendChild(handle);

        document.body.appendChild(rect);
        return rect;
    }

    //
    // 4. Inject a new rectangle
    //
    function injectRectangle() {
        const id = 'rect_' + Date.now();
        const state = { left: '50px', top: '50px', width: '200px', height: '150px' };
        makeRect(id, state);
        sendState(id, state);
    }

    //
    // 5. Restore persisted rectangles
    //
    function restoreRects() {
        chrome.runtime.sendMessage({ type: 'getTabStates' }, response => {
            const states = response.states || {};
            Object.entries(states).forEach(([id, st]) => {
                makeRect(id, st);
            });
        });
    }

    //
    // 6. Call restoreRects as early as possible
    //
    // Try immediately...
    restoreRects();
    // ...and again when <body> appears if needed
    if (!document.body) {
        const obsBody = new MutationObserver((mutations, observer) => {
            if (document.body) {
                restoreRects();
                observer.disconnect();
            }
        });
        obsBody.observe(document.documentElement, { childList: true });
    }

    //
    // 7. Listen for background messages
    //
    chrome.runtime.onMessage.addListener(msg => {
        if (msg.action === 'addRect') {
            injectRectangle();
        } else if (msg.type === 'reloadRects') {
            restoreRects();
        }
    });

    //
    // 8. Mouse event handlers for drag, resize, copy, delete
    //
    let isDragging = false, isResizing = false, currentRect = null;
    let startX, startY, startLeft, startTop, startWidth, startHeight;

    document.addEventListener('mousedown', e => {
        // delete
        if (e.target.matches('.delete-btn')) {
            const r = e.target.closest('.rect');
            if (r) {
                sendState(r.dataset.rectId, null);
                r.remove();
            }
            return;
        }
        // copy
        if (e.target.matches('.copy-btn')) {
            const r = e.target.closest('.rect');
            if (r) {
                const st = window.getComputedStyle(r);
                const newState = {
                    left:  (parseFloat(st.left) + 10) + 'px',
                    top:   (parseFloat(st.top)  + 10) + 'px',
                    width: st.width,
                    height: st.height
                };
                const id2 = 'rect_' + Date.now();
                makeRect(id2, newState);
                sendState(id2, newState);
            }
            return;
        }
        // resize
        if (e.target.matches('.handle')) {
            isResizing = true;
            currentRect = e.target.closest('.rect');
            startX = e.clientX; startY = e.clientY;
            const st = window.getComputedStyle(currentRect);
            startWidth  = parseFloat(st.width);
            startHeight = parseFloat(st.height);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);
            return;
        }
        // drag
        const rElem = e.target.closest('.rect');
        if (rElem) {
            isDragging = true;
            currentRect = rElem;
            startX = e.clientX; startY = e.clientY;
            const box = currentRect.getBoundingClientRect();
            startLeft = box.left; startTop = box.top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);
        }
    });

    function onMouseMove(e) {
        if (isDragging && currentRect) {
            currentRect.style.left = (startLeft + e.clientX - startX) + 'px';
            currentRect.style.top  = (startTop  + e.clientY - startY) + 'px';
        } else if (isResizing && currentRect) {
            currentRect.style.width  = (startWidth  + e.clientX - startX) + 'px';
            currentRect.style.height = (startHeight + e.clientY - startY) + 'px';
        }
    }

    function onMouseUp() {
        if (currentRect) {
            sendState(currentRect.dataset.rectId, {
                left:   currentRect.style.left,
                top:    currentRect.style.top,
                width:  currentRect.style.width,
                height: currentRect.style.height
            });
        }
        isDragging = false;
        isResizing = false;
        currentRect = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup',   onMouseUp);
    }
})();
