import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { INode } from 'svgson'
import { v4 as uuid } from 'uuid'
import { sketchBlocks } from '../sketch-blocks'
import { Path, Point, toPoints } from 'svg-points'

const s2v = {
  parseStyle: (svgStyle: string): FileFormat.Style => {
    console.log(`Parsing ${svgStyle}`)
    // let style = sketchBlocks.emptyStyle()
    return sketchBlocks.sampleStyle()

    /*{
      _class: 'style',
      borderOptions: {
        _class: 'borderOptions',
        isEnabled: true,
        dashPattern: [],
        lineCapStyle: FileFormat.LineCapStyle.Butt,
        lineJoinStyle: FileFormat.LineJoinStyle.Bevel,
      },
      colorControls: {
        _class: 'colorControls',
        isEnabled: false,
        brightness: 0,
        contrast: 0,
        hue: 0,
        saturation: 0,
      },
      do_objectID: uuid(),
      startMarkerType: FileFormat.MarkerType.FilledArrow,
      endMarkerType: FileFormat.MarkerType.FilledArrow,
      miterLimit: 0,
      windingRule: FileFormat.WindingRule.EvenOdd,
      innerShadows: null,
    }*/
  },
  path: (svgData: INode): FileFormat.ShapePath => {
    // TODO: `stroke` support
    let width = 500 // TODO: Calculate this properly
    let height = 800 // TODO: Calculate this properly
    // https://www.w3.org/TR/SVG2/paths.html#PathElement
    // d | pathLength (optional) | id | style | class |
    let pathDefaultAttributes = {
      d: '',
      // id: `path-${index}`,
      id: 'path',
    }
    let attributes = { ...pathDefaultAttributes, ...svgData.attributes }
    // style | script | mask | marker | clipPath | pattern | linearGradient | radialGradient | pattern
    let content = svgData.children
    // console.log(attributes)
    // console.log(content)

    const svgPath: Path = {
      type: 'path',
      d: attributes.d,
    }
    let svgPathPoints: Point[] = toPoints(svgPath)
    let sketchPathPoints: FileFormat.CurvePoint[] = []
    let numberOfPaths = svgPathPoints.filter(point => point.moveTo == true)
      .length
    // console.log(`There are ${numberOfPaths} real paths in this path node`)

    svgPathPoints.forEach((point: Point, index) => {
      // If point `moveTo`, this is a new path
      console.log(point)
      // TODO: extract multiple Sketch paths from a single svg path
      // TODO: move this to sketchBlocks
      let sketchPoint: FileFormat.CurvePoint = sketchBlocks.emptyPoint(
        point.x / width,
        point.y / height
      )
      if (point.curve) {
        switch (point.curve.type) {
          case 'cubic':
            sketchPoint.curveMode = FileFormat.CurveMode.Asymmetric
            // TODO: this curve translation clearly needs more work, because Sketch does not have
            // anything like SVG's cubic curves, so we need to do some magic here. Check the code
            // on Sketch's side to see what we're doing there.
            sketchPoint.curveFrom = `{ x: ${point.curve.x2 / width}, y: ${
              point.curve.y2 / height
            }}`
            sketchPoint.curveTo = `{ x: ${point.curve.x1 / width}, y: ${
              point.curve.y1 / height
            }}`
            sketchPoint.hasCurveTo = true
            sketchPoint.hasCurveFrom = true
            break
          case 'arc':
            console.log('⚠️ Arc curves not implemented yet')
            break
          case 'quadratic':
            console.log('⚠️ Quadratic curves not implemented yet')
            break
          default:
            break
        }
      }

      // console.log(sketchPoint)
      // if (point.moveTo == undefined) {
      // We only want to render points without a `moveTo` attribute,
      // since `svgpoints` already gives us points in the right coordinates
      // and we don't really need to paint the `moveTo` points
      sketchPathPoints.push(sketchPoint)
      // }
    })

    let sketchPath = sketchBlocks.emptyShapePath('path', 0, 0, width, height)
    sketchPath.style = sketchBlocks.sampleStyle() // TODO: get actual style from SVG
    if (attributes.id) {
      sketchPath.name = attributes.id
    }
    sketchPath.points = sketchPathPoints
    return sketchPath
  },
  ellipse: (svgData: INode): FileFormat.Oval => {
    return sketchBlocks.emptyCircle(
      svgData.attributes.id,
      parseInt(svgData.attributes.cx) - parseInt(svgData.attributes.rx),
      parseInt(svgData.attributes.cy) - parseInt(svgData.attributes.ry),
      parseInt(svgData.attributes.rx) * 2,
      parseInt(svgData.attributes.ry) * 2
    )
  },
  circle: (svgData: INode): FileFormat.Oval => {
    return sketchBlocks.emptyCircle(
      svgData.attributes.id,
      parseInt(svgData.attributes.cx) - parseInt(svgData.attributes.r),
      parseInt(svgData.attributes.cy) - parseInt(svgData.attributes.r),
      parseInt(svgData.attributes.r) * 2,
      parseInt(svgData.attributes.r) * 2
    )
  },
}
export { s2v }
