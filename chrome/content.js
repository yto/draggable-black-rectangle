// content.js
(() => {
    if (window.draggableBlackRectangleInit) return;
    window.draggableBlackRectangleInit = true;


    //
    //  State messaging helpers
    //
    function sendState(id, state) {
        chrome.runtime.sendMessage({ type: 'saveState', id, state });
    }


    //
    //  Create rectangle element
    //
    function makeRect(id, { left, top, width, height }) {
        // ID重複ガード
        if (document.querySelector(`div[data-rect-id="${id}"]`)) {
            return document.querySelector(`div[data-rect-id="${id}"]`);
        }

        // ホスト要素（ドラッグ・リサイズの対象）
        const host = document.createElement('div');
        host.dataset.rectId = id;
        host.style.position = 'fixed';
        host.style.left = left;
        host.style.top = top;
        host.style.width = width;
        host.style.height = height;
        host.style.zIndex = '10000';
        host.style.zIndex = '2147483647';
        host.style.cursor = 'move';
        host.style.boxSizing = 'border-box';
        host.style.background = 'rgba(0,0,0,1)';
        host.style.opacity = '1';
        host.style.mixBlendMode = 'normal';
        host.style.filter = 'none';
        host.style.isolation = 'isolate';
        host.style.contain = 'paint';
        document.body.appendChild(host);

        // Shadow DOM
        const shadow = host.attachShadow({ mode: 'open' });

        // Shadow用スタイル（ページCSSの影響を受けない）
        const style = document.createElement('style');
        style.textContent = `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: #000 !important;
      opacity: 1 !important;
      mix-blend-mode: normal !important;
      filter: none !important;
      isolation: isolate !important;
      box-sizing: border-box;
      font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    }
    .controls {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      gap: 4px;
    }
    .btn {
      all: unset;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      box-sizing: border-box;
    }
    .handle {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 10px;
      height: 10px;
      background: #fff;
      cursor: se-resize;
    }
`;
        shadow.appendChild(style);

        // Shadow内容
        const controls = document.createElement('div');
        controls.className = 'controls';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn copy';
        copyBtn.title = 'Copy';
        copyBtn.textContent = '📄';

        const delBtn = document.createElement('button');
        delBtn.className = 'btn delete';
        delBtn.title = 'Delete';
        delBtn.textContent = '✖';

        controls.append(copyBtn, delBtn);

        const handle = document.createElement('div');
        handle.className = 'handle';

        shadow.append(controls, handle);

        // イベントバインド
        bindRectEvents(host);

        return host;
    }

    let dragInfo = null; // { host, startX, startY, startLeft, startTop }
    let resizeInfo = null; // { host, startX, startY, startW, startH }

    function bindRectEvents(host) {
        const shadow = host.shadowRoot;
        const copyBtn = shadow.querySelector('.btn.copy');
        const delBtn  = shadow.querySelector('.btn.delete');
        const handle  = shadow.querySelector('.handle');

        // Delete
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sendState(host.dataset.rectId, null);
            host.remove();
        });

        // Copy
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const st = host.getBoundingClientRect();
            const state = {
                left: (st.left + 10) + 'px',
                top:  (st.top + 10)  + 'px',
                width: host.style.width,
                height: host.style.height
            };
            const id = 'rect_' + Date.now();
            makeRect(id, state);
            sendState(id, state);
        });

        // Resize
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const st = host.getBoundingClientRect();
            resizeInfo = {
                host,
                startX: e.clientX,
                startY: e.clientY,
                startW: st.width,
                startH: st.height
            };
            attachGlobalMouseEvents();
        });

        // Drag (host 全体をドラッグ対象に)
        host.addEventListener('mousedown', (e) => {
            // ボタンやハンドルクリックは除外
            const path = e.composedPath();
            if (path.includes(copyBtn) || path.includes(delBtn) || path.includes(handle)) return;

            e.preventDefault();
            const st = host.getBoundingClientRect();
            dragInfo = {
                host,
                startX: e.clientX,
                startY: e.clientY,
                startLeft: st.left,
                startTop: st.top
            };
            attachGlobalMouseEvents();
        });
    }

    function attachGlobalMouseEvents() {
        document.addEventListener('mousemove', onGlobalMouseMove, true);
        document.addEventListener('mouseup', onGlobalMouseUp, true);
    }

    function detachGlobalMouseEvents() {
        document.removeEventListener('mousemove', onGlobalMouseMove, true);
        document.removeEventListener('mouseup', onGlobalMouseUp, true);
    }

    function onGlobalMouseMove(e) {
        if (dragInfo) {
            const { host, startX, startY, startLeft, startTop } = dragInfo;
            host.style.left = (startLeft + e.clientX - startX) + 'px';
            host.style.top  = (startTop  + e.clientY - startY) + 'px';
        } else if (resizeInfo) {
            const { host, startX, startY, startW, startH } = resizeInfo;
            host.style.width  = (startW + e.clientX - startX) + 'px';
            host.style.height = (startH + e.clientY - startY) + 'px';
        }
    }

    function onGlobalMouseUp() {
        if (dragInfo) {
            const { host } = dragInfo;
            sendState(host.dataset.rectId, {
                left: host.style.left,
                top: host.style.top,
                width: host.style.width,
                height: host.style.height
            });
            dragInfo = null;
        }
        if (resizeInfo) {
            const { host } = resizeInfo;
            sendState(host.dataset.rectId, {
                left: host.style.left,
                top: host.style.top,
                width: host.style.width,
                height: host.style.height
            });
            resizeInfo = null;
        }
        detachGlobalMouseEvents();
    }


    //
    //  Inject a new rectangle
    //
    function injectRectangle() {
        const id = 'rect_' + Date.now();
        const state = { left: '50px', top: '50px', width: '200px', height: '150px' };
        makeRect(id, state);
        sendState(id, state);
    }


    //
    //  Restore persisted rectangles
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
    //  Call restoreRects as early as possible
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
    //  Listen for background messages
    //
    chrome.runtime.onMessage.addListener(msg => {
        if (msg.action === 'addRect') {
            injectRectangle();
        } else if (msg.type === 'reloadRects') {
            restoreRects();
        }
    });


})();
