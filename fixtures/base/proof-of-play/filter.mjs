// STUB for CLI tests — a structure gut that always admits, so the CLI's own plumbing (arg parsing,
// ring selection, output location) is what the test exercises, not the sibling tools.
export function proveRepo(repoPath) {
  return {
    admissible: true, hash: 'stub00000000', benchmark: { spec: 'stub-spec' },
    verdict: { badge: true, core: '10/10', nonCore: '14/14', dominantTell: null },
  };
}
export function assessorRunner() { return () => ({}); }
