import { NORMAL, SPEED } from './config/lang';
import { SelectOption, SelectOptions } from './controls/setting/select';
import language from './config/lang';
import { SubtitleOpts } from './plugins/subtitle';
import RPlayer from './rplayer';
import Storage, { StorageOpts } from './storage';
import { findIndex, isNum, isObj } from './utils';
import { ContextMenuOpts } from './controls/contextmenu';
import { ShortcutOpts } from './shortcut';
import { ThumbnailOpts } from './controls/thumbnail';
import Events from './events';
import { SwitchItemOptions } from './controls/setting/switch-item';

export interface OptionPreset {
  playbackRate?:
    | boolean
    | {
        position?: number;
        checked?: number;
        steps?: { label?: string; value?: number }[];
      };
  version?: boolean;
}

export interface Plugin {
  install: (p: RPlayer) => any;
  [key: string]: any;
}

export interface RPlayerOptions {
  media?: string | HTMLVideoElement;
  el?: string | HTMLElement;
  video?: HTMLVideoElement & { src?: string | string[] };
  settings?: (SelectOptions | SwitchItemOptions)[];
  preset?: OptionPreset;
  shortcut?: ShortcutOpts;
  lang?: string;
  thumbnail?: ThumbnailOpts;
  contextMenu?: ContextMenuOpts;
  storage?: StorageOpts;
  subtitle?: SubtitleOpts;
  plugins?: Plugin[];
}

function processPlaybackRate(
  opts: RPlayerOptions,
  player: RPlayer
): RPlayerOptions {
  if (opts.preset.playbackRate === false) return opts;

  const DEFAULT_PLAY_RATE = {
    steps: [
      { label: '0.5x', value: 0.5, i: 0 },
      { label: '0.75x', value: 0.75, i: 1 },
      { label: language.t(NORMAL, opts.lang), value: 1, i: 2 },
      { label: '1.25x', value: 1.25, i: 3 },
      { label: '1.5x', value: 1.5, i: 4 },
      { label: '1.75x', value: 1.75, i: 5 },
      { label: '2x', value: 2, i: 6 },
    ],
  };

  const playbackRate: any =
    isObj(opts.preset.playbackRate) && opts.preset.playbackRate.steps
      ? opts.preset.playbackRate
      : DEFAULT_PLAY_RATE;

  const setting: SelectOptions = {
    label: language.t(SPEED, opts.lang),
    options: playbackRate.steps,
    init(select) {
      const rate = player.storage.get('playbackRate', 1);
      const i = findIndex(playbackRate.steps, (v: any) => v.value == rate);

      player.playbackRate = rate;
      select.select(i, rate + 'x');
      player.on(Events.RATE_CHANGE, () => {
        const i = findIndex(
          select.opts.options,
          (s) => s.value === player.playbackRate
        );

        if (i > -1 && select.value === i) return;

        const rate = parseFloat(player.playbackRate.toFixed(2));
        player.storage.set({ playbackRate: rate });
        select.select(i, rate + 'x');
      });
    },
    onChange(opt: SelectOption, next: Function) {
      player.storage.set({ playbackRate: opt.value });
      player.playbackRate = opt.value;
      next();
    },
  };

  let pos = isNum(playbackRate.position)
    ? playbackRate.position
    : findIndex(opts.settings, (x) => !!(x as SelectOptions).options);
  if (pos < 0) pos = 0;

  opts.settings.splice(pos, 0, setting);

  return opts;
}

function processShortcut(opts: RPlayerOptions): RPlayerOptions {
  const DEFAULT_SHORTCUT = {
    enable: true,
    time: 10,
    volume: 0.1,
    global: false,
  };
  opts.shortcut = { ...opts.shortcut, ...DEFAULT_SHORTCUT };
  return opts;
}

function processLang(opts: RPlayerOptions): RPlayerOptions {
  opts.lang =
    opts.lang || navigator.language || (navigator as any).userLanguage;
  return opts;
}

function processThumbnail(opts: RPlayerOptions): RPlayerOptions {
  opts.thumbnail = {
    ...{
      startTime: 0,
      gapSec: 10,
      col: 5,
      row: 5,
      width: 160,
      height: 90,
      images: [],
    },
    ...opts.thumbnail,
  };

  return opts;
}

function processContextMenu(opts: RPlayerOptions): RPlayerOptions {
  opts.contextMenu = opts.contextMenu || {};
  opts.contextMenu.items = opts.contextMenu.items || [];

  if (opts.preset.version !== false) {
    opts.contextMenu.items.push({
      label: 'RPlayer: v' + __VERSION,
    });
  }

  opts.contextMenu = {
    ...{
      enable: true,
      toggle: true,
    },
    ...opts.contextMenu,
  };

  return opts;
}

function processStorage(opts: RPlayerOptions): RPlayerOptions {
  opts.storage = {
    ...{
      enable: true,
      key: 'rplayer',
    },
    ...opts.storage,
  };

  return opts;
}

function processCations(opts: RPlayerOptions): RPlayerOptions {
  opts.subtitle = { ...{ checked: -1 }, ...opts.subtitle };
  return opts;
}

export default function processOptions(
  player: RPlayer,
  opts?: RPlayerOptions
): RPlayerOptions {
  opts = opts ? { ...opts } : {};

  opts.settings = opts.settings || [];
  opts.preset = opts.preset || {};
  opts.plugins = opts.plugins || [];

  opts = processStorage(opts);
  player.storage = new Storage(opts);

  opts = processLang(opts);
  opts = processPlaybackRate(opts, player);
  opts = processShortcut(opts);
  opts = processThumbnail(opts);
  opts = processContextMenu(opts);
  opts = processCations(opts);

  return opts;
}
