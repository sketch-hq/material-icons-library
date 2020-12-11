# sketch-synth

A proof of concept tool to generate Sketch files from other file formats

## Supported Input Formats

- SVG (technically just a very small subset of them, since this demo is focused on Google Material Design Icons by now)

## Usage

- `git submodule update --init` to fetch the latest icons from Google Material Design
- `yarn install` to install all the dependencies
- `yarn start` to turn all the assets in the `assets` folder into a .sketch document, or `yarn open` to do that and then open the resulting file in Sketch

## Bonus

If you don't feel like installing anything, there is an Action in the repo that runs the project and generates the .sketch file as an Action Artifact you can download here: https://github.com/sketch-hq/sketch-synth/actions
