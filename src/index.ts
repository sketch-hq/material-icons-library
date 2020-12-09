import fs = require('fs')
import path = require('path')
import glob = require('glob')

import { v4 as uuid } from 'uuid'

import { parseSync } from 'svgson'
import { s2v } from './sketch-svg'

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

  /*
  TODO: There's something wrong with the way I'm creating these, because
  although they're drawn in the document, selecting them does not update
  the Inspector data like normal Symbol Masters do.
  */
  var symbolMaster: FileFormat.SymbolMaster = sketchBlocks.emptySymbolMaster(
    svgName,
    width,
    height,
    index * 100,
    0
  )
  json.children.forEach((child, index) => {
    console.log(child)
    switch (child.name) {
      case 'path':
        let sketchPath = s2v.path(child)
        // TODO: we may need to recalculate the frame for the path after adding the points
        // Looks like we could use https://svgjs.com for that `yarn add @svgdotjs/svg.js`
        // By now, we'll use the width and height supplied by the SVG file
        symbolMaster.layers.push(sketchPath)
        break

      case 'rect':
        let attrs = child.attributes
        let sketchRectangle: FileFormat.Rectangle = sketchBlocks.emptyRectangle(
          attrs.id || 'rectangle',
          parseInt(attrs.x) || 0,
          parseInt(attrs.y) || 0,
          parseInt(attrs.width) || 100,
          parseInt(attrs.height) || 100
        )
        if (attrs.rx || attrs.ry) {
          // TODO: SVG supports an `ry` attribute for vertical corner radius (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect)
          // As far as I know, we don't have anything similar in Sketch, and I doubt it makes sense to try to implement it,
          // but I think it's worth mentioning here. This implementation just takes the first it finds and calls it a day.
          let cornerRadius = parseInt(attrs.rx) || parseInt(attrs.ry)
          sketchRectangle.fixedRadius = cornerRadius
          sketchRectangle.points.forEach(point => {
            point.cornerRadius = cornerRadius
          })
          sketchRectangle.pointRadiusBehaviour =
            FileFormat.PointsRadiusBehaviour.Rounded
        }
        if (attrs.style) {
          // TODO: parse the real style, instead of using a default style
          let style = s2v.parseStyle(attrs.style)
          sketchRectangle.style = style
        }
        symbolMaster.layers.push(sketchRectangle)
        break
      case 'circle':
        symbolMaster.layers.push(s2v.circle(child))
        break
      case 'ellipse':
        symbolMaster.layers.push(s2v.ellipse(child))
        break

      case 'g':
        // Groups!
        let sketchGroup: FileFormat.Group = sketchBlocks.emptyGroup(
          child.attributes.id || 'Group',
          parseInt(child.attributes.x) || 0,
          parseInt(child.attributes.y) || 0,
          parseInt(child.attributes.width) || 100,
          parseInt(child.attributes.height) || 100
        )
        // Traverse Group contents (here's where you'll wish you had made all the parsing code
        // reusable in a library, )
        child.children.forEach(groupContent => {
          switch (groupContent.name) {
            case 'path':
              sketchGroup.layers.push(s2v.path(groupContent))
              break
            case 'ellipse':
              sketchGroup.layers.push(s2v.ellipse(groupContent))
              break
            case 'circle':
              sketchGroup.layers.push(s2v.circle(groupContent))
              break
            default:
              console.warn(
                `⚠️  We don't know what to do with '${groupContent.name}' elements yet.`
              )
              break
          }
        })
        symbolMaster.layers.push(sketchGroup)
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
        // symbolMaster.layers.push(
        // TODO: investigate why we can't use emojis here to name layers...
        // sketchBlocks.emptyShapePath('⚠️ Untranslated element')
        // sketchBlocks.emptyShapePath('Untranslated element')
        // )
        break
    }
  })
  layerCollection.push(symbolMaster)
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
