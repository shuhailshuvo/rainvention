<div align="center">
    <h1>rainvention</h1>
</div>

<div align="center">
  <strong>Coding convention of Spring Rain IT Ltd.</strong>
</div>

rainvention is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.

- rainvention uses [Esprima](https://www.npmjs.com/package/esprima) for JavaScript parsing.
- rainvention uses an AST to evaluate patterns in code.

## Table of Contents

1. [Installation](#installation)
1. [Usage](#usage)

## <a name="installation"></a>Installation

Prerequisites: [Node.js](https://nodejs.org/) (`^8.10.0`, `^10.13.0`, or `>=11.10.1`), npm version 3+.

You can install rainvention using npm:

```
$ npm install -g rainvention
```

It'll be installed globally with predefined conventions.

## <a name="usage"></a>Usage

you can run rainvention on any file or directory like this:

```
$ rainvention yourfile.js
```

or

```
$ rainvention src
```
