import { CheckBoxParams, ComboBoxParams, ControlCreator, ControlSet, DropBoxParams, IListModifiable, IObjectInspectorControl, IObjectInspectorSpecification, ListModifierParams } from '@displayr/ngviz';

export type DataTabConfig = {
    inputSelector: DropBoxParams;
    switchRowColumn?: CheckBoxParams;
    showNetSum?: ComboBoxParams;
    labelModifier?: ListModifierParams;
};

export type DataTabControls = {
    inputSelector: IObjectInspectorControl<string[]>;
    switchRowColumn?: IObjectInspectorControl<boolean>;
    showNetSum?: IObjectInspectorControl<string>;
    labelModifier?: IObjectInspectorControl<IListModifiable[]>;
}

/** Proof of concept for a generalised method that handles the construction of the Data Tab, intended to be used
 * by every NGViz. Will eventually be moved to ngviz-common */
export function constructDataTab(
    config: DataTabConfig,
    settings: IObjectInspectorSpecification,
): DataTabControls {
    const control_set = new ControlSet(true);
    // This page will eventually be called 'Data' instead of 'Inputs'
    const page = 'Inputs';
    const data_control_creator = new ControlCreator(settings, { page, group: 'Data Source' }, undefined, control_set);
    const col_selection_control_creator = data_control_creator.addDefaults({ group: 'Column selection' });

    const primary_data = data_control_creator.dropBox({
        name: 'primaryData',
        label: 'Data',
        ...config.inputSelector,
    });

    let controls: DataTabControls = { inputSelector: primary_data };

    if (config?.switchRowColumn) {
        const switch_rows = data_control_creator.checkBox({
            name: 'switchRowsColumns',
            label: 'Switch rows/columns',
            ...config.switchRowColumn,
        });
        controls.switchRowColumn= switch_rows;
    }

    if (config?.showNetSum) {
        const show_net_sum = col_selection_control_creator.comboBox({
            name: 'showNetSum',
            label: 'Show Net/Sum',
            group: 'Column selection',
            ...config.showNetSum,
        });
        controls.showNetSum = show_net_sum;
    }

    if (config?.labelModifier) {
        const list_modifier = col_selection_control_creator.listModifier({
            name: 'listModifier',
            group: 'Column selection',
            ...config.labelModifier,
        });
        controls.labelModifier = list_modifier;
    }

    return controls;
}
