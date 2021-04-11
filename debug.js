const webpack = require("./webpack");
const options = require("./webpack.config");

const compiler = webpack(options);

// * 4. 执行对象的run方法开始执行编译

compiler.run((err, state) => {
  console.log("err:", err);
  console.log(
    "state.toJson:",
    state.toJson({
      entries: true,
      modules: true,
      chunks: true,
      assets: true,
      files: true,
    })
  );
});
