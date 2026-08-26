// ============ index.js ============
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ======================================================
 * 图标配置数组 —— 后续在此添加新图标即可自动适配
 * ====================================================== */
const ICON_CONFIGS = [
    { id: 'llm', name: '大语言模型', symbol: '🧠', url: 'llm/index.html', color: '#00e5ff' },
    { id: 'vision', name: '图像识别模型', symbol: '👁️', url: 'vision/index.html', color: '#7c4dff' },
    { id: 'reverse', name: '逆向工程', symbol: '⚙️', url: 'reverse/index.html', color: '#ff6d00' },
    { id: 'pentest', name: '渗透测试', symbol: '🛡️', url: 'pentest/index.html', color: '#ff1744' },
    { id: 'bigdata', name: '大数据与建模', symbol: '📊', url: 'bigdata/index.html', color: '#00e676' },
    { id: 'arch', name: '系统架构', symbol: '📐', url: 'arch/index.html', color: '#ffab00' },
];

/* ======================================================
 * 常量
 * ====================================================== */
const PARTICLE_COUNT = 72;
const DEFAULT_ROTATION_SPEED = 5; // 度/秒
const BACKEND_API_BASE = 'https://www.u4019814.nyat.app:25782';
const ELLIPSE_RATIO = Math.cos((30 * Math.PI) / 180); // ≈0.866

/* ======================================================
 * 工具函数
 * ====================================================== */
function formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const wd = weekdays[date.getDay()];
    return `${year}.${month}.${day} ${wd}`;
}

function getRandomVisitors() {
    return Math.floor(Math.random() * 101);
}

/* ======================================================
 * IP 获取函数
 * ====================================================== */
async function fetchIpAddress() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${BACKEND_API_BASE}/api/ip`, {
            signal: controller.signal,
            mode: 'cors',
            headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            const ip = data?.ip || data?.address || data?.client_ip;
            if (ip && typeof ip === 'string') return ip;
        }
    } catch (_) {
        // 静默失败
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('https://api.ipify.org?format=json', {
            signal: controller.signal,
            mode: 'cors',
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            if (data?.ip && typeof data.ip === 'string') return data.ip;
        }
    } catch (_) {
        // 静默失败
    }

    return '127.0.0.1';
}

/* ======================================================
 * 轨道粒子组件
 * ====================================================== */
function OrbitParticles({ count, radiusX, radiusY, rotationAngle }) {
    const particles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < count; i++) {
            const baseAngle = (360 / count) * i;
            const rad = (baseAngle * Math.PI) / 180;
            const size = Math.random() * 2 + 1.2;
            const opacity = Math.random() * 0.4 + 0.3;
            const delay = Math.random() * 2.5;
            arr.push({ baseAngle, size, opacity, delay, id: i });
        }
        return arr;
    }, [count]);

    return (
        <React.Fragment>
            {particles.map((p) => {
                const actualAngle = (p.baseAngle + rotationAngle) * Math.PI / 180;
                const x = Math.cos(actualAngle) * radiusX;
                const y = Math.sin(actualAngle) * radiusY;
                return (
                    <span
                        key={p.id}
                        className="orbit-particle"
                        style={{
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            left: `calc(50% + ${x}px - ${p.size / 2}px)`,
                            top: `calc(50% + ${y}px - ${p.size / 2}px)`,
                            opacity: p.opacity,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                );
            })}
        </React.Fragment>
    );
}

/* ======================================================
 * 图标节点组件
 * ====================================================== */
function IconNode({ config, x, y, onIconClick }) {
    const handleClick = (e) => {
        e.stopPropagation();
        if (onIconClick) onIconClick(config);
    };

    return (
        <div
            className="icon-node-wrapper"
            style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
            }}
            onClick={handleClick}
            title={config.name}
        >
            <div
                className="icon-node"
                style={{
                    '--icon-border': `rgba(${hexToRgb(config.color)}, 0.55)`,
                    '--icon-glow': `rgba(${hexToRgb(config.color)}, 0.35)`,
                }}
            >
                <span className="icon-symbol">{config.symbol}</span>
                <span className="icon-label">{config.name}</span>
            </div>
        </div>
    );
}

/* 将 hex 颜色转为 rgb 字符串 */
function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r},${g},${b}`;
}

