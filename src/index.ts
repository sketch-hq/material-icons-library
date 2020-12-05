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
  json.children.forEach((child, index) => {
    // This is only true for children of type `path`, of course
    console.log(`Translating child:`)
    console.log(child)
    switch (child.name) {
      case 'defs':
        // These are Styles and other reusable elements.
        // It can contain any element inside it, but by now we'll only worry about Style-like content:
        // `linearGradient`, `radialGradient` and `pattern` (although we may also ignore this last one)
        // For more info, check https://www.w3.org/TR/SVG/struct.html#DefsElement
        child.children.forEach(def => {
          console.log(def)
          switch (def.name) {
            case 'linearGradient':
              // https://www.w3.org/TR/SVG/pservers.html#LinearGradientElement
              // ## Parse Attributes
              let attributes = {
                id: def.attributes.id || `linear-gradient-${index}`, // id, x1, y1, x2, y2, gradientUnits, gradientTransform, spreadMethod, href
                // TODO: These values are actually of the <length> type. So they can come in all sorts of units. Find a proper parser for that (check https://github.com/reworkcss/css)
                x1: def.attributes.x1 || 0,
                x2: def.attributes.x2 || 0,
                y1: def.attributes.y1 || 100,
                y2: def.attributes.y2 || 0,
                gradientUnits:
                  def.attributes.gradientUnits || 'objectBoundingBox', // 'userSpaceOnUse' | 'objectBoundingBox'
                gradientTransform: def.attributes.gradientTransform || {}, // Ignored by now
                spreadMethod: def.attributes.spreadMethod || 'pad', // 'pad' | 'reflect' | 'repeat'
                href: def.attributes.href || '',
              }
              // ## Parse content
              // Children of a linearGradient element can be any of:
              // desc, title, metadata, animate, animateTransform, script, set, stop, style
              // We'll only worry about `stop` elements by now
              let stops = def.children.filter(element => element.name == 'stop')
              stops.forEach(stop => {
                // https://www.w3.org/TR/SVG/pservers.html#StopElement
                console.log(stop)
                console.log(`Linear Gradient Stop:`)
                console.log(`\tOffset: ${stop.attributes.offset}`)
                // Style can be an attribute or a child element of a stop 🙃
                // https://www.w3.org/TR/SVG/styling.html#StyleAttribute
                // https://www.w3.org/TR/SVG/styling.html#StyleElement
                console.log(`\tStyle: ${stop.attributes.style}`)
              })
              break
            case 'radialGradient':
              console.log(`radialGradient`)
              //
              // def.attributes
              break
            default:
              console.warn(
                `⚠️ We don't know what to do with ${def.name} by now`
              )
              break
          }
        })
        break
      case 'path':
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

        let sketchPath = sketchBlocks.emptyShapePath()
        artboard.layers.push(sketchPath)
        break

      default:
        console.warn(
          `⚠️ We don't know what to do with '${child.name}' elements yet\nTry again in a few days`
        )
        // Insert a dummy element
        artboard.layers.push(
          sketchBlocks.emptyShapePath('Untranslated element')
          // TODO: investigate why we can't use emojis here to name layers...
          // sketchBlocks.emptyShapePath('⚠️ Untranslated element')
        )
        break
    }
  })
  layerCollection.push(artboard)
})
saveFile(layerCollection)

// Write file
function saveFile(layerCollection) {
  console.log(`Saving file with ${layerCollection.length} layers`)
  // const pagesAndArtboardsID = uuid()
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
      do_objectID: uuid(), // TODO: get the uuid from a command line option?
      colorSpace: 0,
      currentPageIndex: 0,
      assets: {
        _class: 'assetCollection',
        do_objectID: uuid(),
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
      pages: [symbolsPage],
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
