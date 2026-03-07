function startCoolingTimer(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Cooling period finished");
    }, seconds * 1000);
  });
}

module.exports = { startCoolingTimer };