const path = require("path");

import * as Zip from "adm-zip";
import FileFormat from "@sketch-hq/sketch-file-format-ts";

const toFile = async (
  contents: FileFormat.Contents,
  filepath: string
): Promise<void> => {
  await new Promise((resolve, reject): void => {
    const sketch = new Zip();

    // Write pages first and use the resulting paths for the file
    // references that are stored within the main document.json.
    const refs = contents.document.pages.map(
      (page): FileFormat.FileRef => {
        const p = JSON.stringify(page);
        sketch.addFile(
          path.join("pages", `${page.do_objectID}.json`),
          Buffer.alloc(p.length, p),
          `page data for: ${page.name}`
        );

        return {
          _class: "MSJSONFileReference",
          _ref_class: "MSImmutablePage",
          _ref: `pages/${page.do_objectID}`,
        };
      }
    );

    // Write root level JSON data for document, user and meta data.
    const data = {
      document: JSON.stringify(<FileFormat.Document>{
        ...contents.document,
        pages: refs,
      }),
      user: JSON.stringify(contents.user),
      meta: JSON.stringify(contents.meta),
    };

    Object.entries(data).map(([key, val]) => {
      sketch.addFile(
        `${key}.json`,
        Buffer.alloc(val.length, val),
        `${key} data`
      );
    });

    sketch.writeZip(filepath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(null);
    });
  });
};

export { toFile };
