let path = require("path");

let cwd = process.cwd();
console.log(cwd);
let entry1 = path.join(cwd, "./src/entry1.js");
console.log(entry1);
console.log(path.relative(cwd, entry1)); //强制路径分隔符使用/
