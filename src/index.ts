import fs = require("fs");
import path = require("path");
import glob = require("glob");
import uuid = require("uuid");

import { parse, stringify } from "svgson";
import { Circle, Path, toPoints } from "svg-points";

import FileFormat from "@sketch-hq/sketch-file-format-ts";
import { toFile } from "./to-file";


console.log(`Sketch Synth v${process.env.npm_package_version}`);

glob("../assets/**/*.svg", function (err, files) {
  files.forEach((file) => {
    const svgData = fs.readFileSync(file, { encoding: "utf8", flag: "r" });
    const layerName = path.basename(file, ".svg");
    parse(svgData).then((json) => {
      let width = json.attributes.width;
      let height = json.attributes.height;
      console.log(layerName);
      // console.log(json)
      console.log(`Width: ${width}`);
      console.log(`Heigth: ${height}`);
      json.children.forEach((child) => {
        console.log(child);
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
            point: "",
            cornerRadius: 0,
            curveFrom: "",
            curveTo: "",
            // curveMode: point.curve.type,
            curveMode: FileFormat.CurveMode.None,
            hasCurveFrom: false,
            hasCurveTo: false,
          };
          console.log(point);
          console.log(sketchPoint);
          sketchPathPoints.push(point);
        });
        // Convert path into something Sketch can handle
        let path: FileFormat.ShapePath = {
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
          isFlippedVertical: false,
        };
        console.log(path);
      });
    });
  });
});

// Write file

const meta: FileFormat.Meta = {
  commit: "6896e2bfdb0a2a03f745e4054a8c5fc58565f9f1",
  pagesAndArtboards: {
    "DE768058-D22A-4C6E-A641-0B51C72599D2": { name: "Page 1", artboards: {} },
  },
  version: 123,
  fonts: [],
  compatibilityVersion: 99,
  app: FileFormat.BundleId.Internal,
  autosaved: 0,
  variant: "NONAPPSTORE",
  created: {
    commit: "6896e2bfdb0a2a03f745e4054a8c5fc58565f9f1",
    appVersion: "63.1",
    build: 92452,
    app: FileFormat.BundleId.Internal,
    compatibilityVersion: 99,
    version: 123,
    variant: "NONAPPSTORE",
  },
  saveHistory: ["NONAPPSTORE.92452"],
  appVersion: "63.1",
  build: 92452,
};

const page: FileFormat.Page = {
  _class: "page",
  do_objectID: "DE768058-D22A-4C6E-A641-0B51C72599D2",
  booleanOperation: -1,
  isFixedToViewport: false,
  isFlippedHorizontal: false,
  isFlippedVertical: false,
  isLocked: false,
  isVisible: true,
  layerListExpandedType: 0,
  name: "SF Symbols",
  nameIsFixed: false,
  resizingConstraint: 63,
  resizingType: 0,
  rotation: 0,
  shouldBreakMaskChain: false,
  exportOptions: {
    _class: "exportOptions",
    includedLayerIds: [],
    layerOptions: 0,
    shouldTrim: false,
    exportFormats: [],
  },
  frame: {
    _class: "rect",
    constrainProportions: false,
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  },
  clippingMaskMode: 0,
  hasClippingMask: false,
  hasClickThrough: true,
  groupLayout: { _class: "MSImmutableFreeformGroupLayout" },
  layers: [],
  includeInCloudUpload: true,
  horizontalRulerData: { _class: "rulerData", base: 0, guides: [] },
  verticalRulerData: { _class: "rulerData", base: 0, guides: [] },
};

const user: FileFormat.User = {
  document: { pageListHeight: 85, pageListCollapsed: 0 },
};

const contents: FileFormat.Contents = {
  document: {
    _class: "document",
    do_objectID: "AFE275FF-7FFD-45FC-88B4-B49F20BEE837",
    colorSpace: 0,
    currentPageIndex: 0,
    assets: {
      _class: "assetCollection",
      do_objectID: "C94E9FA2-9915-4DFE-87C0-7670678D8CBE",
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
