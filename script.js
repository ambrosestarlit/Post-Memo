// ===== 初期化 =====
let posts = [];
let currentFilter = null;
let selectedImages = [];
let userIcon = null;
let backgroundImage = null;
let cropImage = null;
let cropStartX = 0;
let cropStartY = 0;
let cropEndX = 0;
let cropEndY = 0;
let isDragging = false;

// LocalStorageキー
const STORAGE_KEYS = {
    POSTS: 'memoSNS_posts',
    ICON: 'memoSNS_userIcon',
    BACKGROUND: 'memoSNS_background',
    THEME: 'memoSNS_theme',
    BG_OPACITY: 'memoSNS_bgOpacity',
    BG_BORDER: 'memoSNS_bgBorder'
};

// ===== 初期読み込み =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeEventListeners();
    renderTimeline();
    
    // デフォルトアイコンを設定
    if (!userIcon) {
        loadDefaultIcon();
    } else {
        updateUserIcon();
    }
});

// ===== デフォルトアイコン読み込み =====
function loadDefaultIcon() {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 200, 200);
        userIcon = canvas.toDataURL();
        saveIcon();
        updateUserIcon();
    };
    img.onerror = () => {
        // 画像読み込み失敗時は以前の方法でデフォルトアイコンを生成
        userIcon = createDefaultIcon();
        saveIcon();
        updateUserIcon();
    };
    img.src = 'default-icon.png';
}

// ===== イベントリスナー初期化 =====
function initializeEventListeners() {
    // 投稿ボタン
    document.getElementById('postBtn').addEventListener('click', createPost);
    
    // 画像選択
    document.getElementById('imageInput').addEventListener('change', handleImageSelect);
    
    // Enterキーでの送信は無効（誤送信防止）
    
    // 検索ボタン
    document.getElementById('searchBtn').addEventListener('click', openSearchModal);
    
    // 設定ボタン
    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    
    // モーダル閉じる
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
    
    // モーダル外クリックで閉じる
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // 検索機能
    document.getElementById('hashtagSearch').addEventListener('input', filterHashtags);
    document.getElementById('clearFilterBtn').addEventListener('click', clearFilter);
    
    // 設定
    document.getElementById('iconInput').addEventListener('change', handleIconChange);
    document.getElementById('bgInput').addEventListener('change', handleBackgroundChange);
    document.getElementById('bgOpacityCheck').addEventListener('change', handleOpacityChange);
    document.getElementById('themeSelect').addEventListener('change', handleThemeChange);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importInput').addEventListener('change', importData);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    
    // 背景パターン選択
    document.querySelectorAll('.bg-pattern-item').forEach(item => {
        item.addEventListener('click', handlePatternSelect);
    });
    
    // トリミング
    document.getElementById('cropConfirmBtn').addEventListener('click', confirmCrop);
    document.getElementById('cropCancelBtn').addEventListener('click', cancelCrop);
    
    const canvas = document.getElementById('iconCropCanvas');
    canvas.addEventListener('mousedown', startCrop);
    canvas.addEventListener('mousemove', moveCrop);
    canvas.addEventListener('mouseup', endCrop);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', endCrop);
}

