/**
 * Builds a CSS className string from an object.
 * The keys are converted to the className string, if the values are truthy.
 * @param {Object} obj className to truthy mappings.
 * @returns {String} The formatted CSSString.
 */
export default function cx(obj) {
  return Object.keys(obj).filter(prop => obj[prop]).join(' ');
}
