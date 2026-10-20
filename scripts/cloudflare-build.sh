#!/bin/sh
set -eu
# Node is selected by Cloudflare from .node-version before this script starts.
npm install --global npm@latest
node --version
npm --version
npm ci --no-audit --no-fund
npm run build