// ===== デフォルトアイコン生成 =====
function createDefaultIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, '#8B4513');
    gradient.addColorStop(1, '#D2691E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);
    
    // 顔の輪郭
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(100, 100, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // 目
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(80, 90, 8, 0, Math.PI * 2);
    ctx.arc(120, 90, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 口
    ctx.beginPath();
    ctx.arc(100, 100, 30, 0, Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    return canvas.toDataURL();
}

// ===== データ読み込み =====
function loadData() {
    const savedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (savedPosts) {
        posts = JSON.parse(savedPosts);
    }
    
    const savedIcon = localStorage.getItem(STORAGE_KEYS.ICON);
    if (savedIcon) {
        userIcon = savedIcon;
    }
    
    const savedBg = localStorage.getItem(STORAGE_KEYS.BACKGROUND);
    if (savedBg) {
        backgroundImage = savedBg;
        applyBackground(savedBg);
    }
    
    const savedBorder = localStorage.getItem(STORAGE_KEYS.BG_BORDER);
    if (savedBorder === 'true') {
        applyBorder();
    }
    
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        document.getElementById('themeSelect').value = savedTheme;
    }
    
    const savedOpacity = localStorage.getItem(STORAGE_KEYS.BG_OPACITY);
    if (savedOpacity !== null) {
        const isOpaque = savedOpacity === 'true';
        document.getElementById('bgOpacityCheck').checked = !isOpaque;
        if (isOpaque) {
            document.body.classList.add('bg-clear');
        }
    }
    
    updateActivePattern();
}

// ===== データ保存 =====
function saveData() {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

function saveIcon() {
    localStorage.setItem(STORAGE_KEYS.ICON, userIcon);
}

function updateUserIcon() {
    document.getElementById('currentUserIcon').src = userIcon;
}

// ===== 画像選択ハンドラー =====
function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            selectedImages.push({
                data: event.target.result,
                name: file.name
            });
            renderImagePreview();
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreview() {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    selectedImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${img.data}" alt="${img.name}">
            <button class="preview-remove" onclick="removePreviewImage(${index})">×</button>
        `;
        preview.appendChild(div);
    });
}

function removePreviewImage(index) {
    selectedImages.splice(index, 1);
    renderImagePreview();
}

// ===== 投稿作成 =====
function createPost() {
    const textArea = document.getElementById('postText');
    const text = textArea.value.trim();
    
    if (!text && selectedImages.length === 0) {
        alert('テキストまたは画像を入力してください');
        return;
    }
    
    const post = {
        id: Date.now(),
        text: text,
        images: [...selectedImages],
        timestamp: new Date().toISOString()
        // iconは保存しない（常に現在のuserIconを使用）
    };
    
    posts.unshift(post);
    saveData();
    
    // フォームをクリア
    textArea.value = '';
    selectedImages = [];
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imageInput').value = '';
    
    renderTimeline();
}

// ===== タイムライン描画 =====
function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const filteredPosts = currentFilter 
        ? posts.filter(post => post.text.includes(currentFilter))
        : posts;
    
    if (filteredPosts.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem;">📝</div>
                <p>${currentFilter ? 'このハッシュタグの投稿がありません' : '投稿がありません'}</p>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = '';
    filteredPosts.forEach(post => {
        const postElement = createPostElement(post);
        timeline.appendChild(postElement);
    });
}

// ===== 投稿要素作成 =====
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post-item';
    
    const time = new Date(post.timestamp);
    const timeStr = formatTime(time);
    
    // テキスト処理（ハッシュタグとURLを検出）
    const processedText = processText(post.text);
    
    // 画像のグリッドクラス
    let imageGridClass = 'single';
    if (post.images.length === 2) imageGridClass = 'double';
    else if (post.images.length > 2) imageGridClass = 'multiple';
    
    div.innerHTML = `
        <img src="${userIcon}" alt="アイコン" class="user-icon">
        <div class="post-content">
            <div class="post-header">
                <div class="post-time">${timeStr}</div>
            </div>
            ${post.text ? `<div class="post-text">${processedText}</div>` : ''}
            ${post.images.length > 0 ? `
                <div class="post-images ${imageGridClass}">
                    ${post.images.map((img, idx) => `
                        <img src="${img.data}" alt="${img.name}" class="post-image" onclick="downloadImage('${img.data}', '${img.name}')">
                    `).join('')}
                </div>
            ` : ''}
            <div class="post-actions-bottom">
                ${post.text ? `<button class="action-btn" onclick="copyText(\`${escapeText(post.text)}\`)">
                    📋 コピー
                </button>` : ''}
                ${post.images.length > 0 ? `<button class="action-btn" onclick="downloadAllImages(${post.id})">
                    💾 画像保存
                </button>` : ''}
                <button class="action-btn" onclick="deletePost(${post.id})" style="background: #dc3545;">
                    🗑️ 削除
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// ===== テキスト処理 =====
function processText(text) {
    // URLを検出してリンク化
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, '<a href="$1" target="_blank" class="post-url">$1</a>');
    
    // ハッシュタグを検出
    const hashtagRegex = /#([^\s#]+)/g;
    text = text.replace(hashtagRegex, '<span class="hashtag" onclick="filterByHashtag(\'#$1\')">#$1</span>');
    
    return text;
}

function escapeText(text) {
    return text.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// ===== 時刻フォーマット =====
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ===== コピー機能 =====
function copyText(text) {
    // HTMLタグを除去
    const temp = document.createElement('div');
    temp.innerHTML = text;
    const plainText = temp.textContent || temp.innerText;
    
    navigator.clipboard.writeText(plainText).then(() => {
        showToast('テキストをコピーしました');
    });
}

// ===== 画像ダウンロード =====
function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename || `image_${Date.now()}.png`;
    link.click();
    showToast('画像をダウンロードしました');
}

function downloadAllImages(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post || post.images.length === 0) return;
    
    post.images.forEach((img, index) => {
        setTimeout(() => {
            downloadImage(img.data, img.name || `image_${postId}_${index}.png`);
        }, index * 200);
    });
}

// ===== 投稿削除 =====
function deletePost(postId) {
    if (!confirm('この投稿を削除しますか?')) return;
    
    posts = posts.filter(p => p.id !== postId);
    saveData();
    renderTimeline();
    showToast('投稿を削除しました');
}

// ===== 検索モーダル =====
function openSearchModal() {
    document.getElementById('searchModal').classList.add('active');
    renderHashtagList();
}

function renderHashtagList() {
    const hashtags = extractHashtags();
    const list = document.getElementById('hashtagList');
    
    if (hashtags.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999;">ハッシュタグがありません</p>';
        return;
    }
    
    list.innerHTML = '';
    hashtags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'hashtag-item';
        if (currentFilter === tag) {
            div.classList.add('active');
        }
        div.textContent = `${tag} (${countHashtag(tag)})`;
        div.onclick = () => filterByHashtag(tag);
        list.appendChild(div);
    });
}

