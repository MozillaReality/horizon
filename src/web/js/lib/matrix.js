export default class Matrix {
  /**
   * Returns matrix array from CSS matrix and matrix3d transform strings.
   *
   * @param  {String} m3d
   * @return {Array} Matrix values from CSS transform.
   */
  matrixFromCss(matrixString) {
    let values = matrixString.match(/matrix(?:3d)?\((.*)\)/i)[1];
    if (values) {
      return values.split(',').map(v => parseFloat(v.trim()));
    } else {
      return false;
    }
  }

  /**
   * Returns matrix array from Quaternion
   *
   * @param  {Number} x X component
   * @param  {Number} x Y component
   * @param  {Number} x Z component
   * @param  {Number} x W component
   *
   * @return {Array} Matrix values from quaternion.
   */
  matrixFromQuaternion(x, y, z, w) {
    let m = Array(16);

    let x2 = x + x, y2 = y + y, z2 = z + z;
    let xx = x * x2, xy = x * y2, xz = x * z2;
    let yy = y * y2, yz = y * z2, zz = z * z2;
    let wx = w * x2, wy = w * y2, wz = w * z2;

    m[0] = 1 - (yy + zz);
    m[4] = xy - wz;
    m[8] = xz + wy;

    m[1] = xy + wz;
    m[5] = 1 - (xx + zz);
    m[9] = yz - wx;

    m[2] = xz - wy;
    m[6] = yz + wx;
    m[10] = 1 - (xx + yy);

    m[3] = m[7] = m[11] = 0;
    m[12] = m[13] = m[14] = 0;
    m[15] = 1;

    return m;
  }

  /**
   * Returns CSS matrix3d string from matrix array.
   *
   * @param  {Array} e 6 or 16 element matrix array.
   * @return {String} CSS transform string.
   */
  cssMatrixFromElements(e) {
    let matrixStr = (e.length === 16) ? 'matrix3d' : 'matrix';
    return matrixStr + '(' + e.join(',') + ')';
  }

  /**
   * Returns CSS matrix3d string from quaternion.
   *
   * @param {Object} q Quaternion
   * @param {Number} q.x X Component
   * @param {Number} q.y Y Component
   * @param {Number} q.z Z Component
   * @param {Number} q.w W Component
   * @return {String} transform string
   */
  cssMatrixFromOrientation(q) {
    if (!q) {
      return '';
    }
    /* -Y to account for CSS Y orientation */
    return this.cssMatrixFromElements(this.matrixFromQuaternion(q.x, -q.y, q.z, q.w));
  }
}
