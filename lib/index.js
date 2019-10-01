const fs = require("fs");
const linter = require("./linter");
const codeDir = process.cwd("./");
let files = [];

module.exports = async file => {
  try {
    // validate source directory
    const { absolutePath } = validate(codeDir, file);

    // list all files from directory
    if (!fs.lstatSync(absolutePath).isFile()) {
      await listFiles(absolutePath);
    } else {
      files.push(absolutePath);
    }

    // review files
    const review = await analyze(files, absolutePath);

    pretyPrint(review);
  } catch (error) {
    console.log(error);
  }
  return;
};

const validate = (dir, file = "") => {
  let absolutePath = file;
  try {
    if (!fs.lstatSync(absolutePath).isFile()) {
      absolutePath = dir + "/" + file;
    }
    fs.lstatSync(absolutePath).isFile();
    return absolutePath;
  } catch (e) {
    throw { Error: "Invalid file or directory" };
  }
};

const listFiles = async dir => {
  folders = await fs.readdirSync(dir);
  for (var i = 0; i < folders.length; i++) {
    // skipping .env, .json and node_modules
    if (
      folders[i].indexOf(".json") === -1 &&
      folders[i].indexOf(".env") === -1 &&
      folders[i].indexOf("node_modules") === -1
    ) {
      if (!fs.lstatSync(dir + "/" + folders[i]).isFile()) {
        listFiles(dir + "/" + folders[i]);
      } else {
        files.push(dir + "/" + folders[i]);
      }
    }
  }
  return files;
};

const analyze = async (files, absolutePath) => {
  let review = [];
  while (files.length) {
    const file = files.shift();
    const codeString = fs.readFileSync(`${file}`, "utf-8");
    const result = await linter(codeString, absolutePath, file);
    review.push({ file, review: result });
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
        console.log(
          "\x1b[33m",
          comments + ". ",
          review.review[0].message +
            " " +
            review.file +
            " on line " +
            review.review[0].line +
            ":" +
            review.review[0].column
        );
        comments++;
      } else {
        review.review[0].map(comment => {
          console.log("\x1b[33m", comments + ". ", comment);
          comments++;
        });
      }
    }
  }
};
