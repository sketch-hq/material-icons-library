// A collection of helpers to make it easier to generate Sketch documents programatically
import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { v4 as uuid } from 'uuid'

const sketchBlocks = {
  colorBlack: function (): FileFormat.Color {
    let color: FileFormat.Color = {
      alpha: 1,
      _class: 'color',
      red: 0,
      green: 0,
      blue: 0,
    }
    return color
  },
  colorWhite: function (): FileFormat.Color {
    let color: FileFormat.Color = {
      _class: 'color',
      alpha: 1,
      red: 1,
      green: 1,
      blue: 1,
    }
    return color
  },
  emptyExportOptions: function (): FileFormat.ExportOptions {
    return {
      _class: 'exportOptions',
      includedLayerIds: [],
      layerOptions: 0,
      shouldTrim: false,
      exportFormats: [],
    }
  },
  emptyGroup: function (
    groupName: string,
    frame?: FileFormat.Rect
  ): FileFormat.Group {
    var emptyGroup: FileFormat.Group = {
      _class: 'group',
      do_objectID: uuid(),
      name: groupName,
      booleanOperation: FileFormat.BooleanOperation.None,
      exportOptions: sketchBlocks.emptyExportOptions(),
      frame: {
        _class: 'rect',
        constrainProportions: false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      hasClickThrough: false,
      isFixedToViewport: false,
      isFlippedHorizontal: false,
      isFlippedVertical: false,
      isLocked: false,
      isVisible: true,
      layerListExpandedType: FileFormat.LayerListExpanded.Expanded,
      layers: [],
      nameIsFixed: false,
      resizingConstraint: 63,
      resizingType: FileFormat.ResizeType.Stretch,
      rotation: 0,
      shouldBreakMaskChain: false,
    }
    return emptyGroup
  },
  emptySymbolMaster: function (
    name: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number
  ): FileFormat.SymbolMaster {
    return {
      _class: 'symbolMaster',
      do_objectID: uuid(),
      symbolID: uuid(),
      name: name,
      backgroundColor: sketchBlocks.colorWhite(),
      hasBackgroundColor: false,
      booleanOperation: FileFormat.BooleanOperation.None,
      exportOptions: sketchBlocks.emptyExportOptions(),
      frame: {
        _class: 'rect',
        constrainProportions: false,
        width: width || 100,
        height: height || 100,
        x: x || 0,
        y: y || 0,
      },
      hasClickThrough: false,
      includeBackgroundColorInExport: false,
      includeBackgroundColorInInstance: false,
      includeInCloudUpload: true,
      allowsOverrides: false,
      overrideProperties: [],
      isFixedToViewport: false,
      isFlippedHorizontal: false,
      isFlippedVertical: false,
      isFlowHome: false,
      isLocked: false,
      isVisible: true,
      layerListExpandedType: FileFormat.LayerListExpanded.Collapsed,
      layers: [],
      nameIsFixed: true,
      resizesContent: false,
      resizingConstraint: 63,
      resizingType: FileFormat.ResizeType.Stretch,
      rotation: 0,
      shouldBreakMaskChain: false,
      horizontalRulerData: {
        _class: 'rulerData',
        base: 0,
        guides: [],
      },
      verticalRulerData: {
        _class: 'rulerData',
        base: 0,
        guides: [],
      },
      clippingMaskMode: 0,
    }
  },

  emptyPage: function (pageName: string, id?: string): FileFormat.Page {
    return {
      _class: 'page',
      do_objectID: id || uuid(),
      name: pageName,
      booleanOperation: -1,
      isFixedToViewport: false,
      isFlippedHorizontal: false,
      isFlippedVertical: false,
      isLocked: false,
      isVisible: true,
      layerListExpandedType: 0,
      nameIsFixed: false,
      resizingConstraint: 63,
      resizingType: FileFormat.ResizeType.Stretch,
      rotation: 0,
      shouldBreakMaskChain: false,
      exportOptions: sketchBlocks.emptyExportOptions(),
      frame: {
        _class: 'rect',
        constrainProportions: true,
        height: 0,
        width: 0,
        x: 0,
        y: 0,
      },
      clippingMaskMode: 0,
      hasClippingMask: false,
      hasClickThrough: true,
      groupLayout: { _class: 'MSImmutableFreeformGroupLayout' },
      layers: [],
      includeInCloudUpload: true,
      horizontalRulerData: { _class: 'rulerData', base: 0, guides: [] },
      verticalRulerData: { _class: 'rulerData', base: 0, guides: [] },
    }
  },
}
export { sketchBlocks }
