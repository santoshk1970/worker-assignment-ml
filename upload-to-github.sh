#!/bin/bash
# 🚀 Quick GitHub Upload Script
# Run this script to upload your project to GitHub

echo "🎯 Worker Assignment ML System - GitHub Upload"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project directory. Please run from /Users/santosh/development/machinelearning"
    exit 1
fi

echo "📋 Pre-upload checks..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Worker Assignment ML System"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "🚀 Ready for GitHub upload!"
echo ""
echo "📝 Next steps:"
echo "1. Go to https://github.com/new"
echo "2. Repository name: worker-assignment-ml"
echo "3. Description: Machine Learning system for optimal worker-job assignment using K-Nearest Neighbors algorithm"
echo "4. Choose Public (recommended for portfolio)"
echo "5. DON'T initialize with README (we already have one)"
echo "6. Click 'Create repository'"
echo ""
echo "7. Then run these commands (replace YOUR_USERNAME):"
echo ""
echo "   git remote add origin https://github.com/santoshk1970/worker-assignment-ml.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "📚 For detailed instructions, see: GITHUB_UPLOAD_GUIDE.md"
echo ""

# Test the project
echo "🧪 Testing project functionality..."
if npm list >/dev/null 2>&1; then
    echo "✅ Dependencies are installed"
else
    echo "⚠️  Installing dependencies..."
    npm install
fi

# Check if data exists
if [ -f "data/historical_data.json" ]; then
    echo "✅ Sample data exists"
else
    echo "📊 Generating sample data..."
    npm run generate-data
fi

echo ""
echo "🎉 Project is ready for upload!"
echo "   - Total files: $(git ls-files | wc -l | tr -d ' ')"
echo "   - Last commit: $(git log -1 --pretty=format:'%h - %s')"
echo "   - Ready for: https://github.com/YOUR_USERNAME/worker-assignment-ml"
