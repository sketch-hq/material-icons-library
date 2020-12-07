import fs = require('fs')
import path = require('path')
import glob = require('glob')

import { v4 as uuid } from 'uuid'

import { parseSync } from 'svgson'
import { Path, Point, toPoints } from 'svg-points'

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { toFile } from './to-file'
import { sketchBlocks } from './sketch-blocks'

console.log(`\n\n⚗️  Sketch Synth v${process.env.npm_package_version}`)

var layerCollection = []
const files = glob.sync('assets/**/*.svg')

files.forEach((file, index) => {
  const svgData = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })
  const svgName = path.basename(file, '.svg')
  console.log(`\nConverting "${svgName}.svg"`)
  const json = parseSync(svgData)

  const width: number = parseInt(json.attributes.width) || 100
  const height: number = parseInt(json.attributes.height) || 100
  console.log(`  Dimensions: ${width}x${height}`)

  var artboard: FileFormat.SymbolMaster = sketchBlocks.emptySymbolMaster(
    svgName,
    width,
    height,
    index * 100,
    0
  )
  json.children.forEach((child, index) => {
    // console.log(child)
    switch (child.name) {
      case 'path':
        // https://www.w3.org/TR/SVG2/paths.html#PathElement
        // d | pathLength (optional) | id | style | class |
        let pathDefaultAttributes = {
          d: '',
          id: `path-${index}`,
        }
        let attributes = { ...pathDefaultAttributes, ...child.attributes }
        // style | script | mask | marker | clipPath | pattern | linearGradient | radialGradient | pattern
        let content = child.children
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
          let sketchPoint: FileFormat.CurvePoint = {
            _class: 'curvePoint',
            cornerRadius: 0,
            curveMode: FileFormat.CurveMode.Straight,
            curveFrom: `{ x: 0, y: 0 }`,
            curveTo: `{ x: 0, y: 0 }`,
            hasCurveFrom: false,
            hasCurveTo: false,
            point: `{ x: ${point.x / width}, y: ${point.y / height} }`,
          }

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

        let sketchPath = sketchBlocks.emptyShapePath(
          'path',
          0,
          0,
          width,
          height
        )
        sketchPath.style = sketchBlocks.sampleStyle() // TODO: get actual style from SVG
        if (attributes.id) {
          sketchPath.name = attributes.id
        }
        sketchPath.points = sketchPathPoints
        // TODO: we may need to recalculate the frame for the path after adding the points
        // Looks like we could use https://svgjs.com for that `yarn add @svgdotjs/svg.js`
        // By now, we'll use the width and height supplied by the SVG file
        artboard.layers.push(sketchPath)
        break

      case 'rect':
        console.log(child)
        const attrs = child.attributes
        let sketchRectangle: FileFormat.Rectangle = sketchBlocks.emptyRectangle(
          attrs.id || 'rectangle',
          parseInt(attrs.x) || 0,
          parseInt(attrs.y) || 0,
          parseInt(attrs.width) || 100,
          parseInt(attrs.height) || 100
        )
        if (attrs.rx) {
          // TODO: support multiple corner radius
          sketchRectangle.fixedRadius = parseInt(attrs.rx)
          sketchRectangle.points.forEach(point => {
            point.cornerRadius = parseInt(attrs.rx)
          })
          sketchRectangle.pointRadiusBehaviour =
            FileFormat.PointsRadiusBehaviour.Rounded
        }
        artboard.layers.push(sketchRectangle)
        break

      case 'defs':
        break
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
                ...child.attributes,
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

      default:
        console.warn(
          `⚠️  We don't know what to do with '${child.name}' elements yet.`
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
  const fileCommit = '6896e2bfdb0a2a03f745e4054a8c5fc58565f9f1'

  const meta: FileFormat.Meta = {
    commit: fileCommit,
    pagesAndArtboards: {
      // Apparently this is not required...
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
