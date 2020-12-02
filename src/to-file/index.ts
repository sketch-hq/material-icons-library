const fs = require('fs')
const path = require('path')

import FileFormat from "@sketch-hq/sketch-file-format-ts";

const toFile = async (
  contents: FileFormat.Contents,
  filepath: string
): Promise<void> => {
  await new Promise((resolve): void => {
    console.log(contents);
    console.log(`not implemented: writing to ${filepath}`);

    // TODO: Replace with temporary folder
    const folder = path.basename(filepath, `.sketch`);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    // Write all page JSON data.
    const pagesFolder = path.join(folder, `pages`);
    if (!fs.existsSync(pagesFolder)) fs.mkdirSync(pagesFolder);

    const refs = contents.document.pages.map(
      (page): FileFormat.FileRef => {
        fs.writeFileSync(
          path.join(pagesFolder, `${page.do_objectID}.json`),
          JSON.stringify(page)
        );

        return {
          _class: "MSJSONFileReference",
          _ref_class: "MSImmutablePage",
          _ref: `pages/${page.do_objectID}`
        };
      }
    );

    // Write root level JSON data for document, user and meta data.
    const data: FileFormat.Document = {
      ...contents.document,
      pages: refs
    };

    const dst = path.join(folder, `document.json`)
    fs.writeFileSync(dst, JSON.stringify(data));

    fs.writeFileSync(
      path.join(folder, `user.json`),
      JSON.stringify(contents.user)
    );

    fs.writeFileSync(
      path.join(folder, `meta.json`),
      JSON.stringify(contents.meta)
    );

    resolve(true);
  });
};

console.log(fs);

export { toFile };
