#!/usr/bin/env node
// Generates public/data/journey3.json (The Abyss) from curated pools of real,
// distinct LeetCode problems. Best-effort curation from public knowledge of
// commonly-cited company interview questions — not a verified real-time
// "asked by company" frequency ranking (that data is LeetCode's proprietary
// company-tag feature). See docs/superpowers/specs/2026-07-18-blind-sea-unlock-and-abyss-design.md
// (original 20-company design) and its "100 companies" addendum (the revision this
// script implements: 100 companies x 50 problems, `roles`/`recency` tags, and slugs
// unique per-island rather than journey-wide, since real interview problems are
// legitimately reused across companies).
import { readFileSync, writeFileSync } from 'node:fs'

const XP = { easy: 100, medium: 250, hard: 500 }
const LIMIT = { easy: 900, medium: 1800, hard: 2700 }
const EASY_N = 16, MEDIUM_N = 24, HARD_N = 20 // per company; last hard = boss

// [name, domain] — domain drives the illustrative extra `roles` tag (see DOMAIN_ROLE).
const COMPANIES = [
  ['Google', 'generalist'], ['Amazon', 'commerce'], ['Meta', 'social'], ['Microsoft', 'generalist'],
  ['Apple', 'generalist'], ['Netflix', 'dataml'], ['Uber', 'commerce'], ['LinkedIn', 'social'],
  ['Bloomberg', 'fintech'], ['Adobe', 'saas'], ['Salesforce', 'saas'], ['Oracle', 'generalist'],
  ['ByteDance', 'dataml'], ['Airbnb', 'commerce'], ['Goldman Sachs', 'fintech'], ['DoorDash', 'commerce'],
  ['X', 'social'], ['Pinterest', 'social'], ['Nvidia', 'hardware'], ['Walmart', 'commerce'],
  ['Stripe', 'fintech'], ['PayPal', 'fintech'], ['Spotify', 'dataml'], ['Snap', 'social'],
  ['Dropbox', 'saas'], ['Atlassian', 'saas'], ['Square', 'fintech'], ['Visa', 'fintech'],
  ['Mastercard', 'fintech'], ['Capital One', 'fintech'], ['JPMorgan Chase', 'fintech'],
  ['Morgan Stanley', 'fintech'], ['Citadel', 'fintech'], ['Two Sigma', 'fintech'],
  ['Jane Street', 'fintech'], ['Databricks', 'dataml'], ['Snowflake', 'dataml'], ['Palantir', 'dataml'],
  ['Robinhood', 'fintech'], ['Coinbase', 'fintech'], ['Instacart', 'commerce'], ['Lyft', 'commerce'],
  ['Booking.com', 'commerce'], ['Expedia', 'commerce'], ['Yelp', 'commerce'], ['Zillow', 'commerce'],
  ['Wayfair', 'commerce'], ['Etsy', 'commerce'], ['eBay', 'commerce'], ['Shopify', 'commerce'],
  ['Twilio', 'saas'], ['Zoom', 'saas'], ['Slack', 'saas'], ['Box', 'saas'], ['ServiceNow', 'saas'],
  ['Workday', 'saas'], ['SAP', 'saas'], ['VMware', 'infra'], ['Cisco', 'infra'], ['IBM', 'generalist'],
  ['Intel', 'hardware'], ['AMD', 'hardware'], ['Qualcomm', 'hardware'], ['Samsung', 'hardware'],
  ['Sony', 'hardware'], ['Electronic Arts', 'gaming'], ['Riot Games', 'gaming'], ['Roblox', 'gaming'],
  ['Epic Games', 'gaming'], ['Activision Blizzard', 'gaming'], ['Tesla', 'hardware'],
  ['SpaceX', 'hardware'], ['Rivian', 'hardware'], ['Waymo', 'dataml'], ['Affirm', 'fintech'],
  ['Chime', 'fintech'], ['SoFi', 'fintech'], ['Intuit', 'saas'], ['Splunk', 'infra'],
  ['Datadog', 'infra'], ['MongoDB', 'infra'], ['Elastic', 'infra'], ['Confluent', 'infra'],
  ['HashiCorp', 'infra'], ['Okta', 'infra'], ['CrowdStrike', 'infra'], ['Palo Alto Networks', 'infra'],
  ['Cloudflare', 'infra'], ['Akamai', 'infra'], ['Disney', 'generalist'], ['Reddit', 'social'],
  ['Quora', 'social'], ['Yahoo', 'generalist'], ['Dell', 'hardware'], ['Broadcom', 'hardware'],
  ['Arista Networks', 'infra'], ['Nutanix', 'infra'], ['Wix', 'saas'], ['GoDaddy', 'saas'],
  ['Figma', 'saas'],
]
if (COMPANIES.length !== 100) throw new Error(`expected 100 companies, got ${COMPANIES.length}`)

