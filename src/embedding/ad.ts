// (C) 2020 GoodData Corporation

import {
    CommandFailed,
    IApplicationCommand,
    IApplicationCommandWithPayload,
    IApplicationEventWithPayload,
    ObjectMeta,
} from "./common";
import isEmpty = require("lodash/isEmpty");

// TODO: these are part of client (gooddata-js), move to model (typings)
export interface IBaseExportConfig {
    title?: string;
    format?: "xlsx" | "csv" | "raw";
    mergeHeaders?: boolean;
}

// TODO: these are part of client (gooddata-js), move to model (typings)
// NOTE: AFM is ommitted on purpose; it should be added by AD itself; create new type using Omit<>
export interface IExportConfig extends IBaseExportConfig {
    showFilters?: boolean;
}

export namespace EmbeddedAnalyticalDesigner {
    export enum GdcAdCommandType {
        Save = "adSave",
        SaveAs = "adSaveAs",
        Export = "adExport",
        Undo = "adUndo",
        Redo = "adRedo",
    }

    export enum GdcAdEventType {
        NewInsightInitialized = "adNewInsightInitialized",
        InsightOpened = "adInsightOpened",
        InsightSaved = "adInsightSaved",
        UndoFinished = "adUndoFinished",
        RedoFinished = "adRedoFinished",
        ExportFinished = "adExportFinished",
    }

    export enum GdcAdErrorType {
        /**
         * The posted command is not recognized by AD.
         */
        InvalidCommand = "adError:invalidCommand",

        /**
         * Argument specified in the command body is invalid; it has failed the syntactical or semantic
         * validation done by AD.
         */
        InvalidArgument = "adError:invalidArgument",

        /**
         * Command was posted when AD is not in a state to process the command. For instance:
         *
         * - trying to do save/save-as on new, empty insight
         * - trying to do save/save-as on insight that is in error
         * - trying to do undo when there is no step-back available
         * - trying to do redo when there is no step-forward available
         */
        InvalidState = "adError:invalidState",

        /**
         * The Unexpected Happened.
         */
        RuntimeError = "adError:runtime",
    }

    /**
     * This event will be emitted if AD runs into errors while processing the posted command.
     *
     * @remarks see {@link GdcAdErrorType} for types of errors that may fly
     */
    export type AdCommandFailed = CommandFailed<GdcAdErrorType>;

    //
    // Save command
    //

    export type SaveCommandBody = {
        title: string;
    };

    /**
     * Saves current insight.
     *
     * Contract:
     *
     * -  if currently edited insight IS NOT eligible for save (empty, in-error), then CommandFailed event
     *    will be posted
     * -  if the specified title is invalid / does not match title validation rules, then CommandFailed event
     *    will be posted
     * -  otherwise insight WILL be saved with the title as specified in the body and the InsightSaved event
     *    will be posted
     * -  the InsightSaved event will be posted even when saving insights that have not changed but are eligible
     *    for saving (not empty, not in-error)
     *
     * Note: sending SaveCommand with different title means insight will be saved with that new title.
     *
     * @remarks use {@link saveInsight} factory function to instantiate
     */
    export type SaveCommand = IApplicationCommandWithPayload<GdcAdCommandType.Save, SaveCommandBody>;

    /**
     * @param correlationId - optionally specify correlationId to include in any events that are posted
     *  as part/at the end of command processing
     * @param title - title for the insight
     * @returns new Save Command
     */
    export function saveInsight(title: string, correlationId?: string): SaveCommand {
        return {
            commandType: GdcAdCommandType.Save,
            correlationId,
            payload: {
                title,
            },
        };
    }

    /**
     * Type-guard checking whether object is an instance of SaveCommand.
     *
     * @param obj - object to test
     */
    export function isSaveCommand(obj: any): obj is SaveCommand {
        return !isEmpty(obj) && (obj as SaveCommand).commandType === GdcAdCommandType.Save;
    }

