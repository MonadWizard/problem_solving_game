export interface VerifyResult {
  /** False if verification wasn't actually attempted (unset, no username, network error). */
  checked: boolean
  solved: boolean
}

const WORKER_URL = import.meta.env.VITE_VERIFY_WORKER_URL as string | undefined

/** Off by default — the frontend only calls the worker when this is set. */
export const verificationAvailable = !!WORKER_URL

export async function verifyRecentlySolved(leetcodeUsername: string, slug: string): Promise<VerifyResult> {
  if (!WORKER_URL || !leetcodeUsername) return { checked: false, solved: false }
  try {
    const res = await fetch(
      `${WORKER_URL}?username=${encodeURIComponent(leetcodeUsername)}&slug=${encodeURIComponent(slug)}`,
    )
    if (!res.ok) return { checked: false, solved: false }
    const data = (await res.json()) as VerifyResult
    return { checked: !!data.checked, solved: !!data.solved }
  } catch {
    return { checked: false, solved: false }
  }
}

/**
 * Runs the optional check before marking solved. Always resolves true
 * (proceed) unless verification is configured, ran successfully, found no
 * match, AND the user declines the "are you sure" prompt — honor-system
 * remains the default and the fallback.
 */
export async function confirmSolve(leetcodeUsername: string | null, slug: string): Promise<boolean> {
  if (!verificationAvailable || !leetcodeUsername) return true
  const result = await verifyRecentlySolved(leetcodeUsername, slug)
  if (!result.checked || result.solved) return true
  return window.confirm(
    "We couldn't find this problem in your recent LeetCode submissions. Mark it solved anyway?",
  )
}
