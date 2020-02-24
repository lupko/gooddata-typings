// (C) 2020 GoodData Corporation
import {
    CommandFailed,
    IApplicationCommand,
    IApplicationCommandWithPayload,
    IApplicationEventWithPayload,
    ObjectMeta,
} from "./common";
import isEmpty = require("lodash/isEmpty");

export namespace EmbeddedKpiDashboards {
    export enum GdcKdCommandType {
        SwitchToEdit = "kdSwitchToEdit",
        DeleteDashboard = "kdDeleteDashboard",
        CancelEdit = "kdCancelEdit",
        Save = "kdSave",
        AddWidget = "kdAddWidget",
        AddFilter = "kdAddFilter",
    }

    export enum GdcKdEventType {
        DashboardLoaded = "kdDashboardLoaded",
        SwitchedToEdit = "kdSwitchedToEdit",
        SwitchedToView = "kdSwitchedToView",
        DashboardSaved = "kdDashboardSaved",
        DashboardDeleted = "kdDashboardDeleted",
        WidgetAdded = "kdWidgetAdded",
        FilterAdded = "kdFilterAdded",
    }

    export enum GdcKdErrorType {
        /**
         * The posted command is not recognized by KD.
         */
        InvalidCommand = "kdError:invalidCommand",

        /**
         * Argument specified in the command body is invalid; it has failed the syntactical or semantic
         * validation done by KD.
         */
        InvalidArgument = "kdError:invalidArgument",

        /**
         * Command was posted when KD is not in a state to process the command.
         */
        InvalidState = "kdError:invalidState",

        /**
         * The Unexpected Happened.
         */
        RuntimeError = "kdError:runtime",
    }

    /**
     * This event will be emitted if KD runs into errors while processing the posted command.
     *
     * @remarks see {@link GdcKdErrorType} for types of errors that may fly
     */
    export type KdCommandFailed = CommandFailed<GdcKdErrorType>;

    //
    // Switch to edit
    //

    /**
     * Switches current dashboard to edit mode.
     *
     * Contract:
     *
     * -  if KD shows dashboard in view mode, will switch to edit mode and post SwitchedToEdit once ready for
     *    editing
     * -  if KD shows dashboard in edit mode, will keep edit mode and post SwitchedToEdit as if just switched
     *    from view mode
     * -  if no dashboard currently displayed, posts KdCommandFailed
     *
     * @remarks use {@link switchToEdit} factory function to instantiate
     */
    export type SwitchToEdit = IApplicationCommand<GdcKdCommandType.SwitchToEdit>;

    export function switchToEdit(correlationId?: string): SwitchToEdit {
        return {
            commandType: GdcKdCommandType.SwitchToEdit,
            correlationId,
        };
    }

    /**
     * Type-guard checking whether object is an instance of {@link SwitchToEdit}.
     *
     * @param obj - object to test
     */
    export function isSwitchToEdit(obj: any): obj is SwitchToEdit {
        return !isEmpty(obj) && (obj as SwitchToEdit).commandType === GdcKdCommandType.SwitchToEdit;
    }

    //
    // Delete dashboard
    //

    /**
     * Deleted currently edited dashboard.
     *
     * Contract:
     *
     * -  if KD is currently editing dashboard, this will trigger delete without popping up the dialog
     *    asking for permission. On success DashboardDeleted will be posted
     *
     * -  if KD is currently viewing dashboard or not not showing any dashboard, KdCommandFailed will
     *    be posted
     *
     * @remarks use {@link deleteDashboard} factory function to instantiate
     */
    export type DeleteDashboard = IApplicationCommand<GdcKdCommandType.DeleteDashboard>;

    export function deleteDashboard(correlationId?: string): DeleteDashboard {
        return {
            commandType: GdcKdCommandType.DeleteDashboard,
            correlationId,
        };
    }

    /**
     * Type-guard checking whether object is an instance of {@link DeleteDashboard}.
     *
     * @param obj - object to test
     */
    export function isDeleteDashboard(obj: any): obj is DeleteDashboard {
        return !isEmpty(obj) && (obj as DeleteDashboard).commandType === GdcKdCommandType.DeleteDashboard;
    }

    //
    //
    //

    /**
     * Cancels editing and switches dashboard to view mode.
     *
     * Contract:
     *
     * -  if KD is currently editing dashboard, this will trigger switch to view mode, without popping up the
     *    dialog asking to discard unsaved changes. On success SwitchedToView will be posted
     * -  if KD is currently viewing dashboard, SwitchedToView will be posted back immediately
     * -  if KD is not currently showing any dashboard, KdCommandFailed is posted
     *
     * @remarks use {@link cancelEdit} factory function to instantiate
     */
    export type CancelEdit = IApplicationCommand<GdcKdCommandType.CancelEdit>;

    export function cancelEdit(correlationId?: string): CancelEdit {
        return {
            commandType: GdcKdCommandType.CancelEdit,
            correlationId,
        };
    }

