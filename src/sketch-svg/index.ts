import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { v4 as uuid } from 'uuid'
import { sketchBlocks } from '../sketch-blocks'

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
}
export { s2v }
