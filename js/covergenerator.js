class CoverGenerator {
    constructor() {
        this.fonts = {};
        this.images = {};
        this.canvas = null;
        this.ctx = null;

        this.defaultSettings = {
            title: {
                text: '示例标题', x: 460, y: 300, fontSize: 32,
                fontFamily: '思源黑体-中等', color: '#3682e0', bgColor: '#ffffff'
            },
            subtitle: {
                text: ['小图', '标题'], x: 1111.5, y: 190, fontSize: 120,
                fontFamily: '创客贴金刚体', color: '#ffffff', bgColor: 'transparent'
            }
        };

        this.elements = {
            title: { ...this.defaultSettings.title, type: 'text' },
            subtitle: { ...this.defaultSettings.subtitle, type: 'text' },
            rightImg: { x: 920, y: 0, width: 383, height: 383, type: 'image' }
        };
        this.selectedElement = null;
    }

    async init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this._initEvents();
    }

    async loadFonts(fontConfigs) {
        const fontLoaders = [];
        for (const [name, config] of Object.entries(fontConfigs)) {
            const fontFace = new FontFace(name, `url("${config.url}")`);
            fontLoaders.push(
                fontFace.load().then(loaded => {
                    document.fonts.add(loaded);
                    this.fonts[name] = loaded;
                    console.log(`字体 ${name} 加载成功`);
                })
            );
        }
        await Promise.all(fontLoaders);
    }

    async setLeftImage(url) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            img.onload = () => { this.images.left = img; this.render(); res(); };
            img.onerror = () => rej(new Error('大图加载失败: ' + url));
        });
    }

    async setRightImage(url) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            img.onload = () => {
                this.images.right = img;
                this.elements.rightImg.width = 300;
                this.elements.rightImg.height = 383;
                this.elements.rightImg.x = 600;
                this.elements.rightImg.y = 0;
                this.render();
                res();
            };
            img.onerror = () => rej(new Error('小图加载失败: ' + url));
        });
    }

    reset() {
        const curTitle = this.elements.title.text;
        const curSub = this.elements.subtitle.text;
        this.elements.title = { ...this.defaultSettings.title, text: curTitle, type: 'text' };
        this.elements.subtitle = { ...this.defaultSettings.subtitle, text: curSub, type: 'text' };
        this.render();
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.images.left) this.ctx.drawImage(this.images.left, 0, 0, 920, 383);
        if (this.images.right) this.ctx.drawImage(this.images.right, 920, 0, 383, 383);

        this.addText({
            text: this.elements.title.text,
            x: this.elements.title.x,
            y: this.elements.title.y,
            fontSize: this.elements.title.fontSize,
            fontFamily: this.elements.title.fontFamily,
            color: this.elements.title.color,
            backgroundColor: this.elements.title.bgColor,
            bgPadding: 10,
            textAlign: 'center',
            textBaseline: 'bottom'
        });

        this.addText({
            text: this.elements.subtitle.text,
            x: this.elements.subtitle.x,
            y: this.elements.subtitle.y,
            fontSize: this.elements.subtitle.fontSize,
            fontFamily: this.elements.subtitle.fontFamily,
            color: this.elements.subtitle.color,
            backgroundColor: this.elements.subtitle.bgColor,
            textAlign: 'center',
            textBaseline: 'middle'
        });
    }

    addText(opts) {
        const {
            text,
            x,
            y,
            fontSize = 32,                   
            fontFamily = '思源黑体-中等',     
            color = '#000',                  
            backgroundColor,               
            textAlign = 'left',              
            textBaseline = 'top',           
            bgPadding = 0,                   
            bgRadius = 0,                   
            lineHeight = 1.2,
            letterSpacing = 0  
        } = opts;

        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = 'alphabetic';

        const texts = Array.isArray(text) ? text : [text];
        let maxW = 0;
        texts.forEach(t => maxW = Math.max(maxW, this.ctx.measureText(t).width));

        const totalH = fontSize * texts.length * lineHeight;
        let bgX, bgY;
        switch (textAlign) {
            case 'center': bgX = x - maxW / 2 - bgPadding; break;
            case 'right': bgX = x - maxW - bgPadding; break;
            default: bgX = x - bgPadding;
        }
        switch (textBaseline) {
            case 'middle': bgY = y - totalH / 2 - bgPadding; break;
            case 'bottom': bgY = y - totalH - bgPadding; break;
            default: bgY = y - bgPadding;
        }
        const bgW = maxW + bgPadding * 2;
        const bgH = totalH + bgPadding * 2;

        if (backgroundColor && backgroundColor !== 'transparent' && bgW > 0 && bgH > 0) {
            this.ctx.fillStyle = backgroundColor;
            if (bgRadius > 0) {
                this.ctx.beginPath();
                this.ctx.roundRect(bgX, bgY, bgW, bgH, bgRadius);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(bgX, bgY, bgW, bgH);
            }
        }

        this.ctx.fillStyle = color;
        const lineH = fontSize * lineHeight;

        texts.forEach((t, i) => {
            let ty;
            switch (textBaseline) {
                case 'middle': ty = y - totalH / 2 + lineH * (i + 0.8); break;
                case 'bottom': ty = y - totalH + lineH * (i + 0.8); break;
                default: ty = y + lineH * (i + 0.8);
            }

            if (letterSpacing !== 0) {
                let totalWidth = 0;
                const characters = t.split('');

                characters.forEach(char => {
                    totalWidth += this.ctx.measureText(char).width + letterSpacing;
                });
                totalWidth -= letterSpacing; 

                let startX = x;
                if (textAlign === 'center') {
                    startX = x - totalWidth / 2;
                } else if (textAlign === 'right') {
                    startX = x - totalWidth;
                }

                let currentX = startX;
                characters.forEach(char => {
                    this.ctx.fillText(char, currentX, ty);
                    currentX += this.ctx.measureText(char).width + letterSpacing;
                });
            } else {
                this.ctx.fillText(t, x, ty);
            }
        });
    }

    _initEvents() {
        let isDragging = false, offsetX = 0, offsetY = 0;
        this.canvas.onmousedown = e => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            const hit = (el, w, h) =>
                mx >= el.x - w / 2 && mx <= el.x + w / 2 &&
                my >= el.y - h / 2 && my <= el.y + h / 2;
            if (hit(this.elements.subtitle, 200, 150)) this.selectedElement = this.elements.subtitle;
            else if (hit(this.elements.title, 300, 100)) this.selectedElement = this.elements.title;

            if (this.selectedElement) {
                isDragging = true;
                offsetX = mx - this.selectedElement.x;
                offsetY = my - this.selectedElement.y;
                this.canvas.style.cursor = 'grabbing';
            }
        };
        window.onmousemove = e => {
            if (!isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left, my = e.clientY - rect.top;
                const over = (Math.abs(mx - this.elements.title.x) < 150 && Math.abs(my - this.elements.title.y) < 50) ||
                    (Math.abs(mx - this.elements.subtitle.x) < 100 && Math.abs(my - this.elements.subtitle.y) < 70);
                this.canvas.style.cursor = over ? 'move' : 'default';
                return;
            }
            if (!this.selectedElement) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            requestAnimationFrame(() => {
                this.selectedElement.x = mx - offsetX;
                this.selectedElement.y = my - offsetY;
                this.render();
            });
        };
        window.onmouseup = () => {
            isDragging = false;
            this.selectedElement = null;
            this.canvas.style.cursor = 'default';
        };
    }

    getCoverBase64() {
        if (!this.canvas) return null;
        return this.canvas.toDataURL('image/png');
    }
}

