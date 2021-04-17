class DonePlugin {
  apply(compiler) {
    // 注册一个emit钩子
    compiler.hooks.emit.tap("EmitPlugin", () => {
      //每次输出目前前更新一个输出的readme文档
      compiler.assets["readme.md"] = "请先读我";
    });
  }
}

module.exports = DonePlugin;
