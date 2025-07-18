// content.js
(() => {
    if (window.draggableBlackRectangleInit) return;
    window.draggableBlackRectangleInit = true;

    // Inject CSS
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
    document.head.appendChild(style);

    let isDragging = false, isResizing = false, currentRect = null;
    let startX, startY, startLeft, startTop, startWidth, startHeight;

    // Utility: Save or remove state
    function sendState(id, state) {
        chrome.runtime.sendMessage({ type: 'saveState', id, state });
    }

    // Create rectangle element
    function makeRect(id, { left, top, width, height }) {
        const rect = document.createElement('div');
        rect.className = 'rect';
        rect.dataset.rectId = id;
        rect.style.left = left;
        rect.style.top = top;
        rect.style.width = width;
        rect.style.height = height;

        // Controls
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

        // Handle
        const handle = document.createElement('div');
        handle.className = 'handle';
        rect.appendChild(handle);

        document.body.appendChild(rect);
        return rect;
    }

    // Inject new rectangle
    function injectRectangle() {
        const id = 'rect_' + Date.now();
        const state = { left: '50px', top: '50px', width: '200px', height: '150px' };
        const rect = makeRect(id, state);
        sendState(id, state);
    }

    // Restore rectangles
    function restoreRects() {
        chrome.runtime.sendMessage({ type: 'getTabStates' }, response => {
            const states = response.states || {};
            for (const id in states) {
                makeRect(id, states[id]);
            }
        });
    }

    // Listen messages
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'addRect') {
            injectRectangle();
        } else if (msg.type === 'reloadRects') {
            restoreRects();
        }
    });

    // On page load — DOMContentLoaded を過ぎていればすぐ呼び出し
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', restoreRects);
    } else {
        restoreRects();
    }

    // Mouse events
    document.addEventListener('mousedown', (e) => {
        // Delete
        if (e.target.matches('.delete-btn')) {
            const rect = e.target.closest('.rect');
            if (rect) {
                const id = rect.dataset.rectId;
                sendState(id, null);
                rect.remove();
            }
            return;
        }
        // Copy
        if (e.target.matches('.copy-btn')) {
            const rect = e.target.closest('.rect');
            if (rect) {
                const style = window.getComputedStyle(rect);
                const state = {
                    left: (parseFloat(style.left) + 10) + 'px',
                    top: (parseFloat(style.top) + 10) + 'px',
                    width: style.width,
                    height: style.height
                };
                const id = 'rect_' + Date.now();
                const clone = makeRect(id, state);
                sendState(id, state);
            }
            return;
        }
        // Resize
        if (e.target.matches('.handle')) {
            isResizing = true;
            currentRect = e.target.closest('.rect');
            startX = e.clientX; startY = e.clientY;
            const st = window.getComputedStyle(currentRect);
            startWidth = parseFloat(st.width);
            startHeight = parseFloat(st.height);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            return;
        }
        // Drag
        const rectElem = e.target.closest('.rect');
        if (rectElem) {
            isDragging = true;
            currentRect = rectElem;
            startX = e.clientX; startY = e.clientY;
            const box = currentRect.getBoundingClientRect();
            startLeft = box.left; startTop = box.top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });

    function onMouseMove(e) {
        if (isDragging && currentRect) {
            currentRect.style.left = (startLeft + e.clientX - startX) + 'px';
            currentRect.style.top = (startTop + e.clientY - startY) + 'px';
        } else if (isResizing && currentRect) {
            currentRect.style.width = (startWidth + e.clientX - startX) + 'px';
            currentRect.style.height = (startHeight + e.clientY - startY) + 'px';
        }
    }
    function onMouseUp() {
        if (currentRect) {
            const id = currentRect.dataset.rectId;
            sendState(id, {
                left: currentRect.style.left,
                top: currentRect.style.top,
                width: currentRect.style.width,
                height: currentRect.style.height
            });
        }
        isDragging = false; isResizing = false; currentRect = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
})();
