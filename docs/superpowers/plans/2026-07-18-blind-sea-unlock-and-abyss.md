# Blind Sea Unlock Fix + The Abyss (Journey 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "complete The First Sea" gate on The Blind Sea, and build out The Abyss (currently a disabled "Coming soon" placeholder tab) into a real third journey: 20 top-tech-company islands × 15 real LeetCode problems each, unlocked for everyone with no sequential gating, reusing the existing timed-attempt/star mechanic.

**Architecture:** No new subsystems. This journey slots into the existing generic journey/island/problem model (`src/lib/types.ts`, `src/lib/unlocks.ts`, `src/data/curriculum.ts`) by extending `JourneyId` from `1 | 2` to `1 | 2 | 3` and adding a third data file (`public/data/journey3.json`) alongside `journey1.json`/`journey2.json`. Verified during planning that `ProblemRow`/`BossCard`/`gameStore.ts` gate all timed-attempt/star/pattern-reveal behavior on `problem.time_limit_seconds !== undefined`, not on journey id — so journey 3 gets stars/timers for free with zero changes to those files.

**Tech Stack:** React + TypeScript + Zustand + Vite + Vitest. Data is static JSON fetched at runtime (`src/data/curriculum.ts`). No backend framework changes; Supabase schema already stores `journey_id` as an unconstrained `smallint`.

## Global Constraints

