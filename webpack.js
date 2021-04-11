const Compiler = require("./Compiler");
const { Command } = require("commander");
function webpack(config) {
  // * 1. 初始化参数：从配置文件和Shell语句中读取并合并参数,得出最终的配置对象
  const program = new Command();
  program.option("--mode <type>", "webpack mode");
  program.parse(process.argv);
  const shellOptions = program.opts();
  const finalOptions = { ...config, ...shellOptions };

  // * 2. 用上一步得到的参数初始化Compiler对象
  const compiler = new Compiler(finalOptions);

  // * 3. 加载所有配置的插件
  if (finalOptions.plugins && Array.isArray(finalOptions.plugins)) {
    for (const plugin of finalOptions.plugins) {
      plugin.apply(compiler);
    }
  }
  return compiler;
}

module.exports = webpack;
