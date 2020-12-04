// A collection of helpers to make it easier to generate Sketch documents programatically
import FileFormat from '@sketch-hq/sketch-file-format-ts'

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
}
export { sketchBlocks }
