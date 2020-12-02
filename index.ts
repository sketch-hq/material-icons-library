import fs = require('fs')
import path = require('path')
import glob = require('glob')
import { parse, stringify } from 'svgson'
import FileFormat from '@sketch-hq/sketch-file-format-ts'


console.log(`Sketch Synth v${process.env.npm_package_version}`);

glob("assets/**/*.svg", function (er, files) {
  files.forEach(file => {
    const svgData = fs.readFileSync(file, {encoding:'utf8', flag:'r'})
    const layerName = path.basename(file, '.svg')
    parse(svgData).then(json => {
      let width = json.attributes.width
      let height = json.attributes.height
      console.log(layerName)
      // console.log(json)
      console.log(`Width: ${width}`)
      console.log(`Heigth: ${height}`)
      json.children.forEach(child => {
        console.log(child)
        // Convert path into something Sketch can handle
        let path:FileFormat.ShapePath = {
          _class: "shapePath",
          do_objectID: 'uuid',
          name: layerName,
          nameIsFixed: true,
          pointRadiusBehaviour: null,
          resizingConstraint: null,
          resizingType: null,
          rotation: 0,
          shouldBreakMaskChain: false,
          isVisible: true,
          isLocked: false,
          layerListExpandedType: null,
          booleanOperation: FileFormat.BooleanOperation.None, // let's not get there yet
          edited: false,
          exportOptions: null,
          points: [],
          isClosed: true, // jump of faith
          frame: null,
          isFixedToViewport: false,
          isFlippedHorizontal: false,
          isFlippedVertical: false
        }
        console.log(path)
      })
    })
  })
})