function extractHashtags() {
    const tags = new Set();
    posts.forEach(post => {
        const matches = post.text.match(/#[^\s#]+/g);
        if (matches) {
            matches.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
}

function countHashtag(tag) {
    return posts.filter(post => post.text.includes(tag)).length;
}

function filterHashtags() {
    const query = document.getElementById('hashtagSearch').value.toLowerCase();
    const items = document.querySelectorAll('.hashtag-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'block' : 'none';
    });
}

function filterByHashtag(tag) {
    currentFilter = tag;
    renderTimeline();
    document.getElementById('searchModal').classList.remove('active');
    showToast(`${tag} で絞り込み中`);
}

function clearFilter() {
    currentFilter = null;
    renderTimeline();
    document.getElementById('searchModal').classList.remove('active');
    showToast('すべて表示');
}

// ===== 設定モーダル =====
function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
}

function handleIconChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            cropImage = img;
            showCropArea(img);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function showCropArea(img) {
    const cropArea = document.getElementById('iconCropArea');
    const canvas = document.getElementById('iconCropCanvas');
    const ctx = canvas.getContext('2d');
    
    // キャンバスサイズを設定（最大400px）
    const maxSize = 400;
    let width = img.width;
    let height = img.height;
    
    if (width > maxSize || height > maxSize) {
        if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
        } else {
            width = (width / height) * maxSize;
            height = maxSize;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 画像を描画
    ctx.drawImage(img, 0, 0, width, height);
    
    // デバイス判定
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
        // スマホ用：スライダーとタップ移動UI
        showMobileCropUI(width, height);
    } else {
        // PC用：ドラッグ選択UI
        showDesktopCropUI(width, height);
    }
    
    cropArea.style.display = 'block';
}

function showDesktopCropUI(width, height) {
    // 既存のドラッグ方式
    const size = Math.min(width, height) * 0.8;
    cropStartX = (width - size) / 2;
    cropStartY = (height - size) / 2;
    cropEndX = cropStartX + size;
    cropEndY = cropStartY + size;
    
    const canvas = document.getElementById('iconCropCanvas');
    const ctx = canvas.getContext('2d');
    canvas.style.cursor = 'crosshair';
    drawCropRect(ctx, width, height);
}

function showMobileCropUI(width, height) {
    const cropArea = document.getElementById('iconCropArea');
    const canvas = document.getElementById('iconCropCanvas');
    const ctx = canvas.getContext('2d');
    
    // 初期サイズと位置
    const initialSize = Math.min(width, height) * 0.6;
    cropStartX = (width - initialSize) / 2;
    cropStartY = (height - initialSize) / 2;
    cropEndX = cropStartX + initialSize;
    cropEndY = cropStartY + initialSize;
    
    // スマホ用コントロールを追加
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-crop-controls';
    mobileControls.innerHTML = `
        <div class="crop-control-item">
            <label>サイズ</label>
            <input type="range" id="cropSizeSlider" min="50" max="${Math.min(width, height)}" value="${initialSize}" step="1">
        </div>
        <div class="crop-control-item">
            <label>位置を調整（タップで移動）</label>
        </div>
    `;
    
    // 既存のモバイルコントロールを削除
    const existingControls = cropArea.querySelector('.mobile-crop-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    cropArea.insertBefore(mobileControls, cropArea.querySelector('.crop-controls'));
    
    // スライダーイベント
    document.getElementById('cropSizeSlider').addEventListener('input', (e) => {
        const size = parseFloat(e.target.value);
        const centerX = (cropStartX + cropEndX) / 2;
        const centerY = (cropStartY + cropEndY) / 2;
        
        cropStartX = Math.max(0, Math.min(width - size, centerX - size / 2));
        cropStartY = Math.max(0, Math.min(height - size, centerY - size / 2));
        cropEndX = cropStartX + size;
        cropEndY = cropStartY + size;
        
        drawCropRect(ctx, width, height);
    });
    
    // タップで枠を移動
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (width / rect.width);
        const clickY = (e.clientY - rect.top) * (height / rect.height);
        
        const size = cropEndX - cropStartX;
        cropStartX = Math.max(0, Math.min(width - size, clickX - size / 2));
        cropStartY = Math.max(0, Math.min(height - size, clickY - size / 2));
        cropEndX = cropStartX + size;
        cropEndY = cropStartY + size;
        
        drawCropRect(ctx, width, height);
    });
    
    drawCropRect(ctx, width, height);
}

function drawCropRect(ctx, width, height) {
    // 元の画像を再描画
    ctx.drawImage(cropImage, 0, 0, width, height);
    
    // 暗いオーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    // トリミング領域をクリア（正方形に強制）
    const x = Math.min(cropStartX, cropEndX);
    const y = Math.min(cropStartY, cropEndY);
    const w = Math.abs(cropEndX - cropStartX);
    const h = Math.abs(cropEndY - cropStartY);
    const size = Math.min(w, h);
    
    ctx.clearRect(x, y, size, size);
    ctx.drawImage(cropImage, 
        x * (cropImage.width / width), 
        y * (cropImage.height / height), 
        size * (cropImage.width / width), 
        size * (cropImage.height / height),
        x, y, size, size
    );
    
    // 枠線
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    
    // グリッド線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + size * i / 3, y);
        ctx.lineTo(x + size * i / 3, y + size);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y + size * i / 3);
        ctx.lineTo(x + size, y + size * i / 3);
        ctx.stroke();
    }
}

