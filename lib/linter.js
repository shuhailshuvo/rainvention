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

module.exports = async (codeString, filePath, file) => {
  try {
    const AST = esprima.parseModule(codeString, parserOptions);
    for (var i = 0; i < AST.body.length; i++) {
      const body = AST.body[i];
      await validateNames(body, file, filePath);
    }
    for (var i = 0; i < AST.tokens.length; i++) {
      await collectVariables(AST, file);
    }
    const code = new SourceCode(codeString, AST);
    const lintResult = await linter.verify(code, rules);
    lintResult.push(err);
    return lintResult;
  } catch (e) {
    prittyPrint(e);
  }
};

const collectVariables = async (AST, file) => {
  const token = AST.tokens[i];
  if (
    token.type === "Identifier" &&
    functions.indexOf(token.value) === -1 &&
    vars.indexOf(token.value) === -1 &&
    rules.naming.variables.exceptions.indexOf(token.value) === -1
  ) {
    vars.push(token.value);
    await validate.rules(
      token.value,
      `${file}:${token.loc.start.line}:${token.loc.start.column}`,
      varRules,
      "Variable"
    );
  }
};
const validate = {
  camelCase: input => {
    const rules = new RegExp("^[a-z]+([A-Z][a-z]+)*$");
    return rules.test(input);
  },
  pascalCase: input => {
    const rules = new RegExp("^[A-Z][a-z]+(?:[A-Z][a-z]+)*$");
    return rules.test(input);
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
  classMethods: async classContent => {
    for (var j = 0; j < classContent.length; j++) {
      const content = classContent[j];
      if (content.type === "MethodDefinition") {
        functions.push(content.key.name);
        await validate.rules(
          content.key.name,
          `line :${content.key.loc.start.line}:${content.key.loc.start.column}`,
          funcRules,
          "Function"
        );
      }
    }
  },
  rules: async (name, loc, rules, type) => {
    for (var i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const validated = await validate[rule](name);
      if (!validated) {
        err.push(`${type} name "${name}" should be "${rule}" on ${loc}`);
      }
    }
  }
};

const validateNames = async (body, file, filePath) => {
  switch (body.type) {
    case "VariableDeclaration":
      if (body.declarations[0].init.type === "ArrowFunctionExpression") {
        functions.push(body.declarations[0].id.name);
        await validate.rules(
          body.declarations[0].id.name,
          `${file}:${body.declarations[0].loc.start.line}:${body.declarations[0].loc.start.column}`,
          funcRules,
          "Function"
        );
      }
      break;
    case "ClassDeclaration":
      if (
        classes.indexOf(body.id.name) === -1 &&
        rules.naming.classes.exceptions.indexOf(body.id.name) === -1
      ) {
        classes.push(body.id.name);
        if (rules.naming.classes.fileName) {
          if (
            !validate[rules.naming.classes.fileName](
              file,
              `${filePath}/${file}`
            )
          ) {
            err.push(
              `Class File name "${file}" should be "${rules.naming.classes.fileName}"`
            );
          }
        }
        await validate.rules(
          body.id.name,
          `${file} ${body.loc.start.line}:${body.loc.start.column}`,
          classRules,
          "Class"
        );
        await validate.classMethods(body.body.body);
      }
      break;
    case "FunctionDeclaration":
      functions.push(body.id.name);
      await validate.rules(
        body.id.name,
        `${file}:${body.loc.start.line}:${body.loc.start.column}`,
        funcRules,
        "Function"
      );
      break;
  }
};

const prittyPrint = e => {
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
