const logError = (error) => {
  console.error(`[${new Date().toISOString()}]`, error);
};

module.exports = { logError };