/* ======================================================
 * 中心显示屏组件
 * ====================================================== */
function CentralDisplay({ timeStr, dateStr, ipAddress, visitorCount }) {
    return (
        <div className="central-display">
            <span className="display-corner-tl"></span>
            <span className="display-corner-br"></span>
            <div className="display-content">
                <span className="display-time">{timeStr}</span>
                <span className="display-date">{dateStr}</span>
                <div className="display-divider"></div>
                <div className="display-info-row">
                    <span className="display-info-label">IP</span>
                    <span className="display-info-value ip-value">{ipAddress}</span>
                </div>
                <div className="display-info-row">
                    <span className="display-info-label">访客</span>
                    <span className="display-info-value visitor-value">{visitorCount}</span>
                </div>
            </div>
        </div>
    );
}

/* ======================================================
 * 主组件
 * ====================================================== */
function App() {
    const [timeStr, setTimeStr] = useState(() => formatTime(new Date()));
    const [dateStr, setDateStr] = useState(() => formatDate(new Date()));
    const [ipAddress, setIpAddress] = useState('127.0.0.1');
    const [visitorCount] = useState(() => getRandomVisitors());
    const [rotationAngle, setRotationAngle] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [orbitSize, setOrbitSize] = useState({
        width: Math.min(window.innerWidth * 0.78, window.innerHeight * 0.78, 720),
        height: Math.min(window.innerWidth * 0.78, window.innerHeight * 0.78, 720) * ELLIPSE_RATIO,
    });

    const orbitRef = useRef(null);
    const dragStateRef = useRef({
        isDragging: false,
        lastMouseAngle: 0,
        lastRotationAngle: 0,
    });
    const rotationAngleRef = useRef(0);
    const animationFrameRef = useRef(null);
    const lastTimestampRef = useRef(null);

    // 椭圆半轴
    const radiusX = orbitSize.width / 2;
    const radiusY = orbitSize.height / 2;

    // 图标角度间隔
    const iconAngleStep = 360 / ICON_CONFIGS.length;

    useEffect(() => {
        rotationAngleRef.current = rotationAngle;
    }, [rotationAngle]);

    /* ----- 时间更新 ----- */
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTimeStr(formatTime(now));
            setDateStr(formatDate(now));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    /* ----- IP 获取 ----- */
    useEffect(() => {
        let isMounted = true;
        fetchIpAddress().then((ip) => {
            if (isMounted) setIpAddress(ip);
        }).catch(() => {
            if (isMounted) setIpAddress('127.0.0.1');
        });
        return () => { isMounted = false; };
    }, []);

    /* ----- 窗口大小调整 ----- */
    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const width = Math.min(w * 0.78, h * 0.78, 720);
            setOrbitSize({
                width,
                height: width * ELLIPSE_RATIO,
            });
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /* ----- 默认匀速旋转动画 ----- */
    useEffect(() => {
        const animate = (timestamp) => {
            if (lastTimestampRef.current === null) {
                lastTimestampRef.current = timestamp;
            }
            const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
            lastTimestampRef.current = timestamp;

            const dragState = dragStateRef.current;
            if (!dragState.isDragging) {
                const newAngle = rotationAngleRef.current + DEFAULT_ROTATION_SPEED * deltaTime;
                rotationAngleRef.current = newAngle;
                setRotationAngle(newAngle);
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    /* ----- 计算鼠标相对于轨道中心的角度 ----- */
    const getMouseAngle = useCallback((clientX, clientY) => {
        const orbitEl = orbitRef.current;
        if (!orbitEl) return 0;
        const rect = orbitEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;
        return angle;
    }, []);

    /* ----- 鼠标按下处理 ----- */
    const handleMouseDown = useCallback((e) => {
        dragStateRef.current.isDragging = true;
        dragStateRef.current.lastMouseAngle = getMouseAngle(e.clientX, e.clientY);
        dragStateRef.current.lastRotationAngle = rotationAngleRef.current;
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
    }, [getMouseAngle]);

    /* ----- 鼠标移动处理 ----- */
    const handleMouseMove = useCallback((e) => {
        const dragState = dragStateRef.current;
        if (!dragState.isDragging) return;
        const currentMouseAngle = getMouseAngle(e.clientX, e.clientY);
        let angleDelta = currentMouseAngle - dragState.lastMouseAngle;
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;

        const newRotation = dragState.lastRotationAngle + angleDelta;
        rotationAngleRef.current = newRotation;
        setRotationAngle(newRotation);
        dragState.lastMouseAngle = currentMouseAngle;
        dragState.lastRotationAngle = newRotation;
    }, [getMouseAngle]);

    /* ----- 鼠标释放处理 ----- */
    const handleMouseUp = useCallback(() => {
        const dragState = dragStateRef.current;
        if (dragState.isDragging) {
            dragState.isDragging = false;
            setIsDragging(false);
            document.body.style.cursor = 'default';
        }
    }, []);

    /* ----- 触摸事件处理 ----- */
    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            dragStateRef.current.isDragging = true;
            dragStateRef.current.lastMouseAngle = getMouseAngle(touch.clientX, touch.clientY);
            dragStateRef.current.lastRotationAngle = rotationAngleRef.current;
            setIsDragging(true);
            e.preventDefault();
        }
    }, [getMouseAngle]);

    const handleTouchMove = useCallback((e) => {
        const dragState = dragStateRef.current;
        if (!dragState.isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const currentMouseAngle = getMouseAngle(touch.clientX, touch.clientY);
        let angleDelta = currentMouseAngle - dragState.lastMouseAngle;
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;
        const newRotation = dragState.lastRotationAngle + angleDelta;
        rotationAngleRef.current = newRotation;
        setRotationAngle(newRotation);
        dragState.lastMouseAngle = currentMouseAngle;
        dragState.lastRotationAngle = newRotation;
        e.preventDefault();
    }, [getMouseAngle]);

    const handleTouchEnd = useCallback(() => {
        const dragState = dragStateRef.current;
        if (dragState.isDragging) {
            dragState.isDragging = false;
            setIsDragging(false);
        }
    }, []);

    /* ----- 全局事件监听 ----- */
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    /* ----- 图标点击处理 ----- */
    const handleIconClick = useCallback((config) => {
        console.log(`[导航] 跳转到: ${config.name} -> ${config.url}`);
        window.location.href = config.url;
    }, []);

    /* ----- 渲染 ----- */
    return (
        <React.Fragment>
            <div className="tech-bg"></div>

            <div className="hud-corner tl"></div>
            <div className="hud-corner tr"></div>
            <div className="hud-corner bl"></div>
            <div className="hud-corner br"></div>

            <div
                className={`orbital-container ${isDragging ? 'dragging' : ''}`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                ref={orbitRef}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <CentralDisplay
                    timeStr={timeStr}
                    dateStr={dateStr}
                    ipAddress={ipAddress}
                    visitorCount={visitorCount}
                />

                <div
                    className="orbit-ring"
                    style={{
                        width: orbitSize.width,
                        height: orbitSize.height,
                    }}
                >
                    <div className="orbit-line"></div>

                    <OrbitParticles
                        count={PARTICLE_COUNT}
                        radiusX={radiusX}
                        radiusY={radiusY}
                        rotationAngle={rotationAngle}
                    />

                    {ICON_CONFIGS.map((config, index) => {
                        const baseAngle = index * iconAngleStep;
                        const actualAngle = (baseAngle + rotationAngle) * Math.PI / 180;
                        const x = Math.cos(actualAngle) * radiusX;
                        const y = Math.sin(actualAngle) * radiusY;
                        return (
                            <IconNode
                                key={config.id}
                                config={config}
                                x={x}
                                y={y}
                                onIconClick={handleIconClick}
                            />
                        );
                    })}
                </div>
            </div>
        </React.Fragment>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
