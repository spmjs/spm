var CSSLint = require('csslint').CSSLint;
var fsExt = require('../../utils/fs_ext.js');


// https://github.com/stubbornella/csslint/wiki/Command-line-interface
var cssLintOptions = ['help', 'format', 'list-rules', 'errors','warnings', 'ignore', 'version'];

module.exports = function(file, argv) {
  var options = {};

  Object.keys(argv).forEach(function(arg) {
    if (cssLintOptions.indexOf(arg) > -1) {
      options[arg] = argv[arg];
    }
  });

  if (options.help){
    outputHelp();
    return;
  }

  if (options.version){
    console.info("v" + CSSLint.version);
    return;
  }

  if (options["list-rules"]){
    printRules();
    return;
  }

  processFiles(file, options);
};

/**
 * Returns an array of messages for a particular type.
 * @param messages {Array} Array of CSS Lint messages.
 * @param type {String} The type of message to filter on.
 * @return {Array} An array of matching messages.
 */
function pluckByType(messages, type){
    return messages.filter(function(message) {
        return message.type === type;
    });
}

/**
 * Returns a ruleset object based on the CLI options.
 * @param options {Object} The CLI options.
 * @return {Object} A ruleset object.
 */
function gatherRules(options, ruleset){
    var warnings = options.rules || options.warnings,
        errors = options.errors;

    if (warnings){
        ruleset = ruleset || {};
        warnings.split(",").forEach(function(value){
            ruleset[value] = 1;
        });
    }

    if (errors){
        ruleset = ruleset || {};
        errors.split(",").forEach(function(value){
            ruleset[value] = 2;
        });
    }

    return ruleset;
}

/**
 * Filters out rules using the ignore command line option.
 * @param options {Object} the CLI options
 * @return {Object} A ruleset object.
 */
function filterRules(options) {
    var ignore = options.ignore,
        ruleset = null;

    if (ignore) {
        ruleset = CSSLint.getRuleset();
        ignore.split(",").forEach(function(value){
            delete ruleset[value];
        });
    }

    return ruleset;
}

/**
 * Outputs all available rules to the CLI.
 * @return {void}
 */
function printRules(){
    console.info("");
    var rules = CSSLint.getRules();
    rules.forEach(function(rule){
        console.info(rule.id + "\n  " + rule.desc + "\n");
    });
}

/**
 * Given a file name and options, run verification and print formatted output.
 * @param {String} relativeFilePath absolute file location
 * @param {Object} options for processing
 * @return {Number} exit code
 */
function processFile(filePath, options) {
    var input = fsExt.readFileSync(filePath),
        ruleset = filterRules(options),
        result = CSSLint.verify(input, gatherRules(options, ruleset)),
        formatter = CSSLint.getFormatter(options.format || "text"),
        messages = result.messages || [],
        output,
        exitCode = 0;

    if (!input) {
        if (formatter.readError) {
            console.info(formatter.readError(relativeFilePath, "Could not read file data. Is the file empty?"));
        } else {
            console.info("csslint: Could not read file data in " + relativeFilePath + ". Is the file empty?");
        }
        exitCode = 1;
    } else {
        output = formatter.formatResults(result, filePath, options);
        if (output){
            console.info(output);
        }

        if (messages.length > 0 && pluckByType(messages, "error").length > 0) {
            exitCode = 1;
        }
    }

    return exitCode;
}


/**
 * Outputs the help screen to the CLI.
 * @return {void}
 */
function outputHelp(){
    console.info([
        "\nUsage: csslint-rhino.js [options]* [file|dir]*",
        " ",
        "Global Options",
        "  --help                    Displays this information.",
        "  --format=<format>         Indicate which format to use for output.",
        "  --list-rules              Outputs all of the rules available.",
        "  --quiet                   Only output when errors are present.",
        "  --errors=<rule[,rule]+>   Indicate which rules to include as errors.",
        "  --warnings=<rule[,rule]+> Indicate which rules to include as warnings.",
        "  --ignore=<rule,[,rule]+>  Indicate which rules to ignore completely.",
        "  --version                 Outputs the current version number."
    ].join("\n") + "\n");
}

/**
 * Given an Array of filenames, print wrapping output and process them.
 * @param files {Array} filenames list
 * @param options {Object} options object
 * @return {Number} exit code
 */
function processFiles(file, options){
    var exitCode = 0,
        formatId = options.format || "text",
        formatter,
        output;

    if (!CSSLint.hasFormat(formatId)){
        console.info("csslint: Unknown format '" + formatId + "'. Cannot proceed.");
        exitCode = 1;
    } else {
        formatter = CSSLint.getFormatter(formatId);

        output = formatter.startFormat();
        if (output){
            console.info(output);
        }
        if (exitCode === 0) {
            exitCode = processFile(file,options);
        } else {
            processFile(file,options);
        }

        output = formatter.endFormat();
        if (output){
            console.info(output);
        }
    }

    return exitCode;
}

