import Settings from '../../settings.js';

const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::|:\/\/)/i;

export default class UriHelper {
  /**
   * Constructs a search results URL (DuckDuckGo, Google) from a given input.
   *
   * If a `{q}` exists in the search URL, we replace it with the given input.
   * Otherwise, we append the term to the search URl.
   *
   * @param {(Event|null)} term The search term.
   * @returns {String} A URL to the search results page.
   */
  static readSearchURI(term) {
    let termSafe = encodeURIComponent(term);

    if (Settings.search_url.indexOf('{q}') !== -1) {
      return Settings.search_url.replace('{q}', termSafe);
    }

    return Settings.search_url + termSafe;
  }

  static read(input) {
    if (this.isNotURI(input)) {
      // For cases such as `apricots`.
      return this.readSearchURI(input);
    }

    if (!this.hasScheme(input)) {
      // For cases such as `localhost:3000` or `//mozvr.com`.
      return `http://${input}`;
    }

    // For cases such as `view-source:example.com`.
    return input;
  }

  static getScheme(input) {
    // This function returns one of following:
    // - scheme + ':' (ex. http:)
    // - scheme + '://' (ex. http://)
    // - null
    var scheme = (rscheme.exec(input) || [])[0];
    return scheme === 'localhost:' ? null : scheme;
  }

  static hasScheme(input) {
    return !!this.getScheme(input);
  }

  static isURI(input) {
    return !this.isNotURI(input);
  }

  static isNotURI(input) {
    let str = input.trim();

    // For cases such as ?abc and "a? b" which should searching query.
    const case1Reg = /^(\?)|(\?.+\s)/;
    // For cases such as pure string.
    const case2Reg = /[\?\.\s\:]/;
    // For cases such as `data:uri` and `view-source:example.com`.
    const case3Reg = /^\w+\:\/*$/;

    if (case1Reg.test(str) || !case2Reg.test(str) || case3Reg.test(str)) {
      return true;
    }

    if (!this.hasScheme(input)) {
      // No scheme? Prepend to test as an HTTP URL below.
      str = 'http://' + str;
    }

    try {
      new URL(str);
      return false;
    } catch (e) {
      return true;
    }
  }
}