    //
    // Save As command
    //

    export type SaveAsCommandBody = {
        readonly title: string;
    };

    /**
     * Saves current insight as a new object, with a different title. The title is specified
     *
     * Contract is same as {@link SaveCommand}.
     *
     * @remarks use {@link saveInsightAs} factory function to instantiate
     */
    export type SaveAsCommand = IApplicationCommandWithPayload<GdcAdCommandType.SaveAs, SaveAsCommandBody>;

    /**
     * @param title - title for the new insight
     * @param correlationId - optionally specify correlationId to include in any events that are posted
     *  as part/at the end of command processing
     * @returns new SaveAsCommand
     */
    export function saveInsightAs(title: string, correlationId: string): SaveAsCommand {
        return {
            commandType: GdcAdCommandType.SaveAs,
            correlationId,
            payload: {
                title,
            },
        };
    }

    /**
     * Type-guard checking whether object is an instance of SaveAsCommand.
     *
     * @param obj - object to test
     */
    export function isSaveAsCommand(obj: any): obj is SaveCommand {
        return !isEmpty(obj) && (obj as SaveAsCommand).commandType === GdcAdCommandType.SaveAs;
    }

    //
    // Export command
    //

    export type ExportCommandBody = {
        readonly config: IExportConfig;
    };

    /**
     * Exports current insight into CSV or XLSX. The export configuration matches that of the exportResult
     * function already available in gooddata-js. Please consult {@link IExportConfig} for more detail about
     * possible configuration options.
     *
     * Contract:
     *
     * -  if the currently edited insight IS eligible for export then it is done and the ExportFinished event will be
     *    posted with `link` to the result.
     * -  if the currently edited insight IS NOT eligible for export (empty, in-error), then CommandFailed event
     *    will be posted.
     * -  if the specified export config is invalid / does not match validation rules, then CommandFailed event
     *    will be posted
     *
     * @remarks use {@link exportInsight} factory function to instantiate
     */
    export type ExportCommand = IApplicationCommandWithPayload<GdcAdCommandType.Export, ExportCommandBody>;

    /**
     * @param config - export config
     * @param correlationId - optionally specify correlationId to include in any events that are posted
     *  as part/at the end of command processing
     * @returns new instance of ExportCommand
     */
    export function exportInsight(config: IExportConfig, correlationId: string): ExportCommand {
        return {
            commandType: GdcAdCommandType.Export,
            correlationId,
            payload: {
                config,
            },
        };
    }

    /**
     * Type-guard checking whether object is an instance of ExportCommand.
     *
     * @param obj - object to test
     */
    export function isExportCommand(obj: any): obj is ExportCommand {
        return !isEmpty(obj) && (obj as ExportCommand).commandType === GdcAdCommandType.Export;
    }

    //
    // Undo
    //

    /**
     * Triggers the undo action.
     *
     * Contract:
     *
     * -  if it is valid to perform Undo operation, AD will do it and the UndoFinished will be posted once the
     *    undo completes
     *
     * -  if the Undo operation is not available in current state of AD, then CommandFailed will be posted
     *
     * @remarks use {@link undo} factory function to instantiate
     */
    export type UndoCommand = IApplicationCommand<GdcAdCommandType.Undo>;

    export function isUndoCommand(obj: any): obj is UndoCommand {
        return !isEmpty(obj) && (obj as UndoCommand).commandType === GdcAdCommandType.Undo;
    }

    export function undo(correlationId?: string): UndoCommand {
        return {
            commandType: GdcAdCommandType.Undo,
            correlationId,
        };
    }

    //
    // Redo
    //

    /**
     * Triggers the redo action.
     *
     * Contract:
     *
     * -  if it is valid to perform Redo operation, AD will do it and the RedoFinished will be posted once the
     *    redo completes
     *
     * -  if the Redo operation is not available in current state of AD, then CommandFailed will be posted
     *
     * @remarks use {@link redo} factory function to instantiate
     */
    export type RedoCommand = IApplicationCommand<GdcAdCommandType.Redo>;

