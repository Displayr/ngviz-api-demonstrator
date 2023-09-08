import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, INgvizModeState, HostDrawFlag } from '@displayr/ngviz';
import * as Plotly from 'plotly.js-dist-min';

interface ViewState {
    clickCount?: number;
}

/**
 * See README.md.
 */
export default class NgvizApiDemonstrator implements INgviz<ViewState> {
    sizeDiv!: HTMLElement;
    viewStateClickableDiv!: HTMLElement;
    controlsDiv!: HTMLElement;
    ngvizSelectedDiv!: HTMLElement;
    subSelectableDiv!: HTMLElement;
    dropBoxDataDiv!: HTMLElement;
    subSelectableIsSelected = false;
    checkbox?: IObjectInspectorControl<boolean>;
    addNErrors?: IObjectInspectorControl<number>;
    addNWarnings?: IObjectInspectorControl<number>;
    colourPicker?: IObjectInspectorControl<string>;
    dropBox?: IObjectInspectorControl<string[]>;
    hostDrawing?: IObjectInspectorControl<string>;

    private constructionComplete: boolean = false;

    constructor(
        private container: HTMLDivElement, 
        private editMode: boolean, 
        private settings: IObjectInspectorSpecification, 
        private viewState: ViewState, 
        private callbacks: INgvizCallbacks<ViewState>, 
        private modeState: INgvizModeState) {
        this.render();
    }

    private async render() {
        function create(element_name: string, attrs: {[name:string]: string}, inner_html: string): HTMLElement {
            const e = document.createElement(element_name);
            for (const k in attrs)
                e.setAttribute(k, attrs[k]);
            e.innerHTML = inner_html;
            return e;
        }

        if (!this.viewState.clickCount)
            this.viewState.clickCount = 0;

        // We await this because later code depends on styling to size the chart
        await this.addCssReference();
        
        const font = this.modeState.baseFont;
        if (font) {
            this.container.style.setProperty('font-family', font.family),
            this.container.style.setProperty('font-size', font.size + 'pt');
            this.container.style.setProperty('font-weight', font.bold ? 'bold' : 'normal');
            this.container.style.setProperty('font-style', font.italic ? 'italic' : 'normal');
            this.container.style.setProperty('text-decoration', font.underline ? (font.strikeout ? 'underline line-through' : 'underline') : (font.strikeout ? 'line-through' : 'none'));
        }
        this.container.className = 'ngviz-api-demo';

        this.refreshObjectInspector();

        const mode_div = create('div', {}, `This ngviz is running in ${this.editMode ? 'edit' : 'view'} mode.`);
        this.sizeDiv = create('div', {}, `Its size <span>???</span>`);
        this.updateSizeDiv();
        const font_div = create('div', {}, `Its base font comes from its host environment.  It should be Comic Sans in the harness, and whatever the default chart font is in Displayr.`);
        const colours_div = create('div', {}, `The available colour palette is: `);
        for (const c of this.modeState.colorPalette)
            colours_div.appendChild(create('span', {style:`background-color:rgb(${c}); width: 2em; display: inline-block`}, '&nbsp;'));
        const styled_div = create('div', {}, 'This ngviz should be surrounded by a double red border, which comes from assets/style.css');

        this.viewStateClickableDiv = create('div', {}, 'This text been clicked <span>???</span> times, which will be persisted in view state.');
        this.viewStateClickableDiv.addEventListener('click', () => {
            this.viewState.clickCount! ++;
            this.updateClickCount();
            this.callbacks.viewStateChanged(this.viewState);
        });
        this.updateClickCount();

        this.controlsDiv = create('div', {}, 'The checkbox in the object inspector is <span>?</span>.');
        this.updateTextForCheckboxState();

        this.ngvizSelectedDiv = create('div', {}, 'This ngviz is <span>???</span>selected in Displayr.');
        this.selected(false);  // to give it an initial value

        this.subSelectableIsSelected = false;
        this.subSelectableDiv = create('div', {}, 'You can sub-select this div by clicking on it, in which case a new control will appear in the object inspector.  Click elsewhere to deselect.')
        this.subSelectableDiv.addEventListener('click', (event) => {
            this.subSelectableIsSelected = true;
            this.subSelectableDiv.classList.add('ngviz-api-demo-subselected');
            this.refreshObjectInspector();
            event.stopPropagation();
        });
        this.container.addEventListener('click', () => {
            // Click anywhere else removes selection.
            this.subSelectableIsSelected = false;
            this.subSelectableDiv.classList.remove('ngviz-api-demo-subselected');
            this.refreshObjectInspector();
        });
        this.updateColourForSelection();

        this.dropBoxDataDiv = create('div', {class: "dropBoxData"}, '');
        this.updateDropBoxData();

        const plotly_div = create('div', {style: "height:150px"}, '');
        this.container.append(mode_div, this.sizeDiv, font_div, colours_div, styled_div, this.viewStateClickableDiv, this.controlsDiv, this.ngvizSelectedDiv, this.subSelectableDiv, plotly_div, this.dropBoxDataDiv);

        var data = [{
            x: [1, 2, 3],
            y: [10, 15, 13]
        }];
        Plotly.newPlot(plotly_div, <any>data, {margin:{pad:0,l:0,t:0,r:0,b:0}});
        
        this.constructionComplete = true;
        this.renderFinished();
    }

