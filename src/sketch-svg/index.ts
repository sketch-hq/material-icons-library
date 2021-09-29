import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { INode } from 'svgson'
import { v4 as uuid } from 'uuid'
import { sketchBlocks } from '../sketch-blocks'
import { CurveCubic, Path, Point, Polygon, toPoints } from 'svg-points'

const s2v = {
  parseStyle: (svgData: INode): FileFormat.Style => {
    if (
      svgData.attributes.fill == 'none' ||
      svgData.attributes.style == 'fill:none'
    ) {
      return sketchBlocks.emptyStyle()
    } else {
      let style = sketchBlocks.sampleStyle()
      if (svgData.attributes.opacity) {
        style.fills[0].color.alpha = parseFloat(svgData.attributes.opacity)
      }
      return style
    }
  },
  rect: (svgData: INode): FileFormat.Rectangle => {
    let sketchRectangle: FileFormat.Rectangle = sketchBlocks.emptyRectangle(
      svgData.attributes.id || 'rectangle',
      parseFloat(svgData.attributes.x) || 0,
      parseFloat(svgData.attributes.y) || 0,
      parseFloat(svgData.attributes.width) || 100,
      parseFloat(svgData.attributes.height) || 100
    )
    if (svgData.attributes.rx || svgData.attributes.ry) {
      // SVG supports an `ry` attribute for vertical corner radius (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect)
      // As far as I know, we don't have anything similar in Sketch, and I doubt it makes sense to try to implement it,
      // but I think it's worth mentioning here. This implementation just takes the first it finds and calls it a day.
      let cornerRadius =
        parseFloat(svgData.attributes.rx) || parseFloat(svgData.attributes.ry)
      sketchRectangle.fixedRadius = cornerRadius
      sketchRectangle.points.forEach(point => {
        point.cornerRadius = cornerRadius
      })
      sketchRectangle.pointRadiusBehaviour =
        FileFormat.PointsRadiusBehaviour.Rounded
    }
    sketchRectangle.style = s2v.parseStyle(svgData)
    return sketchRectangle
  },
  path: (svgData: INode): FileFormat.ShapePath | FileFormat.ShapeGroup => {
    // https://www.w3.org/TR/SVG2/paths.html#PathElement
    // We may need to recalculate the frame for the path after adding the points
    // Looks like we could use https://svgjs.com for that `yarn add @svgdotjs/svg.js`
    // By now, we'll use a fixed width and height for this demo
    let width = 24
    let height = 24

    /**
     * We don't really need to split paths or know how many of them are there,
     * or make special code paths for 1 vs multiple paths.
     * We just need to start painting, and keep pushing paths to the container…
     */
    let container = sketchBlocks.emptyShapeGroup(
      svgData.attributes.id,
      parseFloat(svgData.attributes.x),
      parseFloat(svgData.attributes.y),
      parseFloat(svgData.attributes.width) || width,
      parseFloat(svgData.attributes.height) || height
    )
    container.style = s2v.parseStyle(svgData)
    let svgPath: Path = {
      type: 'path',
      d: svgData.attributes.d,
    }
    let svgPathPoints: Point[] = toPoints(svgPath)
    let firstPath = true
    let currentPath: FileFormat.ShapePath
    let currentPoints: FileFormat.CurvePoint[]
    let currentControlPoints
    let currentPointCounter

    svgPathPoints.forEach((point, index) => {
      if (point.moveTo) {
        // Store the current path (if any) in the container and create a new one.
        // To store the current path, we first need to assign the right curve points
        if (!firstPath) {
          currentPath.points = s2v.updateCurveControlPoints(
            currentControlPoints,
            currentPoints,
            width,
            height
          )
          // Store path in the container
          container.layers.push(currentPath)
        } else {
          firstPath = false
        }
        // Start new Path from zero
        currentPath = sketchBlocks.emptyShapePath(
          'Path',
          parseFloat(svgData.attributes.x),
          parseFloat(svgData.attributes.y),
          parseFloat(svgData.attributes.width) || width,
          parseFloat(svgData.attributes.height) || height
        )
        currentPoints = []
        currentControlPoints = []
        currentPointCounter = 0
      }
      let sketchPoint: FileFormat.CurvePoint = sketchBlocks.emptyPoint(
        point.x / width,
        point.y / height
      )
      if (point.curve) {
        switch (point.curve.type) {
          case 'cubic':
            currentControlPoints.push([currentPointCounter, point.curve])
            break
          case 'arc':
            console.log('⚠️  Arc curves not implemented yet')
            break
          case 'quadratic':
            console.log('⚠️  Quadratic curves not implemented yet')
            break
          default:
            break
        }
      }
      currentPoints.push(sketchPoint)
      currentPointCounter++
      if (index == svgPathPoints.length - 1) {
        // This is the last point on the path group, so we need to draw it
        // and then commit the path.
        currentPath.points = s2v.updateCurveControlPoints(
          currentControlPoints,
          currentPoints,
          width,
          height
        )
        // Store path in the container
        container.layers.push(currentPath)
      }
    })
    if (container.layers.length == 1) {
      // There's only one path in this shape so we can return it
      // and skip the container. But first let's use the container style
      currentPath.style = container.style
      return currentPath
    }
    return container
  },
  ellipse: (svgData: INode): FileFormat.Oval => {
    return sketchBlocks.emptyCircle(
      svgData.attributes.id,
      parseFloat(svgData.attributes.cx) - parseFloat(svgData.attributes.rx),
      parseFloat(svgData.attributes.cy) - parseFloat(svgData.attributes.ry),
      parseFloat(svgData.attributes.rx) * 2,
      parseFloat(svgData.attributes.ry) * 2
    )
  },
  circle: (svgData: INode): FileFormat.Oval => {
    return sketchBlocks.emptyCircle(
      svgData.attributes.id,
      parseFloat(svgData.attributes.cx) - parseFloat(svgData.attributes.r),
      parseFloat(svgData.attributes.cy) - parseFloat(svgData.attributes.r),
      parseFloat(svgData.attributes.r) * 2,
      parseFloat(svgData.attributes.r) * 2
    )
  },
  group: (svgData: INode): FileFormat.Group => {
    // Hello recursivity, do not hesitate to call yourself if you need any help
    let sketchGroup: FileFormat.Group = sketchBlocks.emptyGroup(
      svgData.attributes.id || 'Group',
      parseFloat(svgData.attributes.x) || 0,
      parseFloat(svgData.attributes.y) || 0,
      parseFloat(svgData.attributes.width) || 24,
      parseFloat(svgData.attributes.height) || 24
    )
    // We're going to store a reference to the group's style, in case we
    // need to apply it to any of its children if they don't have a style set
    let groupStyle = s2v.parseStyle(svgData)

    // Traverse Group contents (here's where you'll wish you had made all the parsing code
    // reusable in a library, )
    svgData.children.forEach((item, index) => {
      let sketchLayer:
        | FileFormat.Group
        | FileFormat.ShapePath
        | FileFormat.ShapeGroup
        | FileFormat.Oval
        | FileFormat.Rectangle
        | FileFormat.Bitmap
        | FileFormat.Text
        | FileFormat.Polygon
        | FileFormat.Star
        | FileFormat.Triangle
        | FileFormat.SymbolInstance
        | FileFormat.Slice
        | FileFormat.Hotspot = s2v.parse(item, index)

      // If the layer is using a default style, use the parent style from the group
      if (sketchLayer) {
        if (sketchLayer.style) {
          let style = sketchLayer.style
          // This is an oversimplification of this check, but it will work for our sample code
          if (
            style.borders.length == 1 &&
            style.fills.length == 1 &&
            (style.fills[0].color.alpha == 1 ||
              style.fills[0].color.alpha == 0.87)
          ) {
            sketchLayer.style = groupStyle
          }
        }
        sketchGroup.layers.push(sketchLayer)
      }
    })
    sketchGroup.style = s2v.parseStyle(svgData)
    return sketchGroup
  },
  image: (svgData: INode): FileFormat.Bitmap => ({
    // TODO: download and embed image in Sketch document, by now we'll use an embedded image
    // TODO: apparently SVG creates a frame for the bitmap, in which it then renders the image without stretching it.
    // A possible option for us would be to create an empty Rectangle, with an image fill that mimics the behavior of how a browser renders the SVG element.
    // However, I just tried our own native importer and it looks like we're doing the wrong thing, so not sure how much further we want to go with this…
    _class: 'bitmap',
    name: svgData.attributes.id || 'Bitmap',
    do_objectID: uuid(),
    booleanOperation: FileFormat.BooleanOperation.None,
    clippingMaskMode: 0,
    hasClippingMask: false,
    clippingMask: `{{0,0}, {1,1}}`,
    exportOptions: sketchBlocks.emptyExportOptions(),
    fillReplacesImage: false,
    frame: sketchBlocks.emptyRect(
      parseFloat(svgData.attributes.x),
      parseFloat(svgData.attributes.y),
      parseFloat(svgData.attributes.width),
      parseFloat(svgData.attributes.height)
    ),
    image: {
      _class: 'MSJSONOriginalDataReference',
      _ref_class: 'MSImageData',
      _ref: uuid(),
      // TODO: we need to find a way to copy this image file into the .sketch bundle.
      // Otherwise, Sketch will complain about the file being corrupt on first open.
      // Fortunately for us, Sketch will happily open the file anyway and fix it.
      // But still, we should try to create completely valid .sketch documents here.
      // This library feels like the wrong place to implement that stuff, so we may
      // want to do this on a last pass before saving the file, in the `to-file` module.
      data: {
        // base64 -i input-file
        _data:
          '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',
      },
      sha1: {
        // sha1sum input-file
        _data: '935296b749b0d45da60f1d23bad1c3c59d9f57f4',
      },
    },
    intendedDPI: 72,
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: FileFormat.LayerListExpanded.Collapsed,
    nameIsFixed: false,
    resizingConstraint: 63,
    resizingType: FileFormat.ResizeType.Stretch,
    rotation: 0,
    shouldBreakMaskChain: false,
  }),
  text: (svgData: INode): FileFormat.Text => ({
    // There's not a lot of text on the Material Design Icons, so this code is mostly untested.
    // It's left here in case it's useful to someone.
    _class: 'text',
    name: svgData.attributes.id || 'Text',
    attributedString: {
      _class: 'attributedString',
      // TODO: get style from SVG
      attributes: [
        {
          _class: 'stringAttribute',
          length: svgData.children.filter(item => item.type == 'text')[0].value
            .length,
          location: 0,
          attributes: {
            kerning: 0,
            MSAttributedStringFontAttribute: {
              _class: 'fontDescriptor',
              attributes: {
                name: 'Arial',
                size: 14,
              },
            },
          },
        },
      ],
      string: svgData.children.filter(item => item.type == 'text')[0].value,
    },
    automaticallyDrawOnUnderlyingPath: false,
    booleanOperation: FileFormat.BooleanOperation.None,
    do_objectID: uuid(),
    dontSynchroniseWithSymbol: false,
    exportOptions: sketchBlocks.emptyExportOptions(),
    frame: sketchBlocks.emptyRect(
      parseFloat(svgData.attributes.x),
      parseFloat(svgData.attributes.y),
      parseFloat(svgData.attributes.width),
      parseFloat(svgData.attributes.height)
    ),
    glyphBounds: '',
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: FileFormat.LayerListExpanded.Collapsed,
    lineSpacingBehaviour: FileFormat.LineSpacingBehaviour.None,
    nameIsFixed: false,
    resizingConstraint: 63,
    resizingType: FileFormat.ResizeType.Stretch,
    rotation: 0,
    shouldBreakMaskChain: false,
    textBehaviour: FileFormat.TextBehaviour.Flexible,
  }),
  polygon: (svgData: INode): FileFormat.ShapePath => {
    let width = 24
    let height = 24
    const svgPolygon: Polygon = {
      type: 'polygon',
      points: svgData.attributes.points,
    }
    let svgPolygonPoints: Point[] = toPoints(svgPolygon)
    let sketchPolygonPoints: FileFormat.CurvePoint[] = []
    svgPolygonPoints.forEach(point => {
      let sketchPoint: FileFormat.CurvePoint = sketchBlocks.emptyPoint(
        point.x / width,
        point.y / height
      )
      sketchPolygonPoints.push(sketchPoint)
    })
    let sketchPath = sketchBlocks.emptyShapePath(
      svgData.attributes.id || 'Polygon',
      0,
      0,
      width,
      height
    )
    sketchPath.style = s2v.parseStyle(svgData)
    sketchPath.points = sketchPolygonPoints
    return sketchPath
  },
  parse(svgData: INode, index: number) {
    switch (svgData.name) {
      case 'path':
        return this.path(svgData)
      case 'rect':
        return this.rect(svgData)
      case 'ellipse':
        return this.ellipse(svgData)
      case 'circle':
        return this.circle(svgData)
      case 'text':
        return this.text(svgData)
      case 'g':
        return this.group(svgData)
      case 'polygon':
        return this.polygon(svgData)
      case 'defs':
        // These are Styles and other reusable elements. We're not using them in this example,
        // but we can use them in other projects. Comments left in for reference.
        break
        // A `defs` node can contain any element, but by now we'll only worry about Style-like content:
        // `linearGradient`, `radialGradient` and `pattern` (although we may also ignore this last one)
        // For more info, check https://www.w3.org/TR/SVG/struct.html#DefsElement
        svgData.children.forEach(def => {
          // console.log(def)
          switch (def.name) {
            case 'linearGradient':
              // https://www.w3.org/TR/SVG/pservers.html#LinearGradientElement
              // ## Parse Attributes
              let linearGradientDefaults = {
                id: `linear-gradient-${index}`,
                // TODO: These values are actually of the <length> type. So they can come in all sorts of units. Find a proper parser for that (check https://github.com/reworkcss/css)
                x1: 0,
                x2: 0,
                y1: 100,
                y2: 0,
                gradientUnits: 'objectBoundingBox',
                gradientTransform: '',
                spreadMethod: 'pad',
                href: '',
              }
              let attributes = {
                ...linearGradientDefaults,
                ...svgData.attributes,
              }
              // ## Parse content
              // Children of a linearGradient element can be any of:
              // desc, title, metadata, animate, animateTransform, script, set, stop, style
              // We'll only worry about `stop` elements by now
              let stops = def.children.filter(element => element.name == 'stop')
              stops.forEach(stop => {
                // https://www.w3.org/TR/SVG/pservers.html#StopElement
                // console.log(stop)
                // console.log(`Linear Gradient Stop:`)
                // console.log(`\tOffset: ${stop.attributes.offset}`)
                // Style can be an attribute or a child element of a stop 🙃
                // https://www.w3.org/TR/SVG/styling.html#StyleAttribute
                // https://www.w3.org/TR/SVG/styling.html#StyleElement
                // console.log(`\tStyle: ${stop.attributes.style}`)
              })
              break
            case 'radialGradient':
              // console.log(`radialGradient`)
              //
              // def.attributes
              break
            default:
              // console.warn(
              //   `⚠️ We don't know what to do with ${def.name} by now`
              // )
              break
          }
        })
      case 'image':
        return this.image(svgData)
      case 'line':
      case 'polyline':
      case 'filter':
      case 'font':
      case 'font-face':
      default:
        console.warn(
          `⚠️  We don't know what to do with '${svgData.name}' elements yet.`
        )
        return sketchBlocks.emptyShapePath('Untranslated element', 0, 0, 2, 2)
    }
  },
  updateCurveControlPoints(
    currentControlPoints: any,
    currentPoints: FileFormat.CurvePoint[],
    width: number,
    height: number
  ): FileFormat.CurvePoint[] {
    if (currentControlPoints.length > 0) {
      currentControlPoints.forEach(pointData => {
        let index = pointData[0]
        let curve: CurveCubic = pointData[1]
        let thisPoint = currentPoints[index]
        let nextPoint = currentPoints[index - 1]
        thisPoint.curveMode = FileFormat.CurveMode.Mirrored
        thisPoint.curveTo = `{ x: ${curve.x2 / width}, y: ${curve.y2 / height}}`
        thisPoint.hasCurveTo = true
        if (nextPoint) {
          nextPoint.curveFrom = `{ x: ${curve.x1 / width}, y: ${
            curve.y1 / height
          }}`
          nextPoint.hasCurveFrom = true
        }
      })
    }
    return currentPoints
  },
}
export { s2v }
