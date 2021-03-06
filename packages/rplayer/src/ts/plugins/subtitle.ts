import { CAPTION, CAPTION_ACTIVE } from '../config/classname';
import { CAPTIONS, CLOSE } from '../config/lang';
import Select, { SelectChangeFn } from '../controls/setting/select';
import icons from '../icons';
import RPlayer from '../rplayer';
import { ajax, newElement, ua } from '../utils';
import Tray from '../widgets/tray';

interface CaptionItem {
  label?: string;
  index: number;
  track?: TextTrack;
  show?: boolean;
}

export interface SubtitleOpts {
  style?: Partial<CSSStyleDeclaration>;
  checked?: number;
  captions: HTMLTrackElement[];
}

export default class Subtitle {
  private readonly player: RPlayer;
  private tray: Tray;
  private items: CaptionItem[];
  private prev: CaptionItem = {} as CaptionItem;
  private select: Select;
  private readonly dom: HTMLElement;

  constructor(player: RPlayer) {
    this.player = player;
    const { captions, checked, style } = player.options.subtitle;
    if (captions && captions.length) {
      this.dom = newElement(CAPTION);
      player.appendChild(this.dom);

      this.update(captions, checked);
      if (style) this.updateUI(style);
    }
  }

  private optionChangeHandler: SelectChangeFn = (item, update): void => {
    if (this.prev.track) {
      this.prev.show = false;
      this.removeCueEvent();
    }

    if (item.track) {
      this.addCueEvent(item.track);
      this.active();
      this.prev = item as CaptionItem;
      this.show();
    } else {
      this.hide();
      this.deactivate();
    }

    update();
  };

  private cueChangeHandler = (ev: Event): void => {
    const cues: VTTCue[] = [...((ev.target as any).activeCues || [])];
    if (cues) {
      cues.forEach((cue) => {
        this.renderText(cue.getCueAsHTML().firstChild.textContent);
      });
    }
  };

  private addCueEvent(track = this.prev.track): void {
    this.cueChangeHandler({ target: track } as any);
    track.addEventListener('cuechange', this.cueChangeHandler);
  }

  private removeCueEvent(): void {
    this.prev.track.removeEventListener('cuechange', this.cueChangeHandler);
    this.renderText('');
  }

  private run(): void {
    const tracks = this.player.media.textTracks;
    if (!tracks || !tracks.length) return;

    this.items.push({
      label: this.player.t(CLOSE),
      index: 0,
    });
    for (let i = 0, l = tracks.length; i < l; i++) {
      const track = tracks[i];
      track.mode = 'hidden';
      this.items.push({ track, index: i + 1, label: track.label, show: false });
    }

    if (!this.select) {
      this.select = this.player.controls.addSettingItem({
        label: this.player.t(CAPTIONS),
        options: this.items as any,
        onChange: this.optionChangeHandler,
      }) as Select;
    }

    if (!this.tray) {
      this.tray = new Tray({
        label: this.player.t(CAPTIONS),
        icons: [icons.cc()],
        onClick: this.onClick,
      });
      this.deactivate();
      this.player.controls.addTray(this.tray.dom, -3);
    }

    if (this.prev.index) {
      this.toggle();
    }
  }

  private onClick = (): void => {
    this.toggle();
  };

  private active = (): void => {
    this.tray.enable();
  };

  private deactivate = (): void => {
    this.tray.disable();
  };

  renderText(text: string): void {
    this.dom.innerHTML = text;
  }

  show(): void {
    this.dom.classList.add(CAPTION_ACTIVE);
    this.prev.show = true;
  }

  hide(): void {
    this.dom.classList.remove(CAPTION_ACTIVE);
    this.prev.show = false;
  }

  update(tracks: Partial<HTMLTrackElement>[], checked = -1): void {
    if (!tracks || !tracks.length) return;
    this.items = [];
    const trackEls: HTMLTrackElement[] = [];

    const df = document.createDocumentFragment();
    tracks.forEach((item: HTMLTrackElement) => {
      const track = document.createElement('track');
      track.setAttribute('kind', 'captions');
      Object.keys(item).forEach((key) => {
        track.setAttribute(key, (item as any)[key]);
      });
      df.appendChild(track);
      trackEls.push(track);
    });

    if (ua.isIE || ua.isEdge) {
      let latch = 0;
      trackEls.forEach((track) => {
        const src = track.getAttribute('src');
        ajax(src, (_, data) => {
          if (data) {
            track.setAttribute(
              'src',
              URL.createObjectURL(new Blob([data], { type: 'text/vtt' }))
            );
          }
          latch++;
          if (latch == trackEls.length) this.run();
        });
      });
    }

    this.player.media.appendChild(df);
    this.prev = { index: checked + 1 };
    if (!ua.isIE && !ua.isEdge) this.run();
  }

  updateUI(style: SubtitleOpts['style']): void {
    Object.keys(style).forEach((k) => {
      this.dom.style[k as any] = style[k as any];
    });
  }

  toggle(): void {
    if (this.prev.track && this.prev.show) {
      this.select.select(0);
      this.deactivate();
      this.hide();
      this.removeCueEvent();
    } else {
      this.prev = this.items[this.prev.index];

      if (!this.prev.track) {
        this.prev = this.items[1];
      }

      this.addCueEvent();
      this.select.select(this.prev.index);
      this.active();
      this.show();
    }
  }
}
