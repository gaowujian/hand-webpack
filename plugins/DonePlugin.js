class DonePlugin {
  apply(compiler) {
    // 注册一个run钩子
    compiler.hooks.done.tap("donePlugin", () => {
      console.log("done plugin");
    });
  }
}

module.exports = DonePlugin;
