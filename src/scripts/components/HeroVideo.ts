const DESKTOP_QUERY = '(min-width: 577px)';
const INITIAL_PROGRESS = 0.62;
const FRAME_DURATION = 1 / 24;
const FOLLOW_DELAY = 85;

export class HeroVideo {
  private readonly root: HTMLElement;
  private readonly video: HTMLVideoElement;
  private readonly desktopMedia = window.matchMedia(DESKTOP_QUERY);
  private readonly reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  private duration = 0;
  private targetProgress = INITIAL_PROGRESS;
  private renderedProgress = INITIAL_PROGRESS;
  private animationFrame = 0;
  private previousFrameTime = 0;
  private isActive = false;

  constructor(root: HTMLElement) {
    const video = root.querySelector<HTMLVideoElement>('[data-hero-video-element]');

    if (!video) throw new Error('HeroVideo requires a video element.');

    this.root = root;
    this.video = video;

    this.desktopMedia.addEventListener('change', this.sync);
    this.reducedMotionMedia.addEventListener('change', this.sync);
    this.video.addEventListener('loadedmetadata', this.handleMetadata);
    this.video.addEventListener('seeked', this.handleSeeked);

    this.sync();
  }

  private sync = (): void => {
    if (this.desktopMedia.matches && !this.reducedMotionMedia.matches) {
      this.activate();
    } else {
      this.deactivate();
    }
  };

  private activate(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.root.addEventListener('pointermove', this.handlePointerMove);
    this.video.preload = 'auto';

    if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      this.handleMetadata();
    } else {
      this.video.load();
    }
  }

  private deactivate(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.root.removeEventListener('pointermove', this.handlePointerMove);
    this.root.classList.remove('is-video-ready');
    this.video.pause();
    window.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.previousFrameTime = 0;
  }

  private handleMetadata = (): void => {
    if (!this.isActive || !Number.isFinite(this.video.duration)) return;

    this.duration = Math.max(this.video.duration - FRAME_DURATION, 0);
    this.targetProgress = INITIAL_PROGRESS;
    this.renderedProgress = INITIAL_PROGRESS;

    const initialTime = this.duration * INITIAL_PROGRESS;

    if (Math.abs(this.video.currentTime - initialTime) < FRAME_DURATION / 2) {
      if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.root.classList.add('is-video-ready');
      }
      return;
    }

    this.video.currentTime = initialTime;
  };

  private handleSeeked = (): void => {
    if (!this.isActive) return;

    this.root.classList.add('is-video-ready');

    if (Math.abs(this.targetProgress - this.renderedProgress) > 0.0005) {
      this.requestRender();
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || this.duration === 0) return;

    const bounds = this.root.getBoundingClientRect();
    const progress = (event.clientX - bounds.left) / bounds.width;

    this.targetProgress = Math.min(Math.max(progress, 0), 1);
    this.requestRender();
  };

  private requestRender(): void {
    if (this.animationFrame) return;

    this.animationFrame = window.requestAnimationFrame(this.render);
  }

  private render = (time: number): void => {
    this.animationFrame = 0;

    if (!this.isActive) return;

    const elapsed = this.previousFrameTime ? Math.min(time - this.previousFrameTime, 64) : 16;
    const follow = 1 - Math.exp(-elapsed / FOLLOW_DELAY);

    this.previousFrameTime = time;
    this.renderedProgress += (this.targetProgress - this.renderedProgress) * follow;

    if (Math.abs(this.targetProgress - this.renderedProgress) < 0.0005) {
      this.renderedProgress = this.targetProgress;
      this.previousFrameTime = 0;
    }

    const nextTime = this.duration * this.renderedProgress;

    if (!this.video.seeking && Math.abs(this.video.currentTime - nextTime) >= FRAME_DURATION / 2) {
      this.video.currentTime = nextTime;
    }

    if (this.video.seeking || this.renderedProgress !== this.targetProgress) {
      this.requestRender();
    }
  };

  static initAll(): HeroVideo[] {
    return [...document.querySelectorAll<HTMLElement>('[data-hero-video]')].map(
      (root) => new HeroVideo(root),
    );
  }
}