function startCrop(e) {
    const canvas = document.getElementById('iconCropCanvas');
    const rect = canvas.getBoundingClientRect();
    cropStartX = e.clientX - rect.left;
    cropStartY = e.clientY - rect.top;
    isDragging = true;
}

function moveCrop(e) {
    if (!isDragging) return;
    
    const canvas = document.getElementById('iconCropCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    cropEndX = e.clientX - rect.left;
    cropEndY = e.clientY - rect.top;
    
    drawCropRect(ctx, canvas.width, canvas.height);
}

function endCrop(e) {
    isDragging = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    const canvas = document.getElementById('iconCropCanvas');
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    cropStartX = touch.clientX - rect.left;
    cropStartY = touch.clientY - rect.top;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const canvas = document.getElementById('iconCropCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    cropEndX = touch.clientX - rect.left;
    cropEndY = touch.clientY - rect.top;
    
    drawCropRect(ctx, canvas.width, canvas.height);
}

function confirmCrop() {
    const canvas = document.getElementById('iconCropCanvas');
    const ctx = canvas.getContext('2d');
    
    // トリミング範囲を計算（正方形）
    const x = Math.min(cropStartX, cropEndX);
    const y = Math.min(cropStartY, cropEndY);
    const w = Math.abs(cropEndX - cropStartX);
    const h = Math.abs(cropEndY - cropStartY);
    const size = Math.min(w, h);
    
    // 元の画像のスケールを考慮
    const scaleX = cropImage.width / canvas.width;
    const scaleY = cropImage.height / canvas.height;
    
    // 新しいキャンバスにトリミング結果を描画
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = 200;
    resultCanvas.height = 200;
    const resultCtx = resultCanvas.getContext('2d');
    
    resultCtx.drawImage(cropImage,
        x * scaleX, y * scaleY,
        size * scaleX, size * scaleY,
        0, 0, 200, 200
    );
    
    userIcon = resultCanvas.toDataURL();
    saveIcon();
    updateUserIcon();
    renderTimeline(); // タイムラインを再描画して全投稿のアイコンを更新
    
    // トリミング領域を非表示
    const cropArea = document.getElementById('iconCropArea');
    const mobileControls = cropArea.querySelector('.mobile-crop-controls');
    if (mobileControls) {
        mobileControls.remove();
    }
    cropArea.style.display = 'none';
    document.getElementById('iconInput').value = '';
    
    showToast('アイコンを変更しました');
}

function cancelCrop() {
    const cropArea = document.getElementById('iconCropArea');
    const mobileControls = cropArea.querySelector('.mobile-crop-controls');
    if (mobileControls) {
        mobileControls.remove();
    }
    cropArea.style.display = 'none';
    document.getElementById('iconInput').value = '';
}

function handleBackgroundChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        backgroundImage = event.target.result;
        localStorage.setItem(STORAGE_KEYS.BACKGROUND, backgroundImage);
        localStorage.removeItem(STORAGE_KEYS.BG_BORDER);
        applyBackground(backgroundImage);
        removeBorder();
        updateActivePattern();
        showToast('背景を変更しました');
    };
    reader.readAsDataURL(file);
}