    /**
     * Type-guard checking whether object is an instance of {@link CancelEdit}.
     *
     * @param obj - object to test
     */
    export function isCancelEdit(obj: any): obj is CancelEdit {
        return !isEmpty(obj) && (obj as CancelEdit).commandType === GdcKdCommandType.CancelEdit;
    }

    //
    //
    //

    export type SaveBody = {
        title: string;
    };

    /**
     * Saves current dashboard.
     *
     * Contract:
     *
     * -  if currently edited dashboard IS NOT eligible for save (empty, in-error), then KdCommandFailed event
     *    will be posted
     * -  if the specified title is invalid / does not match title validation rules, then KdCommandFailed event
     *    will be posted
     * -  otherwise dashboard WILL be saved with the title as specified in the body and the DashboardSaved event
     *    will be posted
     * -  the DashboardSaved event will be posted even when saving dashboard that has not changed but would
     *    otherwise be eligible for saving (not empty, not in-error)
     *
     * Note: sending Save command with different title means dashboard will be saved with that new title.
     *
     * @remarks use {@link save} factory function to instantiate
     */
    export type Save = IApplicationCommandWithPayload<GdcKdCommandType.Save, SaveBody>;

    export function save(title: string, correlationId?: string): Save {
        return {
            commandType: GdcKdCommandType.Save,
            correlationId,
            payload: {
                title,
            },
        };
    }

    /**
     * Type-guard checking whether object is an instance of {@link Save}.
     *
     * @param obj - object to test
     */
    export function isSave(obj: any): obj is Save {
        return !isEmpty(obj) && (obj as Save).commandType === GdcKdCommandType.Save;
    }

    //
    //
    //

    export type KpiWidget = {
        type: "kpi";
    };

    export type InsightRef = { identifier: string } | { uri: string };

    export type InsightWidget = {
        type: "insight";
        ref: InsightRef;
    };

    export type AddWidgetBody = {
        widget: KpiWidget | InsightWidget;
    };

    /**
     * Adds new widget onto dashboard. New row will be created on top of the dashboard, the widget
     * will be placed into its first column.
     *
     * It is currently possible to add either a KPI or an Insight. When adding either of these, KD will
     * scroll to top so that the newly added widget is visible.
     *
     * For KPI, the KD will start the KPI customization flow right after the KPI is placed.
     * Insights are placed without need for further customization
     *
     * Contract:
     *
     * -  if KD is currently editing a dashboard, then depending on widget type:
     *    -  KPI is added to dashboard, customization flow is started, WidgetAdded will be posted
     *    -  Insight is added to dashboard, WidgetAdded will be posted
     *
     * -  if insight reference included in command payload does not refer to a valid insight, KdCommandFailed
     *    will be posted
     *
     * -  if KD is in view mode or not showing any dashboard, then KdCommandFailed will be posted
     *
     * @remarks use {@link addKpi} or {@link addInsight} to create instances of AddWidget
     */
    export type AddWidget = IApplicationCommandWithPayload<GdcKdCommandType.AddWidget, AddWidgetBody>;

    export function addKpi(correlationId?: string): AddWidget {
        return {
            commandType: GdcKdCommandType.AddWidget,
            correlationId,
            payload: {
                widget: { type: "kpi" },
            },
        };
    }

    export function addInsight(ref: InsightRef, correlationId?: string): AddWidget {
        return {
            commandType: GdcKdCommandType.AddWidget,
            correlationId,
            payload: {
                widget: {
                    type: "insight",
                    ref,
                },
            },
        };
    }

    /**
     * Type-guard checking whether object is an instance of {@link AddWidget}.
     *
     * @param obj - object to test
     */
    export function isAddWidget(obj: any): obj is AddWidget {
        return !isEmpty(obj) && (obj as AddWidget).commandType === GdcKdCommandType.AddWidget;
    }

    //
    //
    //

    /**
     * Adds new attribute filter to filter bar and starts the filter customization flow.
     *
     * Contract:
     *
     * -  if KD is currently editing a dashboard, adds new attribute filter, starts customization flow; FilterAdded
     *    will be posted right after customization starts
     *
     * -  if KD is currently in view mode or does not show any dashboard, will post KdCommandFailed
     *
     * @remarks use {@link addFilter} factory function to instantiate
     */
    export type AddFilter = IApplicationCommand<GdcKdCommandType.AddFilter>;

    export function addFilter(correlationId?: string): AddFilter {
        return {
            commandType: GdcKdCommandType.AddFilter,
            correlationId,
        };
    }

    /**
     * Type-guard checking whether object is an instance of {@link AddFilter}.
     *
     * @param obj - object to test
     */
    export function isAddFilter(obj: any): obj is AddFilter {
        return !isEmpty(obj) && (obj as AddFilter).commandType === GdcKdCommandType.AddFilter;
    }

    //
    //
    //

    export type AvailableCommands = {
        availableCommands: GdcKdCommandType[];
    };

    //
    //
    //

    export type DashboardLoadedBody = AvailableCommands & {
        dashboard: ObjectMeta;
    };

