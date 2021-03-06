// (C) 2007-2019 GoodData Corporation
import isEmpty = require('lodash/isEmpty');

/**
 * Types defined here are client-side representation of the AFM. This representation MAY differ from the
 * physical representation of the AFM accepted by the REST API.
 *
 * The intended use is that client code uses exclusively types defined in this namespace. Functions or methods
 * that communicate with executeAfm REST API endpoint MUST transform this AFM to a structure acceptable by
 * the backend.
 *
 * >>> Note for developers: when you modify these structures, be sure to update gooddata-js execute-afm.convert.ts
 * with conversion of the new/updated construct to ExecuteAFM types accepted by backend.
 *
 * @see ./ExecuteAFM
 */
export namespace AFM {
    export interface IExecution {
        execution: {
            afm: IAfm;
            resultSpec?: IResultSpec;
        };
    }

    export interface IAfm {
        attributes?: IAttribute[];
        measures?: IMeasure[];
        filters?: CompatibilityFilter[];
        nativeTotals?: INativeTotalItem[];
    }

    export interface IResultSpec {
        dimensions?: IDimension[];
        sorts?: SortItem[];
    }

    export interface IAttribute {
        localIdentifier: Identifier;
        displayForm: ObjQualifier;
        alias?: string;
    }

    export interface IMeasure {
        localIdentifier: Identifier;
        definition: MeasureDefinition;
        alias?: string;
        format?: string;
    }

    export type MeasureDefinition = ISimpleMeasureDefinition
        | IArithmeticMeasureDefinition
        | IPopMeasureDefinition
        | IPreviousPeriodMeasureDefinition;

    export interface ISimpleMeasureDefinition {
        measure: ISimpleMeasure;
    }

    export interface IArithmeticMeasureDefinition {
        arithmeticMeasure: IArithmeticMeasure;
    }

    export interface IPopMeasureDefinition {
        popMeasure: IPopMeasure;
    }

    export interface IPreviousPeriodMeasureDefinition {
        previousPeriodMeasure: IPreviousPeriodMeasure;
    }

    export type SimpleMeasureAggregation = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'runsum';

    export interface ISimpleMeasure {
        item: ObjQualifier;
        aggregation?: SimpleMeasureAggregation;
        filters?: FilterItem[];
        computeRatio?: boolean;
    }

    export type ArithmeticMeasureOperator = 'sum' | 'difference' | 'multiplication' | 'ratio' | 'change';

    export interface IArithmeticMeasure {
        measureIdentifiers: Identifier[];
        operator: ArithmeticMeasureOperator;
    }

    export interface IPopMeasure {
        measureIdentifier: Identifier;
        popAttribute: ObjQualifier;
    }

    export interface IPreviousPeriodMeasure {
        measureIdentifier: Identifier;
        dateDataSets: IPreviousPeriodDateDataSet[];
    }

    export interface IPreviousPeriodDateDataSet {
        dataSet: ObjQualifier;
        periodsAgo: number;
    }

    // ObjQualifier type
    export type Identifier = string;
    export type ObjQualifier = IObjUriQualifier | IObjIdentifierQualifier;

    export interface IObjIdentifierQualifier {
        identifier: string;
    }

    export interface IObjUriQualifier {
        uri: string;
    }

    // Filter types and interfaces
    export type ExtendedFilter = FilterItem | IMeasureValueFilter;
    export type CompatibilityFilter = IExpressionFilter | ExtendedFilter;
    export type FilterItem = DateFilterItem | AttributeFilterItem;
    export type AttributeFilterItem = IPositiveAttributeFilter | INegativeAttributeFilter;
    export type DateFilterItem = IAbsoluteDateFilter | IRelativeDateFilter;

    export interface IPositiveAttributeFilter {
        positiveAttributeFilter: {
            displayForm: ObjQualifier;
            in: string[];
            textFilter?: boolean;
        };
    }