    private async addCssReference() {
        const stylesheetUrl = this.callbacks.getAssetPathFor('assets/ngviz-api-demonstrator-style.css');
        await this.callbacks.loadStylesheet(stylesheetUrl);
    }

    private isRenderFinished(): boolean {
        return this.constructionComplete;
    }

    private renderFinished() {
        if (this.isRenderFinished())
            this.callbacks.renderFinished();
    }

    refreshObjectInspector() {
        this.callbacks.clearSettings();
        this.checkbox = this.settings.checkBox({
            label: 'Checkbox',
            page: 'Inputs',
            group: 'Data Source',
            change: () => this.updateTextForCheckboxState(),
        });
        const dropbox_types_text = this.settings.textBox({
            label: 'Types available in dropbox',
            prompt: 'See https://wiki.q-researchsoftware.com/wiki/R_GUI_Controls#DropBox_Types',
            change: () => this.refreshObjectInspector(),
        });
        const types_available: string = dropbox_types_text.getValue() || 'table';
        this.dropBox = this.settings.dropBox({
            label: 'Dropdown (called primaryData)',
            name: 'primaryData',
            page: 'Inputs',
            group: 'Data Source',
            multi: true,
            types: types_available.split(';').map(s => s.trim()).filter(Boolean),
            data_change: () => this.updateDropBoxData(),
            change: () => {},
        });
        this.hostDrawing = this.settings.comboBox({label: 'Host should draw', alternatives: ['None', 'EncouragementToSelectData', 'Errors'], default_value: 'None', change: () => this.refreshObjectInspector()});
        this.addNErrors = this.settings.numericUpDown({label: 'Add this number of errors', default_value: 0, change: () => this.refreshObjectInspector()});
        this.addNWarnings = this.settings.numericUpDown({label: 'Add this number of warnings', default_value: 0, change: () => this.refreshObjectInspector()});
        const sub_selection_context = this.settings.getSubContext('SubSelection');
        this.colourPicker = sub_selection_context.colorPicker({label: 'Color of selected text', visible: this.subSelectableIsSelected,
                                                               change: () => this.updateColourForSelection()});
        this.callbacks.updateObjectInspector();
        this.updateErrorsAndWarnings();
        this.renderFinished();
    }

    updateErrorsAndWarnings() {
        function messages(n: number) {
            return Array.from({length:n}).map((_, index) => index.toString());
        }
        const nerrors = this.addNErrors?.getValue()!;
        const nwarnings = this.addNWarnings?.getValue()!;
        this.callbacks.setErrorsAndWarnings({
            errors: messages(nerrors).map(m => { return { message: m } }),
            warnings: messages(nwarnings).map(m => { return { message: m } })
        }, this.hostDrawFromControl());
    }

    hostDrawFromControl(): HostDrawFlag {
        const host_draw_value = this.hostDrawing!.getValue();        
        const host_draw_enum = ((<any>HostDrawFlag)[host_draw_value]);
        if (host_draw_enum === undefined)
            throw new Error('Could not find HostDrawFlag name '+host_draw_value);
        return <HostDrawFlag>host_draw_enum;
    }

    updateSizeDiv() {
        const rect = this.container.getBoundingClientRect();
        const text = `is ${Math.round(rect.width)}x${Math.round(rect.height)} at ${Math.round(rect.left)},${Math.round(rect.top)}`;
        this.sizeDiv.querySelector('span')!.textContent = text;
    }

    updateTextForCheckboxState() {
        this.controlsDiv.querySelector('span')!.textContent = this.checkbox!.getValue() ? 'checked' : 'not checked';
    }

    updateDropBoxData() {
        const data = this.dropBox?.getData();
        this.dropBoxDataDiv.textContent = data ? JSON.stringify(data) : '- No data selected in drop box -';
    }

    updateClickCount() {
        this.viewStateClickableDiv.querySelector('span')!.textContent = this.viewState.clickCount!.toString();
    }

    selected(is_selected: boolean): void {
        this.ngvizSelectedDiv.querySelector('span')!.textContent = is_selected ? '' : 'not ';
    }

    updateColourForSelection() {
        this.subSelectableDiv.style.setProperty('color', this.colourPicker!.getValue());
    }

    resizedOrDragged() {
        this.updateSizeDiv();
        this.renderFinished();
    }

    validateNgvizConstructor() {
        return NgvizApiDemonstrator;
    }
}
