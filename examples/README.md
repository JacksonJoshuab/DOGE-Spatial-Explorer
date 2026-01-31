# DOGE Spatial Explorer Examples

This directory contains examples demonstrating various features of the DOGE Spatial Explorer.

## Available Examples

### 1. Basic Example (`basic.ts`)
Simple introduction to the framework showing basic object manipulation and scene management.

```bash
npm run build
node dist/examples/basic.js
```

### 2. Apple visionOS Example (`apple-visionos.ts`)
Demonstrates spatial computing on Apple Vision Pro with privacy-first settings.

```bash
npm run build
node dist/examples/apple-visionos.js
```

### 3. AI Integration Example (`ai-integration.ts`)
Shows on-device, edge, and cloud AI processing capabilities.

```bash
npm run build
node dist/examples/ai-integration.js
```

### 4. Multi-Platform Example (`multi-platform.ts`)
Demonstrates platform detection and adaptive content delivery.

```bash
npm run build
node dist/examples/multi-platform.js
```

## Running Examples

All examples are written in TypeScript and need to be compiled before running:

```bash
# Build the project
npm run build

# Run an example
node dist/examples/[example-name].js
```

Or use ts-node for direct execution:

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run directly
ts-node examples/basic.ts
```
