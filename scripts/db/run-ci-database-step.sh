#!/usr/bin/env bash
# GitHub-only shell for bounded database preparation and SOC tests.
# Reuse the existing postgres:16 service image and the runner's Node 24 runtime.
# Shared network namespace preserves the installer's real loopback-host check.
set -euo pipefail
[[ "${GITHUB_ACTIONS:-}" == true && "${ALLOW_TEST_DATABASE_MUTATION:-}" == true ]]
[[ "${CI_POSTGRES_CONTAINER:-}" =~ ^[a-f0-9]{64}$ ]]
script=$(realpath "$1")
case "$script" in "${RUNNER_TEMP}/"*) ;; *) echo 'Rejected script outside runner temp' >&2; exit 1;; esac
[[ "$(docker inspect --format '{{.Config.Image}}' "$CI_POSTGRES_CONTAINER")" == postgres:16 ]]
node_root=$(dirname "$(dirname "$(readlink -f "$(command -v node)")")")
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 24 ]]
# The exact SOC command includes tests that invoke git; the base PostgreSQL image lacks it.
if ! docker image inspect rentipid-iso-ci-test-tools:pg16 >/dev/null 2>&1; then
  docker build --tag rentipid-iso-ci-test-tools:pg16 - < scripts/db/ci-test-tools.Dockerfile
fi
url='postgresql://rentipid_test_user:ci_test_only@127.0.0.1:5432/rentipid_test_soc?schema=public'
docker run --rm --network "container:${CI_POSTGRES_CONTAINER}" \
  --volume "${GITHUB_WORKSPACE}:${GITHUB_WORKSPACE}" \
  --volume "${RUNNER_TEMP}:${RUNNER_TEMP}:ro" \
  --volume "${node_root}:/opt/node:ro" \
  --workdir "$GITHUB_WORKSPACE" \
  --env PATH=/opt/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  --env CI=true --env GITHUB_ACTIONS=true --env NODE_ENV=test \
  --env ALLOW_TEST_DATABASE_MUTATION=true \
  --env "DATABASE_URL=$url" --env "DIRECT_URL=$url" \
  --entrypoint /bin/bash rentipid-iso-ci-test-tools:pg16 --noprofile --norc -e -o pipefail "$script"
