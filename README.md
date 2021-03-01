# ⚗️ Sketch Synth

A proof of concept tool to generate Sketch files from other file formats

## Supported Input Formats

- SVG (technically just a very small subset of them, since this demo is focused on Google Material Design Icons by now)

## Requirements

- A recent version of `node` (we're using v15.8.0 at the moment of writing this)
- A recent version of `yarn` (we're using v1.22.5 at the moment of writing this)
- A recent version of Visual Studio Code

Once that's ready:

- Clone the repository.
- `cd` to the project folder.
- run `git submodule update --init` to fetch the latest icons from Google Material Design (this will take a while).
- run `yarn install` to install all the dependencies.
- run `yarn start` to generate the Sketch Library. Depending on your computer setup, this will take anywhere from a few seconds to a few minutes. For reference, building the Library takes about 9 seconds on a 2020 M1 MacBook Pro. You can also use `yarn open` to build the library and then open the resulting file in Sketch.

If all went well, you'll now have a `material-design-icons.sketch` file on your project folder, about 7.5 Mb in size, with all the Material Design Icons neatly positioned on a grid on the `Symbols` page.

## Bonus

If you don't feel like installing anything, [there is an Action in the repo](https://github.com/sketch-hq/sketch-synth/blob/main/.github/workflows/main.yml) that runs the project and generates the .sketch file as an Action Artifact you can download here: https://github.com/sketch-hq/sketch-synth/actions
