// ============ image_recognition.js ============
// 图像识别页面逻辑
// 后端接口：POST https://www.u4019814.nyat.app:25782/api/analyze_image
// 请求体：FormData, 字段名 "image" 携带图片文件
// 响应JSON结构：
// {
//   "status": "success",          // 状态
//   "message": "分析成功，具体内容如下：", // 提示信息
//   "result": "识别结果文本...",   // 具体分析内容
//   "confidence": 95              // 置信度（整数，0-100）
// }
// 错误时可能返回 {"status": "error", "message": "错误描述"}

(function() {
    // DOM 元素
    const uploadPanel = document.getElementById('uploadPanel');
    const resultPanel = document.getElementById('resultPanel');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const confirmUploadBtn = document.getElementById('confirmUploadBtn');
    const resultBox = document.getElementById('resultBox');
    const resultText = document.getElementById('resultText');
    const reuploadBtn = document.getElementById('reuploadBtn');
    const backHomeBtn = document.getElementById('backHomeBtn');

    let selectedFile = null;

    // 返回首页
    backHomeBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    // 点击上传图片按钮，触发文件选择
    uploadImageBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择变化
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            fileNameDisplay.textContent = `已选择: ${file.name}`;
            confirmUploadBtn.disabled = false;
        } else {
            selectedFile = null;
            fileNameDisplay.textContent = '';
            confirmUploadBtn.disabled = true;
        }
    });

    // 确认上传按钮点击
    confirmUploadBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        // 切换到结果面板，显示等待状态
        uploadPanel.style.display = 'none';
        resultPanel.style.display = 'block';
        resultText.textContent = '正在分析中，请稍候...';

        // 准备 FormData
        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const response = await fetch('https://www.u4019814.nyat.app:25782/api/analyze_image', {
                method: 'POST',
                body: formData,
                // 注意：不需要手动设置 Content-Type，浏览器会自动添加 boundary
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                // 拼接显示内容
                const content = `${data.message}\n\n${data.result}\n\n置信度：${data.confidence}%`;
                resultText.textContent = content;
            } else {
                // 后端返回错误状态
                resultText.textContent = `分析失败：${data.message || '未知错误'}`;
            }
        } catch (error) {
            console.error('请求出错:', error);
            resultText.textContent = `请求出错：${error.message}`;
        }
    });

    // 再次上传按钮
    reuploadBtn.addEventListener('click', () => {
        // 重置界面
        resultPanel.style.display = 'none';
        uploadPanel.style.display = 'flex';
        fileNameDisplay.textContent = '';
        confirmUploadBtn.disabled = true;
        selectedFile = null;
        fileInput.value = '';  // 清空文件输入
    });

})();
