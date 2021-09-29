import fs = require('fs')
import path = require('path')
import glob = require('glob')

import { v4 as uuid } from 'uuid'

import { parseSync } from 'svgson'
import { s2v } from './sketch-svg'

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { SketchFile, toFile } from '@sketch-hq/sketch-file'
import { sketchBlocks } from './sketch-blocks'

let outputFile = 'material-design-icons.sketch'

console.log(`\n\nMaterial Icons Library v${process.env.npm_package_version}`)

var layerCollection = []
const files = glob.sync('assets/material-design-icons/src/**/**/**/*.svg')
//.slice(0, 100) // Limit number of icons, for testing

files.forEach((file, index) => {
  const svgData = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' })
  const iconName = path.dirname(file).split('/').splice(-2)[0]
  const svgName = file
    .replace('assets/material-design-icons/src/', '')
    .replace('20px.svg', `${iconName} 20px`)
    .replace('24px.svg', `${iconName} 24px`) //
  const json = parseSync(svgData)

  const width: number = parseFloat(json.attributes.width) || 100
  const height: number = parseFloat(json.attributes.height) || 100

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
    symbolMaster.layers.push(s2v.parse(child, index))
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

  // TODO: update this to use the latest version of the file format metadata
  const meta: FileFormat.Meta = {
    commit: fileCommit,
    pagesAndArtboards: {},
    version: 131,
    compatibilityVersion: 99,
    app: FileFormat.BundleId.PublicRelease,
    autosaved: 0,
    variant: 'NONAPPSTORE',
    created: {
      commit: fileCommit,
      appVersion: '77',
      build: 92452,
      app: FileFormat.BundleId.PublicRelease,
      compatibilityVersion: 99,
      version: 131,
      variant: 'NONAPPSTORE',
    },
    saveHistory: [],
    appVersion: '77',
    build: 92452,
  }

  const blankPage: FileFormat.Page = sketchBlocks.emptyPage('Blank')
  const symbolsPage: FileFormat.Page = sketchBlocks.emptyPage('Symbols')
  symbolsPage.layers = layerCollection

  const user: FileFormat.User = {
    document: { pageListHeight: 85, pageListCollapsed: 0 },
  }
  const workspace: FileFormat.Workspace = {}

  const contents: FileFormat.Contents = {
    document: {
      _class: 'document',
      do_objectID: uuid(),
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
    workspace,
  }
  let fileToSave: SketchFile = {
    contents: contents,
    filepath: outputFile,
  }
  toFile(fileToSave)
    .then(() => {
      console.log(`🎉  File saved successfully!`)
    })
    .catch(err => {
      console.log(err)
    })
}
