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
