import fs = require('fs')
import path = require('path')
import glob = require('glob')

import { v4 as uuid } from 'uuid'

import { parseSync } from 'svgson'
import { s2v } from './sketch-svg'

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { toFile } from './to-file'
import { sketchBlocks } from './sketch-blocks'

let outputFile = 'material-design-icons.sketch'

console.log(`\n\n⚗️   Sketch Synth v${process.env.npm_package_version}`)

var layerCollection = []
const files = glob.sync('assets/material-design-icons/src/**/**/**/*.svg')
//.slice(0, 100) // Limit number of icons, for testing

files.forEach((file, index) => {
  // console.log(file)

  const svgData = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })
  const iconName = path.dirname(file).split('/').splice(-2)[0]
  const svgName = file
    .replace('assets/material-design-icons/src/', '')
    .replace('20px.svg', `${iconName} 20px`)
    .replace('24px.svg', `${iconName} 24px`) //
  console.log(`⚙️  ${index} / ${files.length}: ${svgName}`)
  const json = parseSync(svgData)

  const width: number = parseFloat(json.attributes.width) || 100
  const height: number = parseFloat(json.attributes.height) || 100
  // console.log(`  Dimensions: ${width}x${height}`)

  /*
  TODO: There's something wrong with the way I'm creating these, because
  although they're drawn in the document, selecting them does not update
  the Inspector data like normal Symbol Masters do.
  */
  let columns = 30
  let iconSpacing = 50
  var symbolMaster: FileFormat.SymbolMaster = sketchBlocks.emptySymbolMaster(
    svgName,
    width,
    height,
    (index % columns) * iconSpacing,
    Math.floor(index / columns) * iconSpacing
  )
  json.children.forEach((child, index) => {
    // console.log(child)
    switch (child.name) {
      case 'path':
        symbolMaster.layers.push(s2v.path(child))
        break
      case 'rect':
        symbolMaster.layers.push(s2v.rect(child))
        break
      case 'circle':
        symbolMaster.layers.push(s2v.circle(child))
        break
      case 'ellipse':
        symbolMaster.layers.push(s2v.ellipse(child))
        break
      case 'g':
        symbolMaster.layers.push(s2v.group(child))
        break
      case 'polygon':
        symbolMaster.layers.push(s2v.polygon(child))
        break

      case 'defs':
        break
        // These are Styles and other reusable elements.
        // It can contain any element inside it, but by now we'll only worry about Style-like content:
        // `linearGradient`, `radialGradient` and `pattern` (although we may also ignore this last one)
        // For more info, check https://www.w3.org/TR/SVG/struct.html#DefsElement
        child.children.forEach(def => {
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
                ...child.attributes,
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
        break

      case 'image':
        symbolMaster.layers.push(s2v.image(child))
        break
      case 'text':
        symbolMaster.layers.push(s2v.text(child))
        break
      case 'line':
      case 'polyline':
      case 'filter':
      case 'font':
      case 'font-face':
      default:
        // console.warn(
        //   `⚠️  We don't know what to do with '${child.name}' elements yet.`
        // )
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
  console.log(
    `\n📦  Saving file with ${layerCollection.length} icons at '${outputFile}'`
  )
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
      pages: [blankPage, symbolsPage],
    },
    meta,
    user,
  }

  toFile(contents, `./${outputFile}`)
    .then(() => {
      console.log(`🎉  File saved successfully!`)
    })
    .catch(err => {
      console.log(err)
    })
}
