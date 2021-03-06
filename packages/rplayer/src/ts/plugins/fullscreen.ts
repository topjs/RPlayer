import { FULL } from '../config/classname';
import { EXIT_FULL_SCREEN, FULL_SCREEN } from '../config/lang';
import Events from '../events';
import icons from '../icons';
import RPlayer from '../rplayer';
import { isFn, ua } from '../utils';
import Tray from '../widgets/tray';

export default class Fullscreen {
  private readonly tray: Tray;
  private readonly player: RPlayer;
  readonly prefix = this.getPrefix();
  private target: HTMLElement;

  constructor(player: RPlayer) {
    this.player = player;
    this.setTarget();

    (document as any).addEventListener(
      this.prefix === 'ms'
        ? 'MSFullscreenChange'
        : `${this.prefix}fullscreenchange`,
      this.changeHandler
    );

    if (this.isActive) player.addClass(FULL);
    player.on(Events.PLAYER_DBLCLICK, this.playerDblClickHandler);
    player.on(Events.ENTER_FULLSCREEN, this.onEnterFullscreen);
    player.on(Events.EXIT_FULLSCREEN, this.onExitFullscreen);

    this.tray = new Tray({
      label: player.t(FULL_SCREEN),
      icons: [icons.enterFullscreen(), icons.exitFullscreen()],
      labelPos: 'right',
      onClick: this.onClick,
    });

    player.controls.addTray(this.tray.dom, -1);
  }

  private playerDblClickHandler = (ev: Event): void => {
    ev.preventDefault();
    if (this.player.controls.dom.contains(ev.target as any)) return;
    this.toggle();
  };

  private changeHandler = (): void => {
    let evt = '';
    if (this.isActive) {
      this.player.addClass(FULL);
      evt = Events.ENTER_FULLSCREEN;
    } else {
      this.player.removeClass(FULL);
      evt = Events.EXIT_FULLSCREEN;
    }
    this.player.emit(evt);
  };

  private getPrefix(): string {
    if (isFn(document.exitFullscreen)) return '';

    let prefix = '';
    ['webkit', 'moz', 'ms'].forEach((p) => {
      if (
        isFn((document as any)[`${p}ExitFullscreen`]) ||
        isFn((document as any)[`${p}CancelFullScreen`])
      ) {
        prefix = p;
      }
    });

    return prefix;
  }

  get requestFullscreen(): Function {
    return (
      HTMLElement.prototype.requestFullscreen ||
      (HTMLElement.prototype as any).webkitRequestFullscreen ||
      (HTMLElement.prototype as any).mozRequestFullScreen ||
      (HTMLElement.prototype as any).msRequestFullscreen
    );
  }

  get exitFullscreen(): Function {
    return (
      HTMLDocument.prototype.exitFullscreen ||
      (HTMLDocument.prototype as any).webkitExitFullscreen ||
      (HTMLDocument.prototype as any).cancelFullScreen ||
      (HTMLDocument.prototype as any).mozCancelFullScreen ||
      (HTMLDocument.prototype as any).msExitFullscreen
    );
  }

  get fullscreenElement(): HTMLElement {
    return (
      document.fullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      (document as any).webkitFullscreenElement
    );
  }

  get isActive(): boolean {
    return this.fullscreenElement === this.target;
  }

  private onClick = (): void => {
    this.player.fullscreen.toggle();
  };

  private onEnterFullscreen = (): void => {
    this.tray.changeTip(this.player.t(EXIT_FULL_SCREEN));
    this.tray.showIcon(1);
  };

  private onExitFullscreen = (): void => {
    this.tray.changeTip(this.player.t(FULL_SCREEN));
    this.tray.showIcon(0);
  };

  setTarget(dom?: HTMLElement, video?: HTMLVideoElement): void {
    this.target =
      (dom && ua.isIos ? video : dom) ||
      (ua.isIos ? this.player.media : this.player.dom);
    if (this.isActive) this.enter();
  }

  enter(): void {
    if (ua.isIos) {
      (this.target as any).webkitEnterFullscreen();
    } else {
      this.requestFullscreen.call(this.target, { navigationUI: 'hide' });
    }
  }

  exit(): void {
    if (ua.isIos) {
      (this.target as any).webkitExitFullscreen();
    } else {
      this.exitFullscreen.call(document);
    }
  }

  toggle(): void {
    if (this.isActive) {
      this.exit();
    } else {
      this.enter();
    }
  }
}