const DOMAIN_ROLE = {
  fintech: 'Quant / Fintech SWE', dataml: 'Data / ML Engineer', gaming: 'Game / Engine SWE',
  infra: 'Infra / Security Engineer', hardware: 'Hardware / Systems SWE',
  commerce: 'Product / Backend SWE', saas: 'Enterprise SWE', social: null, generalist: null,
}

// [slug, title, pattern] — original 20-company pool (still real, still valid).
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

// Supplemental problems added for the 100-company expansion — same bar (real,
// well-known, correctly labeled), just more of them for per-company variety.
const EASY_EXTRA = [
  ['contains-duplicate-ii', 'Contains Duplicate II', 'hash map'],
  ['longest-common-prefix', 'Longest Common Prefix', 'string'],
  ['hamming-distance', 'Hamming Distance', 'bit manipulation'],
  ['number-complement', 'Number Complement', 'bit manipulation'],
  ['power-of-four', 'Power of Four', 'bit manipulation'],
  ['n-th-tribonacci-number', 'N-th Tribonacci Number', 'dp'],
  ['cousins-in-binary-tree', 'Cousins in Binary Tree', 'tree'],
  ['univalued-binary-tree', 'Univalued Binary Tree', 'tree'],
  ['leaf-similar-trees', 'Leaf-Similar Trees', 'tree'],
  ['defanging-an-ip-address', 'Defanging an IP Address', 'string'],
  ['unique-morse-code-words', 'Unique Morse Code Words', 'hash set'],
  ['shuffle-the-array', 'Shuffle the Array', 'array'],
  ['running-sum-of-1d-array', 'Running Sum of 1d Array', 'prefix sum'],
  ['richest-customer-wealth', 'Richest Customer Wealth', 'array'],
  ['number-of-good-pairs', 'Number of Good Pairs', 'hash map'],
  ['kids-with-the-greatest-number-of-candies', 'Kids With the Greatest Number of Candies', 'array'],
  ['find-pivot-index', 'Find Pivot Index', 'prefix sum'],
  ['backspace-string-compare', 'Backspace String Compare', 'two pointers'],
  ['middle-of-the-linked-list', 'Middle of the Linked List', 'fast & slow pointers'],
  ['palindrome-linked-list', 'Palindrome Linked List', 'linked list'],
  ['sum-of-left-leaves', 'Sum of Left Leaves', 'tree'],
  ['average-of-levels-in-binary-tree', 'Average of Levels in Binary Tree', 'bfs'],
  ['minimum-depth-of-binary-tree', 'Minimum Depth of Binary Tree', 'tree'],
  ['find-all-numbers-disappeared-in-an-array', 'Find All Numbers Disappeared in an Array', 'array'],
  ['find-the-index-of-the-first-occurrence-in-a-string', 'Find the Index of the First Occurrence in a String', 'string'],
  ['remove-duplicates-from-sorted-list', 'Remove Duplicates from Sorted List', 'linked list'],
  ['maximum-product-of-three-numbers', 'Maximum Product of Three Numbers', 'sorting'],
  ['distribute-candies', 'Distribute Candies', 'hash set'],
  ['detect-capital-use', 'Detect Capital', 'string'],
  ['construct-the-rectangle', 'Construct the Rectangle', 'math'],
  ['employee-importance', 'Employee Importance', 'graph dfs'],
  ['fibonacci-number', 'Fibonacci Number', 'dp'],
  ['design-hashmap', 'Design HashMap', 'design'],
  ['design-hashset', 'Design HashSet', 'design'],
]

