const fs = require('fs')
const path = require('path')
const glob = require('glob')
const { parse, stringify } = require('svgson')

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
      })
    })
  })
})