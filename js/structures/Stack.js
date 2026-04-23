/**
 * Stack — Linear Data Structure (LIFO)
 * Used by ExamAttempt to track answer selections and enable undo.
 */
class Stack {
  #items = [];

  /** Push an item onto the top of the stack. O(1) */
  push(item) { this.#items.push(item); }

  /** Remove and return the top item. Returns undefined if empty. O(1) */
  pop() { return this.#items.pop(); }

  /** Peek at the top item without removing it. O(1) */
  peek() { return this.#items[this.#items.length - 1]; }

  /** Returns true if the stack has no items. */
  isEmpty() { return this.#items.length === 0; }

  /** Returns the count of items in the stack. */
  size() { return this.#items.length; }

  /** Clears all items from the stack. */
  clear() { this.#items = []; }

  /** Returns a shallow copy of the underlying array (bottom to top). */
  toArray() { return [...this.#items]; }
}
