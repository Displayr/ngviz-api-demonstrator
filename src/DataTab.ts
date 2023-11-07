import { CheckBoxParams, ComboBoxParams, ControlCreator, DropBoxParams, IListModifiable, IObjectInspectorControl, IObjectInspectorSpecification, ListModifierParams } from '@displayr/ngviz';

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
    // This page will eventually be called 'Data' instead of 'Inputs'
    const page = 'Inputs';

    const primary_data = settings.dropBox({
        name: 'primaryData',
        label: 'Data',
        page,
        group: 'Data Source',
        ...config.inputSelector,
    });

    let controls: DataTabControls = { inputSelector: primary_data };

    if (config?.switchRowColumn) {
        const switch_rows = settings.checkBox({
            name: 'switchRowsColumns',
            label: 'Switch rows/columns',
            page,
            group: 'Data Source',
            ...config.switchRowColumn,
        });
        controls.switchRowColumn= switch_rows;
    }

    if (config?.showNetSum) {
        const show_net_sum = settings.comboBox({
            name: 'showNetSum',
            label: 'Show Net/Sum',
            page,
            group: 'Column selection',
            ...config.showNetSum,
        });
        controls.showNetSum = show_net_sum;
    }

    if (config?.labelModifier) {
        const list_modifier = settings.listModifier({
            name: 'listModifier',
            page,
            group: 'Column selection',
            ...config.labelModifier,
        });
        controls.labelModifier = list_modifier;
    }

    return controls;
}
