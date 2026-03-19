#!/bin/bash
# Fission Protocol - Deploy Script
# Usage: ./deploy.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}

if [ "$NETWORK" = "mainnet" ]; then
  RPC_URL="https://eth-rpc.polkadot.io/"
  echo "🚀 Deploying to Polkadot Hub MAINNET (Chain ID: 420420419)"
else
  RPC_URL="https://eth-rpc-testnet.polkadot.io/"
  echo "🧪 Deploying to Polkadot Hub TESTNET (Chain ID: 420420422)"
fi

if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Set PRIVATE_KEY environment variable first"
  echo "   export PRIVATE_KEY=0x..."
  exit 1
fi

echo ""
echo "⚛️  Fission Protocol Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Compile
echo "📦 Compiling contracts..."
forge build

# Step 2: Deploy via script
echo ""
echo "🔗 Deploying to $NETWORK..."
forge script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY" \
  -vvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Copy deployed addresses from broadcast output above"
echo "   2. Update frontend/src/config/contracts.ts with new addresses"
echo "   3. cd frontend && npm run dev"
echo ""
echo "🔍 Verify on Blockscout:"
if [ "$NETWORK" = "mainnet" ]; then
  echo "   https://blockscout.polkadot.io/"
else
  echo "   https://blockscout-testnet.polkadot.io/"
fi
