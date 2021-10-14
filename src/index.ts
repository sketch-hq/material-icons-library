import fs = require('fs')
import path = require('path')
import glob = require('glob')

import { v4 as uuid } from 'uuid'

import { parseSync } from 'svgson'
import { s2v } from './sketch-svg'

import FileFormat from '@sketch-hq/sketch-file-format-ts'
import { SketchFile, toFile } from '@sketch-hq/sketch-file'
import { sketchBlocks } from './sketch-blocks'

const outputFile = 'material-design-icons.sketch'

console.log(`\n\nMaterial Icons Library v${process.env.npm_package_version}`)

const layerCollection = []
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

  const columns = 30
  const iconSpacing = 50
  const symbolMaster: FileFormat.SymbolMaster = sketchBlocks.emptySymbolMaster(
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
  const fileCommit = 'da3a810344f01b8f82ff1686c8c6e334062f75ce'
  const meta: FileFormat.Meta = {
    app: FileFormat.BundleId.PublicRelease,
    appVersion: '77',
    autosaved: 0,
    build: 131065,
    commit: fileCommit,
    compatibilityVersion: 99,
    pagesAndArtboards: {},
    saveHistory: [],
    variant: 'NONAPPSTORE',
    version: 136,
    created: {
      app: FileFormat.BundleId.PublicRelease,
      appVersion: '77',
      build: 131065,
      commit: fileCommit,
      compatibilityVersion: 99,
      variant: 'NONAPPSTORE',
      version: 136,
    },
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
  const fileToSave: SketchFile = {
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
