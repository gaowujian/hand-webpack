const path = require("path");
const DonePlugin = require("./plugins/DonePlugin");
const RunPlugin = require("./plugins/RunPlugin");
const EmitPlugin = require("./plugins/EmitPlugin");
module.exports = {
  mode: "development",
  entry: {
    entry2: "./src/entry2.js",
    entry1: "./src/entry1.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [path.resolve(__dirname, "app")],
        exclude: [path.resolve(__dirname, "node_modules")],
        use: [
          path.resolve(__dirname, "loaders", "logger1-loader.js"),
          path.resolve(__dirname, "loaders", "logger2-loader.js"),
        ],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
  plugins: [new RunPlugin(), new DonePlugin(), new EmitPlugin()],
  devtool: false,
};
