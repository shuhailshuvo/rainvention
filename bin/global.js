#!/usr/bin/env node

// Delete the 0 and 1 argument (node and script.js)
const args = process.argv.splice(process.execArgv.length + 2);

// Retrieve the first argument
const name = args[0].replace("./", "");

const rainvention = require("../lib/index.js");

// Start review process
rainvention(name);
