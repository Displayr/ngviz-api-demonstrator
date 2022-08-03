import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, TabularData, INgvizModeState, ITabularDataForJson } from '@displayr/ngviz';
import $ from 'jquery';
import * as Plotly from 'plotly.js';

interface ViewState {
    clickCount?: number;
}

/**
 * See README.md.
 */
export default class NgvizApiDemonstrator implements INgviz<ViewState> {
    container: HTMLDivElement;
    settings: IObjectInspectorSpecification;
    callbacks: INgvizCallbacks<ViewState>;
    sizeDiv: JQuery<HTMLDivElement>;
    viewState: ViewState;
    viewStateClickableDiv: JQuery<HTMLElement>;
    controlsDiv: JQuery<HTMLDivElement>;
    ngvizSelectedDiv: JQuery<HTMLDivElement>;
    subSelectableDiv: JQuery<HTMLElement>;
    dropBoxDataDiv: JQuery<HTMLPreElement>;
    subSelectableIsSelected: boolean;
    checkbox?: IObjectInspectorControl<boolean>;
    colourPicker?: IObjectInspectorControl<string>;
    dropBox?: IObjectInspectorControl<string[]>;

    constructor(container: HTMLDivElement, edit_mode: boolean, settings: IObjectInspectorSpecification, view_state_to_restore: ViewState, callbacks: INgvizCallbacks<ViewState>, mode_state: INgvizModeState) {
        this.container = container;
        this.settings = settings;
        this.callbacks = callbacks;        
        this.viewState = view_state_to_restore;
        if (!this.viewState.clickCount)
            this.viewState.clickCount = 0;

        callbacks.loadStylesheet(callbacks.getAssetPathFor('assets/style.css'));  // returns a promise
        
        const font = mode_state.baseFont;
        if (font)
            $(container).css({
                'font-family': font.family,
                'font-size': font.size + 'pt',
                'font-weight': font.bold ? 'bold' : 'normal',
                'font-style': font.italic ? 'italic' : 'normal',
                'text-decoration': font.underline ? (font.strikeout ? 'underline line-through' : 'underline') : (font.strikeout ? 'line-through' : 'none')
            });
        container.className = 'ngviz-api-demo';

        this.refreshObjectInspector();

        const mode_div = $(`<div>This ngviz is running in ${edit_mode ? 'edit' : 'view'} mode.</div>`);
        this.sizeDiv = $(`<div>Its size <span>???</span></div>`);
        this.updateSizeDiv();
        const font_div = $(`<div>Its base font comes from its host environment.  It should be Comic Sans in the harness, and whatever the default chart font is in Displayr.</div>`);
        const colours_div = $(`<div>The available colour palette is: </div>`)
            .append(mode_state.colorPalette.map(c => $(`<span style="background-color:rgb(${c}); width: 2em; display: inline-block")>&nbsp;</span>`)));
        const styled_div = $('<div>This ngviz should be surrounded by a double red border, which comes from assets/style.css</div>');

        this.viewStateClickableDiv = $('<div>This text been clicked <span>???</span> times, which will be persisted in view state.</div>')
            .on('click', () => {
                this.viewState.clickCount! ++;
                this.updateClickCount();
                callbacks.viewStateChanged(this.viewState);
            });
        this.updateClickCount();

        this.controlsDiv = $('<div>The checkbox in the object inspector is <span>?</span>.</div>');
        this.updateTextForCheckboxState();

        this.ngvizSelectedDiv = $('<div>This ngviz is <span>???</span>selected in Displayr.</div>');
        this.selected(false);  // to give it an initial value

        this.subSelectableIsSelected = false;
        this.subSelectableDiv = $('<div>You can sub-select this div by clicking on it, in which case a new control will appear in the object inspector.  Click elsewhere to deselect.</div>')
            .on('click', (event) => {
                this.subSelectableIsSelected = true;
                this.subSelectableDiv.addClass('ngviz-api-demo-subselected');
                this.refreshObjectInspector();
                event.stopPropagation();
            });
        $(container).on('click', () => {
            // Click anywhere else removes selectino.
            this.subSelectableIsSelected = false;
            this.subSelectableDiv.removeClass('ngviz-api-demo-subselected');
            this.refreshObjectInspector();
        });
        this.updateColourForSelection();

        this.dropBoxDataDiv = $('<div class="dropBoxData"></div>');
        this.updateDropBoxData();

        const plotly_div = $('<div style="height:150px"></div>');
        $(container).append(mode_div, this.sizeDiv, font_div, colours_div, styled_div, this.viewStateClickableDiv, this.controlsDiv, this.ngvizSelectedDiv, this.subSelectableDiv, plotly_div, this.dropBoxDataDiv);

        var data = [{
            x: [1, 2, 3],
            y: [10, 15, 13]
        }];
        Plotly.newPlot(plotly_div[0], <any>data, {margin:{pad:0,l:0,t:0,r:0,b:0}});
    }

    refreshObjectInspector() {
        this.callbacks.clearSettings();
        this.checkbox = this.settings.checkBox({label: 'Checkbox', page: 'Inputs', group: 'Data Source', 
                                                change: () => this.updateTextForCheckboxState()});
        const dropbox_types_text = this.settings.textBox({label: 'Types available in dropbox', prompt: 'See https://wiki.q-researchsoftware.com/wiki/R_GUI_Controls#DropBox_Types', change: () => {}});
        const types_available = dropbox_types_text.getValue() || 'table';
        this.dropBox = this.settings.dropBox({label: 'Dropdown (called primaryData)', name: 'primaryData', page: 'Inputs', group: 'Data Source', types: [types_available],
                                              dataChange: () => this.updateDropBoxData(), change: () => {}});
        const sub_selection_context = this.settings.getSubContext('SubSelection');
        this.colourPicker = sub_selection_context.colorPicker({label: 'Color of selected text', visible: this.subSelectableIsSelected,
                                                               change: () => this.updateColourForSelection()});
        this.callbacks.updateObjectInspector();
        this.callbacks.renderFinished();
    }

    updateSizeDiv() {
        const rect = this.container.getBoundingClientRect();
        const text = `is ${Math.round(rect.width)}x${Math.round(rect.height)} at ${Math.round(rect.left)},${Math.round(rect.top)}`;
        this.sizeDiv.find('span').text(text);
    }

    updateTextForCheckboxState() {
        this.controlsDiv.find('span').text(this.checkbox!.getValue() ? 'checked' : 'not checked');
    }

    updateDropBoxData() {
        const data = this.dropBox?.getData();
        this.dropBoxDataDiv.text(data ? JSON.stringify(data) : '- No data selected in drop box -');
    }

    updateClickCount() {
        this.viewStateClickableDiv.find('span').text(this.viewState.clickCount!);
    }

    selected(is_selected: boolean): void {
        this.ngvizSelectedDiv.find('span').text(is_selected ? '' : 'not ');
    }

    updateColourForSelection() {
        this.subSelectableDiv.css('color', this.colourPicker!.getValue());
    }

    resizedOrDragged() {
        this.updateSizeDiv();
        this.callbacks.renderFinished();
    }
}