    export function isRedoCommand(obj: any): obj is RedoCommand {
        return !isEmpty(obj) && (obj as RedoCommand).commandType === GdcAdCommandType.Redo;
    }

    export function redo(correlationId?: string): RedoCommand {
        return {
            commandType: GdcAdCommandType.Redo,
            correlationId,
        };
    }

    //
    // Events
    //

    /**
     * List of available commands; this is included in each event sent by AD.
     */
    export type AvailableCommands = {
        availableCommands: GdcAdCommandType[];
    };

    //
    // New Insight Initialized
    //

    export type NewInsightInitializedBody = AvailableCommands;

    /**
     * This event is emitted when AD initializes edit session for a new insight.
     */
    export type NewInsightInitialized = IApplicationEventWithPayload<
        GdcAdEventType.NewInsightInitialized,
        NewInsightInitializedBody
    >;

    export function isNewInsightInitialized(obj: any): obj is NewInsightInitialized {
        return (
            !isEmpty(obj) && (obj as NewInsightInitialized).eventType === GdcAdEventType.NewInsightInitialized
        );
    }

    //
    // Insight Opened
    //

    export type InsightOpenedBody = AvailableCommands & {
        insight: ObjectMeta;
    };

    /**
     * This event is emitted when AD initializes edit session for an existing insight. Essential detail about
     * the insight is included in the body.
     */
    export type InsightOpened = IApplicationEventWithPayload<GdcAdEventType.InsightOpened, InsightOpenedBody>;

    export function isInsightOpened(obj: any): obj is InsightOpened {
        return !isEmpty(obj) && (obj as InsightOpened).eventType === GdcAdEventType.InsightOpened;
    }

    //
    // Insight Saved
    //

    export type InsightSavedBody = AvailableCommands & {
        insight: ObjectMeta;
    };

    /**
     * This event is emitted when AD saves the currently edited insight.
     */
    export type InsightSaved = IApplicationEventWithPayload<GdcAdEventType.InsightSaved, InsightSavedBody>;

    export function isInsightSaved(obj: any): obj is InsightSavedBody {
        return !isEmpty(obj) && (obj as InsightSaved).eventType === GdcAdEventType.InsightSaved;
    }

    //
    // Export
    //

    export type ExportFinishedBody = AvailableCommands & {
        /**
         * Link to the file containing exported data.
         */
        link: string;
    };

    /**
     * This event is emitted when AD successfully exports data visualized by the currently edited insight.
     */
    export type ExportFinished = IApplicationEventWithPayload<
        GdcAdEventType.ExportFinished,
        ExportFinishedBody
    >;

    export function isExportFinishedEvent(obj: any): obj is ExportFinished {
        return !isEmpty(obj) && (obj as ExportFinished).eventType === GdcAdEventType.ExportFinished;
    }

    //
    // Undo finished
    //

    export type UndoFinishedBody = AvailableCommands;

    /**
     * This event is emitted when AD successfully performs Undo operation.
     */
    export type UndoFinished = IApplicationEventWithPayload<GdcAdEventType.UndoFinished, UndoFinishedBody>;

    export function isUndoFinishedEvent(obj: any): obj is UndoFinished {
        return !isEmpty(obj) && (obj as UndoFinished).eventType === GdcAdEventType.UndoFinished;
    }

    //
    // Redo finished
    //

    export type RedoFinishedBody = AvailableCommands;

    /**
     * This event is emitted when AD successfully performs Undo operation.
     */
    export type RedoFinished = IApplicationEventWithPayload<GdcAdEventType.RedoFinished, RedoFinishedBody>;

    export function isRedoFinishedEvent(obj: any): obj is RedoFinished {
        return !isEmpty(obj) && (obj as RedoFinished).eventType === GdcAdEventType.RedoFinished;
    }
}
