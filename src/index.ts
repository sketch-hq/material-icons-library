import fs = require("fs");
import path = require("path");
import glob = require("glob");

import { v4 as uuid } from "uuid";

import { parseSync, stringify } from "svgson";
import { Circle, Path, toPoints } from "svg-points";

import FileFormat from "@sketch-hq/sketch-file-format-ts";
import { toFile } from "./to-file";


console.log(`Sketch Synth v${process.env.npm_package_version}`);

var layerCollection = []
const files = glob.sync("assets/**/*.svg")

files.forEach((file) => {
  
  const svgData = fs.readFileSync(file, { encoding: "utf8", flag: "r" })
  const layerName = path.basename(file, ".svg")
  const json = parseSync(svgData)
  const width = json.attributes.width
  const height = json.attributes.height

  var iconGroup:FileFormat.Group = {
    _class: "group",
    do_objectID: uuid().toUpperCase(),
    name: `icon/${layerName}`,
    booleanOperation: FileFormat.BooleanOperation.NA,
    exportOptions: emptyExportOptions(),
    frame: {
      _class: "rect",
      constrainProportions: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    hasClickThrough: false,
    isFixedToViewport: false,
    isFlippedHorizontal: false,
    isFlippedVertical: false,
    isLocked: false,
    isVisible: true,
    layerListExpandedType: FileFormat.LayerListExpanded.Expanded,
    layers: [],
    nameIsFixed: false,
    resizingConstraint: 0,
    resizingType: FileFormat.ResizeType.Resize,
    rotation: 0,
    shouldBreakMaskChain: false
  }

  // var artboard:FileFormat.Artboard = {
  //   _class: "artboard",
  //   do_objectID: uuid().toUpperCase(),
  //   name: layerName,
  //   backgroundColor: null,
  //   hasBackgroundColor: false,
  //   booleanOperation: null,
  //   exportOptions: emptyExportOptions(),
  //   frame: {
  //     _class: "rect",
  //     constrainProportions: false,
  //     width: parseInt(width),
  //     height: parseInt(height),
  //     x: 0,
  //     y: 0
  //   },
  //   hasClickThrough: false,
  //   horizontalRulerData: null,
  //   includeBackgroundColorInExport: false,
  //   includeInCloudUpload: true,
  //   isFixedToViewport: false,
  //   isFlippedHorizontal: false,
  //   isFlippedVertical: false,
  //   isFlowHome: false,
  //   isLocked: false,
  //   isVisible: true,
  //   layerListExpandedType: FileFormat.LayerListExpanded.Collapsed,
  //   layers: [iconGroup],
  //   nameIsFixed: true,
  //   resizesContent: false,
  //   resizingConstraint: null,
  //   resizingType: null,
  //   rotation: 0,
  //   shouldBreakMaskChain: false,
  //   verticalRulerData: null,
  //   clippingMaskMode: 0,
  // }

  json.children.forEach((child) => {
    const svgPath: Path = {
      type: "path",
      d: child.attributes.d,
    };
    let svgPathPoints = toPoints(svgPath);
    let sketchPathPoints = [];
    svgPathPoints.forEach((point) => {
      // Convert SVG Points to Sketch CurvePoints
      let sketchPoint: FileFormat.CurvePoint = {
        _class: "curvePoint",
        point: `{${point.x},${point.y}}`,
        cornerRadius: 0,
        curveFrom: `{${point.x},${point.y}}`,
        curveTo: `{${point.x},${point.y}}`,
        // curveMode: point.curve.type,
        curveMode: FileFormat.CurveMode.None,
        hasCurveFrom: false,
        hasCurveTo: false,
      };
      sketchPathPoints.push(point);
    });
    // Convert path into something Sketch can handle
    let path: FileFormat.ShapePath = {
      _class: "shapePath",
      do_objectID: uuid().toUpperCase(),
      name: layerName,
      nameIsFixed: true,
      pointRadiusBehaviour: 1,
      resizingConstraint: 63,
      resizingType: FileFormat.ResizeType.Stretch,
      rotation: 0,
      shouldBreakMaskChain: false,
      isVisible: true,
      isLocked: false,
      layerListExpandedType: FileFormat.LayerListExpanded.Expanded,
      booleanOperation: FileFormat.BooleanOperation.NA, // let's not get there yet
      edited: true,
      exportOptions: emptyExportOptions(),
      points: sketchPathPoints, // TODO: This doesn't work yet
      isClosed: true, // jump of faith
      frame: {
        _class: "rect",
        constrainProportions: true,
        height: 0,
        width: 0,
        x: 0,
        y: 0
      },
      isFixedToViewport: false,
      isFlippedHorizontal: false,
      isFlippedVertical: false,
    };
    // iconGroup.layers.push(path)
  })
  layerCollection.push(iconGroup)
})
saveFile(layerCollection)

// Write file
function saveFile(layerCollection) {
  console.log(`Saving file with ${layerCollection.length} layers`)
  const pagesAndArtboardsID = uuid().toUpperCase()
  const pageName = "SVG Icons"
  const fileCommit = "6896e2bfdb0a2a03f745e4054a8c5fc58565f9f1"

const meta: FileFormat.Meta = {
  commit: fileCommit,
  pagesAndArtboards: {
    pagesAndArtboardsID: { name: pageName, artboards: {} },
  },
  version: 131,
  fonts: [],
  compatibilityVersion: 99,
  app: FileFormat.BundleId.Internal,
  autosaved: 0,
  variant: "NONAPPSTORE",
  created: {
    commit: fileCommit,
    appVersion: "70.1",
    build: 92452,
    app: FileFormat.BundleId.Internal,
    compatibilityVersion: 99,
    version: 131,
    variant: "NONAPPSTORE",
  },
  saveHistory: [],
  appVersion: "70.1",
  build: 92452,
};

const page: FileFormat.Page = {
  _class: "page",
  do_objectID: pagesAndArtboardsID,
  name: pageName,
  booleanOperation: -1,
  isFixedToViewport: false,
  isFlippedHorizontal: false,
  isFlippedVertical: false,
  isLocked: false,
  isVisible: true,
  layerListExpandedType: 0,
  nameIsFixed: false,
  resizingConstraint: 63,
  resizingType: 0,
  rotation: 0,
  shouldBreakMaskChain: false,
  exportOptions: emptyExportOptions(),
  frame: {
    _class: "rect",
    constrainProportions: true,
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  },
  clippingMaskMode: 0,
  hasClippingMask: false,
  hasClickThrough: true,
  groupLayout: { _class: "MSImmutableFreeformGroupLayout" },
  layers: layerCollection,
  includeInCloudUpload: true,
  horizontalRulerData: { _class: "rulerData", base: 0, guides: [] },
  verticalRulerData: { _class: "rulerData", base: 0, guides: [] },
}

// console.log(page)

const user: FileFormat.User = {
  document: { pageListHeight: 85, pageListCollapsed: 0 },
};

const contents: FileFormat.Contents = {
  document: {
    _class: "document",
    do_objectID: uuid().toUpperCase(), // TODO: get the uuid from a command line option?
    colorSpace: 0,
    currentPageIndex: 0,
    assets: {
      _class: "assetCollection",
      do_objectID: uuid().toUpperCase(),
      images: [],
      colorAssets: [],
      exportPresets: [],
      gradientAssets: [],
      imageCollection: { _class: "imageCollection", images: {} },
      colors: [],
      gradients: [],
    },
    foreignLayerStyles: [],
    foreignSymbols: [],
    foreignTextStyles: [],
    layerStyles: { _class: "sharedStyleContainer", objects: [] },
    layerSymbols: { _class: "symbolContainer", objects: [] },
    layerTextStyles: { _class: "sharedTextStyleContainer", objects: [] },
    pages: [page],
  },
  meta,
  user,
};

  toFile(contents, `./foo.sketch`)
    .then(() => {
      console.log(`done`);
    })
    .catch((err) => {
      console.log(err);
    });
}


function emptyExportOptions():FileFormat.ExportOptions {
  return {
    _class: "exportOptions",
    includedLayerIds: [],
    layerOptions: 0,
    shouldTrim: false,
    exportFormats: [],
  }
}