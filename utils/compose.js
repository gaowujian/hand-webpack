function compose(loaders) {
  return function (origin) {
    return loaders.reduceRight((memo, current) => {
      return current(memo);
    }, origin);
  };
}

module.exports = compose;
