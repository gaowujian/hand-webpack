class RunPlugin {
  apply(compiler) {
    // 注册一个run钩子
    compiler.hooks.run.tap("runPlugin", () => {
      // 执行回调
      console.log("run plugin 回调函数");
    });
  }
}

module.exports = RunPlugin;