const MEDIUM_EXTRA = [
  ['two-city-scheduling', 'Two City Scheduling', 'greedy'],
  ['letter-case-permutation', 'Letter Case Permutation', 'backtracking'],
  ['continuous-subarray-sum', 'Continuous Subarray Sum', 'prefix sum'],
  ['next-greater-element-ii', 'Next Greater Element II', 'monotonic stack'],
  ['01-matrix', '01 Matrix', 'graph bfs'],
  ['top-k-frequent-words', 'Top K Frequent Words', 'heap'],
  ['find-k-closest-elements', 'Find K Closest Elements', 'binary search'],
  ['delete-and-earn', 'Delete and Earn', '1-d dp'],
  ['populating-next-right-pointers-in-each-node', 'Populating Next Right Pointers in Each Node', 'tree'],
  ['sum-root-to-leaf-numbers', 'Sum Root to Leaf Numbers', 'dfs'],
  ['delete-node-in-a-bst', 'Delete Node in a BST', 'bst'],
  ['insert-into-a-binary-search-tree', 'Insert into a Binary Search Tree', 'bst'],
  ['construct-binary-tree-from-inorder-and-postorder-traversal', 'Construct Binary Tree from Inorder and Postorder Traversal', 'tree'],
  ['maximum-width-of-binary-tree', 'Maximum Width of Binary Tree', 'bfs'],
  ['all-nodes-distance-k-in-binary-tree', 'All Nodes Distance K in Binary Tree', 'graph bfs'],
  ['swap-nodes-in-pairs', 'Swap Nodes in Pairs', 'linked list'],
  ['remove-duplicates-from-sorted-list-ii', 'Remove Duplicates from Sorted List II', 'linked list'],
  ['4sum', '4Sum', 'two pointers'],
  ['next-permutation', 'Next Permutation', 'array'],
  ['find-first-and-last-position-of-element-in-sorted-array', 'Find First and Last Position of Element in Sorted Array', 'binary search'],
  ['search-in-rotated-sorted-array-ii', 'Search in Rotated Sorted Array II', 'binary search'],
  ['capacity-to-ship-packages-within-d-days', 'Capacity To Ship Packages Within D Days', 'binary search on answer'],
  ['evaluate-division', 'Evaluate Division', 'graph dfs'],
  ['is-graph-bipartite', 'Is Graph Bipartite?', 'graph bfs/dfs'],
  ['all-paths-from-source-to-target', 'All Paths From Source to Target', 'graph dfs'],
  ['single-number-iii', 'Single Number III', 'bit manipulation'],
  ['game-of-life', 'Game of Life', 'matrix'],
  ['maximal-square', 'Maximal Square', '2-d dp'],
  ['perfect-squares', 'Perfect Squares', 'dp'],
  ['minimum-falling-path-sum', 'Minimum Falling Path Sum', '2-d dp'],
  ['out-of-boundary-paths', 'Out of Boundary Paths', 'dp'],
  ['knight-probability-in-chessboard', 'Knight Probability in Chessboard', 'dp'],
  ['path-sum-ii', 'Path Sum II', 'backtracking'],
  ['contains-duplicate-iii', 'Contains Duplicate III', 'sliding window'],
]

