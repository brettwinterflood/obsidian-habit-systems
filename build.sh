#!/bin/bash

# Build script for Obsidian Habits Tracker plugin

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Verify OBSIDIAN_PLUGIN_DIR is set
if [ -z "$OBSIDIAN_PLUGIN_DIR" ]; then
    echo "Error: OBSIDIAN_PLUGIN_DIR not set in .env file"
    exit 1
fi

BUILD_DIR="build"  # Temp build dir

# Create build dir if not exists
mkdir -p $BUILD_DIR

# Use esbuild to compile and bundle TypeScript to a single JS file
npx esbuild src/main.ts \
  --bundle \
  --format=cjs \
  --outfile=$BUILD_DIR/main.js \
  --platform=node \
  --external:obsidian \
  --minify

# Copy manifest.json
cp manifest.json $BUILD_DIR/

# Clear target plugin dir (be careful!)
rm -rf "$OBSIDIAN_PLUGIN_DIR"/*
mkdir -p "$OBSIDIAN_PLUGIN_DIR"

# Copy built files
cp $BUILD_DIR/main.js "$OBSIDIAN_PLUGIN_DIR"/
cp $BUILD_DIR/manifest.json "$OBSIDIAN_PLUGIN_DIR"/

# Clean up build dir
rm -rf $BUILD_DIR

echo "Plugin built and copied to $OBSIDIAN_PLUGIN_DIR"
echo "Restart Obsidian or reload plugins to apply changes."