let gen;               
let coverReady = false; 

async function initCoverTool() {
    if (coverReady) return;
    gen = new CoverGenerator();
    await gen.init('coverCanvas');

    const fontConfigs = {
        '思源黑体-极细': { url: './font/SourceHanSansSC-Regular-2.otf' },
        '思源黑体-中等': { url: './font/SourceHanSansSC-Medium-2.otf' },
        '思源黑体-中等旧字形': { url: './font/SourceHanSansOLD-Medium-2.otf' },
        '创客贴金刚体': { url: './font/CKTKingkong.ttf' },
        '阿里巴巴普惠体-极细': { url: './font/AlibabaPuHuiTi-3-35-Thin.otf' },
        '阿里巴巴普惠体-细体': { url: './font/AlibabaPuHuiTi-3-45-Light.otf' },
        '阿里巴巴普惠体-常规': { url: './font/AlibabaPuHuiTi-3-55-Regular.otf' },
        '阿里巴巴普惠体-常规增补': { url: './font/AlibabaPuHuiTi-3-55-RegularL3.otf' },
        '阿里巴巴普惠体-中等': { url: './font/AlibabaPuHuiTi-3-65-Medium.otf' },
        '阿里巴巴普惠体-半粗': { url: './font/AlibabaPuHuiTi-3-75-SemiBold.otf' },
        '阿里巴巴普惠体-粗体': { url: './font/AlibabaPuHuiTi-3-85-Bold.otf' },
        '阿里巴巴普惠体-特粗': { url: './font/AlibabaPuHuiTi-3-95-ExtraBold.otf' },
        '阿里巴巴普惠体-极粗Heavy': { url: './font/AlibabaPuHuiTi-3-105-Heavy.otf' },
        '阿里巴巴普惠体-极粗Black': { url: './font/AlibabaPuHuiTi-3-115-Black.otf' },
        '阿里妈妈方圆体': { url: ' ./font/AlimamaFangYuanTiVF-Thin-2.ttf' },
        '庞门正道粗书体': { url: './font/PangMenZhengDaoCuShuTi-2.ttf' },
        '霞鹜铭心宋': { url: './font/LXGWHeartSerifCHS-2.ttf' }
    };
    await gen.loadFonts(fontConfigs);

    await Promise.all([
        gen.setLeftImage('./static/default-left.png'),
        gen.setRightImage('./static/default-right.png'),
           console.log(`默认图 加载成功`)
    ]);

    // 下拉列表
    const selects = ['titleFontSelect', 'subtitleFontSelect'];
    const fontNames = Object.keys(fontConfigs);
    selects.forEach(id => {
        const el = document.getElementById(id);
        fontNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = opt.innerText = name;
            el.appendChild(opt);
        });
        el.value = (id === 'titleFontSelect')
                   ? gen.elements.title.fontFamily
                   : gen.elements.subtitle.fontFamily;
    });

    gen.render();
    coverReady = true;
    console.log('CoverTool 已就绪（浏览器版）');
}

