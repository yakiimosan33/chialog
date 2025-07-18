// グローバル変数
let isLoading = true;
let currentSlide = 0;
let isScrolling = false;
let isMobile = window.innerWidth <= 768;
let mobileScrollObserver = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    isMobile = window.innerWidth <= 768;
    console.log('isMobile:', isMobile, 'window width:', window.innerWidth);
    initLoader();
    initMenu();
    initSlideAnimations();
    if (!isMobile) {
        initTiltEffect();
    }
    initParticleEffects();
    initImageErrorHandling();
});

// ローダー
function initLoader() {
    const loader = document.querySelector('.js-loader');
    
    // 画像読み込み完了を待つ
    setTimeout(() => {
        if (loader) {
            loader.classList.add('is-hidden');
        }
        isLoading = false;
        
        // スクロールを初期化
        console.log('Initializing scroll, isMobile:', isMobile);
        if (isMobile) {
            initMobileScroll();
        } else {
            initHorizontalScroll();
        }
        
        // 最初のスライドをアクティブに
        const firstSlide = document.querySelector('.js-slide');
        if (firstSlide) {
            firstSlide.classList.add('is-active');
        }
        
        // ビデオの再生を確認
        ensureVideoPlayback();
    }, 1500);
}

// メニュー
function initMenu() {
    const menuBtn = document.querySelector('.js-menu-btn');
    const fullscreenMenu = document.querySelector('.js-fullscreen-menu');
    const menuLinks = document.querySelectorAll('.js-menu-link');
    
    if (!menuBtn) return;
    
    menuBtn.addEventListener('click', function() {
        const isActive = this.classList.contains('is-active');
        
        if (isActive) {
            this.classList.remove('is-active');
            fullscreenMenu.classList.remove('is-active');
        } else {
            this.classList.add('is-active');
            fullscreenMenu.classList.add('is-active');
        }
    });
    
    // メニューリンククリック時
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSlide = document.querySelector(`#${targetId}`);
            
            if (targetSlide) {
                if (isMobile) {
                    // モバイルでは通常のスクロール
                    targetSlide.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                } else {
                    // デスクトップでは横スクロール
                    const slides = Array.from(document.querySelectorAll('.js-slide'));
                    const targetIndex = slides.indexOf(targetSlide);
                    
                    if (targetIndex !== -1) {
                        scrollToSlide(targetIndex);
                    }
                }
            }
            
            // メニューを閉じる
            menuBtn.classList.remove('is-active');
            fullscreenMenu.classList.remove('is-active');
        });
    });
}

// モバイル用スクロール初期化
function initMobileScroll() {
    console.log('initMobileScroll called');
    const slides = document.querySelectorAll('.js-slide');
    console.log('Found slides:', slides.length);
    
    if (slides.length === 0) return;
    
    // スマホではIntersection Observerの代わりにシンプルなスクロールイベントを使用
    console.log('Setting up mobile scroll detection');
    
    // 最初のスライドをアクティブに
    if (slides[0]) {
        slides[0].classList.add('is-active');
    }
    
    // スクロールイベントでアクティブスライドを切り替え
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            
            slides.forEach((slide, index) => {
                const slideTop = slide.offsetTop;
                const slideHeight = slide.offsetHeight;
                const slideCenter = slideTop + (slideHeight / 2);
                const windowCenter = scrollTop + (windowHeight / 2);
                
                // スライドが画面の中央付近にある場合
                if (Math.abs(slideCenter - windowCenter) < windowHeight / 3) {
                    if (!slide.classList.contains('is-active')) {
                        // 前のアクティブスライドを削除
                        document.querySelectorAll('.js-slide.is-active').forEach(s => {
                            s.classList.remove('is-active');
                        });
                        
                        // 新しいスライドをアクティブに
                        slide.classList.add('is-active');
                        currentSlide = index;
                        console.log('Active slide:', index);
                    }
                }
            });
        }, 50);
    });
}