- Golden rule 1 (`CLAUDE.md`): all curriculum content lives in `public/data/*.json` — never hardcode problems/islands in components. This plan follows that.
- Golden rule 3: free tier only — no new services, no paid APIs. This plan adds zero new dependencies.
- Golden rule 4: guest mode must keep working with no Supabase env vars. Nothing in this plan touches the guest/local-store path differently than journeys 1/2 already do.
- Golden rule 5: sync merge must stay idempotent and commutative; `src/test/merge.test.ts` must keep passing unmodified logic-wise (journey 3 introduces new `(journeyId, slug)` pairs into the same generic merge, not new merge code).
- Island naming convention (`.claude/skills/pirate-lore/SKILL.md`): islands are always `"<Concept> Island"`. Abyss islands are `"<Company> Island"` (e.g. "Google Island") — using real company names here is factual/informational labeling of problem sets, not fictional-IP infringement, so it does not violate the "no copyrighted IP" world-bible rule (that rule targets original pirate-world fiction, e.g. no franchise characters).
- Company-tagged problem data is a **best-effort curated list from public knowledge**, not a verified real-time "asked by company" frequency ranking (that data is LeetCode's proprietary/paywalled company-tag feature, inaccessible to this project). This is a build note, never player-facing copy.
- Run `npx vitest run` and `npm run typecheck` before every commit in this plan; do not commit a red test suite or a type error.

---

### Task 1: Unlock The Blind Sea for everyone

**Files:**
- Modify: `src/lib/unlocks.ts:49-52`
- Modify: `src/screens/MapScreen.tsx:97-119`
- Modify: `src/test/unlocks.test.ts:48-51`

**Interfaces:**
- Consumes: nothing new.
- Produces: `journey2Unlocked(j1: Journey, state: ProgressState): boolean` — same signature, now always returns `true`. Downstream callers (`MapScreen.tsx`) unchanged in signature use.

- [ ] **Step 1: Update the failing test first**

Open `src/test/unlocks.test.ts`. Find this block (lines 48-51):

```ts
describe('journey 2 gating', () => {
  it('unlocks only after journey 1 is 100% complete', () => {
    expect(journey2Unlocked(j1, progress())).toBe(false)
    expect(journey2Unlocked(j1, solveAll(j1))).toBe(true)
  })
```

Replace it with:

```ts
describe('journey 2 gating', () => {
  it('is always unlocked, regardless of journey 1 progress', () => {
    expect(journey2Unlocked(j1, progress())).toBe(true)
    expect(journey2Unlocked(j1, solveAll(j1))).toBe(true)
  })
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/test/unlocks.test.ts -t "journey 2 gating"`
Expected: FAIL — `journey2Unlocked(j1, progress())` currently returns `false`, test now expects `true`.

- [ ] **Step 3: Remove the completion gate**

Open `src/lib/unlocks.ts`. Replace this function (lines 49-52):

```ts
/** The Blind Sea stays locked until The First Sea is 100% complete. */
export function journey2Unlocked(j1: Journey, state: ProgressState): boolean {
  return journeyComplete(j1, state)
}
```

with:

```ts
/** The Blind Sea has no completion gate — available from the start, same as The First Sea. */
export function journey2Unlocked(_j1: Journey, _state: ProgressState): boolean {
  return true
}
```

(Keep the `_j1`/`_state` parameters, unused-but-named, so the call site in `MapScreen.tsx` doesn't need to change and the function's intent stays documented in code. `journeyComplete` itself is untouched — it's still used by `shipTier`/`completedIslands` elsewhere.)

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run src/test/unlocks.test.ts`
Expected: PASS (all cases in the file, not just journey 2 gating).

- [ ] **Step 5: Remove the lock UI on the Blind Sea tab**

Open `src/screens/MapScreen.tsx`. Find the Blind Sea tab button (lines 97-119):

```tsx
          <button
            role="tab"
            aria-selected={activeTab === 2}
            disabled={!j2Unlocked}
            title={j2Unlocked ? undefined : 'Complete The First Sea to unlock'}
            onClick={() => j2Unlocked && setTab('2')}
            className={`relative rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === 2
                ? 'text-white'
                : j2Unlocked
                  ? 'border border-sea-300 dark:border-sea-700'
                  : 'cursor-not-allowed border border-sea-200 opacity-50 dark:border-sea-800'
            }`}
          >
            {activeTab === 2 && (
              <motion.span
                layoutId="journey-tab-pill"
                className="absolute inset-0 rounded-full bg-sea-600"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">The Blind Sea {!j2Unlocked && '🔒'}</span>
          </button>
```

Replace with:

```tsx
          <button
            role="tab"
            aria-selected={activeTab === 2}
            onClick={() => setTab('2')}
            className={`relative rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === 2 ? 'text-white' : 'border border-sea-300 dark:border-sea-700'
            }`}
          >
            {activeTab === 2 && (
              <motion.span
                layoutId="journey-tab-pill"
                className="absolute inset-0 rounded-full bg-sea-600"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">The Blind Sea</span>
          </button>
```

This is a pure styling/JSX simplification — `journey2Unlocked` now always returns `true` so the branchy disabled/locked styling is dead code. (`j2Unlocked` is still read at the top of the component; it stays, just always `true` now — leave `const j2Unlocked = journey2Unlocked(j1, local)` as-is, it's harmless and keeps the diff minimal. Task 3 replaces this whole component region again when Abyss is wired in, so don't over-clean here.)

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS, no regressions.

- [ ] **Step 7: Commit**

```bash
git add src/lib/unlocks.ts src/screens/MapScreen.tsx src/test/unlocks.test.ts
git commit -m "Remove completion gate on The Blind Sea"
```

---

### Task 2: Generate The Abyss content (public/data/journey3.json)

**Files:**
- Create: `scripts/gen-abyss-data.mjs`
- Create (generated, do not hand-edit): `public/data/journey3.json`

**Interfaces:**
- Produces: `public/data/journey3.json` matching the `Journey` shape used by `journey1.json`/`journey2.json` — `{ id: 3, name: 'The Abyss', islands: Island[20], problems: Problem[300] }`, every problem has `pattern`, `time_limit_seconds` (easy 900 / medium 1800 / hard 2700), `xp` = 100/250/500 ×(2 if boss), `is_boss` true only on the last (15th) problem of each island, which is always `difficulty: 'hard'`.
- Consumed by: Task 3's `curriculum.test.ts` additions, and by `src/data/curriculum.ts` at runtime once wired in Task 3.

This script was already written and validated during planning (ran clean: 20 islands, 300 problems, all sanity checks — uniqueness, per-island counts, boss-last, boss-is-hard — passed). Create it exactly as follows, then run it.

- [ ] **Step 1: Create `scripts/gen-abyss-data.mjs`**

```js
#!/usr/bin/env node
// Generates public/data/journey3.json (The Abyss) from curated pools of real,
// distinct LeetCode problems. Best-effort curation from public knowledge of
// commonly-cited company interview questions — not a verified real-time
// "asked by company" frequency ranking (that data is LeetCode's proprietary
// company-tag feature). See docs/superpowers/specs/2026-07-18-blind-sea-unlock-and-abyss-design.md.
import { writeFileSync } from 'node:fs'

const XP = { easy: 100, medium: 250, hard: 500 }
const LIMIT = { easy: 900, medium: 1800, hard: 2700 }

const COMPANIES = [
  'Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Netflix', 'Uber', 'LinkedIn',
  'Bloomberg', 'Adobe', 'Salesforce', 'Oracle', 'ByteDance', 'Airbnb', 'Goldman Sachs',
  'DoorDash', 'X', 'Pinterest', 'Nvidia', 'Walmart',
]

// [slug, title, pattern]
const EASY = [
  ['two-sum', 'Two Sum', 'hash map'],
  ['valid-parentheses', 'Valid Parentheses', 'stack'],
  ['merge-two-sorted-lists', 'Merge Two Sorted Lists', 'linked list'],
  ['best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'greedy'],
  ['valid-palindrome', 'Valid Palindrome', 'two pointers'],
  ['invert-binary-tree', 'Invert Binary Tree', 'tree'],
  ['valid-anagram', 'Valid Anagram', 'hash map'],
  ['binary-search', 'Binary Search', 'binary search'],
  ['flood-fill', 'Flood Fill', 'graph'],
  ['climbing-stairs', 'Climbing Stairs', 'dp'],
  ['reverse-linked-list', 'Reverse Linked List', 'linked list'],
  ['majority-element', 'Majority Element', 'array'],
  ['contains-duplicate', 'Contains Duplicate', 'hash map'],
  ['missing-number', 'Missing Number', 'bit manipulation'],
  ['move-zeroes', 'Move Zeroes', 'two pointers'],
  ['single-number', 'Single Number', 'bit manipulation'],
  ['intersection-of-two-arrays', 'Intersection of Two Arrays', 'hash map'],
  ['happy-number', 'Happy Number', 'math'],
  ['plus-one', 'Plus One', 'array'],
  ['sqrtx', 'Sqrt(x)', 'binary search'],
  ['excel-sheet-column-title', 'Excel Sheet Column Title', 'math'],
  ['power-of-two', 'Power of Two', 'bit manipulation'],
  ['add-digits', 'Add Digits', 'math'],
  ['ugly-number', 'Ugly Number', 'math'],
  ['first-bad-version', 'First Bad Version', 'binary search'],
  ['counting-bits', 'Counting Bits', 'bit manipulation'],
  ['reverse-string', 'Reverse String', 'two pointers'],
  ['reverse-vowels-of-a-string', 'Reverse Vowels of a String', 'two pointers'],
  ['roman-to-integer', 'Roman to Integer', 'hash map'],
  ['palindrome-number', 'Palindrome Number', 'math'],
  ['remove-duplicates-from-sorted-array', 'Remove Duplicates from Sorted Array', 'two pointers'],
  ['remove-element', 'Remove Element', 'two pointers'],
  ['search-insert-position', 'Search Insert Position', 'binary search'],
  ['length-of-last-word', 'Length of Last Word', 'string'],
  ['merge-sorted-array', 'Merge Sorted Array', 'two pointers'],
  ['same-tree', 'Same Tree', 'tree'],
  ['symmetric-tree', 'Symmetric Tree', 'tree'],
  ['path-sum', 'Path Sum', 'tree'],
  ['pascals-triangle', "Pascal's Triangle", 'dp'],
  ['pascals-triangle-ii', "Pascal's Triangle II", 'dp'],
  ['best-time-to-buy-and-sell-stock-ii', 'Best Time to Buy and Sell Stock II', 'greedy'],
  ['linked-list-cycle', 'Linked List Cycle', 'linked list'],
  ['min-stack', 'Min Stack', 'stack'],
  ['intersection-of-two-linked-lists', 'Intersection of Two Linked Lists', 'linked list'],
  ['two-sum-ii-input-array-is-sorted', 'Two Sum II - Input Array Is Sorted', 'two pointers'],
  ['factorial-trailing-zeroes', 'Factorial Trailing Zeroes', 'math'],
  ['house-robber', 'House Robber', 'dp'],
  ['number-of-1-bits', 'Number of 1 Bits', 'bit manipulation'],
  ['isomorphic-strings', 'Isomorphic Strings', 'hash map'],
  ['remove-linked-list-elements', 'Remove Linked List Elements', 'linked list'],
  ['count-primes', 'Count Primes', 'math'],
  ['reverse-bits', 'Reverse Bits', 'bit manipulation'],
  ['power-of-three', 'Power of Three', 'math'],
  ['valid-perfect-square', 'Valid Perfect Square', 'binary search'],
  ['guess-number-higher-or-lower', 'Guess Number Higher or Lower', 'binary search'],
  ['ransom-note', 'Ransom Note', 'hash map'],
  ['first-unique-character-in-a-string', 'First Unique Character in a String', 'hash map'],
  ['fizz-buzz', 'Fizz Buzz', 'math'],
  ['third-maximum-number', 'Third Maximum Number', 'array'],
  ['assign-cookies', 'Assign Cookies', 'greedy'],
  ['repeated-substring-pattern', 'Repeated Substring Pattern', 'string'],
  ['diameter-of-binary-tree', 'Diameter of Binary Tree', 'tree'],
  ['merge-two-binary-trees', 'Merge Two Binary Trees', 'tree'],
  ['two-sum-iv-input-is-a-bst', 'Two Sum IV - Input is a BST', 'tree'],
  ['convert-sorted-array-to-binary-search-tree', 'Convert Sorted Array to Binary Search Tree', 'tree'],
  ['minimum-absolute-difference-in-bst', 'Minimum Absolute Difference in BST', 'tree'],
  ['binary-tree-tilt', 'Binary Tree Tilt', 'tree'],
  ['base-7', 'Base 7', 'math'],
  ['relative-ranks', 'Relative Ranks', 'sorting'],
  ['perfect-number', 'Perfect Number', 'math'],
  ['construct-string-from-binary-tree', 'Construct String from Binary Tree', 'tree'],
  ['next-greater-element-i', 'Next Greater Element I', 'stack'],
  ['keyboard-row', 'Keyboard Row', 'string'],
  ['detect-capital', 'Detect Capital', 'string'],
  ['longest-uncommon-subsequence-i', 'Longest Uncommon Subsequence I', 'string'],
  ['binary-number-with-alternating-bits', 'Binary Number with Alternating Bits', 'bit manipulation'],
  ['self-dividing-numbers', 'Self Dividing Numbers', 'math'],
  ['array-partition', 'Array Partition', 'greedy'],
  ['reshape-the-matrix', 'Reshape the Matrix', 'array'],
  ['maximum-average-subarray-i', 'Maximum Average Subarray I', 'sliding window'],
  ['teemo-attacking', 'Teemo Attacking', 'array'],
  ['can-place-flowers', 'Can Place Flowers', 'greedy'],
  ['minimum-distance-between-bst-nodes', 'Minimum Distance Between BST Nodes', 'tree'],
  ['binary-tree-paths', 'Binary Tree Paths', 'tree'],
  ['find-the-difference', 'Find the Difference', 'hash map'],
  ['sum-of-left-leaves', 'Sum of Left Leaves', 'tree'],
  ['convert-a-number-to-hexadecimal', 'Convert a Number to Hexadecimal', 'bit manipulation'],
  ['license-key-formatting', 'License Key Formatting', 'string'],
  ['max-consecutive-ones', 'Max Consecutive Ones', 'array'],
  ['degree-of-an-array', 'Degree of an Array', 'hash map'],
  ['range-sum-query-immutable', 'Range Sum Query - Immutable', 'array'],
  ['island-perimeter', 'Island Perimeter', 'array'],
  ['number-complement', 'Number Complement', 'bit manipulation'],
  ['k-diff-pairs-in-an-array', 'K-diff Pairs in an Array', 'hash map'],
  ['arranging-coins', 'Arranging Coins', 'binary search'],
  ['largest-triangle-area', 'Largest Triangle Area', 'math'],
  ['valid-mountain-array', 'Valid Mountain Array', 'array'],
  ['uncommon-words-from-two-sentences', 'Uncommon Words from Two Sentences', 'hash map'],
  ['goat-latin', 'Goat Latin', 'string'],
  ['jewels-and-stones', 'Jewels and Stones', 'hash map'],
  ['di-string-match', 'DI String Match', 'greedy'],
]

const MEDIUM = [
  ['add-two-numbers', 'Add Two Numbers', 'linked list'],
  ['longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'sliding window'],
  ['container-with-most-water', 'Container With Most Water', 'two pointers'],
  ['3sum', '3Sum', 'two pointers'],
  ['letter-combinations-of-a-phone-number', 'Letter Combinations of a Phone Number', 'backtracking'],
  ['remove-nth-node-from-end-of-list', 'Remove Nth Node From End of List', 'linked list'],
  ['generate-parentheses', 'Generate Parentheses', 'backtracking'],
  ['search-in-rotated-sorted-array', 'Search in Rotated Sorted Array', 'binary search'],
  ['combination-sum', 'Combination Sum', 'backtracking'],
  ['permutations', 'Permutations', 'backtracking'],
  ['rotate-image', 'Rotate Image', 'array'],
  ['group-anagrams', 'Group Anagrams', 'hash map'],
  ['spiral-matrix', 'Spiral Matrix', 'array'],
  ['jump-game', 'Jump Game', 'greedy'],
  ['merge-intervals', 'Merge Intervals', 'intervals'],
  ['unique-paths', 'Unique Paths', 'dp'],
  ['minimum-path-sum', 'Minimum Path Sum', 'dp'],
  ['set-matrix-zeroes', 'Set Matrix Zeroes', 'array'],
  ['subsets', 'Subsets', 'backtracking'],
  ['word-search', 'Word Search', 'backtracking'],
  ['decode-ways', 'Decode Ways', 'dp'],
  ['validate-binary-search-tree', 'Validate Binary Search Tree', 'tree'],
  ['binary-tree-level-order-traversal', 'Binary Tree Level Order Traversal', 'tree'],
  ['construct-binary-tree-from-preorder-and-inorder-traversal', 'Construct Binary Tree from Preorder and Inorder Traversal', 'tree'],
  ['flatten-binary-tree-to-linked-list', 'Flatten Binary Tree to Linked List', 'tree'],
  ['best-time-to-buy-and-sell-stock-with-cooldown', 'Best Time to Buy and Sell Stock with Cooldown', 'dp'],
  ['gas-station', 'Gas Station', 'greedy'],
  ['candy', 'Candy', 'greedy'],
  ['single-number-ii', 'Single Number II', 'bit manipulation'],
  ['copy-list-with-random-pointer', 'Copy List with Random Pointer', 'linked list'],
  ['word-break', 'Word Break', 'dp'],
  ['linked-list-cycle-ii', 'Linked List Cycle II', 'linked list'],
  ['lru-cache', 'LRU Cache', 'design'],
  ['sort-list', 'Sort List', 'linked list'],
  ['maximum-product-subarray', 'Maximum Product Subarray', 'dp'],
  ['find-minimum-in-rotated-sorted-array', 'Find Minimum in Rotated Sorted Array', 'binary search'],
  ['majority-element-ii', 'Majority Element II', 'array'],
  ['excel-sheet-column-number', 'Excel Sheet Column Number', 'math'],
  ['reverse-words-in-a-string', 'Reverse Words in a String', 'string'],
  ['compare-version-numbers', 'Compare Version Numbers', 'string'],
  ['fraction-to-recurring-decimal', 'Fraction to Recurring Decimal', 'hash map'],
  ['largest-number', 'Largest Number', 'sorting'],
  ['repeated-dna-sequences', 'Repeated DNA Sequences', 'hash map'],
  ['house-robber-ii', 'House Robber II', 'dp'],
  ['kth-largest-element-in-an-array', 'Kth Largest Element in an Array', 'heap'],
  ['combination-sum-iii', 'Combination Sum III', 'backtracking'],
  ['contains-duplicate-iii', 'Contains Duplicate III', 'sliding window'],
  ['basic-calculator-ii', 'Basic Calculator II', 'stack'],
  ['summary-ranges', 'Summary Ranges', 'array'],
  ['kth-smallest-element-in-a-bst', 'Kth Smallest Element in a BST', 'tree'],
  ['implement-queue-using-stacks', 'Implement Queue using Stacks', 'stack'],
  ['lowest-common-ancestor-of-a-binary-search-tree', 'Lowest Common Ancestor of a Binary Search Tree', 'tree'],
  ['product-of-array-except-self', 'Product of Array Except Self', 'array'],
  ['search-a-2d-matrix-ii', 'Search a 2D Matrix II', 'binary search'],
  ['different-ways-to-add-parentheses', 'Different Ways to Add Parentheses', 'dp'],
  ['shortest-word-distance', 'Shortest Word Distance', 'array'],
  ['meeting-rooms-ii', 'Meeting Rooms II', 'intervals'],
  ['paint-house', 'Paint House', 'dp'],
  ['graph-valid-tree', 'Graph Valid Tree', 'graph'],
  ['walls-and-gates', 'Walls and Gates', 'graph'],
  ['flatten-nested-list-iterator', 'Flatten Nested List Iterator', 'design'],
  ['top-k-frequent-elements', 'Top K Frequent Elements', 'heap'],
  ['intersection-of-two-arrays-ii', 'Intersection of Two Arrays II', 'hash map'],
  ['closest-binary-search-tree-value', 'Closest Binary Search Tree Value', 'tree'],
  ['longest-increasing-subsequence', 'Longest Increasing Subsequence', 'dp'],
  ['minimum-height-trees', 'Minimum Height Trees', 'graph'],
  ['sparse-matrix-multiplication', 'Sparse Matrix Multiplication', 'array'],
  ['increasing-triplet-subsequence', 'Increasing Triplet Subsequence', 'greedy'],
  ['integer-break', 'Integer Break', 'dp'],
  ['design-snake-game', 'Design Snake Game', 'design'],
  ['design-hit-counter', 'Design Hit Counter', 'design'],
  ['design-phone-directory', 'Design Phone Directory', 'design'],
  ['wiggle-sort-ii', 'Wiggle Sort II', 'sorting'],
  ['nested-list-weight-sum', 'Nested List Weight Sum', 'graph'],
  ['find-the-duplicate-number', 'Find the Duplicate Number', 'binary search'],
  ['course-schedule', 'Course Schedule', 'graph'],
  ['course-schedule-ii', 'Course Schedule II', 'graph'],
  ['implement-trie-prefix-tree', 'Implement Trie (Prefix Tree)', 'trie'],
  ['minimum-size-subarray-sum', 'Minimum Size Subarray Sum', 'sliding window'],
  ['add-and-search-word-data-structure-design', 'Design Add and Search Words Data Structure', 'trie'],
  ['number-of-islands', 'Number of Islands', 'graph'],
  ['bitwise-and-of-numbers-range', 'Bitwise AND of Numbers Range', 'bit manipulation'],
  ['binary-tree-right-side-view', 'Binary Tree Right Side View', 'tree'],
  ['valid-sudoku', 'Valid Sudoku', 'array'],
  ['combination-sum-ii', 'Combination Sum II', 'backtracking'],
  ['permutations-ii', 'Permutations II', 'backtracking'],
  ['subsets-ii', 'Subsets II', 'backtracking'],
  ['surrounded-regions', 'Surrounded Regions', 'graph'],
  ['palindrome-partitioning', 'Palindrome Partitioning', 'backtracking'],
  ['gray-code', 'Gray Code', 'backtracking'],
  ['path-sum-ii', 'Path Sum II', 'tree'],
  ['sum-root-to-leaf-numbers', 'Sum Root to Leaf Numbers', 'tree'],
  ['clone-graph', 'Clone Graph', 'graph'],
  ['evaluate-reverse-polish-notation', 'Evaluate Reverse Polish Notation', 'stack'],
  ['reverse-words-in-a-string-ii', 'Reverse Words in a String II', 'string'],
  ['find-peak-element', 'Find Peak Element', 'binary search'],
  ['binary-search-tree-iterator', 'Binary Search Tree Iterator', 'tree'],
  ['odd-even-linked-list', 'Odd Even Linked List', 'linked list'],
  ['longest-palindromic-substring', 'Longest Palindromic Substring', 'dp'],
  ['zigzag-conversion', 'Zigzag Conversion', 'string'],
  ['string-to-integer-atoi', 'String to Integer (atoi)', 'string'],
  ['integer-to-roman', 'Integer to Roman', 'greedy'],
  ['3sum-closest', '3Sum Closest', 'two pointers'],
  ['next-permutation', 'Next Permutation', 'array'],
  ['multiply-strings', 'Multiply Strings', 'math'],
  ['jump-game-ii', 'Jump Game II', 'greedy'],
  ['rotate-list', 'Rotate List', 'linked list'],
  ['unique-paths-ii', 'Unique Paths II', 'dp'],
  ['simplify-path', 'Simplify Path', 'stack'],
  ['partition-list', 'Partition List', 'linked list'],
  ['binary-tree-zigzag-level-order-traversal', 'Binary Tree Zigzag Level Order Traversal', 'tree'],
  ['populating-next-right-pointers-in-each-node', 'Populating Next Right Pointers in Each Node', 'tree'],
  ['populating-next-right-pointers-in-each-node-ii', 'Populating Next Right Pointers in Each Node II', 'tree'],
  ['triangle', 'Triangle', 'dp'],
  ['sort-colors', 'Sort Colors', 'two pointers'],
  ['combinations', 'Combinations', 'backtracking'],
  ['spiral-matrix-ii', 'Spiral Matrix II', 'array'],
  ['insert-interval', 'Insert Interval', 'intervals'],
  ['h-index', 'H-Index', 'sorting'],
  ['coin-change', 'Coin Change', 'dp'],
  ['kth-smallest-element-in-a-sorted-matrix', 'Kth Smallest Element in a Sorted Matrix', 'heap'],
  ['task-scheduler', 'Task Scheduler', 'greedy'],
  ['find-all-anagrams-in-a-string', 'Find All Anagrams in a String', 'sliding window'],
  ['daily-temperatures', 'Daily Temperatures', 'stack'],
  ['letter-case-permutation', 'Letter Case Permutation', 'backtracking'],
  ['accounts-merge', 'Accounts Merge', 'graph'],
  ['pacific-atlantic-water-flow', 'Pacific Atlantic Water Flow', 'graph'],
  ['rotting-oranges', 'Rotting Oranges', 'graph'],
  ['number-of-provinces', 'Number of Provinces', 'graph'],
  ['redundant-connection', 'Redundant Connection', 'graph'],
  ['subarray-sum-equals-k', 'Subarray Sum Equals K', 'hash map'],
  ['partition-equal-subset-sum', 'Partition Equal Subset Sum', 'dp'],
  ['unique-binary-search-trees', 'Unique Binary Search Trees', 'dp'],
  ['unique-binary-search-trees-ii', 'Unique Binary Search Trees II', 'backtracking'],
  ['sort-characters-by-frequency', 'Sort Characters By Frequency', 'heap'],
  ['find-all-duplicates-in-an-array', 'Find All Duplicates in an Array', 'array'],
  ['random-pick-with-weight', 'Random Pick with Weight', 'binary search'],
  ['validate-ip-address', 'Validate IP Address', 'string'],
  ['convert-bst-to-greater-tree', 'Convert BST to Greater Tree', 'tree'],
  ['delete-node-in-a-bst', 'Delete Node in a BST', 'tree'],
]

const HARD = [
  ['median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'binary search'],
  ['trapping-rain-water', 'Trapping Rain Water', 'two pointers'],
  ['merge-k-sorted-lists', 'Merge k Sorted Lists', 'heap'],
  ['reverse-nodes-in-k-group', 'Reverse Nodes in k-Group', 'linked list'],
  ['wildcard-matching', 'Wildcard Matching', 'dp'],
  ['first-missing-positive', 'First Missing Positive', 'array'],
  ['n-queens', 'N-Queens', 'backtracking'],
  ['largest-rectangle-in-histogram', 'Largest Rectangle in Histogram', 'stack'],
  ['maximal-rectangle', 'Maximal Rectangle', 'dp'],
  ['binary-tree-maximum-path-sum', 'Binary Tree Maximum Path Sum', 'tree'],
  ['word-ladder', 'Word Ladder', 'graph'],
  ['serialize-and-deserialize-binary-tree', 'Serialize and Deserialize Binary Tree', 'tree'],
  ['alien-dictionary', 'Alien Dictionary', 'graph'],
  ['word-ladder-ii', 'Word Ladder II', 'graph'],
  ['burst-balloons', 'Burst Balloons', 'dp'],
  ['remove-invalid-parentheses', 'Remove Invalid Parentheses', 'backtracking'],
  ['expression-add-operators', 'Expression Add Operators', 'backtracking'],
  ['reconstruct-itinerary', 'Reconstruct Itinerary', 'graph'],
  ['self-crossing', 'Self Crossing', 'math'],
  ['palindrome-pairs', 'Palindrome Pairs', 'trie'],
  ['sliding-window-maximum', 'Sliding Window Maximum', 'sliding window'],
  ['basic-calculator', 'Basic Calculator', 'stack'],
  ['the-skyline-problem', 'The Skyline Problem', 'heap'],
  ['count-of-smaller-numbers-after-self', 'Count of Smaller Numbers After Self', 'binary search'],
  ['maximum-gap', 'Maximum Gap', 'sorting'],
  ['dungeon-game', 'Dungeon Game', 'dp'],
  ['n-queens-ii', 'N-Queens II', 'backtracking'],
  ['text-justification', 'Text Justification', 'string'],
  ['scramble-string', 'Scramble String', 'dp'],
  ['interleaving-string', 'Interleaving String', 'dp'],
  ['recover-binary-search-tree', 'Recover Binary Search Tree', 'tree'],
  ['minimum-window-substring', 'Minimum Window Substring', 'sliding window'],
  ['russian-doll-envelopes', 'Russian Doll Envelopes', 'dp'],
  ['max-points-on-a-line', 'Max Points on a Line', 'math'],
  ['best-time-to-buy-and-sell-stock-iii', 'Best Time to Buy and Sell Stock III', 'dp'],
  ['best-time-to-buy-and-sell-stock-iv', 'Best Time to Buy and Sell Stock IV', 'dp'],
  ['distinct-subsequences', 'Distinct Subsequences', 'dp'],
  ['edit-distance', 'Edit Distance', 'dp'],
  ['regular-expression-matching', 'Regular Expression Matching', 'dp'],
  ['longest-valid-parentheses', 'Longest Valid Parentheses', 'stack'],
  ['shortest-palindrome', 'Shortest Palindrome', 'string'],
  ['super-ugly-number', 'Super Ugly Number', 'heap'],
  ['patching-array', 'Patching Array', 'greedy'],
  ['verify-preorder-serialization-of-a-binary-tree', 'Verify Preorder Serialization of a Binary Tree', 'stack'],
  ['valid-number', 'Valid Number', 'string'],
  ['find-median-from-data-stream', 'Find Median from Data Stream', 'heap'],
  ['sliding-puzzle', 'Sliding Puzzle', 'graph'],
  ['cherry-pickup', 'Cherry Pickup', 'dp'],
  ['minimum-window-subsequence', 'Minimum Window Subsequence', 'sliding window'],
  ['longest-consecutive-sequence', 'Longest Consecutive Sequence', 'hash map'],
  ['word-break-ii', 'Word Break II', 'dp'],
  ['longest-increasing-path-in-a-matrix', 'Longest Increasing Path in a Matrix', 'graph'],
  ['bus-routes', 'Bus Routes', 'graph'],
  ['smallest-range-covering-elements-from-k-lists', 'Smallest Range Covering Elements from K Lists', 'heap'],
  ['k-th-smallest-in-lexicographical-order', 'K-th Smallest in Lexicographical Order', 'trie'],
  ['count-of-range-sum', 'Count of Range Sum', 'binary search'],
  ['maximum-frequency-stack', 'Maximum Frequency Stack', 'stack'],
  ['sliding-window-median', 'Sliding Window Median', 'sliding window'],
  ['race-car', 'Race Car', 'dp'],
  ['cut-off-trees-for-golf-event', 'Cut Off Trees for Golf Event', 'graph'],
]

function assertUnique(name, pool) {
  const seen = new Set()
  for (const [slug] of pool) {
    if (seen.has(slug)) throw new Error(`duplicate slug in ${name}: ${slug}`)
    seen.add(slug)
  }
}
assertUnique('EASY', EASY)
assertUnique('MEDIUM', MEDIUM)
assertUnique('HARD', HARD)

const EASY_PER = 5
const MEDIUM_PER = 7
const HARD_PER = 3 // includes the boss

if (EASY.length < COMPANIES.length * EASY_PER) throw new Error(`need ${COMPANIES.length * EASY_PER} easy, have ${EASY.length}`)
if (MEDIUM.length < COMPANIES.length * MEDIUM_PER) throw new Error(`need ${COMPANIES.length * MEDIUM_PER} medium, have ${MEDIUM.length}`)
if (HARD.length < COMPANIES.length * HARD_PER) throw new Error(`need ${COMPANIES.length * HARD_PER} hard, have ${HARD.length}`)

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const islands = []
const problems = []
const allSlugs = new Set()

COMPANIES.forEach((company, idx) => {
  const islandId = slugify(company)
  islands.push({ id: islandId, name: `${company} Island`, order: idx + 1 })

  const easyChunk = EASY.slice(idx * EASY_PER, (idx + 1) * EASY_PER)
  const mediumChunk = MEDIUM.slice(idx * MEDIUM_PER, (idx + 1) * MEDIUM_PER)
  const hardChunk = HARD.slice(idx * HARD_PER, (idx + 1) * HARD_PER)

  const chunk = [
    ...easyChunk.map(([slug, title, pattern]) => ({ slug, title, pattern, difficulty: 'easy' })),
    ...mediumChunk.map(([slug, title, pattern]) => ({ slug, title, pattern, difficulty: 'medium' })),
    ...hardChunk.map(([slug, title, pattern]) => ({ slug, title, pattern, difficulty: 'hard' })),
  ]

  chunk.forEach((p, k) => {
    const order = k + 1
    const isBoss = order === chunk.length
    if (allSlugs.has(p.slug)) throw new Error(`global duplicate slug: ${p.slug}`)
    allSlugs.add(p.slug)
    problems.push({
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      island_id: islandId,
      order,
      xp: XP[p.difficulty] * (isBoss ? 2 : 1),
      pattern: p.pattern,
      is_boss: isBoss,
      leetcode_url: `https://leetcode.com/problems/${p.slug}/`,
      time_limit_seconds: LIMIT[p.difficulty],
    })
  })
})

const journey3 = { id: 3, name: 'The Abyss', islands, problems }

// Sanity checks mirroring src/test/curriculum.test.ts invariants.
if (islands.length !== 20) throw new Error(`expected 20 islands, got ${islands.length}`)
if (problems.length !== 300) throw new Error(`expected 300 problems, got ${problems.length}`)
for (const island of islands) {
  const count = problems.filter((p) => p.island_id === island.id).length
  if (count !== 15) throw new Error(`${island.id} has ${count} problems, expected 15`)
  const bosses = problems.filter((p) => p.island_id === island.id && p.is_boss)
  if (bosses.length !== 1) throw new Error(`${island.id} has ${bosses.length} bosses, expected 1`)
  const last = problems.filter((p) => p.island_id === island.id).sort((a, b) => a.order - b.order).at(-1)
  if (!last.is_boss) throw new Error(`${island.id} boss is not last`)
  if (last.difficulty !== 'hard') throw new Error(`${island.id} boss is not hard difficulty`)
}
if (new Set(problems.map((p) => p.slug)).size !== 300) throw new Error('duplicate slugs across journey3')

writeFileSync(new URL('../public/data/journey3.json', import.meta.url), JSON.stringify(journey3, null, 2) + '\n')
console.log(`OK: wrote journey3.json — ${islands.length} islands, ${problems.length} problems.`)
```

- [ ] **Step 2: Run it**

Run: `node scripts/gen-abyss-data.mjs`
Expected: `OK: wrote journey3.json — 20 islands, 300 problems.` with exit code 0. If it throws (e.g. a duplicate-slug error), fix the offending pool entry and re-run — do not hand-edit the generated JSON.

- [ ] **Step 3: Spot-check the output**

Run: `node -e "const j=require('./public/data/journey3.json'); console.log(j.islands.length, j.problems.length, new Set(j.problems.map(p=>p.slug)).size)"`
Expected: `20 300 300`

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-abyss-data.mjs public/data/journey3.json
git commit -m "Add The Abyss content: 20 company islands, 300 problems"
```

---

### Task 3: Wire journey 3 into the app (types, unlocks, loader, screens)

**Files:**
- Modify: `src/lib/types.ts:23`
- Modify: `src/lib/unlocks.ts:37-42`
- Modify: `src/data/curriculum.ts:17-39`
- Modify: `src/screens/IslandScreen.tsx:22`
- Modify: `src/screens/MapScreen.tsx` (tab type, tab bar, view toggle, content render)
- Modify: `src/test/curriculum.test.ts` (add journey3 block)
- Modify: `src/test/unlocks.test.ts` (add journey3 always-unlocked case)

**Interfaces:**
- Consumes: `public/data/journey3.json` from Task 2.
- Produces: `JourneyId = 1 | 2 | 3`; `curriculum.journeys[3]` populated at runtime; `islandUnlocked(j, islandId, state)` returns `true` unconditionally for `j.id === 3`.

- [ ] **Step 1: Extend the `JourneyId` type**

Open `src/lib/types.ts`. Change line 23:

```ts
export type JourneyId = 1 | 2
```

to:

```ts
export type JourneyId = 1 | 2 | 3
```

- [ ] **Step 2: Write the failing unlock test**

Open `src/test/unlocks.test.ts`. Add this new `describe` block right after the existing `describe('journey 2 gating', ...)` block (which ends around line 60 after Task 1's edit — insert after its closing `})`):

```ts
describe('journey 3 (The Abyss) gating', () => {
  const j3 = makeJourney(3, [
    ['google', 3],
    ['amazon', 3],
  ])

  it('unlocks every island immediately, no sequential gating, no quiz', () => {
    const state = progress()
    expect(islandUnlocked(j3, 'google', state)).toBe(true)
    expect(islandUnlocked(j3, 'amazon', state)).toBe(true)
  })
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run src/test/unlocks.test.ts -t "journey 3"`
Expected: FAIL — `islandUnlocked(j3, 'amazon', state)` currently returns `false` (falls through to the journey-2-style "previous island must be complete" check, since `amazon` isn't the first island).

- [ ] **Step 4: Add the journey-3 branch to `islandUnlocked`**

Open `src/lib/unlocks.ts`. Replace this function (lines 37-42):

```ts
export function islandUnlocked(j: Journey, islandId: string, state: ProgressState): boolean {
  const prev = previousIsland(j, islandId)
  if (!prev) return true
  if (!islandComplete(j, prev.id, state)) return false
  return j.id === 1 ? quizPassed(prev.id, state) : true
}
```

with:

```ts
export function islandUnlocked(j: Journey, islandId: string, state: ProgressState): boolean {
  if (j.id === 3) return true
  const prev = previousIsland(j, islandId)
  if (!prev) return true
  if (!islandComplete(j, prev.id, state)) return false
  return j.id === 1 ? quizPassed(prev.id, state) : true
}
```

Also update the doc comment directly above it (currently describes only journeys 1 and 2):

```ts
/**
 * Journey 1: an island unlocks when the previous one is 100% solved AND its
 * pattern-gate quiz is passed (a synced quiz_pass event, so unlock state
 * resumes on any device). Journey 2 isles unlock sequentially by completion.
 * Journey 3 (The Abyss) has no gating at all — every company island is
 * unlocked immediately, since companies aren't a learning progression.
 */
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npx vitest run src/test/unlocks.test.ts`
Expected: PASS.

- [ ] **Step 6: Wire journey3.json into the curriculum loader**

Open `src/data/curriculum.ts`. Replace the whole file with:

```ts
import type { ItemsData, Journey, JourneyId, Problem, StoryData } from '../lib/types'

export interface Curriculum {
  journeys: Record<JourneyId, Journey>
  items: ItemsData
  story: StoryData
}

let cache: Promise<Curriculum> | null = null

async function fetchJson<T>(name: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`Failed to load ${name}.json: ${res.status}`)
  return res.json() as Promise<T>
}

export function loadCurriculum(): Promise<Curriculum> {
  cache ??= Promise.all([
    fetchJson<Journey>('journey1'),
    fetchJson<Journey>('journey2'),
    fetchJson<Journey>('journey3'),
    fetchJson<ItemsData>('items'),
    fetchJson<StoryData>('story'),
  ]).then(([j1, j2, j3, items, story]) => ({ journeys: { 1: j1, 2: j2, 3: j3 }, items, story }))
  return cache
}

/** Key for cross-journey problem lookup: `${journeyId}:${slug}`. */
export function problemKey(journeyId: JourneyId, slug: string): string {
  return `${journeyId}:${slug}`
}

/** Index problems of all three journeys by problemKey — the lookup XP derivation uses. */
export function indexProblems(c: Pick<Curriculum, 'journeys'>): Map<string, Problem> {
  const map = new Map<string, Problem>()
  for (const j of [c.journeys[1], c.journeys[2], c.journeys[3]]) {
    for (const p of j.problems) map.set(problemKey(j.id, p.slug), p)
  }
  return map
}

export function islandProblems(j: Journey, islandId: string): Problem[] {
  return j.problems.filter((p) => p.island_id === islandId).sort((a, b) => a.order - b.order)
}
```

- [ ] **Step 7: Fix the journey-id route param parsing bug**

Open `src/screens/IslandScreen.tsx`. This currently hardcodes only 1 or 2 — any `/island/3/:islandId` route would silently resolve to journey 1. Change line 22:

```ts
  const journeyId = (journeyIdParam === '2' ? 2 : 1) as JourneyId
```

to:

```ts
  const journeyId = (journeyIdParam === '3' ? 3 : journeyIdParam === '2' ? 2 : 1) as JourneyId
```

- [ ] **Step 8: Wire the Abyss tab into MapScreen**

Open `src/screens/MapScreen.tsx`. Make these four changes:

**8a.** Change line 11:

```ts
type Tab = 1 | 2 | 'abyss'
```

to:

```ts
type Tab = 1 | 2 | 3
```

**8b.** Around lines 49-55, replace:

```ts
  const j1 = curriculum.journeys[1]
  const j2 = curriculum.journeys[2]
  const j2Unlocked = journey2Unlocked(j1, local)
  const xp = totalXp(local, problems)
  const { level, current, needed } = xpToNextLevel(xp)
  const streak = computeStreak(local.events)
  const activeTab: Tab = tab === '2' ? 2 : tab === 'abyss' ? 'abyss' : 1
```

with:

```ts
  const j1 = curriculum.journeys[1]
  const j2 = curriculum.journeys[2]
  const j3 = curriculum.journeys[3]
  const j2Unlocked = journey2Unlocked(j1, local)
  const xp = totalXp(local, problems)
  const { level, current, needed } = xpToNextLevel(xp)
  const streak = computeStreak(local.events)
  const activeTab: Tab = tab === '2' ? 2 : tab === '3' ? 3 : 1
```

(`j2Unlocked` is now always `true` per Task 1 — kept for minimal-diff reasons, same as noted in Task 1.)

**8c.** Replace the Abyss tab button (the block that currently reads `title="Coming soon"` — originally lines 120-128):

```tsx
          <button
            role="tab"
            aria-selected={activeTab === 'abyss'}
            onClick={() => setTab('abyss')}
            className="relative cursor-not-allowed rounded-full border border-sea-200 px-4 py-2 text-sm font-medium opacity-50 dark:border-sea-800"
            title="Coming soon"
          >
            The Abyss
          </button>
```

with:

```tsx
          <button
            role="tab"
            aria-selected={activeTab === 3}
            onClick={() => setTab('3')}
            className={`relative rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === 3 ? 'text-white' : 'border border-sea-300 dark:border-sea-700'
            }`}
          >
            {activeTab === 3 && (
              <motion.span
                layoutId="journey-tab-pill"
                className="absolute inset-0 rounded-full bg-sea-600"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">The Abyss</span>
          </button>
```

**8d.** Replace the view-toggle conditional block through the end of the file (originally lines 131-180):

```tsx
        {activeTab !== 'abyss' && (
          <div className="relative flex gap-1 rounded-full border border-sea-300 p-1 text-xs dark:border-sea-700">
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`relative rounded-full px-3 py-1 ${view === 'map' ? 'text-white' : ''}`}
            >
              {view === 'map' && (
                <motion.span
                  layoutId="map-view-pill"
                  className="absolute inset-0 rounded-full bg-sea-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">Map</span>
            </button>
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`relative rounded-full px-3 py-1 ${view === 'list' ? 'text-white' : ''}`}
            >
              {view === 'list' && (
                <motion.span
                  layoutId="map-view-pill"
                  className="absolute inset-0 rounded-full bg-sea-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">List</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'abyss' ? (
        <p className="rounded-lg border border-sea-200 p-6 text-center opacity-70 dark:border-sea-800">
          The Abyss is uncharted. Coming soon.
        </p>
      ) : (
        <div>
          {view === 'map' ? (
            <SeaChart journey={activeTab === 1 ? j1 : j2} j1={j1} state={local} />
          ) : (
            <IslandList journey={activeTab === 1 ? j1 : j2} state={local} />
          )}
        </div>
      )}
    </div>
  )
}
```

with:

```tsx
        <div className="relative flex gap-1 rounded-full border border-sea-300 p-1 text-xs dark:border-sea-700">
          <button
            onClick={() => setView('map')}
            aria-pressed={view === 'map'}
            className={`relative rounded-full px-3 py-1 ${view === 'map' ? 'text-white' : ''}`}
          >
            {view === 'map' && (
              <motion.span
                layoutId="map-view-pill"
                className="absolute inset-0 rounded-full bg-sea-600"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">Map</span>
          </button>
          <button
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            className={`relative rounded-full px-3 py-1 ${view === 'list' ? 'text-white' : ''}`}
          >
            {view === 'list' && (
              <motion.span
                layoutId="map-view-pill"
                className="absolute inset-0 rounded-full bg-sea-600"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">List</span>
          </button>
        </div>
      </div>

      <div>
        {view === 'map' ? (
          <SeaChart journey={activeTab === 1 ? j1 : activeTab === 2 ? j2 : j3} j1={j1} state={local} />
        ) : (
          <IslandList journey={activeTab === 1 ? j1 : activeTab === 2 ? j2 : j3} state={local} />
        )}
      </div>
    </div>
  )
}
```

(This drops the `activeTab !== 'abyss'` wrapper around the view toggle — all three tabs now share it — and drops the `'abyss' ? <p>Coming soon</p> : ...` branch entirely in favor of always rendering the SeaChart/IslandList pair.)

- [ ] **Step 9: Write the failing curriculum data-invariant test**

Open `src/test/curriculum.test.ts`. Add `const j3 = read<Journey>('journey3')` next to the existing `j1`/`j2` reads (line 9 area):

```ts
const j1 = read<Journey>('journey1')
const j2 = read<Journey>('journey2')
const j3 = read<Journey>('journey3')
```

Add a `J3_SIZES` constant next to `J1_SIZES`/`J2_SIZES` (line 17 area):

```ts
const J3_SIZES = Array(20).fill(15)
```

Add a new `describe` block after the `journey2 — The Blind Sea` block (after its closing `})`, before `describe('items.json', ...)`):

```ts
describe('journey3 — The Abyss', () => {
  it('is journey 3 with 20 islands and 300 problems', () => {
    expect(j3.id).toBe(3)
    expect(j3.islands.length).toBe(20)
    expect(j3.problems.length).toBe(300)
  })
  validateJourney(j3, J3_SIZES)

  it('names islands after their company', () => {
    for (const island of j3.islands) expect(island.name).toMatch(/ Island$/)
  })

  it('has time limits by difficulty (900/1800/2700), same tiers as journey 2', () => {
    const LIMIT = { easy: 900, medium: 1800, hard: 2700 }
    for (const p of j3.problems) expect(p.time_limit_seconds).toBe(LIMIT[p.difficulty])
  })
})
```

Also update the `story.json` describe block (line 115-127) so it doesn't require journey-3 story entries — it currently only iterates `[...j1.islands, ...j2.islands]`, which is already correct and needs **no change** (Abyss intentionally has no story content, confirmed in Task 3 Step-6 review that `IslandScreen.tsx` handles missing `story` gracefully).

- [ ] **Step 10: Run it to confirm it fails, then passes**

Run: `npx vitest run src/test/curriculum.test.ts`
Expected first (before Task 2's `journey3.json` exists, or before Step 1 of this task extends `JourneyId`): FAIL with "Failed to load journey3.json" or a type error.
Since Task 2 already created `public/data/journey3.json` and this task's Step 1 already extended `JourneyId`, this should now PASS immediately. If it doesn't, fix the mismatch between `gen-abyss-data.mjs`'s output and these assertions before continuing — do not weaken the test.

- [ ] **Step 11: Regenerate the Supabase seed data**

Open `scripts/gen-seed.mjs`. Change line 15:

```js
const journeys = [loadJourney('journey1'), loadJourney('journey2')]
```

to:

```js
const journeys = [loadJourney('journey1'), loadJourney('journey2'), loadJourney('journey3')]
```

Run: `node scripts/gen-seed.mjs`
Expected: `Wrote supabase/seed.sql with 525 problem rows.` (150 + 75 + 300).

This regenerates `supabase/seed.sql` locally. **Manual follow-up required** (cannot be automated from this repo): paste the regenerated `supabase/seed.sql` into the Supabase SQL editor and run it — it's a safe upsert on `(journey_id, slug)`, per the existing `.claude/skills/curriculum/SKILL.md` "Adding data" instructions. Flag this to the user rather than attempting it yourself; it requires their Supabase project credentials/dashboard access.

- [ ] **Step 12: Run the full suite, typecheck, and build**

Run: `npx vitest run`
Expected: PASS, all files.

Run: `npm run typecheck`
Expected: no errors. (This is the step that will surface any remaining `1 | 2`-only assumption missed during planning — if it fails on a file not covered by this plan, investigate and fix that file's `JourneyId` usage before continuing; do not silence with `as any`.)

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 13: Manual smoke test**

Run: `npm run dev`, open the app, click "The Abyss" tab — confirm:
- Tab is enabled (no lock icon, no "Coming soon").
- Map/List view toggle works and shows 20 islands, all unlocked.
- Opening a company island (e.g. Google Island) shows 15 problems, a boss card at the bottom, "Start attempt" timers, and pattern-reveal-via-Oracle-Fruit behavior (same as a Blind Sea island).
- "The Blind Sea" tab is also enabled with no lock icon regardless of First Sea progress.

- [ ] **Step 14: Commit**

```bash
git add src/lib/types.ts src/lib/unlocks.ts src/data/curriculum.ts src/screens/IslandScreen.tsx \
  src/screens/MapScreen.tsx src/test/curriculum.test.ts src/test/unlocks.test.ts \
  scripts/gen-seed.mjs supabase/seed.sql
git commit -m "Wire The Abyss (journey 3) into unlocks, loader, and map/island screens"
```

---

## Post-plan follow-up (not part of this plan's tasks, flag to user)

- Re-run the regenerated `supabase/seed.sql` in the Supabase SQL editor (Task 3, Step 11) — requires dashboard access this plan doesn't have.
- Consider whether `README.md` or any player-facing "what's in the game" copy mentions journey count and needs a one-line update (not discovered during planning — grep for "Blind Sea" / "two seas" in root-level docs before calling the feature fully shipped).
