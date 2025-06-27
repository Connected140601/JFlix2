document.addEventListener('DOMContentLoaded', () => {
  const installButton = document.getElementById('install-app-button');

  if (installButton) {
    installButton.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!document.getElementById('install-modal')) {
        const response = await fetch('/templates/install-modal.html');
        const modalHTML = await response.text();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupModal();
      }
      document.getElementById('install-modal').style.display = 'block';
    });
  }

  function setupModal() {
    const modal = document.getElementById('install-modal');
    const closeButton = modal.querySelector('.close-button');
    const iosButton = modal.querySelector('#ios-install-btn');
    const androidButton = modal.querySelector('#android-install-btn');
    let video = modal.querySelector('#install-video'); // Use let to allow reassignment

    const closeModal = () => {
      modal.style.display = 'none';
      video.pause();
      video.style.display = 'none';
      // Stop the video from continuing to load by removing its sources
      while (video.firstChild) {
        video.removeChild(video.firstChild);
      }
      video.load(); // With no source, this effectively stops loading
      iosButton.classList.remove('selected');
      androidButton.classList.remove('selected');
    };

    closeButton.onclick = closeModal;
    window.onclick = (event) => {
      if (event.target === modal) {
        closeModal();
      }
    };

    const playVideoFor = (platform) => {
      const isNoAds = window.location.pathname.includes('/NOADS/');
      let videoPath;

      if (platform === 'ios') {
        videoPath = isNoAds ? '/NOADS/images/iOS Safari.MP4' : '/images/iOS Safari.MP4';
        iosButton.classList.add('selected');
        androidButton.classList.remove('selected');
      } else {
        videoPath = isNoAds ? '/NOADS/images/Android_noaudio.mp4' : '/images/Android_noaudio.mp4';
        androidButton.classList.add('selected');
        iosButton.classList.remove('selected');
      }

      // --- Start of the new robust video loading logic ---
      video.pause();
      
      // Clone the video node to completely reset its internal state and listeners
      const newVideo = video.cloneNode(false); // false = don't clone children (the <source> tag)
      video.parentNode.replaceChild(newVideo, video);
      video = newVideo; // From now on, use the new video element

      const source = document.createElement('source');
      source.setAttribute('src', `${videoPath}?t=${new Date().getTime()}`);
      source.setAttribute('type', 'video/mp4');
      video.appendChild(source);
      // --- End of the new robust video loading logic ---

      video.style.display = 'block';

      video.addEventListener('canplay', function onCanPlay() {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error(`Video autoplay was prevented for ${platform}:`, error);
            video.controls = true;
          });
        }
      }, { once: true });
      
      video.addEventListener('error', () => {
        console.error('A video error occurred. Code:', video.error.code, 'Message:', video.error.message);
      }, { once: true });

      video.load();
    };

    iosButton.onclick = () => playVideoFor('ios');
    androidButton.onclick = () => playVideoFor('android');
  }
});