// 横スクロール（デスクトップ用）
function initHorizontalScroll() {
    const scrollContainer = document.querySelector('[data-scroll]');
    const scrollContent = document.querySelector('[data-scroll-content]');
    const scrollbar = document.querySelector('[data-scrollbar]');
    const scrollbarHandle = document.querySelector('.js-scrollbar__handle');
    const slides = document.querySelectorAll('.js-slide');
    
    if (!scrollContainer || !scrollContent || slides.length === 0) {
        console.log('Missing elements for horizontal scroll');
        return;
    }
    
    // コンテンツの総幅を計算
    let totalWidth = 0;
    slides.forEach(slide => {
        if (slide.classList.contains('slide--wide')) {
            totalWidth += window.innerWidth * 1.5;
        } else {
            totalWidth += window.innerWidth;
        }
    });
    
    console.log('Total width:', totalWidth);
    
    // ボディの高さを設定（縦スクロールを横スクロールに変換）
    document.body.style.height = `${totalWidth}px`;
    
    // スクロールハンドラー
    let current = 0;
    let target = 0;
    let ease = 0.085;
    
    function updateScroll() {
        target = window.scrollY;
        current += (target - current) * ease;
        
        // コンテンツを横に移動
        const translateX = -current;
        
        // バウンス効果とスキュー効果
        const diff = target - current;
        const acc = diff / window.innerWidth;
        const velo = +acc;
        const bounce = 1 - Math.abs(velo * 0.2);
        const skew = velo * 5;
        
        scrollContent.style.transform = `translate3d(${translateX}px, 0, 0) scaleY(${bounce}) skewX(${skew}deg)`;
        
        // スクロールバーを更新
        if (scrollbar && scrollbarHandle) {
            const progress = current / (totalWidth - window.innerWidth);
            const handlePosition = progress * (scrollbar.offsetWidth - scrollbarHandle.offsetWidth);
            scrollbarHandle.style.transform = `translate3d(${handlePosition}px, 0, 0)`;
        }
        
        // 現在のスライドを判定
        updateActiveSlide(current);
        
        requestAnimationFrame(updateScroll);
    }
    
    updateScroll();
    
    // マウスホイールでの横スクロール
    let wheelHandler = function(e) {
        if (isLoading || isScrolling) return;
        
        // デフォルトの縦スクロールを防止
        e.preventDefault();
        
        const delta = e.deltaY || e.deltaX || e.wheelDelta;
        const scrollSpeed = 1;
        
        window.scrollTo(0, window.scrollY + (delta * scrollSpeed));
    };
    
    // passive: false を設定して preventDefault() を有効にする
    window.addEventListener('wheel', wheelHandler, { passive: false });
    
    // タッチデバイス対応
    let touchStartX = 0;
    let touchStartY = 0;
    
    window.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    window.addEventListener('touchmove', function(e) {
        if (isLoading) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // 横スワイプの方が大きい場合
        if (Math.abs(diffX) > Math.abs(diffY)) {
            e.preventDefault();
            window.scrollTo(0, window.scrollY + diffX);
            
            touchStartX = touchEndX;
        }
    }, { passive: false });
    
    // キーボードナビゲーション
    window.addEventListener('keydown', function(e) {
        if (isLoading) return;
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            navigateToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            navigateToSlide(currentSlide - 1);
        }
    });
}

// アクティブなスライドを更新
function updateActiveSlide(scrollPosition) {
    const slides = document.querySelectorAll('.js-slide');
    let accumulatedWidth = 0;
    
    slides.forEach((slide, index) => {
        const slideWidth = slide.classList.contains('slide--wide') ? 
            window.innerWidth * 1.5 : window.innerWidth;
        
        if (scrollPosition >= accumulatedWidth - 100 && 
            scrollPosition < accumulatedWidth + slideWidth - 100) {
            
            if (currentSlide !== index) {
                // 前のスライドを非アクティブに
                slides[currentSlide]?.classList.remove('is-active');
                
                // 新しいスライドをアクティブに
                slide.classList.add('is-active');
                currentSlide = index;
            }
        }
        
        accumulatedWidth += slideWidth;
    });
}

// 特定のスライドにナビゲート
function navigateToSlide(index) {
    const slides = document.querySelectorAll('.js-slide');
    
    if (index < 0 || index >= slides.length) return;
    
    scrollToSlide(index);
}

// スライドまでスクロール
function scrollToSlide(index) {
    const slides = document.querySelectorAll('.js-slide');
    let targetPosition = 0;
    
    for (let i = 0; i < index; i++) {
        if (slides[i].classList.contains('slide--wide')) {
            targetPosition += window.innerWidth * 1.5;
        } else {
            targetPosition += window.innerWidth;
        }
    }
    
    isScrolling = true;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
    
    setTimeout(() => {
        isScrolling = false;
    }, 1000);
}

