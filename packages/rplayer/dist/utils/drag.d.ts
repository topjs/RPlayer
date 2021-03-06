declare type Fn = (ev: PointerEvent) => any;
export default class Drag {
    private readonly dom;
    private readonly start;
    private readonly move;
    private readonly end;
    private pending;
    private lastEv;
    constructor(dom: HTMLElement, start: Fn, move: Fn, end?: Fn);
    private downHandler;
    private moveHandler;
    private handlerMove;
    private upHandler;
    destroy(): void;
}
export {};
//# sourceMappingURL=drag.d.ts.map