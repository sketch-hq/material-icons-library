# Material Icons Library

A proof of concept tool to generate a Sketch Library from Google's Material Design Icons. For more information, see the related article at `URL`.

## Requirements

- A recent version of `node` (we're using v14.17.0 at the moment of writing this)
- A recent version of `yarn` (we're using v1.22.5 at the moment of writing this)
- A recent version of Visual Studio Code

Once that's ready:

- Clone the repository.
- `cd` to the project folder.
- run `yarn install` to install all the dependencies. This will take a while.
- run `yarn start` to generate the Sketch Library. Depending on your computer setup, this will take anywhere from a few seconds to a few minutes. For reference, building the Library takes about 9 seconds on a 2020 M1 MacBook Pro. You can also use `yarn open` to build the library and then open the resulting file in Sketch.

If all went well, you'll now have a `material-design-icons.sketch` file on your project folder. It'll be about 11 Mb in size, with all the Material Design Icons neatly positioned on a grid on the `Symbols` page.

## Bonus

If you don't feel like installing anything, [there is an Action in the repo](https://github.com/sketch-hq/material-icons-library/blob/main/.github/workflows/main.yml) that runs the project and generates the .sketch file as an Action Artifact you can download here: <https://github.com/sketch-hq/material-icons-library/actions>
