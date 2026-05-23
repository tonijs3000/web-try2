document.addEventListener('DOMContentLoaded', () => {
    const YOUTUBE_API_KEY = '${{ secrets.API_KEY}}';

    const gridView = document.getElementById('gridView');
    const videoDetail = document.getElementById('videoDetail');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    const videoDesc = document.getElementById('videoDesc');
    const backBtn = document.getElementById('backBtn');
    const gridItems = document.querySelectorAll('.grid-item');
    const menuButtons = document.querySelectorAll('.menu button');

    const logoLink = document.querySelector('.logo-2');
    const logoImg = document.querySelector('.logo-img');

    const isTouchPreviewDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    let previewedTouchItem = null;

    if (videoDesc) {
        videoDesc.style.display = 'none';
    }

    if (logoLink && logoImg) {
        let rotation = 0;
        let speed = 0;
        let targetSpeed = 0;
        let lastTime = null;
        let isReturning = false;
        let returnStartRotation = 0;
        let returnEndRotation = 0;
        let returnStartTime = 0;
        let hasInitialSpinPlayed = false;

        const maxSpeed = 0.15;
        const acceleration = 0.035;
        const deceleration = 0.018;
        const returnDuration = 1800;

        function applyLogoRotation() {
            logoImg.style.transform = `scaleY(0.8) scaleX(0.88) rotateY(${rotation}deg)`;
        }

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function animateLogo(time) {
            if (lastTime === null) {
                lastTime = time;
            }

            const delta = time - lastTime;
            lastTime = time;

            if (isReturning) {
                const progress = Math.min((time - returnStartTime) / returnDuration, 1);
                const easedProgress = easeOutCubic(progress);

                rotation = returnStartRotation + (returnEndRotation - returnStartRotation) * easedProgress;
                applyLogoRotation();

                if (progress < 1) {
                    requestAnimationFrame(animateLogo);
                } else {
                    rotation = 0;
                    speed = 0;
                    targetSpeed = 0;
                    isReturning = false;
                    lastTime = null;
                    applyLogoRotation();
                }

                return;
            }

            if (speed < targetSpeed) {
                speed = Math.min(speed + acceleration * delta, targetSpeed);
            } else if (speed > targetSpeed) {
                speed = Math.max(speed - deceleration * delta, targetSpeed);
            }

            rotation += speed * delta;
            applyLogoRotation();

            if (targetSpeed === 0 && speed <= 0.001) {
                const currentRotation = rotation % 360;
                const normalizedRotation = currentRotation < 0 ? currentRotation + 360 : currentRotation;

                returnStartRotation = rotation;
                returnEndRotation = rotation + (360 - normalizedRotation);
                returnStartTime = time;
                isReturning = true;

                requestAnimationFrame(animateLogo);
                return;
            }

            requestAnimationFrame(animateLogo);
        }

        logoLink.addEventListener('mouseenter', () => {
            isReturning = false;
            targetSpeed = maxSpeed;

            if (lastTime === null) {
                requestAnimationFrame(animateLogo);
            }
        });

        logoLink.addEventListener('mouseleave', () => {
            targetSpeed = 0;
        });

        function playInitialLogoSpin(time) {
            const duration = 2400;

            if (!hasInitialSpinPlayed) {
                hasInitialSpinPlayed = true;
                playInitialLogoSpin.startTime = time;
            }

            const progress = Math.min((time - playInitialLogoSpin.startTime) / duration, 1);
            const easedProgress = easeOutCubic(progress);

            rotation = 360 * easedProgress;
            applyLogoRotation();

            if (progress < 1) {
                requestAnimationFrame(playInitialLogoSpin);
            } else {
                rotation = 0;
                speed = 0;
                targetSpeed = 0;
                lastTime = null;
                isReturning = false;
                applyLogoRotation();
            }
        }

        requestAnimationFrame(playInitialLogoSpin);
    }

    function clearTouchPreviews(exceptItem = null) {
        gridItems.forEach(item => {
            if (item !== exceptItem) {
                item.classList.remove('is-touch-preview');
            }
        });

        if (!exceptItem) {
            previewedTouchItem = null;
        }
    }

    async function fetchVideoData() {
        const ids = Array.from(gridItems)
            .map(item => item.dataset.videoId)
            .join(',');

        if (!ids) return;

        try {
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${YOUTUBE_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.items) return;

            data.items.forEach(video => {
                const id = video.id;
                const title = video.snippet.title;

                const item = document.querySelector(`.grid-item[data-video-id="${id}"]`);

                if (item) {
                    item.dataset.title = title;

                    const overlayH3 = item.querySelector('.overlay h3');
                    const overlayP = item.querySelector('.overlay p');

                    if (overlayH3) overlayH3.textContent = title;

                    if (overlayP) {
                        overlayP.textContent = '';
                        overlayP.style.display = 'none';
                    }
                }
            });
        } catch (e) {
            console.error('Failed to fetch YouTube data:', e);
        }
    }

    if (gridItems.length > 0) {
        fetchVideoData();
    }

    if (gridView && videoDetail && videoPlayer && backBtn) {
        gridItems.forEach(item => {
            item.addEventListener('click', event => {
                if (isTouchPreviewDevice && previewedTouchItem !== item) {
                    event.preventDefault();
                    event.stopPropagation();

                    clearTouchPreviews(item);
                    item.classList.add('is-touch-preview');
                    previewedTouchItem = item;

                    return;
                }

                const videoId = item.dataset.videoId;
                const title = item.dataset.title || '';

                clearTouchPreviews();

                videoPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
                videoTitle.textContent = title;

                gridView.style.display = 'none';
                videoDetail.style.display = 'block';

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });

        document.addEventListener('click', event => {
            if (!isTouchPreviewDevice) return;

            const clickedGridItem = event.target.closest('.grid-item');

            if (!clickedGridItem) {
                clearTouchPreviews();
            }
        });

        backBtn.addEventListener('click', () => {
            videoPlayer.src = '';

            clearTouchPreviews();

            gridView.style.display = 'grid';
            videoDetail.style.display = 'none';

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        window.addEventListener('popstate', () => {
            if (videoDetail.style.display === 'block') {
                backBtn.click();
            }
        });
    }

    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;

            if (section === 'main') {
                window.location.href = '/';
            } else if (section === 'about') {
                window.location.href = '/about/';
            } else if (section === 'info') {
                window.location.href = '/info/';
            }
        });
    });
});