    /**
     * This event is emitted after KD loaded a dashboard into view mode.
     */
    export type DashboardLoaded = IApplicationEventWithPayload<
        GdcKdEventType.DashboardLoaded,
        DashboardLoadedBody
    >;

    /**
     * Type-guard checking whether object is an instance of {@link DashboardLoaded}.
     *
     * @param obj - object to test
     */
    export function isDashboardLoaded(obj: any): obj is DashboardLoaded {
        return !isEmpty(obj) && (obj as DashboardLoaded).eventType === GdcKdEventType.DashboardLoaded;
    }

    //
    //
    //

    export type SwitchedToEditBody = AvailableCommands & {
        dashboard: ObjectMeta;
    };

    /**
     * This event is emitted after KD switched a dashboard from view mode to edit mode.
     */
    export type SwitchedToEdit = IApplicationEventWithPayload<
        GdcKdEventType.SwitchedToEdit,
        SwitchedToEditBody
    >;

    /**
     * Type-guard checking whether object is an instance of {@link SwitchedToEdit}.
     *
     * @param obj - object to test
     */
    export function isSwitchedToEdit(obj: any): obj is SwitchedToEdit {
        return !isEmpty(obj) && (obj as SwitchedToEdit).eventType === GdcKdEventType.SwitchedToEdit;
    }

    //
    //
    //

    /**
     * This event is emitted after KD switched a dashboard from edit mode to view mode.
     */
    export type SwitchedToViewBody = AvailableCommands & {
        dashboard: ObjectMeta;
    };

    export type SwitchedToView = IApplicationEventWithPayload<
        GdcKdEventType.SwitchedToView,
        SwitchedToViewBody
    >;

    /**
     * Type-guard checking whether object is an instance of {@link SwitchedToView}.
     *
     * @param obj - object to test
     */
    export function isSwitchedToView(obj: any): obj is SwitchedToView {
        return !isEmpty(obj) && (obj as SwitchedToView).eventType === GdcKdEventType.SwitchedToView;
    }

    //
    //
    //

    export type DashboardSavedBody = AvailableCommands & {
        dashboard: ObjectMeta;
    };

    /**
     * This event is emitted after KD saved a dashboard.
     */
    export type DashboardSaved = IApplicationEventWithPayload<
        GdcKdEventType.DashboardSaved,
        DashboardSavedBody
    >;

    /**
     * Type-guard checking whether object is an instance of {@link DashboardSaved}.
     *
     * @param obj - object to test
     */
    export function isDashboardSaved(obj: any): obj is DashboardSaved {
        return !isEmpty(obj) && (obj as DashboardSaved).eventType === GdcKdEventType.DashboardSaved;
    }

    //
    //
    //

    export type DashboardDeletedBody = AvailableCommands & {
        dashboard: ObjectMeta;
    };

    /**
     * This event is emitted after KD deleted a dashboard.
     */
    export type DashboardDeleted = IApplicationEventWithPayload<
        GdcKdEventType.DashboardDeleted,
        DashboardDeletedBody
    >;

    /**
     * Type-guard checking whether object is an instance of {@link DashboardDeleted}.
     *
     * @param obj - object to test
     */
    export function isDashboardDeleted(obj: any): obj is DashboardDeleted {
        return !isEmpty(obj) && (obj as DashboardDeleted).eventType === GdcKdEventType.DashboardDeleted;
    }

    //
    //
    //

    export type WidgetAddedBody = AvailableCommands & {
        insight?: ObjectMeta;
    };

    /**
     * This event is emitted after KD added a new widget to a dashboard. If the widget is
     * an insight, then meta information about the insight will be returned.
     *
     * Note: when this event is added for a KPI widget, it means the customization flow for the KPI has
     * started. The user may still 'just' click somewhere outside of the KPI configuration and the KPI will
     * be discarded.
     */
    export type WidgetAdded = IApplicationEventWithPayload<GdcKdEventType.WidgetAdded, WidgetAddedBody>;

    /**
     * Type-guard checking whether object is an instance of {@link WidgetAdded}.
     *
     * @param obj - object to test
     */
    export function isWidgetAdded(obj: any): obj is WidgetAdded {
        return !isEmpty(obj) && (obj as WidgetAdded).eventType === GdcKdEventType.WidgetAdded;
    }

    //
    //
    //

    export type FilterAddedBody = AvailableCommands;

    /**
     * This event is emitted after KD added a new filter to dashboard's filter bar and started its
     * customization flow.
     *
     * Note: users can still cancel the filter customization flow meaning no new attribute filter
     * will end on the filter bar.
     */
    export type FilterAdded = IApplicationEventWithPayload<GdcKdEventType.FilterAdded, FilterAddedBody>;

    /**
     * Type-guard checking whether object is an instance of {@link FilterAdded}.
     *
     * @param obj - object to test
     */
    export function isFilterAdded(obj: any): obj is FilterAdded {
        return !isEmpty(obj) && (obj as FilterAdded).eventType === GdcKdEventType.FilterAdded;
    }
}