function clearBackground() {
    backgroundImage = null;
    localStorage.removeItem(STORAGE_KEYS.BACKGROUND);
    document.body.style.backgroundImage = '';
    showToast('背景をクリアしました');
}

function handlePatternSelect(e) {
    const item = e.currentTarget;
    const bgValue = item.getAttribute('data-bg');
    
    if (bgValue === 'custom') {
        // カスタム画像選択
        document.getElementById('bgInput').click();
    } else if (bgValue === 'none') {
        // 背景なし
        backgroundImage = null;
        localStorage.removeItem(STORAGE_KEYS.BACKGROUND);
        localStorage.removeItem(STORAGE_KEYS.BG_BORDER);
        document.body.style.backgroundImage = '';
        removeBorder();
        updateActivePattern();
        showToast('背景をクリアしました');
    } else if (bgValue === 'bg-border.png') {
        // ボーダーパターン（テーマ背景に重ねる）
        backgroundImage = bgValue;
        localStorage.setItem(STORAGE_KEYS.BACKGROUND, bgValue);
        localStorage.setItem(STORAGE_KEYS.BG_BORDER, 'true');
        applyBorder();
        updateActivePattern();
        showToast('ボーダー背景を設定しました');
    } else {
        // プリセット背景
        backgroundImage = bgValue;
        localStorage.setItem(STORAGE_KEYS.BACKGROUND, bgValue);
        localStorage.removeItem(STORAGE_KEYS.BG_BORDER);
        applyBackground(bgValue);
        removeBorder();
        updateActivePattern();
        showToast('背景を変更しました');
    }
}

function applyBackground(bgUrl) {
    document.body.style.backgroundImage = `url(${bgUrl})`;
    document.body.style.backgroundSize = 'auto';
    document.body.style.backgroundRepeat = 'repeat';
}

