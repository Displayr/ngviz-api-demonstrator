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
    ngvizSelectedDiv: JQuery<HTMLDivElement>;
    controlsDiv: JQuery<HTMLDivElement>;
    subSelectableIsSelected: boolean = false;
    checkbox?: IObjectInspectorControl<boolean>;

    constructor(container: HTMLDivElement, edit_mode: boolean, settings: IObjectInspectorSpecification, view_state_to_restore: ViewState, callbacks: INgvizCallbacks<ViewState>, mode_state: INgvizModeState) {
        this.settings = settings;
        this.callbacks = callbacks;
        
        const view_state = { clickCount: 0, ...view_state_to_restore };

        this.addCssStyleSheetInAsset('assets/style.css');
        container.className = 'ngviz-api-demo';

        this.refreshObjectInspector(null);

        const mode_div = $(`<div>This ngviz is running in ${edit_mode ? 'edit' : 'view'} mode.</div>`);
        const styled_div = $('<div>This ngviz should be surrounded by a double red border, which comes from assets/style.css</div>');

        const clickable_div = $('<div>This text been clicked <span>0</span> times, which will be persisted in view state.</div>')
            .on('click', () => {
                clickable_div.find('span').text(++ view_state.clickCount);
                callbacks.viewStateChanged(view_state);
            });

        this.controlsDiv = $('<div>The checkbox in the object inspector is <span>?</span>.</div>');
        this.updateTextForCheckboxState();

        this.ngvizSelectedDiv = $('<div>This ngviz is <span>???</span>selected in Displayr.</div>');
        this.selected(false);  // to give it an initial value

        const subselect_div = $('<div>You can sub-select this div by clicking on it, in which case a new control will appear in the object inspector.  Click elsewhere to deselect.</div>')
            .on('click', (event) => {
                this.subSelectableIsSelected = true;
                subselect_div.addClass('ngviz-api-demo-subselected');
                callbacks.showSubObjectInspector(true);
                event.stopPropagation();
            });
        $(container).on('click', () => {
            // Click anywhere else removes selectino.
            this.subSelectableIsSelected = false;
            subselect_div.removeClass('ngviz-api-demo-subselected');
            callbacks.showSubObjectInspector(null);
        })

        $(container).append(mode_div, styled_div, clickable_div, this.controlsDiv, this.ngvizSelectedDiv, subselect_div);
        callbacks.renderFinished();
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
        const sub_selection = this.settings.getSubContext('SubSelection');
        sub_selection.colorPicker({label: 'Color of selected text', visible: sub_object_selected});
    }

    updateTextForCheckboxState() {
        this.controlsDiv.find('span').text(this.checkbox!.getValue() ? 'checked' : 'not checked');
    }

    selected(is_selected: boolean): void {
        this.ngvizSelectedDiv.find('span').text(is_selected ? '' : 'not ');
    }

    resizedOrDragged() {
        // This visualization doesn't care whether it is resized or dragged, but other
        // might want to redo layout.
    }
}
