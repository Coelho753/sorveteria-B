const blockedKeyPattern = /(^\$|\.)/;

const sanitizeString = (value) => value
  .replace(/\0/g, '')
  .replace(/[<>`]/g, '')
  .trim();

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      if (blockedKeyPattern.test(key)) return acc;
      acc[key] = sanitizeValue(nestedValue);
      return acc;
    }, {});
  }
  if (typeof value === 'string') return sanitizeString(value);
  return value;
};

module.exports = (req, res, next) => {
  req.body = sanitizeValue(req.body || {});
  req.query = sanitizeValue(req.query || {});
  req.params = sanitizeValue(req.params || {});
  next();
};
