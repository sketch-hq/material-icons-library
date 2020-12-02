import fs = require('fs')
import path = require('path')
import glob = require('glob')
import uuid = require('uuid')

import { parse, stringify } from 'svgson'
import { Circle, Path, toPoints } from 'svg-points'

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { CurveMode, CurvePoint } from '@sketch-hq/sketch-file-format-ts/dist/cjs/v1-types'


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
        const svgPath:Path = {
          type: 'path',
          d: child.attributes.d
        }
        let svgPathPoints = toPoints(svgPath)
        let sketchPathPoints = []
        svgPathPoints.forEach(point => {
          // Convert SVG Points to Sketch CurvePoints
          let sketchPoint:CurvePoint = {
            _class: "curvePoint",
            point: "",
            cornerRadius: 0,
            curveFrom: "",
            curveTo: "",
            // curveMode: point.curve.type,
            curveMode: CurveMode.None,
            hasCurveFrom: false,
            hasCurveTo: false
          }
          console.log(point)
          console.log(sketchPoint)
          sketchPathPoints.push(point)
        })
        // Convert path into something Sketch can handle
        let path:FileFormat.ShapePath = {
          _class: "shapePath",
          do_objectID: uuid.v4(),
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
          points: sketchPathPoints,
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
