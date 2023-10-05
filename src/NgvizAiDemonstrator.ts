import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, 
    INgvizModeState, HostDrawFlag, addErrorToErrorsAndWarnings, MessageWithReferences } from '@displayr/ngviz';
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
    AccumulatedData?: Plotly.Data;
    AccumulatedLayout?: Plotly.Layout;
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
    hostDraw!: HostDrawFlag;

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
        this.hostDraw = HostDrawFlag.None;
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
        return layout;
    }

    getData() {
        const data = {
            y: ['Coca Cola', 'Diet Coke', 'Coke Zero', 'Pepsi', 'Pepsi Light', 'Pepsi Max'].reverse(),
            x: [33, 12, 18, 8, 5, 15].reverse(),
            type: 'bar',
            orientation: 'h'
        } as Plotly.Data;
        return data;
    }

    render() {
        this.clearContainer();
        const config = { displayModeBar: false } as Plotly.Config

        if (!this.viewState.StateChangeHistory)
            this.viewState.StateChangeHistory = [];
        const data_change_json = (this.viewState?.StateChange?.DataJson != "" ? this.viewState?.StateChange?.DataJson : "") ?? "";
        const data_change = data_change_json === "" ? undefined : JSON.parse(data_change_json);
        const layout_change_json = (this.viewState?.StateChange?.LayoutJson != "" ? this.viewState?.StateChange?.LayoutJson : "") ?? "";
        const layout_change = layout_change_json === "" ? undefined : JSON.parse(layout_change_json);

        const data = [this.mergeDeepReturnNewObject(this.viewState.AccumulatedData, this.getData())] as Plotly.Data[];
        const layout = this.mergeDeepReturnNewObject(this.viewState.AccumulatedLayout, this.getLayout());
        const tmp_data = [this.mergeDeepReturnNewObject(data[0], data_change)];
        const tmp_layout = this.mergeDeepReturnNewObject(layout, layout_change);

        let data_or_layout_errors = (Plotly as any).validate(tmp_data, tmp_layout) as any[];
        let has_plotly_validation_errors = !!data_or_layout_errors;
        if (has_plotly_validation_errors){
            const non_schema_errors = data_or_layout_errors.filter(verror => verror.code !== 'schema' && verror.code !== 'unused');
            has_plotly_validation_errors = non_schema_errors.length > 0;
            data_or_layout_errors = non_schema_errors;
        }

        if ((data_change || layout_change) && !has_plotly_validation_errors) {
            Plotly.newPlot(this.container, tmp_data, tmp_layout, config);
            this.viewState.AccumulatedData = tmp_data[0] as Plotly.Data;
            this.viewState.AccumulatedLayout = tmp_layout as Plotly.Layout;
        } else {
            const has_state_change_errors = this.viewState.StateChange && this.viewState.StateChange?.Errors.length > 0;

            if ((data_change || layout_change) && !has_state_change_errors) {
                var msg = 'Your request is not clear enough to be applied to this chart';
                const n_msg = data_or_layout_errors.length;
                for (var i = 0; i < n_msg; i++)
                    msg = msg + '. (' + data_or_layout_errors[i].msg + ')';
                this.callbacks.setErrorsAndWarnings({ warnings: [{message: msg}] }, this.hostDraw);
            }
            Plotly.newPlot(this.container, data, layout, config);
        }

        if (this.viewState.StateChange){
            if (this.viewState.StateChangeHistory.length == 0 ||
                this.viewState.StateChangeHistory[this.viewState.StateChangeHistory.length-1].UserRequest != this.viewState.StateChange.UserRequest)
                this.viewState.StateChangeHistory.push(this.viewState.StateChange);

            this.viewState.StateChange.Errors = [];
            this.viewState.StateChange = undefined;
            this.callbacks.viewStateChanged(this.viewState);
        }

        this.createResetButton();
        this.callbacks.renderFinished();
    }

    private reportAIErrors(stateChange?: NgvizAIStateChange){
        this.callbacks.setErrorsAndWarnings({}, this.hostDraw);

        if (!stateChange)
            return;

        const ai_warnings = stateChange.Errors.map((error) => { 
            return {message: error} as MessageWithReferences; 
        });

        this.callbacks.setErrorsAndWarnings({ warnings: ai_warnings }, this.hostDraw);
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
            this.viewState.AccumulatedData = undefined;
            this.viewState.AccumulatedLayout = undefined;
            this.userInput.setValue('');

            this.callbacks.viewStateChanged(this.viewState);
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
        this.update();
    }

    validateNgvizConstructor() {
        return NgvizAiDemonstrator;
    }

    isObject(item: any) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    mergeDeepReturnNewObject(obj_1: any, obj_2: any) {
        return this.mergeDeep({...obj_1}, {...obj_2});
    }
      
    /**
     * Deep merge two objects. From https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
     */
    mergeDeep(target: any, source: any): any {
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return target;
    }
}