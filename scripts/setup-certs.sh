#!/usr/bin/env bash
# setup-certs.sh — generate locally-trusted TLS certs for HTTPS LAN play
#
# Requires mkcert: https://github.com/FiloSottile/mkcert
#   macOS:   brew install mkcert
#   Linux:   apt install mkcert  (or see mkcert releases page)
#   Windows: choco install mkcert
#
# Run once on the DM's machine.  Players don't need to do anything —
# mkcert installs a local CA that the OS (and thus the browser) trusts.
#
# After running, restart the server and share the https:// URL with players.

set -e

if ! command -v mkcert &> /dev/null; then
  echo ""
  echo "  ✗ mkcert not found."
  echo ""
  echo "  Install it first:"
  echo "    macOS:   brew install mkcert"
  echo "    Linux:   apt install mkcert"
  echo "    Windows: choco install mkcert"
  echo ""
  exit 1
fi

# Detect the machine's LAN IP
LAN_IP=$(node -e "
const { networkInterfaces } = require('os')
for (const ifaces of Object.values(networkInterfaces())) {
  for (const i of ifaces ?? []) {
    if (i.family === 'IPv4' && !i.internal) { process.stdout.write(i.address); process.exit(0) }
  }
}
process.stdout.write('127.0.0.1')
")

CERT_DIR="$(dirname "$0")/../server/certs"
mkdir -p "$CERT_DIR"

echo ""
echo "  Installing local CA (you may be prompted for your password)..."
mkcert -install

echo ""
echo "  Generating cert for localhost + $LAN_IP ..."
mkcert -cert-file "$CERT_DIR/cert.pem" -key-file "$CERT_DIR/key.pem" \
  localhost 127.0.0.1 "$LAN_IP"

echo ""
echo "  ✓ Certs written to server/certs/"
echo "  ✓ Restart the server — it will switch to https:// automatically."
echo ""
echo "  Players: share https://$LAN_IP:2567 with your group."
echo "  Their browsers will trust the cert with no warnings (same local CA)."
echo ""
