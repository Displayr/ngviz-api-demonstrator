import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, INgvizModeState, HostDrawFlag } from '@displayr/ngviz';
import * as Plotly from 'plotly.js-dist-min';

interface ViewState {
    clickCount?: number;
}

export default class NgvizAiDemonstrator implements INgviz<ViewState> {
    // sizeDiv!: HTMLElement;
    // viewStateClickableDiv!: HTMLElement;
    // controlsDiv!: HTMLElement;
    // ngvizSelectedDiv!: HTMLElement;
    // subSelectableDiv!: HTMLElement;
    // dropBoxDataDiv!: HTMLElement;
    // subSelectableIsSelected = false;
    // checkbox?: IObjectInspectorControl<boolean>;
    // addNErrors?: IObjectInspectorControl<number>;
    // addNWarnings?: IObjectInspectorControl<number>;
    // colourPicker?: IObjectInspectorControl<string>;
    dropBox?: IObjectInspectorControl<string[]>;
    // hostDrawing?: IObjectInspectorControl<string>;

    // private constructionComplete: boolean = false;

    constructor(
        private container: HTMLDivElement, 
        private editMode: boolean, 
        private settings: IObjectInspectorSpecification, 
        private viewState: ViewState, 
        private callbacks: INgvizCallbacks<ViewState>, 
        private modeState: INgvizModeState) {
        // this.sizeDiv = createElement('div', {}, `Its size <span>???</span>`);
        // this.viewStateClickableDiv = createElement('div', {}, 'This text been clicked <span>???</span> times, which will be persisted in view state.');
        // this.controlsDiv = createElement('div', {}, 'The checkbox in the object inspector is <span>?</span>.');
        // this.ngvizSelectedDiv = createElement('div', {}, 'This ngviz is <span>???</span>selected in Displayr.');
        // this.subSelectableDiv = createElement('div', {}, 'You can sub-select this div by clicking on it, in which case a new control will appear in the object inspector.  Click elsewhere to deselect.')
        // 
        // this.render();
        this.update();
    }

    update(): void {
        this.updateControls();
        this.render();
    }

    updateControls() {
        this.callbacks.clearSettings();
        this.dropBox = this.settings.dropBox({
            label: 'Dropdown (called primaryData)',
            name: 'primaryData',
            page: 'Inputs',
            group: 'Data Source',
            multi: true,
            types: ["RItem", "Table"],
            data_change: () => this.update(),
            change: () => {},
        });
        this.callbacks.updateObjectInspector();
    }

    render() {
        const data = [
            {
              y: ['Coca Cola', 'Diet Coke', 'Coke Zero', 'Pepsi', 'Pepsi Light', 'Pepsi Max'].reverse(),
              x: [33, 12, 18, 8, 5, 15].reverse(),
              type: 'bar',
              orientation: 'h'
            }
          ] as Plotly.Data[];
        const layout = {} as Plotly.Layout;
        const config = { displayModeBar: false } as Plotly.Config;
        Plotly.newPlot(this.container, data, layout, config);
        this.callbacks.renderFinished();
    }

    selected(is_selected: boolean): void {}

    resizedOrDragged() {
        // this.updateSizeDiv();
        // this.renderFinished();
    }

    validateNgvizConstructor() {
        return NgvizAiDemonstrator;
    }
}