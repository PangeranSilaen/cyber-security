#!/usr/bin/env sh
set -eu

version="${1:-3_3_0-12}"
url="https://api.github.com/repos/pkp/omp/tarball/refs/tags/${version}"

echo "Fetching OMP source metadata for ${version}"
curl -I "$url"
