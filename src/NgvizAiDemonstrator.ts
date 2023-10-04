import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, INgvizModeState, HostDrawFlag } from '@displayr/ngviz';
import * as Plotly from 'plotly.js-dist-min';

interface ViewState {
    newData: Plotly.Data;
    newLayout: Plotly.Layout;
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

    // private constructionComplete: boolean = false;
    userInputs: string[] = [];

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

        const input = this.settings.textBox({
            name: 'formUserInput',
            label: 'Modify chart',
            required: false,
            change: () => this.update(),
        });
        this.userInputs[0] = input.getValue(); // temporarily use textbox directly; later this will be value returned from QServer

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
        const txt = '{ "marker": {"color": "red" }}';    // some fake input - later to be replaced by Q server inputs
        const data_change = JSON.parse(txt);
        const data = [{...this.viewState.accumulatedData, ...this.getData()}] as Plotly.Data[];
        const layout = {...this.viewState.accumulatedLayout, ...this.getLayout()};
        const tmp_data = [{...data_change, ...data[0] }];
        const tmp_layout = {...layout};
        const invalid_data_or_layout = (Plotly as any).validate(tmp_data, tmp_layout);
        if (!invalid_data_or_layout) {
            Plotly.newPlot(this.container, tmp_data, tmp_layout, config);
            this.viewState.accumulatedData = tmp_data[0] as Plotly.Data;
            this.viewState.accumulatedLayout = tmp_layout as Plotly.Layout;
            this.callbacks.viewStateChanged(this.viewState);
        } else
            Plotly.newPlot(this.container, data, layout, config);

        this.createResetButton();
        this.callbacks.renderFinished();
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
        this.update();
    }

    validateNgvizConstructor() {
        return NgvizAiDemonstrator;
    }
}