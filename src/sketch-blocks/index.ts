// A collection of helpers to make it easier to generate Sketch documents programatically
import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { v4 as uuid } from 'uuid'

const sketchBlocks = {
  color: (
    r: FileFormat.UnitInterval,
    g: FileFormat.UnitInterval,
    b: FileFormat.UnitInterval,
    alpha?: FileFormat.UnitInterval,
    swatchID?: FileFormat.Uuid
  ): FileFormat.Color => {
    return {
      alpha: alpha || 1,
      _class: 'color',
      red: r,
      green: g,
      blue: b,
      swatchID: swatchID || null,
    }
  },
  colorBlack: (): FileFormat.Color => {
    return sketchBlocks.color(0, 0, 0)
  },
  colorWhite: (): FileFormat.Color => {
    return sketchBlocks.color(1, 1, 1)
  },
  colorGrey: (): FileFormat.Color => {
    return sketchBlocks.color(0.5, 0.5, 0.5)
  },
  colorGreyTrans: (): FileFormat.Color => {
    return sketchBlocks.color(0.5, 0.5, 0.5, 0.5)
  },
  emptyExportOptions: (): FileFormat.ExportOptions => ({
    _class: 'exportOptions',
    includedLayerIds: [],
    layerOptions: 0,
    shouldTrim: false,
    exportFormats: [],
  }),
  emptyLayer: () => ({
    _class: 'skeleton',
    name: 'object',
    do_objectID: uuid(),
    frame: sketchBlocks.emptyRect(),
    nameIsFixed: false,
  }),
  emptyArtboard: (name?:string,x?:number,y?:number,width?:number,height?:number): FileFormat.Artboard => ({
    _class: 'artboard',
    name: name || 'Artboard',
    do_objectID: uuid(),
    nameIsFixed: false,
    backgroundColor: sketchBlocks.colorWhite(),
    booleanOperation: FileFormat.BooleanOperation.None,
    exportOptions: sketchBlocks.emptyExportOptions(),
    frame: sketchBlocks.emptyRect(x,y,width,height),
    hasBackgroundColor: false,
    hasClickThrough: false,
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
    includeBackgroundColorInExport: false,
    includeInCloudUpload: true,
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isFlowHome: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: FileFormat.LayerListExpanded.Expanded,
    layers: [],
    resizesContent: false,
    resizingConstraint: 63,
    resizingType: FileFormat.ResizeType.Stretch,
    rotation: 0,
    shouldBreakMaskChain: false,
    style: sketchBlocks.sampleStyle()
  }),
  emptyGroup: (
    groupName: string,
    frame?: FileFormat.Rect
  ): FileFormat.Group => {
    var emptyGroup: FileFormat.Group = {
      _class: 'group',
      do_objectID: uuid(),
      name: groupName,
      booleanOperation: FileFormat.BooleanOperation.None,
      exportOptions: sketchBlocks.emptyExportOptions(),
      frame: frame || sketchBlocks.sampleRect(),
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
  emptySymbolMaster: (
    name?: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number
  ): FileFormat.SymbolMaster => ({
    ...sketchBlocks.emptyArtboard(name,x,y,width,height),
    ...{
      _class: 'symbolMaster',
      includeBackgroundColorInExport: false,
      includeBackgroundColorInInstance: false,
      symbolID: uuid(),
      allowsOverrides: true,
      overrideProperties: [],
    }
  }),
  emptyRect: (
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ): FileFormat.Rect => ({
    _class: 'rect',
    constrainProportions: false,
    x: x || 0,
    y: y || 0,
    width: width || 100,
    height: height || 100,
  }),
  emptyPage: (pageName: string, id?: FileFormat.Uuid): FileFormat.Page => {
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
  emptyShapePath: (
    name?: string,
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ): FileFormat.ShapePath => {
    return {
      _class: 'shapePath',
      do_objectID: uuid(),
      name: name || 'Path',
      nameIsFixed: true,
      pointRadiusBehaviour: 1,
      resizingConstraint: 63,
      resizingType: FileFormat.ResizeType.Stretch,
      rotation: 0,
      shouldBreakMaskChain: false,
      isVisible: true,
      isLocked: false,
      layerListExpandedType: FileFormat.LayerListExpanded.Expanded,
      booleanOperation: FileFormat.BooleanOperation.None, // let's not get there yet
      edited: true,
      exportOptions: sketchBlocks.emptyExportOptions(),
      points: sketchBlocks.samplePoints(), // TODO: use points from SVG
      isClosed: true, // jump of faith
      frame: {
        _class: 'rect',
        constrainProportions: true,
        width: width || 100,
        height: height || 100,
        x: x || 0,
        y: y || 0,
      },
      isFixedToViewport: false,
      isFlippedHorizontal: false,
      isFlippedVertical: false,
      style: sketchBlocks.sampleStyle(),
    }
  },
  emptyOval: (
    name?: string,
    x?: number,
    y?: number,
    radius?: number
  ): FileFormat.Oval => ({
    _class: 'oval',
    name: name || 'Oval',
    do_objectID: uuid(),
    booleanOperation: FileFormat.BooleanOperation.None,
    edited: false,
    exportOptions: sketchBlocks.emptyExportOptions(),
    frame: sketchBlocks.emptyRect(x || 0, y || 0, radius || 100, radius || 100),
    isClosed: true,
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: FileFormat.LayerListExpanded.Collapsed,
    nameIsFixed: true,
    pointRadiusBehaviour: FileFormat.PointsRadiusBehaviour.Disabled,
    points: [],
    resizingConstraint: 63,
    resizingType: FileFormat.ResizeType.Stretch,
    rotation: 0,
    shouldBreakMaskChain: false,
  }),
  emptyRectangle: (
    name?: string,
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ): FileFormat.Rectangle => ({
    name: name || 'rectangle',
    _class: 'rectangle',
    do_objectID: uuid(),
    booleanOperation: FileFormat.BooleanOperation.None,
    edited: false,
    exportOptions: sketchBlocks.emptyExportOptions(),
    fixedRadius: 0,
    frame: sketchBlocks.emptyRect(x || 0, y || 0, width || 100, height || 100),
    hasConvertedToNewRoundCorners: true,
    isClosed: true,
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: FileFormat.LayerListExpanded.Collapsed,
    nameIsFixed: true,
    needsConvertionToNewRoundCorners: false,
    pointRadiusBehaviour: FileFormat.PointsRadiusBehaviour.Disabled,
    points: [
      sketchBlocks.emptyPoint(0, 0),
      sketchBlocks.emptyPoint(1, 0),
      sketchBlocks.emptyPoint(1, 1),
      sketchBlocks.emptyPoint(0, 1),
    ],
    resizingConstraint: 0,
    resizingType: FileFormat.ResizeType.Stretch,
    rotation: 0,
    shouldBreakMaskChain: false,
    style: sketchBlocks.sampleStyle(),
  }),
  emptyCircle: (
    name?: string,
    x?: number,
    y?: number,
    width?: number,
    height?: number
  ): FileFormat.Oval => ({
    _class: 'oval',
    name: name || 'Oval',
    do_objectID: uuid(),
    edited: false,
    exportOptions: sketchBlocks.emptyExportOptions(),
    frame: sketchBlocks.emptyRect(x || 0, y || 0, width || 100, height || 100),
    isClosed: true,
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: FileFormat.LayerListExpanded.Collapsed,
    nameIsFixed: false,
    pointRadiusBehaviour: FileFormat.PointsRadiusBehaviour.Disabled,
    points: sketchBlocks.samplePoints(), // These are already a circle :D
    resizingConstraint: -63,
    resizingType: FileFormat.ResizeType.Stretch,
    rotation: 0,
    shouldBreakMaskChain: false,
    style: sketchBlocks.sampleStyle(),
    booleanOperation: FileFormat.BooleanOperation.None,
  }),
  sampleRect: (): FileFormat.Rect => {
    return {
      _class: 'rect',
      constrainProportions: false,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }
  },
  emptyPoint: (
    x?: FileFormat.UnitInterval,
    y?: FileFormat.UnitInterval
  ): FileFormat.CurvePoint => ({
    _class: 'curvePoint',
    cornerRadius: 0,
    curveMode: FileFormat.CurveMode.Straight,
    curveFrom: '',
    curveTo: '',
    hasCurveFrom: false,
    hasCurveTo: false,
    point: `{ ${x || 0}, ${y || 0}}`,
  }),
  samplePoints: (): FileFormat.CurvePoint[] => {
    // Returns a circle-shaped path
    return [
      {
        _class: 'curvePoint',
        cornerRadius: 0,
        curveFrom: '{0.77614237490000004, 1}',
        curveMode: 2,
        curveTo: '{0.22385762510000001, 1}',
        hasCurveFrom: true,
        hasCurveTo: true,
        point: '{0.5, 1}',
      },
      {
        _class: 'curvePoint',
        cornerRadius: 0,
        curveFrom: '{1, 0.22385762510000001}',
        curveMode: 2,
        curveTo: '{1, 0.77614237490000004}',
        hasCurveFrom: true,
        hasCurveTo: true,
        point: '{1, 0.5}',
      },
      {
        _class: 'curvePoint',
        cornerRadius: 0,
        curveFrom: '{0.22385762510000001, 0}',
        curveMode: 2,
        curveTo: '{0.77614237490000004, 0}',
        hasCurveFrom: true,
        hasCurveTo: true,
        point: '{0.5, 0}',
      },
      {
        _class: 'curvePoint',
        cornerRadius: 0,
        curveFrom: '{0, 0.77614237490000004}',
        curveMode: 2,
        curveTo: '{0, 0.22385762510000001}',
        hasCurveFrom: true,
        hasCurveTo: true,
        point: '{0, 0.5}',
      },
    ]
  },
  sampleStyle: (): FileFormat.Style => {
    return {
      _class: 'style',
      do_objectID: '63CCF63E-20BD-46E7-87A5-8540F7D34036', // is this a bug, or a feature?
      endMarkerType: 0,
      miterLimit: 10,
      startMarkerType: 0,
      windingRule: 1,
      blur: {
        _class: 'blur',
        isEnabled: false,
        center: '{0.5, 0.5}',
        motionAngle: 0,
        radius: 10,
        saturation: 1,
        type: 0,
      },
      borderOptions: {
        _class: 'borderOptions',
        isEnabled: true,
        dashPattern: [],
        lineCapStyle: 0,
        lineJoinStyle: 0,
      },
      borders: [
        {
          _class: 'border',
          isEnabled: false,
          fillType: 0,
          color: {
            _class: 'color',
            alpha: 1,
            blue: 0.592,
            green: 0.592,
            red: 0.592,
          },
          contextSettings: {
            _class: 'graphicsContextSettings',
            blendMode: 0,
            opacity: 1,
          },
          gradient: {
            _class: 'gradient',
            elipseLength: 0,
            from: '{0.5, 0}',
            gradientType: 0,
            to: '{0.5, 1}',
            stops: [
              {
                _class: 'gradientStop',
                position: 0,
                color: sketchBlocks.colorWhite(),
              },
              {
                _class: 'gradientStop',
                position: 1,
                color: sketchBlocks.colorBlack(),
              },
            ],
          },
          position: 1,
          thickness: 0.1,
        },
      ],
      colorControls: {
        _class: 'colorControls',
        isEnabled: false,
        brightness: 0,
        contrast: 1,
        hue: 0,
        saturation: 1,
      },
      contextSettings: {
        _class: 'graphicsContextSettings',
        blendMode: 0,
        opacity: 1,
      },
      fills: [
        {
          _class: 'fill',
          isEnabled: true,
          fillType: FileFormat.FillType.Color,
          color: sketchBlocks.colorGreyTrans(),
          contextSettings: {
            _class: 'graphicsContextSettings',
            blendMode: FileFormat.BlendMode.Normal,
            opacity: 1,
          },
          gradient: {
            _class: 'gradient',
            elipseLength: 0,
            from: '{0.5, 0}',
            gradientType: FileFormat.GradientType.Linear,
            to: '{0.5, 1}',
            stops: [
              {
                _class: 'gradientStop',
                position: 0,
                color: sketchBlocks.colorWhite(),
              },
              {
                _class: 'gradientStop',
                position: 1,
                color: sketchBlocks.colorBlack(),
              },
            ],
          },
          noiseIndex: 0,
          noiseIntensity: 0,
          patternFillType: FileFormat.PatternFillType.Fill,
          patternTileScale: 1,
        },
      ],
      innerShadows: [],
      shadows: [],
    }
  },
}
export { sketchBlocks }
