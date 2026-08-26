// ============ llm_chat.js ============
// 大语言模型聊天页面逻辑
// 后端接口：POST https://www.u4019814.nyat.app:25782/api/chat
// 请求体（JSON）：
// {
//   "message": "用户输入的内容",
//   "attachments": []   // 预留字段，后续可包含文件信息（如文件名、base64或URL）
// }
// 响应JSON结构建议：
// {
//   "status": "success",
//   "response": "助手回复内容",
//   "confidence": 95  // 可选
// }
// 错误：{"status": "error", "message": "错误描述"}

(function() {
    // DOM 元素
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const backHomeBtn = document.getElementById('backHomeBtn');
    const overlay = document.getElementById('overlay');

    // 是否正在等待回复
    let isWaiting = false;

    // 返回首页
    backHomeBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    // 自动调整输入框高度
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    });

    // 发送消息
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || isWaiting) return;

        // 添加用户消息到界面
        addMessage('user', text);
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // 设置等待状态
        isWaiting = true;
        sendBtn.disabled = true;
        sendBtn.textContent = '思考中...';

        // 构造请求数据，包含预留的附件字段
        const requestData = {
            message: text,
            attachments: []   // 后续文件上传功能可填充此数组
        };

        // 发送请求到后端
        fetch('https://www.u4019814.nyat.app:25782/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                // 显示助手回复
                addMessage('assistant', data.response);
            } else {
                // 后端返回错误状态
                addMessage('error', `错误：${data.message || '未知错误'}`);
            }
        })
        .catch(error => {
            console.error('请求出错:', error);
            addMessage('error', `请求出错：${error.message}`);
        })
        .finally(() => {
            isWaiting = false;
            sendBtn.disabled = false;
            sendBtn.textContent = '发送';
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // 添加消息到界面
    function addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 发送按钮点击
    sendBtn.addEventListener('click', sendMessage);

    // 输入框回车发送（Shift+回车换行）
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 上传按钮点击显示提示
    uploadBtn.addEventListener('click', () => {
        showOverlay('上传文件功能即将上线');
    });

    // 显示提示 overlay
    function showOverlay(text) {
        overlay.style.display = 'flex';
        overlay.querySelector('.overlay-content').textContent = text;
        // 2秒后自动关闭
        clearTimeout(window.overlayTimeout);
        window.overlayTimeout = setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.style.opacity = '1';
            }, 300);
        }, 2000);
    }

    // 点击 overlay 可手动关闭
    overlay.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.opacity = '1';
        }, 300);
    });

    // 初始聚焦输入框
    messageInput.focus();
})();
