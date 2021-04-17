const { SyncHook } = require("tapable");
const path = require("path");
const fs = require("fs");
const compose = require("./utils/compose");
const parser = require("@babel/core");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const types = require("babel-types");
const { DllPlugin } = require("webpack");

const rootPath = process.cwd();
class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new SyncHook(), //开始编译
      done: new SyncHook(), // 编译完成
      emit: new SyncHook(), // 写入文件系统
    };

    // 所有入口
    this.entries = new Set();
    // 所有的模块
    this.modules = new Set();
    // 所有的chunks
    this.chunks = new Set();
    //  存放着本次要产出的文件, key是文件名,不包含路径，值是文件内容
    this.assets = {};
    // 本次编译后，要产出的文件的文件名
    this.files = new Set();
  }
  //开始执行webpack的编译工作
  run(callback) {
    this.hooks.run.call();
    //  * 5. 根据配置中的entry找出入口文件
    let entry = {};
    if (Object.prototype.toString.call(this.options.entry) === "string") {
      entry = {
        main: this.options.entry,
      };
    } else {
      entry = this.options.entry;
    }
    // * 6. 从入口文件出发,调用所有配置的Loader对当前模块进行编译
    for (const entryName in entry) {
      const entryPath = path.posix.join(rootPath, entry[entryName]);
      const entryModule = this.buildModule(entryName, entryPath);
      this.entries.add(entryModule);
    }
    // console.log("this.entries:", this.entries);
    // console.log("this.modules:", this.modules);

    // * 8. 根据入口和模块之间的依赖关系，组装成一个个包含多个模块的 Chunk
    // 一个entry对应一个chunk
    for (const entryModule of this.entries) {
      const chunk = {
        name: entryModule.name,
        entryModule,
        modules: Array.from(this.modules).filter((module) => module.name === entryModule.name),
      };
      this.chunks.add(chunk);
    }
    // console.log("this.chunks:", this.chunks);

    // * 9. 再把每个Chunk转换成一个单独的文件加入到输出列表
    const output = this.options.output;
    this.chunks.forEach((chunk) => {
      const filename = output.filename.replace("[name]", chunk.name);
      this.assets[filename] = getSource(chunk);
    });
    for (const filename in this.assets) {
      const filePath = path.join(output.path, filename);
      fs.writeFileSync(filePath, this.assets[filename]);
    }
    // 完成所有的编译工作，可以触发done的回调
    this.hooks.done.call();
    callback(null, {
      toJson: () => {
        return {
          entries: this.entries,
          modules: this.modules,
          chunks: this.chunks,
          assets: this.assets,
          files: this.files,
        };
      },
    });
  }

  buildModule(moduleName, modulePath) {
    // 1.读取一个模块的内容
    const originalSourceCode = fs.readFileSync(modulePath, "utf-8");
    let targetSourceCode = originalSourceCode;
    // 2. 根据模块后缀，调用所有满足条件的的loader对该模块进行编译
    const rules = this.options.module.rules;
    let loaders = [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule.test.test(modulePath)) {
        loaders = [...loaders, ...rule.use];
      }
    }

    // ==================
    // loaders = loaders.map((path) => require(path));
    // targetSourceCode = compose(loaders)(originalSourceCode);
    // =============
    // 从后向前执行

    for (let i = loaders.length - 1; i >= 0; i--) {
      targetSourceCode = require(loaders[i])(targetSourceCode);
    }
    // 构建当前模块, 所有的模块id都是一个相对根目录的 相对路径
    let moduleId = "./" + path.posix.relative(rootPath, modulePath);
    const module = {
      id: moduleId, //该模块独一无二的id属性
      dependencies: [], // 该模块依赖的模块
      name: moduleName, // 该模块所属的entryModule的name属性，会一直传递向下传递
    };
    // * 7. 再找出该模块依赖的模块，再递归本步骤直到所有入口依赖的文件都经过了本步骤的处理
    // 使用ast去分析依赖
    console.log("targetSourceCode:", targetSourceCode);
    const ast = parser.parse(targetSourceCode, { sourceType: "module" });
    traverse(ast, {
      CallExpression: (nodePath) => {
        const { node } = nodePath;
        // 需要构建一个模块中的依赖模块,
        if (node.callee.name === "require") {
          let moduleName = node.arguments[0].value; // ./title
          const dirName = path.posix.dirname(modulePath); // "/Users/mac/Desktop/hand-webpack/src"
          let depModulePath = path.posix.join(dirName, moduleName); // "/Users/mac/Desktop/hand-webpack/src/title"
          const extensions = this.options.resolve.extensions;
          depModulePath = tryExtensions(depModulePath, extensions, moduleName, dirName);
          let depModuleId = "./" + path.posix.relative(rootPath, depModulePath); //./src/title.js
          node.arguments = [types.stringLiteral(depModuleId)]; // 把模块的依赖名改成了在modules中注册的moduleId
          // !避免两个entry引入同一个title导致创建了两个title module
          const alreadyModulesIds = Array.from(this.modules).map((module) => module.id);
          if (!alreadyModulesIds.includes(depModuleId)) {
            module.dependencies.push(depModulePath); //给当前模块添加依赖
          }
        }
      },
    });
    const { code } = generator(ast);
    module._source = code;
    // 把当前模块编译完后，找到所有的依赖，并进行每个模块的递归编译,从内到外添加到modules中
    module.dependencies.forEach((dep) => {
      const depModule = this.buildModule(moduleName, dep);
      this.modules.add(depModule);
    });

    return module;
  }
}
/**
 *
 * 给当前模块构建依赖模块，模块路径指的是依赖模块的绝对地址
 * @param {*} modulePath 模块路径  /Users/mac/Desktop/hand-webpack/src/title
 * @param {*} extensions 后缀 [ '.js', '.jsx', '.json' ]
 * @param {*} originModulePath ./title
 * @param {*} dirName /Users/mac/Desktop/hand-webpack/src
 * @return {*}
 */
function tryExtensions(modulePath, extensions, originModulePath, dirName) {
  // 在最开始加一个 "" 表示默认一个路径在第一次尝试的时候是不需要补全路径的
  extensions.unshift("");
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i];
    if (fs.existsSync(modulePath + ext)) {
      return modulePath + ext;
    }
  }
  // 说明没有后缀匹配
  // const err = `Module not found: Error: cannot resolve ${originModulePath} in ${dirName}`;
  throw new Error(`Module not found: Error: cannot resolve ${originModulePath} in ${dirName}`);
}

/**
 * 获取chunk对应的源代码 输出的文件内容
 * @param {*} chunk
 *    name 代码块的名字 entryModule入口模块 modules所有的模块
 */
function getSource(chunk) {
  return `
  (() => {
      var modules = ({
         ${chunk.modules
           .map(
             (module) => `
             "${module.id}":
              ((module) => {
                        ${module._source}
              })
             `
           )
           .join(",")} 
      });
      var cache = {};
      function require(moduleId) {
        var cachedModule = cache[moduleId];
        if (cachedModule !== undefined) {
          return cachedModule.exports;
        }
        var module = cache[moduleId] = {
          exports: {}
        };
        modules[moduleId](module, module.exports, require);
        return module.exports;
      }
      var exports = {};
      (() => {
              ${chunk.entryModule._source}
      })();
    })()
      ;
  `;
}

module.exports = Compiler;