    export interface INegativeAttributeFilter {
        negativeAttributeFilter: {
            displayForm: ObjQualifier;
            notIn: string[];
            textFilter?: boolean;
        };
    }

    export interface IAbsoluteDateFilter {
        absoluteDateFilter: {
            dataSet: ObjQualifier;
            from: string;
            to: string;
        };
    }

    export interface IRelativeDateFilter {
        relativeDateFilter: {
            dataSet: ObjQualifier;
            granularity: string;
            from: number;
            to: number;
        };
    }

    export type ComparisonConditionOperator = 'GREATER_THAN'
        | 'GREATER_THAN_OR_EQUAL_TO'
        | 'LESS_THAN'
        | 'LESS_THAN_OR_EQUAL_TO'
        | 'EQUAL_TO'
        | 'NOT_EQUAL_TO';

    export interface IComparisonCondition {
        comparison: {
            operator: ComparisonConditionOperator
            value: number;
        };
    }

    export type RangeConditionOperator = 'BETWEEN' | 'NOT_BETWEEN';

    export interface IRangeCondition {
        range: {
            operator: RangeConditionOperator;
            from: number;
            to: number;
        };
    }

    export type MeasureValueFilterCondition = IComparisonCondition | IRangeCondition;

    export interface ILocalIdentifierQualifier {
        localIdentifier: string;
    }

    export type Qualifier = ObjQualifier | ILocalIdentifierQualifier;

    export interface IMeasureValueFilter {
        measureValueFilter: {
            measure: Qualifier;
            condition?: MeasureValueFilterCondition;
        };
    }

    // Might be removed, as we don't know if expression filter is needed
    export interface IExpressionFilter {
        value: string;
    }

    export interface ITotalItem {
        measureIdentifier: Identifier;
        type: TotalType;
        attributeIdentifier: Identifier;
    }

    export type TotalType = 'sum' | 'avg' | 'max' | 'min' | 'nat' | 'med';

    export interface INativeTotalItem {
        measureIdentifier: Identifier;
        attributeIdentifiers: Identifier[];
    }

    export interface IDimension {
        itemIdentifiers: Identifier[];
        totals?: ITotalItem[];
    }

    export type SortItem = IAttributeSortItem | IMeasureSortItem;
    export type SortDirection = 'asc' | 'desc';

    export interface IAttributeSortItem {
        attributeSortItem: {
            direction: SortDirection;
            attributeIdentifier: Identifier;
            aggregation?: 'sum';
        };
    }

    export type VisualizationStyleType = 'common' | 'table' | 'line' | 'column' | 'bar' | 'area';

    export interface IVisualizationStyle {
        visualizationStyle: {
            type: VisualizationStyleType;
            colorPalette: {
                measure?: {
                    color: string;
                    periodOverPeriod: string;
                }

                stack?: any
            }
        };
    }

    export interface IMeasureSortItem {
        measureSortItem: {
            direction: SortDirection;
            locators: LocatorItem[];
        };
    }

    export type LocatorItem = IAttributeLocatorItem | IMeasureLocatorItem;

    export interface IAttributeLocatorItem {
        attributeLocatorItem: {
            attributeIdentifier: Identifier;
            element: string;
        };
    }

    export interface IMeasureLocatorItem {
        measureLocatorItem: {
            measureIdentifier: Identifier;
        };
    }

    export function isObjectUriQualifier(qualifier: AFM.ObjQualifier): qualifier is AFM.IObjUriQualifier {
        return !isEmpty(qualifier) && (qualifier as AFM.IObjUriQualifier).uri !== undefined;
    }

    export function isObjIdentifierQualifier(qualifier: AFM.ObjQualifier): qualifier is AFM.IObjIdentifierQualifier {
        return !isEmpty(qualifier) && (qualifier as AFM.IObjIdentifierQualifier).identifier !== undefined;
    }

