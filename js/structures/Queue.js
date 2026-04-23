/**
 * Queue — Linear Data Structure (FIFO)
 * Used by ExamManager to manage the exam submission processing pipeline.
 * Jobs are enqueued on submit and dequeued by the async processor.
 */
class Queue {
  #items = [];

  /** Add an item to the back of the queue. O(1) */
  enqueue(item) { this.#items.push(item); }

  /** Remove and return the front item. Returns null if empty. O(n) */
  dequeue() { return this.#items.length > 0 ? this.#items.shift() : null; }

  /** Peek at the front item without removing. Returns null if empty. */
  front() { return this.#items.length > 0 ? this.#items[0] : null; }

  /** Returns true if the queue has no items. */
  isEmpty() { return this.#items.length === 0; }

  /** Returns the number of queued items. */
  size() { return this.#items.length; }

  /** Returns a shallow copy of the underlying array. */
  toArray() { return [...this.#items]; }
}
