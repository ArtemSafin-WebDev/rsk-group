import Lenis from 'lenis';

export class SmoothScroll {
  readonly lenis: Lenis;

  constructor() {
    this.lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      lerp: 0.1,
      smoothWheel: true,
    });
  }

  static init(): SmoothScroll {
    return new SmoothScroll();
  }
}
