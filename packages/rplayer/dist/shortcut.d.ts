import RPlayer from './rplayer';
export declare type ShortcutHandler = (player: RPlayer) => any;
export interface ShortcutOpts {
    enable?: boolean;
    time?: number;
    volume?: number;
    global?: boolean;
}
export default class Shortcut {
    private readonly player;
    private readonly handler;
    readonly editable: string[];
    constructor(player: RPlayer);
    private keydownHandler;
    register(code: number, fn: ShortcutHandler): void;
    unregister(code: number): void;
    enable(global?: boolean): void;
    disable(global?: boolean): void;
}
//# sourceMappingURL=shortcut.d.ts.map