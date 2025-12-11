#!/bin/bash

# Script to fix CSS/Tailwind configuration after wasp clean

echo "🎨 Setting up CSS configuration..."

# Wait for wasp compilation to complete
echo "Waiting for .wasp/out/web-app directory..."
while [ ! -d ".wasp/out/web-app" ]; do
  sleep 1
done

# Copy config files
echo "📋 Copying config files..."
cp tailwind.config.cjs .wasp/out/web-app/
cp postcss.config.cjs .wasp/out/web-app/

# Install dependencies
echo "📦 Installing Tailwind and Autoprefixer..."
cd .wasp/out/web-app
npm install tailwindcss@^3.2.7 autoprefixer@^10.0.0 --silent

echo "✅ CSS setup complete!"
