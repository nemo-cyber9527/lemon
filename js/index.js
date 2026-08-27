// ============ index.js ============
const { useState, useEffect, useRef, useCallback } = React;
const THREE = window.THREE;

/* ======================================================
 * 图标配置 —— 原接口完全保留，字段不变
 * ====================================================== */
const ICON_CONFIGS = [
    {
        id: 'llm',
        name: '大语言模型',
        url: 'llm/index.html',
        color: '#36BFFA',
        icon: '🧠'
    },
    {
        id: 'vision',
        name: '图像识别模型',
        url: 'vision/index.html',
        color: '#7c4dff',
        icon: '👁'
    },
    {
        id: 'reverse',
        name: '逆向工程',
        url: 'reverse/index.html',
        color: '#ff6d00',
        icon: '⚙️'
    },
    {
        id: 'pentest',
        name: '渗透测试',
        url: 'pentest/index.html',
        color: '#ff1744',
        icon: '🛡️'
    },
    {
        id: 'bigdata',
        name: '大数据与建模',
        url: 'bigdata/index.html',
        color: '#00e676',
        icon: '📊'
    },
    {
        id: 'arch',
        name: '系统架构',
        url: 'arch/index.html',
        color: '#ffab00',
        icon: '📐'
    },
];

// 已上线模块名单
const ONLINE_MODULES = new Set(['llm', 'vision']);

/* ======================================================
 * 常量配置
 * ====================================================== */
const BACKEND_API_BASE = 'https://www.u4019814.nyat.app:25782';
const TOTAL_ITEMS = ICON_CONFIGS.length;
const STEP_ANGLE = (Math.PI * 2) / TOTAL_ITEMS;
const ORBIT_RADIUS = 460;
const ORBIT_TILT = THREE.MathUtils.degToRad(20);
const CARD_WIDTH = 140;
const CARD_HEIGHT = 170;
const CARD_THICKNESS = 8;
const ORBIT_DOWN_OFFSET = -110; // 轨道上移30px后的值

/* ======================================================
 * 工具函数（原业务完全保留，API逻辑不变）
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
    return `${year}.${month}.${day} ${weekdays[date.getDay()]}`;
}
function getRandomVisitors() {
    return Math.floor(Math.random() * 101);
}
async function fetchIpAddress() {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${BACKEND_API_BASE}/api/ip`, {
            signal: controller.signal, mode: 'cors',
            headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.ip) return data.ip;
        }
    } catch (_) {}
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        const res = await fetch('https://api.ipify.org?format=json', {
            signal: controller.signal, mode: 'cors',
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.ip) return data.ip;
        }
    } catch (_) {}
    return '127.0.0.1';
}

/* ======================================================
 * 主组件
 * ====================================================== */
