import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, 
    INgvizModeState, HostDrawFlag, addErrorToErrorsAndWarnings, MessageWithReferences } from '@displayr/ngviz';
import * as Plotly from 'plotly.js-dist-min';

interface ViewState {
    ai_state?: {data: Plotly.Data, layout: Plotly.Layout};
    accumulatedData?: Plotly.Data;
    accumulatedLayout?: Plotly.Layout;
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
    // dropBox?: IObjectInspectorControl<string[]>;
    // hostDrawing?: IObjectInspectorControl<string>;

    userInput!: IObjectInspectorControl<string>;

    // private constructionComplete: boolean = false;
    private debounceTimer!: number;
    hostDraw!: HostDrawFlag;

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
        this.hostDraw = HostDrawFlag.None;
        this.update();
    }

    update(): void {
        this.updateControls();
        this.render();
    }

    updateControls() {
        if (this.hostDraw !== HostDrawFlag.None) {
            this.callbacks.setErrorsAndWarnings({}, HostDrawFlag.None);
        }
        this.hostDraw = HostDrawFlag.None;
        this.callbacks.setErrorsAndWarnings({}, this.hostDraw);
        this.callbacks.clearSettings();

        this.userInput = this.settings.textBox({
            name: 'formUserInput',
            label: 'Modify chart',
            required: false,
            change: () => {
                this.update();
                // input.setValue('');
            }
        });

        // this.dropBox = this.settings.dropBox({
        //     label: 'Dropdown (called primaryData)',
        //     name: 'primaryData',
        //     page: 'Inputs',
        //     group: 'Data Source',
        //     multi: true,
        //     types: ["RItem", "Table"],
        //     data_change: () => this.update(),
        //     change: () => {},
        // });

        this.callbacks.updateObjectInspector();
    }

    getLayout() {
        const layout = {} as Plotly.Layout;
        // apply layout modifications from chatgpt here
        return layout;
    }

    getData() {
        const data = {
            y: ['Coca Cola', 'Diet Coke', 'Coke Zero', 'Pepsi', 'Pepsi Light', 'Pepsi Max'].reverse(),
            x: [33, 12, 18, 8, 5, 15].reverse(),
            type: 'bar',
            orientation: 'h'
        } as Plotly.Data;
        // apply data modifications from chatgpt here
        return data;
    }

    render() {
        this.clearContainer();
        const config = { displayModeBar: false } as Plotly.Config

        const data_change = this.viewState?.ai_state?.data;
        const layout_change = this.viewState?.ai_state?.layout;

        const data = [{...this.viewState.accumulatedData, ...this.getData()}] as Plotly.Data[];
        const layout = {...this.viewState.accumulatedLayout, ...this.getLayout()};
        const tmp_data = [{...data_change, ...data[0] }] as Plotly.Data[];
        const tmp_layout = {...layout_change, ...layout};
        const invalid_data_or_layout = (Plotly as any).validate(tmp_data, tmp_layout);
        if ((data_change || layout_change) && !invalid_data_or_layout) {
            Plotly.newPlot(this.container, tmp_data, tmp_layout, config);
            this.viewState.accumulatedData = tmp_data[0] as Plotly.Data;
            this.viewState.accumulatedLayout = tmp_layout as Plotly.Layout;
            this.viewState.ai_state = undefined;
            this.callbacks.viewStateChanged(this.viewState);
        } else {
            if (data_change || layout_change) {
                var msg = 'Query was not understood';
                const n_msg = invalid_data_or_layout.Length;
                for (var i = 0; i < n_msg; i++)
                    msg = msg + invalid_data_or_layout[i].message;
                this.callbacks.setErrorsAndWarnings({ warnings: [{message: msg}] 
                    }, this.hostDraw);
            }
            Plotly.newPlot(this.container, data, layout, config);
        }

        this.createResetButton();
        this.callbacks.renderFinished();
    }

    private updateWithDebounce() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = window.setTimeout(() => this.update(), 100);
    }

    createResetButton() {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.height = '25px';
        div.style.width = '70px';
        div.style.top = '-25px';
        div.style.left = `${this.container.offsetWidth - 70}px`;

        const span = document.createElement('span');
        span.innerText = 'Reset';
        span.style.fontSize = '20px';
        span.style.color = 'rgb(180, 180, 180)';

        span.onmouseenter = () => {
            span.style.color = 'rgb(120, 120, 120)';
            span.style.cursor = 'pointer';
        }

        span.onmouseleave = () => {
            span.style.color = 'rgb(180, 180, 180)';
            span.style.cursor = '';
        }

        span.onclick = () => {
            this.viewState.accumulatedData = undefined;
            this.viewState.accumulatedLayout = undefined;
            (this.userInput as any).setValue('');

            this.callbacks.viewStateChanged(this.viewState);
            this.update();
        }

        div.append(span);
        this.container.append(div);
    }

    clearContainer() {
        while(this.container.firstChild){
            this.container.removeChild(this.container.firstChild);
        }
    }

    selected(is_selected: boolean): void {}

    resizedOrDragged() {
        this.updateWithDebounce();
    }

    validateNgvizConstructor() {
        return NgvizAiDemonstrator;
    }
}