// (C) 2020 GoodData Corporation

import isEmpty = require("lodash/isEmpty");

/**
 * Envelope for all application commands that do not have any command payload.
 *
 * @remarks see {@link IApplicationCommandWithPayload}
 */
export interface IApplicationCommand<T> {
    readonly commandType: T;
    readonly correlationId?: string;
}

/**
 * Envelope for all application commands that come with a payload.
 */
export interface IApplicationCommandWithPayload<T, TBody> extends IApplicationCommand<T> {
    readonly payload: TBody;
}

/**
 * Envelope for all application events that do not have any payload.
 */
export interface IApplicationEvent<T> {
    readonly eventType: T;
    readonly correlationId?: string;
}

/**
 * Envelope for all application events that include a payload.
 */
export interface IApplicationEventWithPayload<T, TBody> extends IApplicationEvent<T> {
    readonly payload: TBody;
}

export type CommandFailedBody<TErrorCodes> = {
    /**
     * Error code indicates category of error that has occurred. The possible types vary between applications.
     */
    errorCode: TErrorCodes;

    /**
     * Error message includes descriptive information about the error. E.g. "Insight title must not contain newline character"
     */
    errorMessage: string;
};

/**
 * Base type for error events sent by application in case command processing comes to an expected or
 * unexpected halt.
 */
export type CommandFailed<TErrorCodes> = IApplicationEventWithPayload<
    "appCommandFailed",
    CommandFailedBody<TErrorCodes>
>;

/**
 * Type-guard checking whether an object is an instance of {@link CommandFailed}
 *
 * @param obj - object to test
 */
export function isCommandFailed(obj: any): obj is CommandFailed<any> {
    return !isEmpty(obj) && (obj as CommandFailed<any>).eventType === "appCommandFailed";
}

/**
 * Minimal meta-information about an object.
 */
export type ObjectMeta = {
    /**
     * Unique, user-assignable identifier of the insight. This identifier does not change during LCM operations.
     */
    identifier: string;

    /**
     * URI of the Insight. In context of GoodData platform, the URI is a link to the visualization object
     * where the insight is persisted.
     *
     * NOTE: URI is workspace scoped; same insight distributed across multiple workspaces using LCM will have
     * different URI.
     */
    uri: string;

    /**
     * Insight title - this is what users see in AD top bar (if visible) or
     */
    title: string;
};