const HARD_EXTRA = [
  ['sudoku-solver', 'Sudoku Solver', 'backtracking'],
  ['find-minimum-in-rotated-sorted-array-ii', 'Find Minimum in Rotated Sorted Array II', 'binary search'],
  ['split-array-largest-sum', 'Split Array Largest Sum', 'binary search on answer'],
  ['critical-connections-in-a-network', 'Critical Connections in a Network', 'graph dfs'],
  ['subarrays-with-k-different-integers', 'Subarrays with K Different Integers', 'sliding window'],
  ['palindrome-partitioning-ii', 'Palindrome Partitioning II', 'dp'],
  ['vertical-order-traversal-of-a-binary-tree', 'Vertical Order Traversal of a Binary Tree', 'tree'],
  ['lfu-cache', 'LFU Cache', 'design'],
  ['minimum-number-of-refueling-stops', 'Minimum Number of Refueling Stops', 'heap'],
  ['shortest-path-visiting-all-nodes', 'Shortest Path Visiting All Nodes', 'bitmask bfs'],
  ['trapping-rain-water-ii', 'Trapping Rain Water II', 'heap'],
  ['number-of-islands-ii', 'Number of Islands II', 'union find'],
]

// New for the 2026-07-18 Abyss expansion — genuinely Hard-difficulty design/OOD LeetCode problems
// (verified: NOT Medium ones like LRU Cache or Design Twitter).
const DESIGN_HARD = [
  ['design-in-memory-file-system', 'Design In-Memory File System', 'design/trie'],
  ['design-search-autocomplete-system', 'Design Search Autocomplete System', 'design/trie'],
  ['all-oone-data-structure', 'All O`one Data Structure', 'design/hash+linked list'],
  ['design-skiplist', 'Design Skiplist', 'design'],
  ['max-stack', 'Max Stack', 'design/stack'],
  ['range-module', 'Range Module', 'design/intervals'],
  ['design-excel-sum-formula', 'Design Excel Sum Formula', 'design/graph'],
  ['data-stream-as-disjoint-intervals', 'Data Stream as Disjoint Intervals', 'design/intervals'],
]

// Genuinely newer (2022-2023) real LeetCode Hard problems, for the "recently popular" recency bucket.
const RECENT_HARD = [
  ['count-the-number-of-ideal-arrays', 'Count the Number of Ideal Arrays', 'combinatorics/dp'],
  ['minimum-obstacle-removal-to-reach-corner', 'Minimum Obstacle Removal to Reach Corner', '0-1 bfs'],
  ['longest-increasing-subsequence-ii', 'Longest Increasing Subsequence II', 'segment tree/dp'],
  ['count-of-integers', 'Count of Integers', 'digit dp'],
  ['minimum-time-to-visit-a-cell-in-a-grid', 'Minimum Time to Visit a Cell In a Grid', 'dijkstra/bfs'],
  ['design-graph-with-shortest-path-calculator', 'Design Graph With Shortest Path Calculator', 'design/dijkstra'],
  ['minimum-cost-to-make-array-equal', 'Minimum Cost to Make Array Equal', 'binary search/prefix sum'],
  ['count-subarrays-with-median-k', 'Count Subarrays With Median K', 'prefix sum/hash map'],
]

// Genuinely newer (2021-2023) real LeetCode Medium problems, for the "recently popular" recency bucket.
const RECENT_MEDIUM = [
  ['maximum-value-of-an-ordered-triplet-ii', 'Maximum Value of an Ordered Triplet II', 'prefix max'],
  ['design-a-food-rating-system', 'Design a Food Rating System', 'design/heap'],
  ['minimum-number-of-operations-to-make-array-continuous', 'Minimum Number of Operations to Make Array Continuous', 'sliding window/binary search'],
  ['minimum-number-of-operations-to-make-array-empty', 'Minimum Number of Operations to Make Array Empty', 'hash map/greedy'],
  ['stock-price-fluctuation', 'Stock Price Fluctuation', 'design/heap'],
  ['design-a-number-container-system', 'Design a Number Container System', 'design/heap'],
]