function App() {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const cardGroupRef = useRef(null);
    const aiGroupRef = useRef(null);
    const cardMeshesRef = useRef([]);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const hoveredIdxRef = useRef(-1);

    const targetRotRef = useRef(Math.PI / 2);
    const currentRotRef = useRef(Math.PI / 2);
    const scrollTimeoutRef = useRef(null);

    const [activeIndex, setActiveIndex] = useState(0);
    const [ipAddress, setIpAddress] = useState('127.0.0.1');
    const [timeStr, setTimeStr] = useState(() => formatTime(new Date()));
    const [dateStr, setDateStr] = useState(() => formatDate(new Date()));
    const [visitorCount] = useState(() => getRandomVisitors());

    /* ----- 时间每秒更新 ----- */
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTimeStr(formatTime(now));
            setDateStr(formatDate(now));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    /* ----- IP获取（原逻辑完全保留） ----- */
    useEffect(() => {
        let mounted = true;
        fetchIpAddress().then(ip => { if (mounted) setIpAddress(ip); });
        return () => { mounted = false; };
    }, []);

    /* ----- 页面埋点（原逻辑保留） ----- */
    const entryTimeRef = useRef(Date.now());
    const sendTrackData = useCallback((duration) => {
        const data = {
            page_path: window.location.pathname,
            stay_duration_seconds: Math.round(duration / 1000)
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(`${BACKEND_API_BASE}/api/track`, blob);
    }, []);
    useEffect(() => {
        const onUnload = () => sendTrackData(Date.now() - entryTimeRef.current);
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('pagehide', onUnload);
        return () => {
            window.removeEventListener('beforeunload', onUnload);
            window.removeEventListener('pagehide', onUnload);
        };
    }, [sendTrackData]);

    /* ======================================================
     * 初始化 Three.js 场景
     * ====================================================== */
    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
            42, window.innerWidth / window.innerHeight, 0.1, 2000
        );
        camera.position.set(0, 60, 900);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            antialias: true, alpha: true, logarithmicDepthBuffer: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 灯光
        const ambientLight = new THREE.AmbientLight(0x77aaff, 0.75);
        scene.add(ambientLight);
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
        mainLight.position.set(150, 250, 350);
        scene.add(mainLight);
        const rimLight = new THREE.DirectionalLight(0x36BFFA, 1.0);
        rimLight.position.set(-180, -80, -280);
        scene.add(rimLight);
        const fillLight = new THREE.PointLight(0x165DFF, 1.0, 1500);
        fillLight.position.set(0, 0, 250);
        scene.add(fillLight);

        createAiText(scene);
        createCardRing(scene);

        // 事件监听
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        const onMouseMove = (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            handleHover();
        };
        renderer.domElement.addEventListener('mousemove', onMouseMove);

        // 点击逻辑：已上线直接跳转，未上线提示
        const onClick = () => {
            if (hoveredIdxRef.current >= 0) {
                const cfg = ICON_CONFIGS[hoveredIdxRef.current];
                console.log(`[导航] 跳转到: ${cfg.name} -> ${cfg.url}`);
                if (ONLINE_MODULES.has(cfg.id)) {
                    window.location.href = cfg.url;
                } else {
                    alert(`${cfg.name}功能即将上线，敬请期待`);
                }
            }
        };
        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.style.cursor = 'grab';

        // 动画循环
        let animId;
        const animate = () => {
            animId = requestAnimationFrame(animate);

            currentRotRef.current += (targetRotRef.current - currentRotRef.current) * 0.09;
            if (cardGroupRef.current) {
                cardGroupRef.current.rotation.y = currentRotRef.current;
            }

            if (aiGroupRef.current) {
                aiGroupRef.current.rotation.y += 0.008;
            }

            const angleOffset = Math.PI / 2 - currentRotRef.current;
            const rawIdx = Math.round(angleOffset / STEP_ANGLE) % TOTAL_ITEMS;
            const normIdx = (rawIdx + TOTAL_ITEMS) % TOTAL_ITEMS;
            if (normIdx !== activeIndex) {
                setActiveIndex(normIdx);
            }

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('click', onClick);
            renderer.dispose();
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ======================================================
     * 中心立体AI文字（屏幕正中心 + 放大3倍）
     * ====================================================== */
    const createAiText = (scene) => {
        const group = new THREE.Group();

        const layers = 10;
        const thickness = 36;

        for (let i = 0; i < layers; i++) {
            const z = (i - layers / 2) * (thickness / layers);
            const isFront = i === layers - 1;
            const isBack = i === 0;

            const geo = new THREE.PlaneGeometry(720, 360);
            const tex = createAiTexture(isFront);
            
            let mat;
            if (isFront) {
                mat = new THREE.MeshStandardMaterial({
                    map: tex,
                    transparent: true,
                    emissive: 0x36BFFA,
                    emissiveIntensity: 1.1,
                    metalness: 0.2,
                    roughness: 0.2,
                    side: THREE.DoubleSide
                });
            } else if (isBack) {
                mat = new THREE.MeshStandardMaterial({
                    map: tex,
                    transparent: true,
                    emissive: 0x0E34A0,
                    emissiveIntensity: 0.4,
                    metalness: 0.4,
                    roughness: 0.3,
                    side: THREE.DoubleSide
                });
            } else {
                const t = i / layers;
                mat = new THREE.MeshStandardMaterial({
                    map: tex,
                    transparent: true,
                    emissive: new THREE.Color().lerpColors(
                        new THREE.Color(0x0E34A0),
                        new THREE.Color(0x165DFF),
                        t
                    ),
                    emissiveIntensity: 0.3 + t * 0.3,
                    metalness: 0.5,
                    roughness: 0.35,
                    side: THREE.DoubleSide,
                    opacity: 0.9
                });
            }

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.z = z;
            group.add(mesh);
        }

        const glowGeo = new THREE.PlaneGeometry(960, 600);
        const glowTex = createGlowTexture();
        const glowMat = new THREE.MeshBasicMaterial({
            map: glowTex,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0x36BFFA,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -6;
        group.add(glow);

        group.position.set(0, 0, 0); // AI正中心
        scene.add(group);
        aiGroupRef.current = group;
    };

    const createAiTexture = (isFront) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 1024, 512);
        if (isFront) {
            grad.addColorStop(0, '#36BFFA');
            grad.addColorStop(0.5, '#165DFF');
            grad.addColorStop(1, '#69b1ff');
        } else {
            grad.addColorStop(0, '#0E34A0');
            grad.addColorStop(1, '#1a4a88');
        }

        ctx.font = 'bold 570px "Space Mono", "Microsoft YaHei", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = grad;
        if (isFront) {
            ctx.shadowColor = '#36BFFA';
            ctx.shadowBlur = 40;
        }
        ctx.fillText('AI', 512, 256);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    };

    const createGlowTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 512);
        grad.addColorStop(0, 'rgba(54,191,250,0.9)');
        grad.addColorStop(0.3, 'rgba(22,93,255,0.35)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 1024);
        return new THREE.CanvasTexture(canvas);
    };

    /* ======================================================
     * 环形卡片组
     * ====================================================== */
    const createCardRing = (scene) => {
        const group = new THREE.Group();
        group.rotation.x = -ORBIT_TILT;
        group.position.y = ORBIT_DOWN_OFFSET;
        cardGroupRef.current = group;

        const meshes = [];

        ICON_CONFIGS.forEach((cfg, idx) => {
            const cardGroup = new THREE.Group();

            const geo = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS);
            
            const frontTex = createCardTexture(cfg);
            const frontMat = new THREE.MeshStandardMaterial({
                map: frontTex,
                transparent: true,
                emissive: new THREE.Color(cfg.color),
                emissiveIntensity: 0.25,
                metalness: 0.15,
                roughness: 0.4
            });

            const sideMat = new THREE.MeshStandardMaterial({
                color: 0x153a7a,
                emissive: 0x153a7a,
                emissiveIntensity: 0.25,
                metalness: 0.4,
                roughness: 0.35
            });

            const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];

            const card = new THREE.Mesh(geo, materials);
            card.userData.index = idx;
            cardGroup.add(card);

            const borderGeo = new THREE.PlaneGeometry(CARD_WIDTH + 10, CARD_HEIGHT + 10);
            const borderMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(cfg.color),
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const border = new THREE.Mesh(borderGeo, borderMat);
            border.position.z = CARD_THICKNESS / 2 + 0.2;
            card.userData.border = border;
            cardGroup.add(border);

            const angle = idx * STEP_ANGLE;
            cardGroup.position.x = Math.cos(angle) * ORBIT_RADIUS;
            cardGroup.position.z = Math.sin(angle) * ORBIT_RADIUS;

            cardGroup.lookAt(0, ORBIT_DOWN_OFFSET, 0);
            cardGroup.rotateY(Math.PI);

            group.add(cardGroup);
            meshes.push(card);
        });

        scene.add(group);
        cardMeshesRef.current = meshes;
    };

    const createCardTexture = (cfg) => {
        const canvas = document.createElement('canvas');
        canvas.width = 280;
        canvas.height = 340;
        const ctx = canvas.getContext('2d');

        const bgGrad = ctx.createLinearGradient(0, 0, 0, 340);
        bgGrad.addColorStop(0, '#0d1a36');
        bgGrad.addColorStop(1, '#081028');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 280, 340, 26);
        ctx.fill();

        ctx.strokeStyle = cfg.color + '99';
        ctx.lineWidth = 3;
        roundRect(ctx, 0, 0, 280, 340, 26);
        ctx.stroke();

        ctx.font = '90px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = 24;
        ctx.fillText(cfg.icon, 140, 130);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#e0edff';
        ctx.fillText(cfg.name, 140, 230);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    };

    const roundRect = (ctx, x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };

    /* ======================================================
     * Hover交互
     * ====================================================== */
    const handleHover = () => {
        if (!sceneRef.current || !cameraRef.current) return;
        
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(cardMeshesRef.current, true);

        if (hoveredIdxRef.current >= 0) {
            const prev = cardMeshesRef.current[hoveredIdxRef.current];
            if (prev) {
                prev.scale.set(1, 1, 1);
                prev.material[4].emissiveIntensity = 0.25;
                if (prev.userData.border) {
                    prev.userData.border.material.opacity = 0;
                }
            }
        }

        if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && !('index' in hit.userData) && hit.parent) {
                hit = hit.parent;
            }
            if (hit && 'index' in hit.userData) {
                const idx = hit.userData.index;
                hoveredIdxRef.current = idx;
                hit.scale.set(1.08, 1.08, 1.08);
                hit.material[4].emissiveIntensity = 0.7;
                if (hit.userData.border) {
                    hit.userData.border.material.opacity = 0.65;
                }
                rendererRef.current.domElement.style.cursor = 'pointer';
                return;
            }
        }

        hoveredIdxRef.current = -1;
        rendererRef.current.domElement.style.cursor = 'grab';
    };

    /* ======================================================
     * 滚动驱动 + 滚动吸附
     * ====================================================== */
    useEffect(() => {
        const onScroll = () => {
            const scrollTop = window.scrollY;
            const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollMax <= 0 ? 0 : scrollTop / scrollMax;

            targetRotRef.current = Math.PI / 2 - progress * Math.PI * 2;

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                const angleOffset = Math.PI / 2 - targetRotRef.current;
                const nearestIdx = Math.round(angleOffset / STEP_ANGLE);
                targetRotRef.current = Math.PI / 2 - nearestIdx * STEP_ANGLE;
            }, 150);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    /* ----- 渲染 ----- */
    return (
        <React.Fragment>
            <div className="tech-bg"></div>
            <div className="hud-corner tl"></div>
            <div className="hud-corner tr"></div>
            <div className="hud-corner bl"></div>
            <div className="hud-corner br"></div>

            <div className="three-canvas-wrap" ref={containerRef}></div>
            <div className="scroll-spacer"></div>

            {/* 左下角信息面板 */}
            <div className="intro-panel">
                <div className="panel-time">{timeStr}</div>
                <div className="panel-date">{dateStr}</div>
                <div className="panel-divider"></div>
                <div className="panel-info-row">
                    <span className="panel-info-label">IP</span>
                    <span className="panel-info-value ip-value">{ipAddress}</span>
                </div>
                <div className="panel-info-row">
                    <span className="panel-info-label">访客</span>
                    <span className="panel-info-value visitor-value">{visitorCount}</span>
                </div>
            </div>
        </React.Fragment>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

