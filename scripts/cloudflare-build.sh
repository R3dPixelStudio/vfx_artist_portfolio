#!/bin/sh
set -eu
# Resolve current stable Node.js and npm before installing or building the project.
exec npx --yes --package=node@latest --package=npm@latest --call 'node --version && npm --version && npm ci && npm run build'