// スライドアニメーション
function initSlideAnimations() {
    // タイトルアニメーション
    const titles = document.querySelectorAll('.js-title');
    
    titles.forEach(title => {
        // 各行を span で囲む
        const lines = title.querySelectorAll('.title-line');
        lines.forEach(line => {
            const text = line.textContent;
            line.innerHTML = `<span>${text}</span>`;
        });
        
        // シマーエフェクトを追加
        title.classList.add('shimmer-effect');
    });
    
}

// スライドアニメーションをトリガー
function triggerSlideAnimations(slide) {
    // モバイルでは画像が消えないようにアニメーションを制限
    if (!isMobile) {
        // デスクトップでのアニメーション
        const titleSpans = slide.querySelectorAll('.title-line span');
        titleSpans.forEach((span, index) => {
            span.style.transform = 'translateY(100%)';
            setTimeout(() => {
                span.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                span.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // サブタイトルとディスクリプション
        const subtitle = slide.querySelector('.slide-subtitle');
        const description = slide.querySelector('.slide-description');
        
        if (subtitle) {
            subtitle.style.opacity = '0';
            subtitle.style.transform = 'translateY(20px)';
            setTimeout(() => {
                subtitle.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                subtitle.style.opacity = '1';
                subtitle.style.transform = 'translateY(0)';
            }, 300);
        }
        
        if (description) {
            description.style.opacity = '0';
            description.style.transform = 'translateY(20px)';
            setTimeout(() => {
                description.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                description.style.opacity = '1';
                description.style.transform = 'translateY(0)';
            }, 500);
        }
        
        // ホテルアイテムのアニメーション
        const hotelItems = slide.querySelectorAll('.hotel-item');
        hotelItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            setTimeout(() => {
                item.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 200 + (index * 100));
        });
    }
}

// チルト効果（デスクトップのみ）
function initTiltEffect() {
    if (isMobile) return;
    
    const tiltElements = document.querySelectorAll('.js-tilt');
    
    if (tiltElements.length === 0) return;
    
    tiltElements.forEach(element => {
        element.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

// パーティクルエフェクト
function initParticleEffects() {
    const heroSlide = document.querySelector('#hero');
    if (!heroSlide) return;
    
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particles';
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 5 + 5) + 's';
        particleContainer.appendChild(particle);
    }
    
    heroSlide.appendChild(particleContainer);
}

// ビデオの再生確認
function ensureVideoPlayback() {
    const video = document.querySelector('.hero-video');
    if (video) {
        video.play().catch(e => {
            console.log('ビデオの自動再生がブロックされました:', e);
        });
    }
}

// リサイズ処理
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        const wasMobile = isMobile;
        isMobile = window.innerWidth <= 768;
        
        // モバイル/デスクトップ切り替え時の処理
        if (wasMobile !== isMobile) {
            // 既存のObserverを削除
            if (mobileScrollObserver) {
                mobileScrollObserver.disconnect();
                mobileScrollObserver = null;
            }
            
            // 適切なスクロールを再初期化
            if (isMobile) {
                // デスクトップからモバイルに切り替え
                document.body.style.height = 'auto';
                const scrollContent = document.querySelector('[data-scroll-content]');
                if (scrollContent) {
                    scrollContent.style.transform = 'none';
                }
                initMobileScroll();
            } else {
                // モバイルからデスクトップに切り替え
                initHorizontalScroll();
            }
        } else if (!isMobile) {
            // デスクトップでのリサイズ
            initHorizontalScroll();
        }
    }, 250);
});

// ビデオの再生を確認
setTimeout(ensureVideoPlayback, 2000);

// 画像エラーハンドリング
function initImageErrorHandling() {
    const hotelImages = document.querySelectorAll('.hotel-item__image img');
    
    hotelImages.forEach(img => {
        img.addEventListener('error', function() {
            console.log('画像の読み込みに失敗しました:', this.src);
            // フォールバック画像を設定
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiPuOBiumkmOOBruiqrei+vOOBv+OBq+Wksei2pOOBl+OBvuOBl+OBnyBOTyBJTUFHRTwvdGV4dD4KPC9zdmc+';
        });
        
        img.addEventListener('load', function() {
            console.log('画像の読み込みが完了しました:', this.src);
        });
    });
}