/* 保存封面：直接下载 PNG */
function sendToWPF() {
    const dataURL = gen.getCoverBase64();
    if (!dataURL) return;
    // 把 dataURL 转成 Blob 并触发下载
    const blob = dataURLtoBlob(dataURL);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover_' + Date.now() + '.png';
    a.click();
    URL.revokeObjectURL(url);
}

/* 工具：dataURL → Blob */
function dataURLtoBlob(dataURL) {
    const [head, data] = dataURL.split(',');
    const mime = head.match(/:(.*?);/)[1];
    const bin = atob(data);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: mime });
}

/* 绘图入口（会重试直到就绪） */
async function drawCover(title) {
    if (!coverReady) { setTimeout(() => drawCover(title), 200); return; }
    document.getElementById('titleInput').value = title;
    gen.elements.title.text = title;
    gen.render();
}

function loadImg(input, type) {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const tempImg = new Image();
    tempImg.src = url;
    tempImg.onload = () => {
        const ratio = tempImg.width / tempImg.height;
        if (type === 'right') {
            if (Math.abs(ratio - 1) > 0.05) { alert('微信右侧小图必须是 1:1 的正方形图片，请重新选择！'); input.value = ''; return; }
            gen.setRightImage(url);
        } else {
            const targetRatio = 920 / 383;
            if (Math.abs(ratio - targetRatio) > 0.1) alert('建议上传 920x383 比例的图片（大图）');
            gen.setLeftImage(url);
        }
    };
}

function updateElement(id, property, value) { gen.elements[id][property] = value; gen.render(); }

function syncColor(id, prop, value, targetId) {
    if (value.toLowerCase() === 'transparent') {
        gen.elements[id][prop] = 'transparent';
        const target = document.getElementById(targetId);
        if (target && target.type === 'text') target.value = 'transparent';
        gen.render(); return;
    }
    if (value.startsWith('#') && (value.length === 7 || value.length === 4)) {
        gen.elements[id][prop] = value;
        const target = document.getElementById(targetId);
        if (target) target.value = value;
        gen.render();
    }
}

async function pickColor(id, prop, syncIds) {
    if (!window.EyeDropper) { alert('您的浏览器不支持吸管取色功能，请使用最新版的 Chrome 或 Edge。'); return; }
    const eyeDropper = new EyeDropper();
    try {
        const result = await eyeDropper.open();
        const hexColor = result.sRGBHex;
        gen.elements[id][prop] = hexColor;
        syncIds.forEach(uiId => { const el = document.getElementById(uiId); if (el) el.value = hexColor; });
        gen.render();
    } catch (e) { console.log('用户取消了取色'); }
}

function uiReset() {
    if (!confirm('确定要重置所有文字的位置和样式吗？')) return;
    gen.reset();

    const t = gen.elements.title, s = gen.elements.subtitle;
    document.getElementById('titleSizeLabel').innerText = t.fontSize;
    document.querySelector('input[oninput*="title"][type="range"]').value = t.fontSize;
    document.querySelector('input[oninput*="title"][oninput*="color"]').value = t.color;
    document.querySelector('input[oninput*="title"][oninput*="bgColor"]').value = t.bgColor;
    document.getElementById('titleFontSelect').value = t.fontFamily;

    document.getElementById('subtitleSizeLabel').innerText = s.fontSize;
    document.querySelector('input[oninput*="subtitle"][type="range"]').value = s.fontSize;
    document.querySelector('input[oninput*="subtitle"][oninput*="color"]').value = s.color;
    document.querySelector('input[oninput*="subtitle"][oninput*="bgColor"]').value = s.bgColor;
    document.getElementById('subtitleFontSelect').value = s.fontFamily;
    document.getElementById('subtitleBgColorHex').value = 'transparent';
    document.getElementById('subtitleBgColorPicker').value = '#ffffff';
    console.log('编辑器已重置');
}
