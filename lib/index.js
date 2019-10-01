const fs = require("fs");
const linter = require("./linter");
const codeDir = process.cwd("./");
let files = [];

const validate = (dir, file = "") => {
  let absolutePath = file;
  try {
    if (!fs.lstatSync(absolutePath).isFile()) {
      absolutePath = dir + "/" + file;
    }
    fs.lstatSync(absolutePath).isFile();
    return absolutePath;
  } catch (err) {
    throw { error: "Invalid file or directory" };
  }
};
const processPath = async (path, fileName) => {
  if (!fs.lstatSync(path).isFile()) {
    await listFiles(path);
  }
  if (fs.lstatSync(path).isFile() && fileName.indexOf(".js") !== -1) {
    files.push(path);
  }
};
const listFiles = async dir => {
  let folders = await fs.readdirSync(dir);
  for (var folder = 0; folder < folders.length; folder++) {
    if (
      folders[folder].indexOf(".json") === -1 &&
      folders[folder].indexOf(".env") === -1 &&
      folders[folder].indexOf("node_modules") === -1
    )
      processPath(dir + "/" + folders[folder], folders[folder]);
  }
  return files;
};

const analyze = absolutePath => {
  let review = [];
  while (files.length) {
    const file = files.shift();
    const codeString = fs.readFileSync(`${file}`, "utf-8");
    linter(codeString, absolutePath, file, result => {
      review.push({ file, review: result });
    });
  }
  return review;
};

const pretyPrint = reviews => {
  console.info(
    "\x1b[37m",
    "\n===================== REVIEW =======================\n"
  );
  let comments = 1;
  for (var k = 0; k < Object.keys(reviews).length; k++) {
    const review = reviews[Object.keys(reviews)[k]];
    if (review.review) {
      if (review.review[0].message) {
        printNamingReview(comments, review);
      } else {
        printLogicalReview(comments, review);
      }
      comments++;
    }
  }
};
const printLogicalReview = (comments, review) => {
  for (var i = 0; i < review.review[0].length; i++) {
    const comment = review.review[0][i];
    console.log("\x1b[37m", comments + ". ", "\x1b[33m", comment);
  }
};
const printNamingReview = (comments, review) => {
  console.log(
    "\x1b[37m",
    comments + ". ",
    "\x1b[33m",
    review.review[0].message +
      " " +
      review.file +
      " on line " +
      review.review[0].line +
      ":" +
      review.review[0].column
  );
};
module.exports = async file => {
  try {
    // validate source directory
    const absolutePath = validate(codeDir, file);
    // list all files from directory
    if (!fs.lstatSync(absolutePath).isFile()) {
      await listFiles(absolutePath);
    } else {
      files.push(absolutePath);
    }

    // review files
    const review = await analyze(absolutePath);

    pretyPrint(review);
  } catch (error) {
    console.log(error);
  }
};
