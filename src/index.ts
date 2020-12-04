import fs = require('fs')
import path = require('path')
import glob = require('glob')

import { v4 as uuid } from 'uuid'

import { parseSync, stringify } from 'svgson'
import { Circle, Path, toPoints } from 'svg-points'

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { toFile } from './to-file'
import { sketchBlocks } from './sketch-blocks'

console.log(`Sketch Synth v${process.env.npm_package_version}`)

var layerCollection = []
const files = glob.sync('assets/**/*.svg')
const objid = () => uuid().toUpperCase()

files.forEach((file, index) => {
  const svgData = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })
  const svgName = path.basename(file, '.svg')
  const json = parseSync(svgData)

  const width: number = parseInt(json.attributes.width) || 100
  const height: number = parseInt(json.attributes.height) || 100

  var artboard: FileFormat.SymbolMaster = sketchBlocks.emptySymbolMaster(
    svgName,
    width,
    height,
    index * 100,
    0
  )
  json.children.forEach(child => {
    // This is only true for children of type `path`, of course
    const svgPath: Path = {
      type: 'path',
      d: child.attributes.d,
    }
    let svgPathPoints = toPoints(svgPath)
    console.log(`Parsing "${svgName}.svg"`)
    console.log(svgPathPoints)

    let sketchPathPoints = []
    svgPathPoints.forEach(point => {
      console.log(point)

      // Convert SVG Points to Sketch CurvePoints
      let sketchPoint: FileFormat.CurvePoint = {
        _class: 'curvePoint',
        point: `{${point.x},${point.y}}`,
        cornerRadius: 0,
        curveFrom: `{${point.x},${point.y}}`,
        curveTo: `{${point.x},${point.y}}`,
        // curveMode: point.curve.type,
        curveMode: FileFormat.CurveMode.None,
        hasCurveFrom: false,
        hasCurveTo: false,
      }
      sketchPathPoints.push(point)
    })
    // Convert path into something Sketch can handle
    let path: FileFormat.ShapePath = {
      _class: 'shapePath',
      do_objectID: objid(),
      name: 'Path',
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
      points: samplePoints(), // TODO: use points from SVG
      isClosed: true, // jump of faith
      frame: {
        _class: 'rect',
        constrainProportions: true,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      },
      isFixedToViewport: false,
      isFlippedHorizontal: false,
      isFlippedVertical: false,
      style: sampleStyle(),
    }
    // iconGroup.layers.push(path)
    artboard.layers.push(path)
  })
  // layerCollection.push(iconGroup)
  layerCollection.push(artboard)
})
saveFile(layerCollection)

// Write file
function saveFile(layerCollection) {
  console.log(`Saving file with ${layerCollection.length} layers`)
  // const pagesAndArtboardsID = objid()
  // const pageName = 'Symbols'
  const fileCommit = '6896e2bfdb0a2a03f745e4054a8c5fc58565f9f1'

  const meta: FileFormat.Meta = {
    commit: fileCommit,
    pagesAndArtboards: {
      //   pagesAndArtboardsID: { name: pageName, artboards: {} },
    },
    version: 131,
    fonts: [],
    compatibilityVersion: 99,
    app: FileFormat.BundleId.Internal,
    autosaved: 0,
    variant: 'NONAPPSTORE',
    created: {
      commit: fileCommit,
      appVersion: '70.1',
      build: 92452,
      app: FileFormat.BundleId.Internal,
      compatibilityVersion: 99,
      version: 131,
      variant: 'NONAPPSTORE',
    },
    saveHistory: [],
    appVersion: '70.1',
    build: 92452,
  }

  const blankPage: FileFormat.Page = sketchBlocks.emptyPage('Blank')
  const symbolsPage: FileFormat.Page = sketchBlocks.emptyPage('Symbols')
  symbolsPage.layers = layerCollection

  const user: FileFormat.User = {
    document: { pageListHeight: 85, pageListCollapsed: 0 },
  }

  const contents: FileFormat.Contents = {
    document: {
      _class: 'document',
      do_objectID: objid(), // TODO: get the uuid from a command line option?
      colorSpace: 0,
      currentPageIndex: 0,
      assets: {
        _class: 'assetCollection',
        do_objectID: objid(),
        images: [],
        colorAssets: [],
        exportPresets: [],
        gradientAssets: [],
        imageCollection: { _class: 'imageCollection', images: {} },
        colors: [],
        gradients: [],
      },
      foreignLayerStyles: [],
      foreignSymbols: [],
      foreignTextStyles: [],
      layerStyles: { _class: 'sharedStyleContainer', objects: [] },
      layerSymbols: { _class: 'symbolContainer', objects: [] },
      layerTextStyles: { _class: 'sharedTextStyleContainer', objects: [] },
      pages: [blankPage, symbolsPage],
    },
    meta,
    user,
  }

  toFile(contents, `./foo.sketch`)
    .then(() => {
      console.log(`done`)
    })
    .catch(err => {
      console.log(err)
    })
}

// Utility functions to generate various Sketch elements

function samplePoints(): FileFormat.CurvePoint[] {
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
}

function sampleStyle(): FileFormat.Style {
  return {
    _class: 'style',
    do_objectID: '63CCF63E-20BD-46E7-87A5-8540F7D34036',
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
        isEnabled: true,
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
        thickness: 1,
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
        fillType: 0,
        color: {
          _class: 'color',
          alpha: 1,
          blue: 0.847,
          green: 0.847,
          red: 0.847,
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
        noiseIndex: 0,
        noiseIntensity: 0,
        patternFillType: 1,
        patternTileScale: 1,
      },
    ],
    innerShadows: [],
    shadows: [],
  }
}