function applyBorder() {
    document.body.style.backgroundImage = `url(bg-border.png)`;
    document.body.style.backgroundSize = 'auto';
    document.body.style.backgroundRepeat = 'repeat';
}

function removeBorder() {
    // ボーダークラスがあれば削除
    localStorage.removeItem(STORAGE_KEYS.BG_BORDER);
}

function updateActivePattern() {
    document.querySelectorAll('.bg-pattern-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const savedBg = localStorage.getItem(STORAGE_KEYS.BACKGROUND);
    if (!savedBg) {
        document.querySelector('[data-bg="none"]').classList.add('active');
    } else {
        const activeItem = document.querySelector(`[data-bg="${savedBg}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        } else {
            document.querySelector('[data-bg="custom"]').classList.add('active');
        }
    }
}

function handleOpacityChange(e) {
    const isTransparent = e.target.checked;
    if (isTransparent) {
        document.body.classList.remove('bg-clear');
        localStorage.setItem(STORAGE_KEYS.BG_OPACITY, 'false');
    } else {
        document.body.classList.add('bg-clear');
        localStorage.setItem(STORAGE_KEYS.BG_OPACITY, 'true');
    }
    showToast(isTransparent ? '背景を薄く表示' : '背景をそのまま表示');
}

function handleThemeChange(e) {
    const theme = e.target.value;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    showToast('テーマを変更しました');
}

// ===== データエクスポート/インポート =====
function exportData() {
    const data = {
        posts: posts,
        icon: userIcon,
        background: backgroundImage,
        theme: localStorage.getItem(STORAGE_KEYS.THEME),
        bgOpacity: localStorage.getItem(STORAGE_KEYS.BG_OPACITY),
        bgBorder: localStorage.getItem(STORAGE_KEYS.BG_BORDER),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memo_sns_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('データをエクスポートしました');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (confirm('既存のデータを上書きしますか？\n（キャンセルで追加モード）')) {
                posts = data.posts || [];
            } else {
                posts = [...posts, ...(data.posts || [])];
            }
            
            if (data.icon) {
                userIcon = data.icon;
                saveIcon();
                updateUserIcon();
            }
            
            if (data.background) {
                backgroundImage = data.background;
                localStorage.setItem(STORAGE_KEYS.BACKGROUND, backgroundImage);
                applyBackground(backgroundImage);
            }
            
            if (data.bgBorder) {
                localStorage.setItem(STORAGE_KEYS.BG_BORDER, data.bgBorder);
                if (data.bgBorder === 'true') {
                    applyBorder();
                }
            }
            
            if (data.theme) {
                document.body.setAttribute('data-theme', data.theme);
                localStorage.setItem(STORAGE_KEYS.THEME, data.theme);
                document.getElementById('themeSelect').value = data.theme;
            }
            
            if (data.bgOpacity !== undefined) {
                localStorage.setItem(STORAGE_KEYS.BG_OPACITY, data.bgOpacity);
                const isOpaque = data.bgOpacity === 'true';
                document.getElementById('bgOpacityCheck').checked = !isOpaque;
                if (isOpaque) {
                    document.body.classList.add('bg-clear');
                } else {
                    document.body.classList.remove('bg-clear');
                }
            }
            
            updateActivePattern();
            
            saveData();
            renderTimeline();
            showToast('データをインポートしました');
        } catch (error) {
            alert('データの読み込みに失敗しました');
            console.error(error);
        }
    };
    reader.readAsText(file);
    
    e.target.value = '';
}

function clearAllData() {
    if (!confirm('本当にすべてのデータを削除しますか？\nこの操作は取り消せません。')) return;
    
    if (!confirm('最終確認: すべての投稿、設定が削除されます。')) return;
    
    posts = [];
    localStorage.clear();
    userIcon = createDefaultIcon();
    saveIcon();
    updateUserIcon();
    document.body.style.backgroundImage = '';
    renderTimeline();
    showToast('すべてのデータを削除しました');
}

// ===== トースト通知 =====
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ===== CSS アニメーション追加 =====
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(style);
