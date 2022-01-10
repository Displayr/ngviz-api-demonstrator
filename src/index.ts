import { INgviz, INgvizCallbacks, IObjectInspectorSpecification, IObjectInspectorControl, TabularData, INgvizModeState, ITabularDataForJson } from '@displayr/ngviz';
import $ from 'jquery';

interface ViewState {
    clickCount?: number;
}

/**
 * See README.md.
 */
export default class NgvizApiDemonstrator implements INgviz<ViewState> {
    settings: IObjectInspectorSpecification;
    callbacks: INgvizCallbacks<ViewState>;
    viewState: ViewState;
    viewStateClickableDiv: JQuery<HTMLElement>;
    controlsDiv: JQuery<HTMLDivElement>;
    ngvizSelectedDiv: JQuery<HTMLDivElement>;
    subSelectableDiv: JQuery<HTMLElement>;
    subSelectableIsSelected: boolean = false;
    checkbox?: IObjectInspectorControl<boolean>;
    colourPicker?: IObjectInspectorControl<string>;

    constructor(container: HTMLDivElement, edit_mode: boolean, settings: IObjectInspectorSpecification, view_state_to_restore: ViewState, callbacks: INgvizCallbacks<ViewState>, mode_state: INgvizModeState) {
        this.settings = settings;
        this.callbacks = callbacks;        
        this.viewState = view_state_to_restore;
        if (!this.viewState.clickCount)
            this.viewState.clickCount = 0;

        this.addCssStyleSheetInAsset('assets/style.css');
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

        this.refreshObjectInspector(null);

        const mode_div = $(`<div>This ngviz is running in ${edit_mode ? 'edit' : 'view'} mode.</div>`);
        const font_div = $(`<div>Its base font comes from its host environment.  It should be Comic Sans in the harness, and whatever the default chart font is in Displayr.</div>`);
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

        this.subSelectableDiv = $('<div>You can sub-select this div by clicking on it, in which case a new control will appear in the object inspector.  Click elsewhere to deselect.</div>')
            .on('click', (event) => {
                this.subSelectableIsSelected = true;
                this.subSelectableDiv.addClass('ngviz-api-demo-subselected');
                callbacks.showSubObjectInspector(true);
                event.stopPropagation();
            });
        $(container).on('click', () => {
            // Click anywhere else removes selectino.
            this.subSelectableIsSelected = false;
            this.subSelectableDiv.removeClass('ngviz-api-demo-subselected');
            callbacks.showSubObjectInspector(null);
        });
        this.updateColourForSelection();

        $(container).append(mode_div, font_div, styled_div, this.viewStateClickableDiv, this.controlsDiv, this.ngvizSelectedDiv, this.subSelectableDiv);
    }

    addCssStyleSheetInAsset(asset: string) {
        var head = document.getElementsByTagName('HEAD')[0];  
        var link = document.createElement('link'); 
        link.rel = 'stylesheet';        
        link.type = 'text/css';       
        link.href = this.callbacks.getAssetPathFor(asset);  
        head.appendChild(link);  
    }

    refreshObjectInspector(token?: any) {
        this.checkbox = this.settings.checkBox({label: 'Checkbox', page: 'Inputs', group: 'Data Source', 
                                                change: () => this.updateTextForCheckboxState()});
        const sub_object_selected = !!token;
        const sub_selection_context = this.settings.getSubContext('SubSelection');
        this.colourPicker = sub_selection_context.colorPicker({label: 'Color of selected text', visible: !!sub_object_selected,
                                                               change: () => this.updateColourForSelection()});
        this.callbacks.renderFinished();
    }

    updateTextForCheckboxState() {
        this.controlsDiv.find('span').text(this.checkbox!.getValue() ? 'checked' : 'not checked');
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
        // This visualization doesn't care whether it is resized or dragged, but other
        // might want to redo layout.
    }
}
