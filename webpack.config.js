const path = require("path");
const DonePlugin = require("./plugins/DonePlugin");
const RunPlugin = require("./plugins/RunPlugin");
module.exports = {
  mode: "development",
  entry: path.join(__dirname, "src", "index"),
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "/dist/",
    filename: "bundle.js",
    chunkFilename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [path.resolve(__dirname, "app")],
        exclude: [path.resolve(__dirname, "node_modules")],
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/env",
                  {
                    targets: {
                      browsers: "last 2 chrome versions",
                    },
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".json", ".js", ".jsx"],
  },
  plugins: [new RunPlugin(), new DonePlugin()],
  devtool: false,
};
