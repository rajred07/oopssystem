/**
 * SortUtils — Static sorting utility used by ExamManager.
 *
 * Implements two distinct algorithms to satisfy the sorting requirement:
 *  1. mergeSort  — O(n log n), used for merit list (priority: accuracy at scale)
 *  2. insertionSort — O(n²) best O(n), used for small submission-time lists
 *
 * Both are pure functions that do not mutate the original array.
 */
const SortUtils = {

  /**
   * Merge Sort — Divide and Conquer, O(n log n)
   * Stable sort; preserves relative order of equal elements.
   * @param {Array} arr
   * @param {Function} compareFn — (a, b) => negative|zero|positive
   * @returns {Array} new sorted array
   */
  mergeSort(arr, compareFn) {
    if (arr.length <= 1) return arr;
    const mid   = Math.floor(arr.length / 2);
    const left  = this.mergeSort(arr.slice(0, mid), compareFn);
    const right = this.mergeSort(arr.slice(mid), compareFn);
    return this._merge(left, right, compareFn);
  },

  _merge(left, right, compareFn) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      result.push(compareFn(left[i], right[j]) <= 0 ? left[i++] : right[j++]);
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
  },

  /**
   * Insertion Sort — O(n²) worst, O(n) best (nearly sorted data)
   * Used for sorting attempts by submission time (usually small, near-sorted).
   * @param {Array} arr
   * @param {Function} compareFn
   * @returns {Array} new sorted array
   */
  insertionSort(arr, compareFn) {
    const result = [...arr];
    for (let i = 1; i < result.length; i++) {
      const current = result[i];
      let j = i - 1;
      while (j >= 0 && compareFn(result[j], current) > 0) {
        result[j + 1] = result[j];
        j--;
      }
      result[j + 1] = current;
    }
    return result;
  },

  /**
   * Bubble Sort — O(n²), kept as a demonstration of a third algorithm.
   * Could be used for small arrays (e.g., question ordering).
   * @param {Array} arr
   * @param {Function} compareFn
   * @returns {Array} new sorted array
   */
  bubbleSort(arr, compareFn) {
    const result = [...arr];
    const n = result.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (compareFn(result[j], result[j + 1]) > 0) {
          [result[j], result[j + 1]] = [result[j + 1], result[j]];
          swapped = true;
        }
      }
      if (!swapped) break; // early exit on sorted data
    }
    return result;
  }
};