// Real HackerRank problems confirmed Hard (or "Advanced", HackerRank's tier above Hard) via direct fetch
// of each problem page. Codeforces was evaluated too but its difficulty ratings could not be reliably
// verified through available tools (the site blocks direct fetching and the public API is too large to
// search page-by-page for arbitrary older problems) — dropped rather than guessed. `source: 'codeforces'`
// stays a valid value on the Problem type for a future attempt with better tooling.
const HR_HARD = [
  ['find-the-running-median', 'Find the Running Median', 'two heaps'],
  ['count-strings', 'Count Strings', 'dp/automaton'],
  ['array-and-simple-queries', 'Array and Simple Queries', 'array/queries'],
  ['string-function-calculation', 'String Function Calculation', 'suffix array/dp'],
]

function dedupe(name, ...groups) {
  const seen = new Map()
  for (const group of groups) {
    for (const [slug, title, pattern] of group) {
      if (!seen.has(slug)) seen.set(slug, { slug, title, pattern, difficulty: name })
    }
  }
  return [...seen.values()]
}
const POOL = {
  easy: dedupe('easy', EASY, EASY_EXTRA),
  medium: dedupe('medium', MEDIUM, MEDIUM_EXTRA),
  hard: dedupe('hard', HARD, HARD_EXTRA),
}
if (POOL.easy.length < EASY_N) throw new Error(`easy pool too small: ${POOL.easy.length}`)
if (POOL.medium.length < MEDIUM_N) throw new Error(`medium pool too small: ${POOL.medium.length}`)
if (POOL.hard.length < HARD_N) throw new Error(`hard pool too small: ${POOL.hard.length}`)

// "Iconic" slugs get the classic_evergreen recency bucket; the rest are commonly_asked.
const ICONIC = new Set([
  'two-sum', 'valid-parentheses', 'merge-two-sorted-lists', 'best-time-to-buy-and-sell-stock',
  'reverse-linked-list', 'contains-duplicate', 'invert-binary-tree', 'climbing-stairs',
  'maximum-subarray', 'longest-substring-without-repeating-characters', '3sum', 'group-anagrams',
  'top-k-frequent-elements', 'product-of-array-except-self', 'merge-k-sorted-lists',
  'trapping-rain-water', 'word-break', 'coin-change', 'number-of-islands', 'course-schedule',
  'clone-graph', 'lru-cache', 'median-of-two-sorted-arrays', 'word-ladder',
  'serialize-and-deserialize-binary-tree', 'longest-palindromic-substring', 'house-robber',
  'jump-game', 'spiral-matrix', 'rotate-image', 'set-matrix-zeroes', 'validate-binary-search-tree',
  'binary-tree-level-order-traversal', 'kth-largest-element-in-an-array', 'subsets', 'permutations',
  'combination-sum', 'word-search', 'n-queens', 'sliding-window-maximum',
  'largest-rectangle-in-histogram', 'edit-distance', 'longest-increasing-subsequence',
  'unique-paths', 'decode-ways', 'binary-search', 'search-in-rotated-sorted-array',
  'find-minimum-in-rotated-sorted-array', 'two-sum-ii-input-array-is-sorted', 'linked-list-cycle',
  'remove-nth-node-from-end-of-list', 'add-two-numbers', 'copy-list-with-random-pointer',
  'alien-dictionary', 'min-stack', 'evaluate-reverse-polish-notation', 'generate-parentheses',
  'daily-temperatures',
])

