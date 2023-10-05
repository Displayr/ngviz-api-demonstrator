import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, INgvizModeState, HostDrawFlag, MessageWithReferences} from '@displayr/ngviz';
import * as Plotly from 'plotly.js-dist-min';

interface NgvizAIStateChange {
    UserRequest: string;
    DataJson: string;
    LayoutJson: string;
    Errors: string[]
}

interface NgvizAIViewState {
    StateChange?: NgvizAIStateChange;
    StateChangeHistory: NgvizAIStateChange[]
    accumulatedData?: Plotly.Data;
    accumulatedLayout?: Plotly.Layout;
}

export default class NgvizAiDemonstrator implements INgviz<NgvizAIViewState> {
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

    constructor(
        private container: HTMLDivElement, 
        private editMode: boolean, 
        private settings: IObjectInspectorSpecification, 
        private viewState: NgvizAIViewState, 
        private callbacks: INgvizCallbacks<NgvizAIViewState>, 
        private modeState: INgvizModeState) {
        // this.sizeDiv = createElement('div', {}, `Its size <span>???</span>`);
        // this.viewStateClickableDiv = createElement('div', {}, 'This text been clicked <span>???</span> times, which will be persisted in view state.');
        // this.controlsDiv = createElement('div', {}, 'The checkbox in the object inspector is <span>?</span>.');
        // this.ngvizSelectedDiv = createElement('div', {}, 'This ngviz is <span>???</span>selected in Displayr.');
        // this.subSelectableDiv = createElement('div', {}, 'You can sub-select this div by clicking on it, in which case a new control will appear in the object inspector.  Click elsewhere to deselect.')
        // 
        // this.render();
        this.reportAIErrors(this.viewState.StateChange);
        this.update();
    }

    update(): void {
        this.updateControls();
        this.render();
    }

    updateControls() {
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

    /*applyDataChange() {
        const txt = '{ "marker": {"color": "red" }}';
        const data_change = JSON.parse(txt);
        const tmp_data = {...data_change, ...this.getData() };
        const tmp_data = {...data_change, ...this.getData() };
        const invalid_layout = (Plotly as any).validate(tmp_data, {});
        console.log(invalid_layout);
        if (!invalid_layout)
            Plotly.restyle(this.container, data_change as Plotly.Data);
    }*/

    render() {
        this.clearContainer();
        const config = { displayModeBar: false } as Plotly.Config

        if (!this.viewState.StateChangeHistory)
            this.viewState.StateChangeHistory = [];
        const data_change_json = (this.viewState?.StateChange?.DataJson != "" ? this.viewState?.StateChange?.DataJson : "{}") ?? "{}";
        const data_change = JSON.parse(data_change_json);
        const layout_change_json = (this.viewState?.StateChange?.LayoutJson != "" ? this.viewState?.StateChange?.LayoutJson : "{}") ?? "{}";
        const layout_change = JSON.parse(layout_change_json);

        const data = [{...this.viewState.accumulatedData, ...this.getData()}] as Plotly.Data[];
        const layout = {...this.viewState.accumulatedLayout, ...this.getLayout()};
        const tmp_data = [{...data[0], ...data_change }] as Plotly.Data[];
        const tmp_layout = {...layout, ...layout_change};
        const invalid_data_or_layout = (Plotly as any).validate(tmp_data, tmp_layout);
        if ((data_change || layout_change) && !invalid_data_or_layout) {
            Plotly.newPlot(this.container, tmp_data, tmp_layout, config);
            this.viewState.accumulatedData = tmp_data[0] as Plotly.Data;
            this.viewState.accumulatedLayout = tmp_layout as Plotly.Layout;
            if (this.viewState.StateChange){
                if (this.viewState.StateChangeHistory.length == 0 ||
                    this.viewState.StateChangeHistory[this.viewState.StateChangeHistory.length-1].UserRequest != this.viewState.StateChange.UserRequest)
                    this.viewState.StateChangeHistory.push(this.viewState.StateChange);
            }
            this.viewState.StateChange = undefined;
            this.callbacks.viewStateChanged(this.viewState);
        } else
            Plotly.newPlot(this.container, data, layout, config);

        this.createResetButton();
        this.callbacks.renderFinished();
    }

    private reportAIErrors(stateChange?: NgvizAIStateChange){
        if (!stateChange)
            return;

        const ai_warnings = stateChange.Errors.map((error) => { 
            return {message: error} as MessageWithReferences; 
        });

        this.callbacks.setErrorsAndWarnings({ warnings: ai_warnings }, HostDrawFlag.None);
        //this.callbacks.setErrorsAndWarnings({ warnings: [{message: 'test warning on viewState change'}]}, HostDrawFlag.None);
        stateChange.Errors = [];
    }

    private updateWithDebounce() {
        //**clearTimeout(this.debounceTimer);
        //**this.debounceTimer = window.setTimeout(() => this.update(), 100);
        this.update();
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