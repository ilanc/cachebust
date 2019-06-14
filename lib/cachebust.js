/*
 *
 * https://github.com/furzeface/cachebust
 *
 * Copyright (c) 2014 Daniel Furze
 * Licensed under the MIT license.]
 *
 */

"use strict";

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const MD5 = require("md5");

function loadAttribute(content) {
  if (content.name.toLowerCase() === "link") {
    return content.attribs.href;
  }

  if (content.name.toLowerCase() === "script") {
    return content.attribs.src;
  }

  throw new Error("No content awaited in this step of process");
}

const implementation = {
  MD5: (options, filePath, originalAttrValue) => {
    if (!fs.existsSync(filePath)) {
      throw new Error(`broken link detected: ${originalAttrValue} => ${filePath}`);
    }
    return MD5(fs.readFileSync(filePath).toString());
  },
  timestamp: (options, filePath, originalAttrValue) => options.currentTimestamp,
  constant: (options, filePath, originalAttrValue) => options.constant
};

function replace(htmlPath, html, originalAttrValue, options) {
  let orig = originalAttrValue.split("?");
  let url = orig[0];
  let qs = orig[1];
  let htmlDirname = path.dirname(htmlPath);
  // support relative and absolute urls
  let dir = url[0] == "/" ? options.basePath : htmlDirname;
  let filePath = path.join(dir, url);
  let newCb = "v=" + implementation[options.type](options, filePath, originalAttrValue);
  // support originalAttrValue has querystring already and originalAttrValue has previously calcuated cachebust (v=hash)
  if (qs) {
    let prevCb = /v=[^&$]*/.exec(qs);
    if (prevCb) {
      // replace prevCb with newCb in existing querystring
      qs = qs.replace(prevCb[0], newCb);
    } else {
      // append newCb to existing querystring
      qs += "&" + newCb;
    }
  } else {
    // add querystring where none existed
    qs = newCb;
  }
  let newAttrValue = url + "?" + qs;
  return html.replace(originalAttrValue, newAttrValue);
}

exports.busted = function(
  htmlFilePath,
  {
    basePath = undefined,
    type = "MD5",
    currentTimestamp = new Date().getTime(),
    constant = undefined
  }
) {
  let html = fs.readFileSync(htmlFilePath, "utf8");
  let $ = cheerio.load(html);
  let options = {
    basePath,
    type,
    currentTimestamp,
    constant
  };
  let protocolRegEx = /^(http(s)?)|\/\//;
  let elements = $(
    "script[src], link[rel=stylesheet][href], link[rel=import][href], link[rel=preload][href]"
  );

  for (let i = 0, len = elements.length; i < len; i++) {
    let originalAttrValue = loadAttribute(elements[i]);

    // Test for http(s) and // and don't cache bust if (assumed) served from CDN
    if (!protocolRegEx.test(originalAttrValue)) {
      html = replace(htmlFilePath, html, originalAttrValue, options);
    }
  }

  return html;
};
