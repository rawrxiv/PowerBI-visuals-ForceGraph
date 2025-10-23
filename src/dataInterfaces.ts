/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { SimulationNodeDatum as Node } from "d3-force";
import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;

import { TooltipEnabledDataPoint } from "powerbi-visuals-utils-tooltiputils";
import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = vf.IValueFormatter;

import { Selection as d3Selection } from "d3-selection";
type Selection<T> = d3Selection<any, T, any, any>;

import { ForceGraphSettings } from "./settings";

export interface ISelectableDataPoint {
    selected: boolean;
    identity: ISelectionId;
}

export interface ForceGraphNode extends Node, ISelectableDataPoint {
    name: string;
    image: string;
    adj: { [i: string]: number };
    links: ForceGraphLink[];
    x?: number;
    y?: number;
    isDrag?: boolean;
    isOver?: boolean;
    hideLabel?: boolean;
    weight?: number;
    dataWeight?: number;
    color?: string;
    colorValue?: string;
    colorLabel?: string;
}

export interface ITextRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ForceGraphNodes {
    [i: string]: ForceGraphNode;
}

export interface ForceGraphLink extends TooltipEnabledDataPoint, ISelectableDataPoint {
    source: ForceGraphNode;
    target: ForceGraphNode;
    weight: number;
    formattedWeight: string;
    linkType: string;
}

export interface ForceGraphData {
    nodes: ForceGraphNodes;
    links: ForceGraphLink[];
    minFiles: number;
    maxFiles: number;
    linkedByName: LinkedByName;
    linkTypes: LinkTypes;
    nodeCategories: NodeColorDataPoints;
    settings: ForceGraphSettings;
    formatter: IValueFormatter;
}

export interface LinkType {
    color: string;
    label: string;
}

export interface LinkTypes {
    [linkType: string]: LinkType;
}

export interface LinkedByName {
    [linkName: string]: number;
}

export interface NodeColorDataPoint {
    color: string;
    label: string;
    selectionId: ISelectionId;
    value: string;
}

export interface NodeColorDataPoints {
    [category: string]: NodeColorDataPoint;
}

export interface ForceGraphBehaviorOptions {
    nodes: Selection<ForceGraphNode>;
    links: Selection<ForceGraphLink>;
    clearCatcher: Selection<any>;
}
