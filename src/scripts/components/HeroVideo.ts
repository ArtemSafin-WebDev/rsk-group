import heroVideoUrl from '../../videos/hero/day-night-scrub.mp4?url';

const FRAME_DURATION = 1 / 24;
const FOLLOW_DELAY = 70;

export class HeroVideo {
  private readonly root: HTMLElement;
  private readonly video: HTMLVideoElement;
  private readonly reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  private duration = 0;
  private targetProgress = 0;
  private renderedProgress = 0;
  private animationFrame = 0;
  private previousFrameTime = 0;
  private isActive = false;
  private loadPromise: Promise<void> | null = null;
  private blobUrl = '';

  constructor(root: HTMLElement) {
    const video = root.querySelector<HTMLVideoElement>('[data-hero-video-element]');

    if (!video) throw new Error('HeroVideo requires a video element.');

    this.root = root;
    this.video = video;

    this.reducedMotionMedia.addEventListener('change', this.sync);
    this.video.addEventListener('loadedmetadata', this.handleMetadata);
    this.video.addEventListener('loadeddata', this.handleFrameReady);
    this.video.addEventListener('canplay', this.handleFrameReady);
    this.video.addEventListener('progress', this.handleProgress);
    this.video.addEventListener('seeked', this.handleSeeked);
    this.video.addEventListener('error', this.handleError);

    this.sync();
  }

  private sync = (): void => {
    if (this.reducedMotionMedia.matches) {
      this.deactivate();
    } else {
      this.activate();
    }
  };

  private activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.root.classList.add('is-video-loading');
    this.root.classList.remove('is-video-unavailable');
    window.addEventListener('scroll', this.handleViewportChange, { passive: true });
    window.addEventListener('resize', this.handleViewportChange, { passive: true });
    document.addEventListener('touchstart', this.unlockMobileVideo, {
      once: true,
      passive: true,
    });

    this.video.preload = 'auto';
    this.loadVideo();
  }

  private deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    window.removeEventListener('scroll', this.handleViewportChange);
    window.removeEventListener('resize', this.handleViewportChange);
    document.removeEventListener('touchstart', this.unlockMobileVideo);
    this.root.classList.remove('is-video-loading');
    this.root.classList.remove('is-video-ready');
    this.video.pause();
    window.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.previousFrameTime = 0;
  }

  private handleMetadata = (): void => {
    if (!this.isActive || !Number.isFinite(this.video.duration)) return;

    this.duration = Math.max(this.video.duration - FRAME_DURATION, 0);
    this.updateProgress(true);
    this.seekToRenderedProgress();
  };

  private handleSeeked = (): void => {
    if (!this.isActive) return;

    this.handleFrameReady();

    if (Math.abs(this.targetProgress - this.renderedProgress) > 0.0005) {
      this.requestRender();
    }
  };

  private handleFrameReady = (): void => {
    if (
      !this.isActive ||
      this.video.seeking ||
      this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return;
    }

    this.root.classList.remove('is-video-loading');
    this.root.classList.add('is-video-ready');
  };

  private handleProgress = (): void => {
    if (
      !this.isActive ||
      this.video.seeking ||
      Math.abs(this.targetProgress - this.renderedProgress) <= 0.0005
    ) {
      return;
    }

    this.requestRender();
  };

  private handleError = (): void => {
    this.root.classList.remove('is-video-loading');
    this.root.classList.remove('is-video-ready');
    this.root.classList.add('is-video-unavailable');
  };

  private loadVideo(): void {
    if (this.blobUrl) {
      this.attachVideo();
      return;
    }

    if (this.loadPromise) return;

    // Native media loading uses byte ranges and starts new requests for every seek.
    // Buffer the small scrub video once so scrolling never depends on the network.
    this.loadPromise = fetch(heroVideoUrl, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load hero video: ${response.status}`);

        return response.blob();
      })
      .then((blob) => {
        this.blobUrl = URL.createObjectURL(blob);

        if (this.isActive) this.attachVideo();
      })
      .catch(this.handleError);
  }

  private attachVideo(): void {
    if (this.video.src === this.blobUrl) return;

    this.video.src = this.blobUrl;
    this.video.load();
  }

  private handleViewportChange = (): void => {
    this.updateProgress();
  };

  private updateProgress(force = false): void {
    const bounds = this.root.getBoundingClientRect();
    const scrollDistance = Math.max(this.root.offsetHeight - window.innerHeight, 1);
    const progress = -bounds.top / scrollDistance;

    this.targetProgress = Math.min(Math.max(progress, 0), 1);
    this.root.style.setProperty('--home-intro-progress', this.targetProgress.toFixed(4));
    const heroExit = Math.min(this.targetProgress / 0.35, 1);

    this.root.style.setProperty('--home-intro-hero-exit', heroExit.toFixed(4));
    this.root.style.setProperty('--home-intro-hero-offset', `${(-3 * heroExit).toFixed(3)}rem`);

    if (force) {
      this.renderedProgress = this.targetProgress;
      this.previousFrameTime = 0;
    }

    if (this.duration > 0) this.requestRender();
  }

  private unlockMobileVideo = (): void => {
    if (!this.isActive || this.video.readyState < HTMLMediaElement.HAVE_METADATA) return;

    void this.video
      .play()
      .then(() => {
        this.video.pause();
        this.updateProgress(true);
        this.seekToRenderedProgress();
      })
      .catch(() => {
        // The poster remains visible if a browser blocks media activation.
      });
  };

  private requestRender(): void {
    if (this.animationFrame) return;

    this.animationFrame = window.requestAnimationFrame(this.render);
  }

  private render = (time: number): void => {
    this.animationFrame = 0;

    if (!this.isActive || this.duration === 0) return;

    const elapsed = this.previousFrameTime ? Math.min(time - this.previousFrameTime, 64) : 16;
    const follow = 1 - Math.exp(-elapsed / FOLLOW_DELAY);

    this.previousFrameTime = time;
    this.renderedProgress += (this.targetProgress - this.renderedProgress) * follow;

    if (Math.abs(this.targetProgress - this.renderedProgress) < 0.0005) {
      this.renderedProgress = this.targetProgress;
      this.previousFrameTime = 0;
    }

    if (this.video.seeking) return;

    this.seekToRenderedProgress();

    if (this.renderedProgress !== this.targetProgress && !this.video.seeking) {
      this.requestRender();
    }
  };

  private seekToRenderedProgress(): void {
    const nextTime = this.duration * this.renderedProgress;

    if (Math.abs(this.video.currentTime - nextTime) < FRAME_DURATION / 2) {
      this.handleFrameReady();
      return;
    }

    this.video.currentTime = nextTime;
  }

  static initAll(): HeroVideo[] {
    return [...document.querySelectorAll<HTMLElement>('[data-hero-video]')].map(
      (root) => new HeroVideo(root),
    );
  }
}
