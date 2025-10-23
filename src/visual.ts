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

/*
 *  This file is based on or incorporates material from the projects listed below (Third Party IP).
 *  The original copyright notice and the license under which Microsoft received such Third Party IP,
 *  are set forth below. Such licenses and notices are provided for informational purposes only.
 *  Microsoft licenses the Third Party IP to you under the licensing terms for the Microsoft product.
 *  Microsoft reserves all other rights not expressly granted under this agreement, whether by
 *  implication, estoppel or otherwise.
 *
 *  d3 Force Layout
 *  Copyright (c) 2010-2015, Michael Bostock
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * The name Michael Bostock may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *  DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 *  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 *  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 *  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import "./../style/visual.less";
import { drag as d3Drag, D3DragEvent } from "d3-drag";
import { forceSimulation, forceLink, Simulation, forceManyBody, forceX, forceY } from "d3-force";
import { scaleLinear as d3ScaleLinear, ScaleLinear as d3ScaleLinearType } from "d3-scale";

import {
    select as d3Select,
    Selection as d3Selection
} from "d3-selection";
type Selection<T> = d3Selection<any, T, any, any>;

import isEmpty from "lodash.isempty";
import powerbi from "powerbi-visuals-api";

import IViewport = powerbi.IViewport;
import IColorPalette = powerbi.extensibility.IColorPalette;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import DataView = powerbi.DataView;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import * as SVGUtil from "powerbi-visuals-utils-svgutils";
import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;

import { IMargin, manipulation } from "powerbi-visuals-utils-svgutils";
import translate = manipulation.translate;

// powerbi.extensibility.utils.formatting
import { valueFormatter, textMeasurementService, interfaces } from "powerbi-visuals-utils-formattingutils";
import TextProperties = interfaces.TextProperties;
import IValueFormatter = valueFormatter.IValueFormatter;

import { ITooltipServiceWrapper, createTooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { formattingSettings, FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

import { ForceGraphColumns } from "./columns";
import { ForceGraphSettings, LinkColorType } from "./settings";
import { ForceGraphTooltipsFactory } from "./tooltipsFactory";
import { ForceGraphData, ForceGraphNode, ForceGraphNodes, ForceGraphLink, LinkedByName, ITextRect, ForceGraphBehaviorOptions, LinkTypes, NodeColorDataPoints } from "./dataInterfaces";
import { ExternalLinksTelemetry } from "./telemetry";
import { ForceGraphBehavior } from "./behavior";

import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;

export class ForceGraph implements IVisual {
    private static VisualClassName: string = "forceGraph";
    private static DefaultImage: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAHNDTTxAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACuUExURQAAAMbGxvLy8sfHx/Hx8fLy8vHx8cnJycrKyvHx8fHx8cvLy/Ly8szMzM3NzfHx8dDQ0PHx8fLy8vHx8e/v79LS0tPT0/Ly8tTU1NXV1dbW1vHx8fHx8fDw8NjY2PT09PLy8vLy8vHx8fLy8vHx8fHx8enp6fDw8PLy8uPj4+Tk5OXl5fHx8b+/v/Pz8+bm5vHx8ejo6PLy8vHx8fLy8sTExPLy8vLy8sXFxfHx8YCtMbUAAAA6dFJOUwD/k/+b7/f///+r/////0z/w1RcEP//ZP///4fj/v8Yj3yXn/unDEhQ////YP9Y/8//aIMU/9+L/+fzC4s1AAAACXBIWXMAABcRAAAXEQHKJvM/AAABQElEQVQoU5WS61LCMBCFFymlwSPKVdACIgWkuNyL+P4v5ibZ0jKjP/xm0uw5ySa7mRItAhnMoIC5TwQZdCZiZjcoC8WU6EVsmZgzoqGdxafgvJAvjUXCb2M+0cXNsd/GDarZqSf7av3M2P1E3xhfLkPUvLD5joEYwVVJQXM6+9McWUwLf4nDTCQZAy96UoDjNI/jhl3xPLbQamu8xD7iaIsPKw7GJ7KZEnWLY3Gi8EFj5nqibXnwD5VEGjJXk5sbpLppfvvo1RazQVrhSopPK4TODrtnjS3dY4ic8KurruWQYF+UG60BacexTMyT2jlNg41dOmKvTpkUd/Jevy7ZxQ61ULRUpoododx8GeDPvIrktbFVdUsK6f8Na5VlVpjZJtowTXVy7kfXF5wCaV1tqXAFuIdWJu+JviaQzNzfQvQDGKRXXEmy83cAAAAASUVORK5CYII=";

    private static MinViewport: IViewport = {
        width: 1,
        height: 1
    };

    private static ImageViewport: IViewport = {
        width: 24,
        height: 24
    };

    private static ImagePosition: number = -12;
    private static MinNodeWeight: number = 5;
    private static MaxNodeRadius: number = 50;
    private static GravityFactor: number = 100;
    private static LinkDistance: number = 100;
    private static HoverOpacity: number = 0.4;
    private static DefaultOpacity: number = 1;
    private static DefaultLinkColor: string = "#bbb";
    private static DefaultLinkHighlightColor: string = "#f00";
    private static DefaultLinkThickness: string = "1.5px";
    private static LabelsFontFamily: string = "sans-serif";
    private static MinRangeValue: number = 1;
    private static MaxRangeValue: number = 10;
    private static DefaultValueOfExistingLink: number = 1;
    private static DefaultLinkType: string = "";
    private static MinWeight: number = 0;
    private static MaxWeight: number = 0;
    private static DefaultSourceType: string = "";
    private static DefaultTargetType: string = "";
    private static StartOffset: string = "25%";
    private static DefaultLinkFillColor: string = "#000";
    private static LinkTextAnchor: string = "middle";
    private static DefaultLabelX: number = 12;
    private static DefaultLabelDy: string = ".35em";
    private static DefaultLabelText: string = "";
    private static ResolutionFactor: number = 20;
    private static ResolutionFactorBoundByBox: number = 0.9;
    private static LinkSelector: ClassAndSelector = createClassAndSelector("link");
    private static LinkLabelHolderSelector: ClassAndSelector = createClassAndSelector("linklabelholder");
    private static LinkLabelSelector: ClassAndSelector = createClassAndSelector("linklabel");
    private static NodeSelector: ClassAndSelector = createClassAndSelector("node");
    private static NodeLabelsSelector: ClassAndSelector = createClassAndSelector("nodelabel");
    private static NoAnimationLimit: number = 200;

    private telemetry: ExternalLinksTelemetry;

    private behavior: ForceGraphBehavior;
    private host: IVisualHost;
    private eventService: IVisualEventService;
    private settings: ForceGraphSettings;
    private formattingSettingsService: FormattingSettingsService;
    private localizationManager: ILocalizationManager;

    private static substractMargin(viewport: IViewport, margin: IMargin): IViewport {
        return {
            width: Math.max(viewport.width - (margin.left + margin.right), 0),
            height: Math.max(viewport.height - (margin.top + margin.bottom), 0)
        };
    }

    private defaultYPosition: number = -6;
    private defaultYOffset: number = -2;

    private svg: Selection<any>;
    private container: Selection<any>;
    private paths: Selection<ForceGraphLink>;
    private nodes: Selection<ForceGraphNode>;
    private forceSimulation: Simulation<ForceGraphNode, ForceGraphLink>;

    private colorPalette: ISandboxExtendedColorPalette;
    private colorHelper: ColorHelper;

    private marginValue: IMargin;

    private get margin(): IMargin {
        return this.marginValue || { left: 0, right: 0, top: 0, bottom: 0 };
    }

    private set margin(value: IMargin) {
        this.marginValue = { ...value };
        this.viewportInValue = ForceGraph.substractMargin(this.viewport, this.margin);
    }

    private viewportValue: IViewport;

    private get viewport(): IViewport {
        return this.viewportValue || { ...ForceGraph.MinViewport };
    }

    private set viewport(viewport: IViewport) {
        this.viewportValue = ForceGraph.getViewport(viewport);
        this.viewportInValue = ForceGraph.getViewport(
            ForceGraph.substractMargin(this.viewport, this.margin));
    }

    private viewportInValue: IViewport;

    private get viewportIn(): IViewport {
        return this.viewportInValue || this.viewport;
    }

    private data: ForceGraphData;

    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.init(options);
    }

    private init(options: VisualConstructorOptions): void {
        const root: Selection<any> = d3Select(options.element);
        this.telemetry = new ExternalLinksTelemetry(this.host.telemetry);

        this.localizationManager = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        this.colorPalette = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette);
        this.eventService = options.host.eventService;

        const selectionManager: ISelectionManager = this.host.createSelectionManager();
        this.behavior = new ForceGraphBehavior(selectionManager);

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            options.host.tooltipService,
            options.element
        );

        this.forceSimulation = forceSimulation<ForceGraphNode, ForceGraphLink>();

        this.svg = root
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .classed(ForceGraph.VisualClassName, true);

        this.container = this.svg.append("g")
            .classed("chartContainer", true)
            .attr("role", "listbox")
            .attr("aria-multiselectable", "true");
    }

    private static getViewport(viewport: IViewport): IViewport {
        const { width, height } = viewport;

        return {
            width: Math.max(ForceGraph.MinViewport.width, width),
            height: Math.max(ForceGraph.MinViewport.height, height)
        };
    }

    private scale1to10(value: number): number {
        const scale: d3ScaleLinearType<number, number> = d3ScaleLinear()
            .domain([
                this.data.minFiles,
                this.data.maxFiles || ForceGraph.MaxRangeValue
            ])
            .rangeRound([
                ForceGraph.MinRangeValue,
                ForceGraph.MaxRangeValue
            ])
            .clamp(true);

        return scale(value);
    }

    private getLinkColor(
        link: ForceGraphLink,
        colorPalette: IColorPalette,
        colorHelper: ColorHelper,
    ): string {
        if (colorHelper.isHighContrast) {
            return colorHelper.getThemeColor("foreground");
        }

        switch (this.settings.links.linkOptions.colorLink.value.value) {
            case LinkColorType.ByWeight: {
                return colorPalette
                    .getColor(this.scale1to10(link.weight).toString())
                    .value;
            }
            case LinkColorType.ByLinkType: {
                return link.linkType && this.data.linkTypes[link.linkType]
                    ? this.data.linkTypes[link.linkType].color
                    : ForceGraph.DefaultLinkColor;
            }
        }

        return ForceGraph.DefaultLinkColor;
    }

    // eslint-disable-next-line max-lines-per-function
    public static converter(
        dataView: DataView,
        colorPalette: IColorPalette,
        colorHelper: ColorHelper,
        host: IVisualHost,
        settings: ForceGraphSettings
    ): ForceGraphData {

        const metadata: ForceGraphColumns<DataViewMetadataColumn> = ForceGraphColumns.getMetadataColumns(dataView);
        const nodes: ForceGraphNodes = {};

        let minFiles: number = Number.MAX_VALUE;
        let maxFiles: number = 0;

        const linkedByName: LinkedByName = {};
        const links: ForceGraphLink[] = [];
        const linkDataPoints: LinkTypes = {};

        let linkTypeCount: number = 0;

        if (!metadata || !metadata.Source || !metadata.Target) {
            return null;
        }

        const categorical: ForceGraphColumns<DataViewCategoryColumn & DataViewValueColumn[]>
            = ForceGraphColumns.getCategoricalColumns(dataView);

        if (!categorical
            || !categorical.Source
            || !categorical.Target
            || isEmpty(categorical.Source.source)
            || isEmpty(categorical.Source.values)
            || isEmpty(categorical.Target.source)
            || isEmpty(categorical.Target.values)
        ) {
            return null;
        }

        const sourceCategories: any[] = categorical.Source.values,
            targetCategories: any[] = categorical.Target.values,
            sourceTypeCategories: any[] = (categorical.SourceType || { values: [] }).values,
            targetTypeCategories: any[] = (categorical.TargetType || { values: [] }).values,
            linkTypeCategories: any[] = (categorical.LinkType || { values: [] }).values,
            weightValues: any[] = (categorical.Weight && categorical.Weight[0] || { values: [] }).values,
            nodeWeightColumns: DataViewValueColumn[] = categorical.NodeWeight || <DataViewValueColumn[]>[],
            sourceNodeWeightValues: any[] = (nodeWeightColumns[0] || { values: [] }).values,
            targetNodeWeightValues: any[] = (nodeWeightColumns[1] || nodeWeightColumns[0] || { values: [] }).values,
            nodeColorColumns: DataViewValueColumn[] = categorical.NodeColor || <DataViewValueColumn[]>[],
            sourceNodeColorValues: any[] = (nodeColorColumns[0] || { values: [] }).values,
            targetNodeColorValues: any[] = (nodeColorColumns[1] || nodeColorColumns[0] || { values: [] }).values;

        const hasSeparateTargetWeights: boolean = nodeWeightColumns.length > 1;
        const hasNodeColorData: boolean = nodeColorColumns.length > 0;
        const hasSeparateTargetColors: boolean = nodeColorColumns.length > 1;

        const assignNodeWeight = (node: ForceGraphNode, value: any): void => {
            if (!node) {
                return;
            }

            const numericValue: number = Number(value);

            if (value === null || value === undefined || isNaN(numericValue)) {
                return;
            }

            node.dataWeight = node.dataWeight !== undefined
                ? Math.max(node.dataWeight, numericValue)
                : numericValue;
        };

        const nodeColorHelper: ColorHelper = hasNodeColorData
            ? new ColorHelper(
                colorPalette,
                {
                    objectName: "nodeDataColors",
                    propertyName: "fill"
                },
                settings.nodes.optionGroup.fillColor.value.value
            )
            : null;

        const nodeColorFormatters: Array<IValueFormatter | null> = nodeColorColumns.map((column: DataViewValueColumn) => {
            return valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(column.source, true)
            });
        });

        const nodeCategoryColors: { [key: string]: { color: string; label: string } } = {};
        const nodeColorDataPoints: NodeColorDataPoints = {};

        const assignNodeColor = (
            node: ForceGraphNode,
            rawValue: any,
            column: DataViewValueColumn,
            columnIndex: number
        ): void => {
            if (!hasNodeColorData || !node || !nodeColorHelper) {
                return;
            }

            if (rawValue === undefined || rawValue === null || rawValue === "") {
                return;
            }

            const key: string = String(rawValue);

            const objects = column && column.objects ? column.objects[columnIndex] : undefined;
            const formatterIndex: number = Math.max(nodeColorColumns.indexOf(column), 0);
            const labelFormatter: IValueFormatter | null = nodeColorFormatters[formatterIndex];
            const label: string = labelFormatter ? labelFormatter.format(rawValue) : key;
            const paletteColor: string = nodeColorHelper.getColorForSeriesValue(objects, key);
            const color: string = nodeColorHelper.getHighContrastColor("foreground", paletteColor);

            if (!nodeCategoryColors[key]) {
                nodeCategoryColors[key] = {
                    color,
                    label
                };
            } else if (objects && nodeCategoryColors[key].color !== color) {
                nodeCategoryColors[key].color = color;
            }

            const categoryInfo = nodeCategoryColors[key];

            node.color = categoryInfo.color;
            node.colorValue = key;
            node.colorLabel = categoryInfo.label;

            if (!nodeColorDataPoints[key] && node.identity) {
                nodeColorDataPoints[key] = {
                    color: categoryInfo.color,
                    label: categoryInfo.label,
                    selectionId: node.identity,
                    value: key
                };
            }
        };

        let weightFormatter: IValueFormatter = null;

        if (metadata.Weight) {
            let weightValue: number = +settings.links.linkOptions.displayUnits.value;

            if (!weightValue && categorical.Weight && categorical.Weight.length) {
                weightValue = categorical.Weight[0].maxLocal as number;
            }

            weightFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(metadata.Weight, true),
                precision: settings.links.linkOptions.decimalPlaces.value,
                value: weightValue
            });
        }

        const sourceFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(metadata.Source, true),
        });

        const targetFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(metadata.Target, true),
        });

        for (let i = 0; i < targetCategories.length; i++) {
            const source = sourceCategories[i];
            const target = targetCategories[i];
            const targetType = targetTypeCategories[i];
            const sourceType = sourceTypeCategories[i];
            const linkType = linkTypeCategories[i];
            const weight = weightValues[i];
            const sourceNodeWeight = sourceNodeWeightValues[i];
            const targetNodeWeight = hasSeparateTargetWeights ? targetNodeWeightValues[i] : sourceNodeWeight;
            const sourceNodeColor = sourceNodeColorValues[i];
            const targetNodeColor = hasSeparateTargetColors ? targetNodeColorValues[i] : sourceNodeColor;

            linkedByName[`${source},${target}`] = ForceGraph.DefaultValueOfExistingLink;

            if (!nodes[source]) {
                nodes[source] = {
                    name: sourceFormatter.format(source),
                    hideLabel: false,
                    image: sourceType || ForceGraph.DefaultSourceType,
                    adj: {},
                    weight: 0,
                    dataWeight: undefined,
                    selected: false,
                    links: [],
                    identity: host.createSelectionIdBuilder()
                        .withCategory(categorical.Source, i)
                        .withMeasure(<string>categorical.Source.values[i])
                        .createSelectionId()
                };
            }

            if (!nodes[target]) {
                nodes[target] = {
                    name: targetFormatter.format(target),
                    hideLabel: false,
                    image: targetType || ForceGraph.DefaultTargetType,
                    adj: {},
                    weight: 0,
                    dataWeight: undefined,
                    selected: false,
                    links: [],
                    identity: host.createSelectionIdBuilder()
                        .withCategory(categorical.Target, i)
                        .withMeasure(<string>categorical.Target.values[i])
                        .createSelectionId()
                };
            }

            const sourceNode: ForceGraphNode = nodes[source],
                targetNode: ForceGraphNode = nodes[target];

            sourceNode.adj[targetNode.name] = sourceNode.adj[targetNode.name] + 1 || ForceGraph.DefaultValueOfExistingLink;
            targetNode.adj[sourceNode.name] = targetNode.adj[sourceNode.name] + 1 || ForceGraph.DefaultValueOfExistingLink;

            assignNodeWeight(sourceNode, sourceNodeWeight);
            assignNodeWeight(targetNode, targetNodeWeight);
            if (hasNodeColorData) {
                assignNodeColor(sourceNode, sourceNodeColor, nodeColorColumns[0], i);
                const targetColorColumn = hasSeparateTargetColors ? nodeColorColumns[1] : nodeColorColumns[0];
                assignNodeColor(targetNode, targetNodeColor, targetColorColumn, i);
            }

            const tooltipInfo: VisualTooltipDataItem[] = ForceGraphTooltipsFactory.build(
                {
                    Source: source,
                    Target: target,
                    Weight: weightFormatter ? weightFormatter.format(weight) : weight,
                    LinkType: linkType,
                    SourceType: sourceType,
                    TargetType: targetType
                },
                dataView.metadata.columns
            );

            const link: ForceGraphLink = {
                source: sourceNode,
                target: targetNode,
                weight: Math.max(metadata.Weight
                    ? (weight || ForceGraph.MinWeight)
                    : ForceGraph.MaxWeight,
                    ForceGraph.MinWeight),
                formattedWeight: weight && weightFormatter.format(weight),
                linkType: linkType || ForceGraph.DefaultLinkType,
                tooltipInfo: tooltipInfo,
                selected: false,
                identity: host.createSelectionIdBuilder()
                    .withCategory(categorical.Source, i)
                    .withMeasure(<string>categorical.Source.values[i])
                    .withCategory(categorical.Target, i)
                    .withMeasure(<string>categorical.Target.values[i])
                    .createSelectionId()
            };

            if (metadata.LinkType && !linkDataPoints[linkType]) {
                const color: string = colorHelper.getHighContrastColor(
                    "foreground",
                    colorPalette.getColor((linkTypeCount++).toString()).value
                );

                linkDataPoints[linkType] = {
                    color,
                    label: linkType,
                };
            }

            if (link.weight < minFiles) {
                minFiles = link.weight;
            }

            if (link.weight > maxFiles) {
                maxFiles = link.weight;
            }

            links.push(link);
            sourceNode.links.push(link);
            targetNode.links.push(link);
        }

        const nodesArray: ForceGraphNode[] = Object.values(nodes);
        const nodesWithDataWeight: ForceGraphNode[] = nodesArray.filter((node: ForceGraphNode) =>
            node.dataWeight !== undefined && !isNaN(node.dataWeight));

        if (nodesWithDataWeight.length) {
            const nodeWeights: number[] = nodesWithDataWeight
                .map((node: ForceGraphNode) => node.dataWeight as number);

            const minNodeWeight: number = Math.min(...nodeWeights);
            const maxNodeWeight: number = Math.max(...nodeWeights);
            const domainMax: number = minNodeWeight === maxNodeWeight
                ? minNodeWeight + 1
                : maxNodeWeight;

            const weightScale: d3ScaleLinearType<number, number> = d3ScaleLinear<number, number>()
                .domain([minNodeWeight, domainMax])
                .rangeRound([ForceGraph.MinNodeWeight, ForceGraph.MaxNodeRadius])
                .clamp(true);

            nodesWithDataWeight.forEach((node: ForceGraphNode) => {
                node.weight = weightScale(node.dataWeight as number);
            });
        }

        // calculate nodes weight based on number of links if node weight isn't provided
        nodesArray.forEach((node: ForceGraphNode) => {
            if (node.weight === undefined || isNaN(node.weight)) {
                node.weight = Object.values(node.adj).reduce((partialSum, a) => partialSum + a, 0);
            }
        });

        return {
            nodes,
            links,
            minFiles,
            maxFiles,
            linkedByName,
            settings,
            linkTypes: linkDataPoints,
            nodeCategories: nodeColorDataPoints,
            formatter: targetFormatter
        };
    }

    private isIntersect(textRect1: ITextRect, textRect2: ITextRect): boolean {
        let intersectY: boolean = false;
        let intersectX: boolean = false;

        if (textRect1.y1 <= textRect2.y1 && textRect2.y1 <= textRect1.y2) {
            intersectY = true;
        }
        if (textRect1.y1 <= textRect2.y2 && textRect2.y2 <= textRect1.y2) {
            intersectY = true;
        }
        if (textRect2.y2 <= textRect1.y1 && textRect1.y1 <= textRect2.y1) {
            intersectY = true;
        }
        if (textRect2.y2 <= textRect1.y2 && textRect1.y2 <= textRect2.y1) {
            intersectY = true;
        }

        if (textRect1.x1 <= textRect2.x1 && textRect2.x1 <= textRect1.x2) {
            intersectX = true;
        }
        if (textRect1.x1 <= textRect2.x2 && textRect2.x2 <= textRect1.x2) {
            intersectX = true;
        }
        if (textRect2.x2 <= textRect1.x1 && textRect1.x1 <= textRect2.x1) {
            intersectX = true;
        }
        if (textRect2.x2 <= textRect1.x2 && textRect1.x2 <= textRect2.x1) {
            intersectX = true;
        }

        return intersectX && intersectY;
    }

    public update(options: VisualUpdateOptions): void {
        if (!options
            || !options.dataViews
            || !options.dataViews[0]
        ) {
            return;
        }

        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(ForceGraphSettings, options.dataViews[0]);
        this.settings.setHighContrastColor(this.colorPalette);

        this.data = ForceGraph.converter(
            options.dataViews[0],
            this.colorPalette,
            this.colorHelper,
            this.host,
            this.settings
        );

        if (!this.data) {
            this.reset();
            return;
        }

        this.viewport = options.viewport;

        this.updateNodeColorSettings();

        const k: number = Math.sqrt(Object.keys(this.data.nodes).length /
            (this.viewport.width * this.viewport.height));

        this.reset();
        const theta: number = 1.4;

        this.forceSimulation
            .force("link", forceLink(this.data.links).distance(ForceGraph.LinkDistance))
            .force("x", forceX(this.viewport.width / 2).strength(ForceGraph.GravityFactor * k))
            .force("y", forceY(this.viewport.height / 2).strength(ForceGraph.GravityFactor * k))
            .force("charge", forceManyBody().strength(this.settings.size.charge.value / k))
            .force("theta", forceManyBody().theta(theta))
            .alpha(0.5);

        const nodesNum: number = Object.keys(this.data.nodes).length;
        this.updateNodes();

        if (this.settings.animation.show.value && nodesNum <= ForceGraph.NoAnimationLimit) {
            this.forceSimulation.on("tick", this.getForceTick()).restart();
        }
        else {
            // manually run simulation to the end
            while (this.forceSimulation.alpha() > this.forceSimulation.alphaMin()) {
                this.forceSimulation.tick();
            }
            // set nodes and links positions
            this.getForceTick();
        }

        this.eventService.renderingStarted(options);
        this.render();
        this.eventService.renderingFinished(options);

        if (this.settings.nodes.imageGroup.displayImage.value) {
            this.telemetry.detectExternalImages(this.settings.nodes.imageGroup.imageUrl.value);
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        this.settings.setLocalizedOptions(this.localizationManager);
        const model = this.formattingSettingsService.buildFormattingModel(this.settings);
        return model;
    }

    private updateNodeColorSettings(): void {
        if (!this.settings || !this.settings.nodes || !this.settings.nodes.colorGroup) {
            return;
        }

        const colorGroup = this.settings.nodes.colorGroup;
        const nodeCategories: NodeColorDataPoints = this.data && this.data.nodeCategories
            ? this.data.nodeCategories
            : {};

        const wildcardSelector = dataViewWildcard.createDataViewWildcardSelector(
            dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals
        );

        const slices = Object.keys(nodeCategories).map((key: string) => {
            const dataPoint = nodeCategories[key];

            const colorSlice = new formattingSettings.ColorPicker({
                name: "fill",
                displayName: dataPoint.label,
                value: { value: dataPoint.color },
                selector: wildcardSelector,
                altConstantSelector: dataPoint.selectionId ? dataPoint.selectionId.getSelector() : undefined,
                instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
            });

            (colorSlice as any).dataValue = dataPoint.value;

            return colorSlice;
        });

        colorGroup.slices = slices;
        colorGroup.visible = slices.length > 0;

        const colorOverrides: { [value: string]: string } = {};

        slices.forEach((slice: formattingSettings.ColorPicker & { dataValue?: string }) => {
            if (slice.value && slice.value.value && slice.dataValue) {
                colorOverrides[slice.dataValue] = slice.value.value;
            }
        });

        if (this.data && Object.keys(colorOverrides).length) {
            Object.values(this.data.nodes).forEach((node: ForceGraphNode) => {
                if (node.colorValue && colorOverrides[node.colorValue]) {
                    node.color = colorOverrides[node.colorValue];
                }
            });

            Object.keys(nodeCategories).forEach((key: string) => {
                if (colorOverrides[key]) {
                    nodeCategories[key].color = colorOverrides[key];
                }
            });
        }
    }

    private render(): void {
        this.renderLinks(this.settings);
        this.renderLinkLabels(this.settings);
        this.renderNodes(this.settings);
        this.renderNodeLabels(this.settings);

        const behaviorOptions: ForceGraphBehaviorOptions = {
            nodes: this.nodes,
            links: this.paths,
            clearCatcher: this.svg
        }
        this.behavior.bindEvents(behaviorOptions, this.fadeNode.bind(this));
        this.behavior.renderSelection();
    }

    private renderLinks(settings: ForceGraphSettings): void {
        this.paths = this.container.selectAll(ForceGraph.LinkSelector.selectorName)
            .data(this.data.links)
            .enter()
            .append("path")
            .attr("id", (d, i) => "linkid_" + i)
            .attr("stroke-width", (link: ForceGraphLink) => {
                return settings.links.linkOptions.thickenLink.value
                    ? this.scale1to10(link.weight)
                    : ForceGraph.DefaultLinkThickness;
            })
            .classed(ForceGraph.LinkSelector.className, true)
            .style("stroke", (link: ForceGraphLink) => {
                return this.getLinkColor(link, this.colorPalette, this.colorHelper);
            })
            .style("fill", (link: ForceGraphLink) => {
                if (settings.links.linkOptions.showArrow.value && link.source !== link.target) {
                    return this.getLinkColor(link, this.colorPalette, this.colorHelper);
                }
            })
            .on("mouseover", () => {
                return this.fadePath(
                    ForceGraph.HoverOpacity,
                    this.colorHelper.getHighContrastColor("foreground", ForceGraph.DefaultLinkHighlightColor),//gray
                    this.colorHelper.getHighContrastColor("foreground", ForceGraph.DefaultLinkColor)
                );
            })
            .on("mouseout", () => {
                return this.fadePath(
                    ForceGraph.DefaultOpacity,
                    this.colorHelper.getHighContrastColor("foreground", ForceGraph.DefaultLinkColor),
                    this.colorHelper.getHighContrastColor("foreground", ForceGraph.DefaultLinkColor)
                );
            });

        //link tooltips
        this.tooltipServiceWrapper.addTooltip(
            this.paths,
            (data: ForceGraphLink) => data.tooltipInfo,
            (data: ForceGraphLink) => data.identity
        );
    }

    private renderLinkLabels(settings: ForceGraphSettings): void {
        if (!settings.links.linkLabels.showLabel.value) {
            return;
        }

        const linklabelholderUpdate: Selection<ForceGraphLink> = this.container
            .selectAll(ForceGraph.LinkLabelHolderSelector.selectorName)
            .data(this.data.links);

        linklabelholderUpdate.enter()
            .append("g")
            .classed(ForceGraph.LinkLabelHolderSelector.className, true)
            .append("text")
            .classed(ForceGraph.LinkLabelSelector.className, true)
            .attr("dy", (link: ForceGraphLink) => {
                return settings.links.linkOptions.thickenLink.value
                    ? -this.scale1to10(link.weight) + this.defaultYOffset
                    : this.defaultYPosition;
            })
            .attr("text-anchor", ForceGraph.LinkTextAnchor)
            .style("fill", settings.links.linkLabels.color.value.value)
            .style("font-size", PixelConverter.fromPoint(settings.links.linkLabels.fontControl.fontSize.value))
            .style("font-family", settings.links.linkLabels.fontControl.fontFamily.value)
            .style("font-weight", settings.links.linkLabels.fontControl.bold.value ? "bold" : "normal")
            .style("font-style", settings.links.linkLabels.fontControl.italic.value ? "italic" : "normal")
            .style("text-decoration", settings.links.linkLabels.fontControl.underline.value ? "underline" : "none")
            .append("textPath")
            .attr("href", (link: ForceGraphLink, index: number) => {
                return "#linkid_" + index;
            })
            .attr("startOffset", ForceGraph.StartOffset)
            .text((link: ForceGraphLink) => {
                return settings.links.linkOptions.colorLink.value.value === LinkColorType.ByLinkType
                    ? link.linkType
                    : link.formattedWeight;
            });

        linklabelholderUpdate
            .exit()
            .remove();
    }

    private renderNodes(settings: ForceGraphSettings): void {
        // define the nodes
        this.nodes = this.container.selectAll(ForceGraph.NodeSelector.selectorName)
            .data(Object.values(this.data.nodes))
            .enter()
            .append("g")
            .attr("drag-resize-disabled", true)
            .classed(ForceGraph.NodeSelector.className, true);

        const nodesNum: number = Object.keys(this.data.nodes).length;
        if (nodesNum <= ForceGraph.NoAnimationLimit && settings.animation.show.value) {
            const drag = d3Drag()
                .on("start", ((event: D3DragEvent<Element, ForceGraphNode, ForceGraphNode>, d: ForceGraphNode) => {
                    if (!event.active) {
                        this.forceSimulation.alphaTarget(1).restart();
                    }
                    d.isDrag = true;
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                    this.fadeNode(d);
                }))
                .on("end", ((event: D3DragEvent<Element, ForceGraphNode, ForceGraphNode>, d: ForceGraphNode) => {
                    if (!event.active) {
                        this.forceSimulation.alphaTarget(0);
                    }
                    event.subject.fx = null;
                    event.subject.fy = null;
                    d.isDrag = false;
                    this.fadeNode(d);
                }))
                .on("drag", (event: D3DragEvent<Element, ForceGraphNode, ForceGraphNode>, d: ForceGraphNode) => {
                    d.fx = event.x;
                    d.fy = event.y;
                    this.fadeNode(d);
                });
            this.nodes.call(drag);
        }
        // render without animation
        else {
            const viewport: IViewport = this.viewportIn;

            const maxWidth: number = viewport.width * ForceGraph.ResolutionFactor,
                maxHeight: number = viewport.height * ForceGraph.ResolutionFactor,
                limitX = x => Math.max((viewport.width - maxWidth) / 2, Math.min((viewport.width + maxWidth) / 2, x)),
                limitY = y => Math.max((viewport.height - maxHeight) / 2, Math.min((viewport.height + maxHeight) / 2, y));

            this.paths.attr("d", (link: ForceGraphLink) => {
                link.source.x = limitX(link.source.x);
                link.source.y = limitY(link.source.y);
                link.target.x = limitX(link.target.x);
                link.target.y = limitY(link.target.y);

                return settings && settings.links && settings.links.linkOptions.showArrow.value
                    ? this.getPathWithArrow(link)
                    : this.getPathWithoutArrow(link);
            });

            this.nodes.attr("transform", (node: ForceGraphNode) => translate(limitX(node.x), limitY(node.y)));
        }

        // add the nodes
        if (settings.nodes.imageGroup.displayImage.value) {
            this.nodes.append("image")
                .attr("x", PixelConverter.toString(ForceGraph.ImagePosition))
                .attr("y", PixelConverter.toString(ForceGraph.ImagePosition))
                .attr("width", PixelConverter.toString(ForceGraph.ImageViewport.width))
                .attr("height", PixelConverter.toString(ForceGraph.ImageViewport.height))
                .attr("xlink:href", (node: ForceGraphNode) => {
                    if (node.image) {
                        return this.getImage(node.image);
                    } else if (settings.nodes.imageGroup.defaultImage.value) {
                        return this.getImage(settings.nodes.imageGroup.defaultImage.value);
                    }

                    return ForceGraph.DefaultImage;
                })
                .attr("title", (node: ForceGraphNode) => node.name)
                .style("outline", `solid 0px ${this.colorHelper.getHighContrastColor("foreground", "black")}`)
                .style("border-radius", "2px")
                .attr("tabindex", 0)
                .attr('aria-label', (node: ForceGraphNode) => `${node.name}`);

        } else {
            this.nodes
                .append("circle")
                .attr("r", (node: ForceGraphNode) => {
                    return isNaN(node.weight) || node.weight < ForceGraph.MinNodeWeight
                        ? ForceGraph.MinNodeWeight
                        : node.weight;
                })
                .style("fill", (node: ForceGraphNode) => {
                    return node.color
                        ? node.color
                        : settings.nodes.optionGroup.fillColor.value.value;
                })
                .style("stroke", settings.nodes.optionGroup.strokeColor.value.value)
                .style("outline", `solid 0px ${this.colorHelper.getHighContrastColor("foreground", "black")}`)
                .style("border-radius", (node: ForceGraphNode) => {
                    const radius = isNaN(node.weight) || node.weight < ForceGraph.MinNodeWeight
                        ? ForceGraph.MinNodeWeight
                        : node.weight;
                    return `${radius}px`
                })
                .attr("tabindex", 0)
                .attr('aria-label', (node: ForceGraphNode) => `${node.name}`);
        }
    }

    private renderNodeLabels(settings: ForceGraphSettings): void {
        if (!settings.labels.show.value) {
            return;
        }

        this.nodes.append("text")
            .classed(ForceGraph.NodeLabelsSelector.className, true)
            .attr("x", ForceGraph.DefaultLabelX)
            .attr("dy", ForceGraph.DefaultLabelDy)
            .style("fill", settings.labels.color.value.value)
            .style("font-size", PixelConverter.fromPoint(settings.labels.fontControl.fontSize.value))
            .style("font-family", settings.labels.fontControl.fontFamily.value)
            .style("font-weight", settings.labels.fontControl.bold.value ? "bold" : "normal")
            .style("font-style", settings.labels.fontControl.italic.value ? "italic" : "normal")
            .style("text-decoration", settings.labels.fontControl.underline.value ? "underline" : "none")
            .text((node: ForceGraphNode) => {
                if (node.name) {
                    if (node.name.length > settings.nodes.optionGroup.nameMaxLength.value) {
                        return node.name.substr(0, settings.nodes.optionGroup.nameMaxLength.value);
                    } else {
                        return node.name;
                    }
                } else {
                    return ForceGraph.DefaultLabelText;
                }
            });
    }

    private getImage(image: string): string {
        return `${this.settings.nodes.imageGroup.imageUrl.value}${image}${this.settings.nodes.imageGroup.imageExt.value}`;
    }

    private reset(): void {
        if (this.container.empty()) {
            return;
        }
        this.forceSimulation.on("tick", null);
        this.forceSimulation.stop();
        this.container
            .selectAll("*")
            .remove();
    }

    private updateNodes(): void {
        const thePreviousNodes: ForceGraphNode[] = this.forceSimulation.nodes();
        this.forceSimulation.nodes(Object.values(this.data.nodes));

        this.forceSimulation.nodes().forEach((node: ForceGraphNode, index: number) => {
            if (!thePreviousNodes[index] || thePreviousNodes[index].name !== node.name) {
                return;
            }

            this.updateNodeAttributes(node, thePreviousNodes[index]);
        });
    }

    private updateNodeAttributes(first: ForceGraphNode, second: ForceGraphNode): void {
        first.x = second.x;
        first.y = second.y;
        first.weight = second.weight;
    }

    private getForceTick(): () => void {
        const viewport: IViewport = this.viewportIn;
        const properties: TextProperties = {
            fontFamily: ForceGraph.LabelsFontFamily,
            fontSize: PixelConverter.fromPoint(this.settings.labels.fontControl.fontSize.value),
            text: this.data.formatter.format("")
        };

        const showArrow: boolean = this.settings.links.linkOptions.showArrow.value;

        let resolutionFactor: number = ForceGraph.ResolutionFactor;
        if (this.settings.size.boundedByBox.value) {
            resolutionFactor = ForceGraph.ResolutionFactorBoundByBox;
        }
        // limitX and limitY is necessary when you minimize the graph and then resize it to normal.
        // "width/height * 20" seems enough to move nodes freely by force layout.
        const maxWidth: number = viewport.width * resolutionFactor,
            maxHeight: number = viewport.height * resolutionFactor,
            viewPortWidthDownLimit: number = (viewport.width - maxWidth) / 2,
            viewPortHeightDownLimit: number = (viewport.height - maxHeight) / 2,
            viewPortHeightUpLimit: number = (viewport.height + maxHeight) / 2,
            viewPortWidthUpLimit: number = (viewport.height + maxHeight) / 2,
            limitX: (x: number) => number = x => Math.max(viewPortWidthDownLimit, Math.min(viewPortWidthUpLimit, x)),
            limitY: (y: number) => number = y => Math.max(viewPortHeightDownLimit, Math.min(viewPortHeightUpLimit, y));

        return () => {
            this.paths.attr("d", (link: ForceGraphLink) => {
                link.source.x = limitX(link.source.x);
                link.source.y = limitY(link.source.y);
                link.target.x = limitX(link.target.x);
                link.target.y = limitY(link.target.y);

                return showArrow
                    ? this.getPathWithArrow(link)
                    : this.getPathWithoutArrow(link);
            });

            this.nodes.attr("transform", (node: ForceGraphNode) => translate(limitX(node.x), limitY(node.y)));

            if (!this.settings.labels.allowIntersection.value
                && this.settings.labels.show.value
                && Object.keys(this.data.nodes).length <= ForceGraph.NoAnimationLimit) {
                this.nodes
                    .classed("hiddenLabel", (node: ForceGraphNode) => {
                        properties.text = this.data.formatter.format(node.name);
                        const curNodeTextRect: ITextRect = this.getTextRect(properties, node.x, node.y);

                        node.hideLabel = false;
                        this.nodes.each((otherNode: ForceGraphNode) => {
                            properties.text = this.data.formatter.format(otherNode.name);
                            const otherNodeTextRect: ITextRect = this.getTextRect(properties, otherNode.x, otherNode.y);
                            if (!otherNode.hideLabel && node.name !== otherNode.name && this.isIntersect(curNodeTextRect, otherNodeTextRect)) {
                                node.hideLabel = true;
                                return;
                            }
                        });

                        return node.hideLabel;
                    });
            }

        };
    }

    private getTextRect(properties: TextProperties, x: number, y: number): ITextRect {
        const textHeight: number = textMeasurementService.estimateSvgTextHeight(properties);
        const textWidth: number = textMeasurementService.measureSvgTextWidth(properties);
        const curTextUpperPointX: number = x + textWidth;
        const curTextUpperPointY: number = y - textHeight;

        return <ITextRect>{
            x1: x,
            y1: y,
            x2: curTextUpperPointX,
            y2: curTextUpperPointY
        };
    }

    private getPathWithArrow(link: ForceGraphLink): string {
        const dx: number = link.target.x - link.source.x,
            dy: number = link.target.y - link.source.y,
            dr: number = Math.sqrt(dx * dx + dy * dy),
            theta: number = Math.atan2(dy, dx) + Math.PI / 7.85,
            d90: number = Math.PI / 2,
            dtxs: number = link.target.x - 6 * Math.cos(theta),
            dtys: number = link.target.y - 6 * Math.sin(theta);

        if (dr === 0) {
            return `M ${link.source.x - 10} ${link.source.y - 10} C ${link.source.x - 50} ${link.source.y - 50}, ${link.source.x + 50} ${link.source.y - 50}, ${link.source.x + 10} ${link.source.y - 10}`;
        }

        return "M" + link.source.x + "," + link.source.y
            + "A" + dr + "," + dr + " 0 0 1," + link.target.x + "," + link.target.y
            + "A" + dr + "," + dr + " 0 0 0," + link.source.x + "," + link.source.y
            + "M" + dtxs + "," + dtys
            + "l" + (3.5 * Math.cos(d90 - theta) - 10 * Math.cos(theta)) + "," + (-3.5 * Math.sin(d90 - theta) - 10 * Math.sin(theta))
            + "L" + (dtxs - 3.5 * Math.cos(d90 - theta) - 10 * Math.cos(theta)) + "," + (dtys + 3.5 * Math.sin(d90 - theta) - 10 * Math.sin(theta))
            + "z";
    }

    private getPathWithoutArrow(link: ForceGraphLink): string {
        const dx: number = link.target.x - link.source.x,
            dy: number = link.target.y - link.source.y,
            dr: number = Math.sqrt(dx * dx + dy * dy);

        if (dr === 0) {
            return `M ${link.source.x - 10} ${link.source.y - 10} C ${link.source.x - 50} ${link.source.y - 50}, ${link.source.x + 50} ${link.source.y - 50}, ${link.source.x + 10} ${link.source.y - 10}`;
        }

        return "M" + link.source.x + "," + link.source.y
            + "A" + dr + "," + dr + " 0 0,1 " + link.target.x + "," + link.target.y;
    }

    private fadePath(
        opacity: number,
        highlightColor: string,
        defaultHighlightColor: string
    ): (link: ForceGraphLink) => void {
        if (this.settings.links.linkOptions.colorLink.value.value !== LinkColorType.Interactive) {
            return;
        }

        return () => {
            this.paths.style("stroke-opacity", (link: ForceGraphLink) => {
                return link.source === link.source && link.target === link.target
                    ? ForceGraph.DefaultOpacity
                    : opacity;
            })
                .style("stroke", (link: ForceGraphLink) => {
                    return link.source === link.source && link.target === link.target
                        ? highlightColor
                        : defaultHighlightColor;
                });
        };
    }

    private isReachable(a: ForceGraphNode, b: ForceGraphNode): boolean {
        if (a.name === b.name || this.data.linkedByName[a.name + "," + b.name]) {
            return true;
        }

        const visited = {};

        for (const name in this.data.nodes) {
            visited[name] = false;
        }

        visited[a.name] = true;

        const stack = [];

        stack.push(a.name);

        while (stack.length > 0) {
            const cur = stack.pop(),
                node = this.data.nodes[cur];

            if (node && node.adj) {
                for (const nb in node.adj) {
                    if (nb === b.name) {
                        return true;
                    }

                    if (!visited[nb]) {
                        visited[nb] = true;
                        stack.push(nb);
                    }
                }
            }
        }

        return false;
    }

    private fadeNode(node: ForceGraphNode): void {
        if (!this.settings || this.settings.links.linkOptions.colorLink.value.value !== LinkColorType.Interactive) {
            return;
        }

        // eslint-disable-next-line
        const self: ForceGraph = this,
            isHighlight = node.isOver || node.isDrag,
            opacity: number = isHighlight
                ? ForceGraph.HoverOpacity
                : ForceGraph.DefaultOpacity;

        const highlight: string = isHighlight
            ? ForceGraph.DefaultLinkHighlightColor
            : ForceGraph.DefaultLinkColor;

        this.nodes.style("stroke-opacity", function (otherNode: ForceGraphNode) {
            const thisOpacity: number = (self.settings.nodes.optionGroup.highlightReachableLinks.value
                ? self.isReachable(node, otherNode)
                : self.areNodesConnected(node, otherNode))
                ? ForceGraph.DefaultOpacity
                : opacity;
            this.setAttribute("fill-opacity", thisOpacity);

            return thisOpacity;
        });

        this.paths.style("stroke-opacity", (link: ForceGraphLink) =>
            (this.settings.nodes.optionGroup.highlightReachableLinks.value
                ? this.isReachable(node, link.source)
                : (link.source === node || link.target === node))
                ? ForceGraph.DefaultOpacity
                : opacity
        );

        this.paths.style("stroke", (link: ForceGraphLink) => {
            const color = (this.settings.nodes.optionGroup.highlightReachableLinks.value
                ? this.isReachable(node, link.source)
                : (link.source === node || link.target === node))
                ? highlight
                : ForceGraph.DefaultLinkColor;

            return this.colorHelper.getHighContrastColor(
                "foreground",
                color
            );
        });
    }

    private areNodesConnected(firstNode: ForceGraphNode, secondNode: ForceGraphNode): number | boolean {
        return this.data.linkedByName[firstNode.name + "," + secondNode.name]
            || this.data.linkedByName[secondNode.name + "," + firstNode.name]
            || firstNode.name === secondNode.name;
    }

    public destroy(): void {
        this.container.selectAll("*")
            .remove();
    }
}
