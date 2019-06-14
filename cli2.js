#! /usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const cachebust = require("./lib/cachebust");
const Args = require("./lib/arg");
const Version = require("./package").version;

let _CommandLineArgs = {
  argParserDetails: {
    version: Version,
    addHelp: true,
    description: "cachebuster v 2"
  },
  args: {
    folder: {
      type: "string",
      help: "path to root folder where we should search for .html files to cachebust",
      required: true
    },
    basePath: {
      type: "string",
      help: "path to html root folder for use with absolute paths. Defaults to --folder",
      required: false
    }
  }
};

async function run() {
  try {
    let args = Args.setCommandLineArgs(_CommandLineArgs);
    if (args.version) {
      version();
      process.exit(0);
    }

    await recurseFolder(args);
  } catch (ex) {
    console.error(ex);
    process.exit(-1);
  }
}

run();

//#region recurseFolder

async function recurseFolder(args) {
  let options = {
    basePath: args.basePath ? args.basePath : args.folder,
    type: "MD5"
  };

  let files = await findFiles(args.folder);
  // console.log("files", files);
  if (files && files.length) {
    for (let file of files) {
      convertHtml(file, options);
    }
  }
}

function findFiles(folder) {
  folder = path.resolve(folder); // glob doesn't work with relative paths e.g. ../
  let globPattern = path.join(folder, "**", "*.html");
  // console.log("globPattern", globPattern);

  return new Promise((resolve, reject) => {
    let options = { nocase: true };
    if (process.platform === "win32") {
      // HACK: glob 7.1.3 broken on windows: https://github.com/isaacs/node-glob/issues/378
      console.warn("glob 7.1.3 broken on windows - can't do case-insensitive find");
      options = {};
    }
    glob(globPattern, options, function(err, files) {
      if (err) {
        return reject(err);
      } else {
        return resolve(files);
      }
    });
  });
}

function convertHtml(filePath, options) {
  let busted = cachebust.busted(filePath, options);
  fs.writeFileSync(filePath, busted);
  console.log("cachebust", filePath);
}

//#endregion

//#region version

function version() {
  return console.log(Version);
}

//#endregion