const toPool = (tuples, difficulty) => tuples.map(([slug, title, pattern]) => ({ slug, title, pattern, difficulty }))
const DESIGN_HARD_POOL = toPool(DESIGN_HARD, 'hard')
const RECENT_HARD_POOL = toPool(RECENT_HARD, 'hard')
const RECENT_MEDIUM_POOL = toPool(RECENT_MEDIUM, 'medium')
const HR_HARD_POOL = toPool(HR_HARD, 'hard')
const RECENT_MEDIUM_SLUGS = new Set(RECENT_MEDIUM_POOL.map((p) => p.slug))

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function seedFor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0
  return h
}
function pick(rng, arr, n, exclude) {
  const avail = arr.filter((p) => !exclude.has(p.slug))
  const used = new Set()
  const out = []
  while (out.length < n && used.size < avail.length) {
    const cand = avail[Math.floor(rng() * avail.length)]
    if (!used.has(cand.slug)) { used.add(cand.slug); out.push(cand) }
  }
  return out
}
function roles(difficulty, isBoss, domain) {
  const band = difficulty === 'easy' ? 'New Grad / SWE I' : difficulty === 'medium' ? 'SWE II / Mid-Level' : 'Senior / Staff'
  const out = [band]
  if (isBoss) out.push('Staff / Principal')
  const flavor = DOMAIN_ROLE[domain]
  if (flavor && difficulty !== 'easy') out.push(flavor)
  return out
}
const recency = (slug) => (ICONIC.has(slug) ? 'classic, evergreen' : 'commonly asked')
function toProblem(p, islandId, order, isBoss, domain) {
  return {
    slug: p.slug, title: p.title, difficulty: p.difficulty, island_id: islandId, order,
    xp: XP[p.difficulty] * (isBoss ? 2 : 1), pattern: p.pattern, is_boss: isBoss,
    leetcode_url: p._url ?? p.leetcode_url ?? `https://leetcode.com/problems/${p.slug}/`,
    time_limit_seconds: LIMIT[p.difficulty], roles: roles(p.difficulty, isBoss, domain),
    recency: p._recency ?? p.recency ?? recency(p.slug),
    ...((p._source ?? p.source) ? { source: p._source ?? p.source } : {}),
  }
}

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// The first 20 companies keep their exact, already-shipped 15 problems (re-ordered so
// the boss lands last at order 50 instead of 15) — everything else is newly picked.
const existingUrl = new URL('../public/data/journey3.json', import.meta.url)
let existing = null
try {
  existing = JSON.parse(readFileSync(existingUrl, 'utf8'))
} catch { /* first run without a prior journey3.json is fine */ }

const islands = []
const problems = []

