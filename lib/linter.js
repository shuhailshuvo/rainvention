const esprima = require("esprima");
const rules = require("./eslintrc.json");
const eslint = require("eslint");
const SourceCode = eslint.SourceCode;
const Linter = eslint.Linter;
const linter = new Linter();
const WordPOS = require("wordpos");
const wordpos = new WordPOS();
const changeCase = require("change-case");
const parserOptions = {
  tokens: true,
  comment: true,
  loc: true,
  range: true
};
const varRules = rules.naming.variables.rules;
const funcRules = rules.naming.functions.rules;
const classRules = rules.naming.classes.rules;
const vars = [];
const classes = [];
const functions = [];
const err = [];

module.exports = async (codeString, filePath, file, cb) => {
  try {
    const AST = esprima.parseModule(codeString, parserOptions);
    for (var i = 0; i < AST.body.length; i++) {
      const body = AST.body[i];
      validateNames(body, file, filePath);
    }
    for (var j = 0; j < AST.tokens.length; j++) {
      collectVariables(AST.tokens[j], file);
    }
    const code = new SourceCode(codeString, AST);
    const lintResult = await linter.verify(code, rules);
    lintResult.push(err);
    return cb(lintResult);
  } catch (e) {
    return prittyPrint(e, file);
  }
};

const collectVariables = async (token, file) => {
  if (
    token.type === "Identifier" &&
    functions.indexOf(token.value) === -1 &&
    vars.indexOf(token.value) === -1 &&
    rules.naming.variables.exceptions.indexOf(token.value) === -1
  ) {
    vars.push(token.value);
    await validate.rule(
      token.value,
      `${file}:${token.loc.start.line}:${token.loc.start.column}`,
      varRules,
      "Variable"
    );
  }
};
const validate = {
  camelCase: input => {
    const camelCaseRule = new RegExp("^[a-z]+([A-Z][a-z]+)*$");
    return camelCaseRule.test(input);
  },
  pascalCase: input => {
    const pascalCaseRule = new RegExp("^[A-Z][a-z]+(?:[A-Z][a-z]+)*$");
    return pascalCaseRule.test(input);
  },
  noun: name => {
    return wordpos.getNouns(changeCase.sentenceCase(name)).then(noun => {
      if (noun.length === 0) {
        return false;
      }
      return true;
    });
  },
  verb: name => {
    return wordpos.getVerbs(changeCase.sentenceCase(name)).then(verb => {
      if (verb.length === 0) {
        return false;
      }
      return true;
    });
  },
  classMethods: classContent => {
    for (var j = 0; j < classContent.length; j++) {
      const content = classContent[j];
      if (content.type === "MethodDefinition") {
        functions.push(content.key.name);
        validate.rule(
          content.key.name,
          `line :${content.key.loc.start.line}:${content.key.loc.start.column}`,
          funcRules,
          "Function"
        );
      }
    }
  },
  rule: (name, loc, validationRule, type) => {
    for (var i = 0; i < validationRule.length; i++) {
      const rule = validationRule[i];
      const validated = validate[rule](name);
      if (!validated) {
        err.push(`${type} name "${name}" should be "${rule}" on ${loc}`);
      }
    }
  }
};

const processVariables = async (body, file) => {
  if (body.init.type === "ArrowFunctionExpression") {
    functions.push(body.id.name);
    await validate.rule(
      body.id.name,
      `${file}:${body.loc.start.line}:${body.loc.start.column}`,
      funcRules,
      "Function"
    );
  }
};

const processClasses = async (body, file, filePath) => {
  classes.push(body.id.name);
  if (
    rules.naming.classes.fileName &&
    !validate[rules.naming.classes.fileName](file, `${filePath}/${file}`)
  )
    err.push(
      `Class File name "${file}" should be "${rules.naming.classes.fileName}"`
    );
  await validate.rule(
    body.id.name,
    `${file} ${body.loc.start.line}:${body.loc.start.column}`,
    classRules,
    "Class"
  );
  await validate.classMethods(body.body.body);
};

const processMethods = async (body, file) => {
  functions.push(body.id.name);
  await validate.rule(
    body.id.name,
    `${file}:${body.loc.start.line}:${body.loc.start.column}`,
    funcRules,
    "Function"
  );
};

const validateNames = async (body, file, filePath) => {
  switch (body.type) {
    case "VariableDeclaration":
      await processVariables(body.declarations[0], file);
      break;
    case "ClassDeclaration":
      if (
        classes.indexOf(body.id.name) === -1 &&
        rules.naming.classes.exceptions.indexOf(body.id.name) === -1
      ) {
        await processClasses(body, file, filePath);
      }
      break;
    case "FunctionDeclaration":
      processMethods(body, file);
      break;
    default:
      break;
  }
};

const prittyPrint = (e, file) => {
  console.error(
    "\x1b[31m",
    `
    ### PARSE ERROR
    #
    # ${file}
    #
    # ${e}
    #
    #########################################\n\n
    `
  );
};
