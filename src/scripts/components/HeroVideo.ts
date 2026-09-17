import heroVideoUrl from '../../videos/hero/waterfront-scrub.mp4?url';

const FRAME_DURATION = 1 / 24;
const FOLLOW_DELAY = 70;
const INTRO_DURATION = 1500;
const INTRO_END_TIME = 3.75;
const PROGRESS_EPSILON = 0.0005;

export class HeroVideo {
  private readonly root: HTMLElement;
  private readonly video: HTMLVideoElement;
  private readonly reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  private duration = 0;
  private scrollProgress = 0;
  private introProgress = 0;
  private introStartedAt: number | null = null;
  private isPageRevealed = false;
  private targetProgress = 0;
  private renderedProgress = 0;
  private animationFrame = 0;
  private previousFrameTime = 0;
  private isActive = false;
  private loadPromise: Promise<void> | null = null;
  private blobUrl = '';
  private hasReportedResult = false;

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

    const preloader = document.querySelector<HTMLElement>('[data-page-preloader]');
    this.isPageRevealed =
      !preloader || Boolean(preloader.hidden) || preloader.classList.contains('is-hiding');
    document.addEventListener('page-preloader:hiding', this.handlePageReveal, { once: true });

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

    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.handleMetadata();
      this.handleFrameReady();
    }
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
    this.introStartedAt = null;
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

    if (this.needsRender()) {
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
    this.reportResult('hero-video:ready');
    this.startIntro();
  };

  private handlePageReveal = (): void => {
    this.isPageRevealed = true;
    this.startIntro();
  };

  private startIntro(): void {
    if (
      !this.isActive ||
      !this.isPageRevealed ||
      !this.root.classList.contains('is-video-ready') ||
      this.introStartedAt !== null ||
      this.introProgress === 1
    ) {
      return;
    }

    this.introStartedAt = performance.now() - this.introProgress * INTRO_DURATION;
    this.requestRender();
  }

  private handleProgress = (): void => {
    if (!this.isActive || this.video.seeking || !this.needsRender()) {
      return;
    }

    this.requestRender();
  };

  private handleError = (): void => {
    this.deactivate();
    this.root.classList.remove('is-video-loading');
    this.root.classList.remove('is-video-ready');
    this.root.classList.add('is-video-unavailable');
    this.reportResult('hero-video:unavailable');
  };

  private reportResult(eventName: 'hero-video:ready' | 'hero-video:unavailable'): void {
    if (this.hasReportedResult) return;

    this.hasReportedResult = true;
    document.dispatchEvent(new CustomEvent(eventName));
  }

  private loadVideo(): void {
    if (this.blobUrl) {
      this.attachVideo();
      return;
    }

    if (this.loadPromise) return;

    // Native media loading uses byte ranges and starts new requests for every seek.
    // Buffer the small scrub video once so scrolling never depends on the network.
    // Vite keeps asset URLs stable in development; revalidate replaced videos there.
    this.loadPromise = fetch(heroVideoUrl, {
      cache: import.meta.env.DEV ? 'no-cache' : 'force-cache',
    })
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

    this.scrollProgress = Math.min(Math.max(progress, 0), 1);
    this.updateTargetProgress();
    this.root.style.setProperty('--home-intro-progress', this.scrollProgress.toFixed(4));
    const heroExit = Math.min(this.scrollProgress / 0.35, 1);

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

    // Unlock media in the gesture without letting native playback compete with scrubbing.
    const playPromise = this.video.play();
    this.video.pause();
    void playPromise.catch(() => {
      // An immediate pause can reject play(); frame seeking still works.
    });
    this.requestRender();
  };

  private updateTargetProgress(): void {
    const introEnd = this.duration > 0 ? Math.min(INTRO_END_TIME / this.duration, 1) : 0;
    const easedIntro = this.introProgress * this.introProgress * (3 - 2 * this.introProgress);
    const baseProgress = introEnd * easedIntro;

    // One continuous target for both inputs: early scrolling adds to the intro,
    // and scrolling back after the intro returns to the already illuminated scene.
    this.targetProgress = baseProgress + (1 - baseProgress) * this.scrollProgress;
  }

  private needsRender(): boolean {
    return (
      (this.introStartedAt !== null && this.introProgress < 1) ||
      Math.abs(this.targetProgress - this.renderedProgress) > PROGRESS_EPSILON
    );
  }

  private requestRender(): void {
    if (this.animationFrame) return;

    this.animationFrame = window.requestAnimationFrame(this.render);
  }

  private render = (time: number): void => {
    this.animationFrame = 0;

    if (!this.isActive || this.duration === 0) return;

    if (this.introStartedAt !== null) {
      this.introProgress = Math.min(Math.max((time - this.introStartedAt) / INTRO_DURATION, 0), 1);
      this.updateTargetProgress();
    }

    const elapsed = this.previousFrameTime ? Math.min(time - this.previousFrameTime, 64) : 16;
    const follow = 1 - Math.exp(-elapsed / FOLLOW_DELAY);

    this.previousFrameTime = time;
    this.renderedProgress += (this.targetProgress - this.renderedProgress) * follow;

    if (Math.abs(this.targetProgress - this.renderedProgress) < PROGRESS_EPSILON) {
      this.renderedProgress = this.targetProgress;
    }

    if (this.video.seeking) return;

    this.seekToRenderedProgress();

    if (this.needsRender() && !this.video.seeking) {
      this.requestRender();
    } else if (!this.needsRender()) {
      this.previousFrameTime = 0;
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
