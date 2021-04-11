class Compiler {
  constructor(options) {
    this.options = options;
  }
  //开始执行webpack的编译工作
  run() {
    //  * 5. 根据配置中的entry找出入口文件
    let entry = {};
    if (Object.prototype.toString.call(this.options.entry) === "string") {
      entry = {
        main: this.options.entry,
      };
    } else {
      entry = this.options.entry;
    }
    //
    console.log("开始任务:");
  }
}

module.exports = Compiler;
