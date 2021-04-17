function logger1(content) {
  console.log("logger11111");
  return content + "logger1111";
}

function logger2(content) {
  console.log("logger2222");
  return content + "logger222";
}

function compose(loaders) {
  return function (origin) {
    return loaders.reduceRight((memo, current) => {
      return current(memo);
    }, origin);
  };
}

const result = compose([logger2, logger1])("heiheihei");
console.log("result:", result);