COMPANIES.forEach(([name, domain], idx) => {
  const id = slugify(name)
  islands.push({ id, name: `${name} Island`, order: idx + 1 })

  const kept = existing?.problems.filter((p) => p.island_id === id) ?? []
  const keptEasy = kept.filter((p) => p.difficulty === 'easy')
  const keptMedium = kept.filter((p) => p.difficulty === 'medium')
  const keptHardNonBoss = kept.filter((p) => p.difficulty === 'hard' && !p.is_boss)
  const keptBoss = kept.find((p) => p.is_boss)

  const rng = mulberry32(seedFor(id))
  const exclude = new Set(kept.map((p) => p.slug))
  const newEasy = pick(rng, POOL.easy, EASY_N - keptEasy.length, exclude)
  newEasy.forEach((p) => exclude.add(p.slug))
  const newMedium = pick(rng, POOL.medium, MEDIUM_N - keptMedium.length, exclude)
  newMedium.forEach((p) => exclude.add(p.slug))
  const hardNeeded = HARD_N - (keptBoss ? 1 : 0) - keptHardNonBoss.length
  const newHard = []
  if (hardNeeded > 0) {
    const designPicked = pick(rng, DESIGN_HARD_POOL, Math.min(3, hardNeeded), exclude)
    designPicked.forEach((p) => exclude.add(p.slug))
    newHard.push(...designPicked)

    const recentPicked = pick(rng, RECENT_HARD_POOL, Math.min(3, Math.max(0, hardNeeded - newHard.length)), exclude)
    recentPicked.forEach((p) => exclude.add(p.slug))
    newHard.push(...recentPicked.map((p) => ({ ...p, _recency: 'recently popular' })))

    const hrPicked = pick(rng, HR_HARD_POOL, Math.min(3, Math.max(0, hardNeeded - newHard.length)), exclude)
    hrPicked.forEach((p) => exclude.add(p.slug))
    newHard.push(
      ...hrPicked.map((p) => ({
        ...p,
        _source: 'hackerrank',
        _url: `https://www.hackerrank.com/challenges/${p.slug}/problem`,
      })),
    )

    const remaining = hardNeeded - newHard.length
    if (remaining > 0) {
      const classicPicked = pick(rng, POOL.hard, remaining, exclude)
      classicPicked.forEach((p) => exclude.add(p.slug))
      newHard.push(...classicPicked)
    }
  }
  let boss = keptBoss
  if (!boss) {
    const bossCandidates = POOL.hard.filter((p) => !exclude.has(p.slug))
    boss = bossCandidates[Math.floor(rng() * bossCandidates.length)]
  }

  const easyAll = [...keptEasy, ...newEasy]
  const mediumAll = [...keptMedium, ...newMedium]
  const haveRecentMedium = mediumAll.filter((p) => RECENT_MEDIUM_SLUGS.has(p.slug)).length
  const swapTarget = Math.min(3, RECENT_MEDIUM_POOL.length) - haveRecentMedium
  if (swapTarget > 0) {
    const swappable = mediumAll.filter((p) => !ICONIC.has(p.slug) && !RECENT_MEDIUM_SLUGS.has(p.slug))
    const swapCount = Math.min(swapTarget, swappable.length)
    if (swapCount > 0) {
      const swapIn = pick(rng, RECENT_MEDIUM_POOL, swapCount, exclude)
      swapIn.forEach((p) => exclude.add(p.slug))
      const toRemove = new Set(swappable.slice(0, swapIn.length).map((p) => p.slug))
      const kept2 = mediumAll.filter((p) => !toRemove.has(p.slug))
      mediumAll.length = 0
      mediumAll.push(...kept2, ...swapIn.map((p) => ({ ...p, _recency: 'recently popular' })))
    }
  }
  const hardAll = [...keptHardNonBoss, ...newHard]

  let order = 1
  for (const p of easyAll) problems.push(toProblem(p, id, order++, false, domain))
  for (const p of mediumAll) problems.push(toProblem(p, id, order++, false, domain))
  for (const p of hardAll) problems.push(toProblem(p, id, order++, false, domain))
  problems.push(toProblem(boss, id, order++, true, domain))
})

const journey3 = { id: 3, name: 'The Abyss', islands, problems }

// Sanity checks mirroring src/test/curriculum.test.ts invariants.
if (islands.length !== 100) throw new Error(`expected 100 islands, got ${islands.length}`)
if (problems.length !== 6000) throw new Error(`expected 6000 problems, got ${problems.length}`)
for (const island of islands) {
  const probs = problems.filter((p) => p.island_id === island.id)
  if (probs.length !== 60) throw new Error(`${island.id} has ${probs.length} problems, expected 60`)
  if (new Set(probs.map((p) => p.slug)).size !== probs.length) throw new Error(`${island.id} has duplicate slugs`)
  const bosses = probs.filter((p) => p.is_boss)
  if (bosses.length !== 1) throw new Error(`${island.id} has ${bosses.length} bosses, expected 1`)
  const last = [...probs].sort((a, b) => a.order - b.order).at(-1)
  if (!last.is_boss) throw new Error(`${island.id} boss is not last`)
  if (last.difficulty !== 'hard') throw new Error(`${island.id} boss is not hard difficulty`)
  if (probs.some((p) => p.difficulty === undefined || Number.isNaN(p.xp))) {
    throw new Error(`${island.id} has a problem with missing difficulty or NaN xp`)
  }
}

writeFileSync(new URL('../public/data/journey3.json', import.meta.url), JSON.stringify(journey3, null, 2) + '\n')
console.log(`OK: wrote journey3.json — ${islands.length} islands, ${problems.length} problems.`)
