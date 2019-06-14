const ArgumentParser = require("argparse").ArgumentParser;

exports.bool = function(s) {
  let v = s.toLowerCase();
  if (["yes", "true", "t", "y", "1"].includes(v)) return true;
  else if (["no", "false", "f", "n", "0"].includes(v)) return false;
  else throw "invalid bool";
};

exports.setCommandLineArgs = function(config) {
  let parser = new ArgumentParser(config.argParserDetails);
  for (a of Object.keys(config.args)) {
    parser.addArgument(["--" + a], config.args[a]);
  }
  let args = parser.parseArgs();
  return args;
};
