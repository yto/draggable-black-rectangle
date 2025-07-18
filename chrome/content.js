(() => {
    if (window.draggableBlackRectangleInit) return;
    window.draggableBlackRectangleInit = true;

    const style = document.createElement('style');
    style.id = 'draggable-black-rectangle-style';
    style.textContent = `
.rect {
  position: fixed;
  top: 50px;
  left: 50px;
  width: 200px;
  height: 150px;
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

    document.addEventListener('mousedown', function(e) {
        if (e.target.matches('.delete-btn')) {
            const rect = e.target.closest('.rect');
            if (rect) rect.remove();
            return;
        }
        if (e.target.matches('.copy-btn')) {
            const rect = e.target.closest('.rect');
            if (rect) {
                const clone = rect.cloneNode(true);
                const style = window.getComputedStyle(rect);
                const left = parseFloat(style.left) + 10;
                const top = parseFloat(style.top) + 10;
                clone.style.left = left + 'px';
                clone.style.top = top + 'px';
                document.body.appendChild(clone);
            }
            return;
        }
        if (e.target.matches('.handle')) {
            isResizing = true;
            currentRect = e.target.closest('.rect');
            startX = e.clientX; startY = e.clientY;
            const styleRect = window.getComputedStyle(currentRect);
            startWidth = parseFloat(styleRect.width);
            startHeight = parseFloat(styleRect.height);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            return;
        }
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
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            currentRect.style.left = startLeft + dx + 'px';
            currentRect.style.top = startTop + dy + 'px';
        } else if (isResizing && currentRect) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            currentRect.style.width = startWidth + dx + 'px';
            currentRect.style.height = startHeight + dy + 'px';
        }
    }

    function onMouseUp() {
        isDragging = false; isResizing = false; currentRect = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'addRect') injectRectangle();
    });

    function injectRectangle() {
        const rect = document.createElement('div');
        rect.className = 'rect';
        rect.style.top = '50px';
        rect.style.left = '50px';

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

        const handle = document.createElement('div');
        handle.className = 'handle';
        rect.appendChild(handle);

        document.body.appendChild(rect);
    }
})();