    export function isSimpleMeasureDefinition(
        definition: AFM.MeasureDefinition
    ): definition is AFM.ISimpleMeasureDefinition {
        return !isEmpty(definition) && (definition as AFM.ISimpleMeasureDefinition).measure !== undefined;
    }

    export function isArithmeticMeasureDefinition(
        definition: AFM.MeasureDefinition
    ): definition is AFM.IArithmeticMeasureDefinition {
        return !isEmpty(definition) && (definition as AFM.IArithmeticMeasureDefinition).arithmeticMeasure !== undefined;
    }

    export function isPopMeasureDefinition(
        definition: AFM.MeasureDefinition
    ): definition is AFM.IPopMeasureDefinition {
        return !isEmpty(definition) && (definition as AFM.IPopMeasureDefinition).popMeasure !== undefined;
    }

    export function isPreviousPeriodMeasureDefinition(
        definition: AFM.MeasureDefinition
    ): definition is AFM.IPreviousPeriodMeasureDefinition {
        return !isEmpty(definition)
            && (definition as AFM.IPreviousPeriodMeasureDefinition).previousPeriodMeasure !== undefined;
    }

    export function isAttributeSortItem(sortItem: AFM.SortItem): sortItem is AFM.IAttributeSortItem {
        return !isEmpty(sortItem) && (sortItem as AFM.IAttributeSortItem).attributeSortItem !== undefined;
    }

    export function isMeasureSortItem(sortItem: AFM.SortItem): sortItem is AFM.IMeasureSortItem {
        return !isEmpty(sortItem) && (sortItem as AFM.IMeasureSortItem).measureSortItem !== undefined;
    }

    export function isMeasureLocatorItem(locator: AFM.LocatorItem): locator is AFM.IMeasureLocatorItem {
        return !isEmpty(locator) && (locator as AFM.IMeasureLocatorItem).measureLocatorItem !== undefined;
    }

    export function isDateFilter(filter: AFM.CompatibilityFilter): filter is AFM.DateFilterItem {
        return !isEmpty(filter) && (isRelativeDateFilter(filter) || isAbsoluteDateFilter(filter));
    }

    export function isRelativeDateFilter(filter: AFM.CompatibilityFilter): filter is AFM.IRelativeDateFilter {
        return !isEmpty(filter) && (filter as IRelativeDateFilter).relativeDateFilter !== undefined;
    }

    export function isAbsoluteDateFilter(filter: AFM.CompatibilityFilter): filter is AFM.IAbsoluteDateFilter {
        return !isEmpty(filter) && (filter as IAbsoluteDateFilter).absoluteDateFilter !== undefined;
    }

    export function isAttributeFilter(filter: AFM.CompatibilityFilter): filter is AFM.AttributeFilterItem {
        return !isEmpty(filter) && (isPositiveAttributeFilter(filter) || isNegativeAttributeFilter(filter));
    }

    export function isPositiveAttributeFilter(filter: AFM.CompatibilityFilter): filter is AFM.IPositiveAttributeFilter {
        return !isEmpty(filter) && (filter as AFM.IPositiveAttributeFilter).positiveAttributeFilter !== undefined;
    }

    export function isNegativeAttributeFilter(filter: AFM.CompatibilityFilter): filter is AFM.INegativeAttributeFilter {
        return !isEmpty(filter) && (filter as AFM.INegativeAttributeFilter).negativeAttributeFilter !== undefined;
    }

    export function isMeasureValueFilter(filter: AFM.CompatibilityFilter): filter is AFM.IMeasureValueFilter {
        return !isEmpty(filter) && (filter as AFM.IMeasureValueFilter).measureValueFilter !== undefined;
    }

    export function isExpressionFilter(filter: AFM.CompatibilityFilter): filter is AFM.IExpressionFilter {
        return !isEmpty(filter) && (filter as AFM.IExpressionFilter).value !== undefined;
    }
}
