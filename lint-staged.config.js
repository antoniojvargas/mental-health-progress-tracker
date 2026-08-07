// Pre-commit hook only — kept fast and dependency-free (no Postgres needed), so it never blocks
// a commit on infrastructure being up. Full test suites run in CI (see .github/workflows/ci.yml),
// not here.
export default {
  'backend/**/*.ts': () => 'npm --prefix backend run lint:fix',
  'frontend/**/*.{ts,tsx}': () => 'npm --prefix frontend run lint:fix',
  '**/*.{ts,tsx,js,jsx,json,css,yml,yaml}': ['prettier --write'],
};
