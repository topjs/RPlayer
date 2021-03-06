import SettingItem from './item';
import RPlayer from '../..';
export interface SelectOption {
    label: string;
    selectedLabel?: string;
    [key: string]: any;
}
export interface SelectChangeFn {
    (o: SelectOption, update: () => void): any;
}
export interface SelectOptions {
    label: string;
    options: SelectOption[];
    checked?: number;
    init?: (select: Select) => any;
    onChange?: SelectChangeFn;
}
export default class Select extends SettingItem {
    private readonly player;
    private prevSelect;
    value: number;
    readonly dom: HTMLElement;
    readonly opts: SelectOptions;
    private readonly options;
    private readonly entryClickCb;
    constructor(player: RPlayer, opts: SelectOptions, entryClickCb?: (select: Select) => any);
    private optionClickHandler;
    select(index: number, orLabel?: string): void;
    onEntryClick(): void;
}
//# sourceMappingURL=select.d.ts.map