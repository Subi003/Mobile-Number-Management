import React, { useState } from 'react';
import { X, Github, Check, Copy, ExternalLink, Globe, Terminal, Sparkles } from 'lucide-react';

interface GitHubPagesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPagesGuideModal: React.FC<GitHubPagesGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [copiedYaml, setCopiedYaml] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);

  const GITHUB_ACTIONS_WORKFLOW = `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const CLI_COMMANDS = `# 1. Initialize git and commit files
git init
git add .
git commit -m "Initial commit of Mobile Number Management Dashboard"

# 2. Add your GitHub repository remote
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mobile-inventory.git

# 3. Push to GitHub
git push -u origin main`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(GITHUB_ACTIONS_WORKFLOW);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2500);
  };

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(CLI_COMMANDS);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Free GitHub Pages Deployment</h3>
              <p className="text-xs text-slate-300">Host your dashboard on your-name.github.io for $0/mo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-900 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Zero-Cost Serverless Architecture</strong>
              <span>
                Because the backend is powered by Google Apps Script &amp; Google Sheets, the frontend is 100% static React!
                It can be hosted freely on GitHub Pages without any servers, Docker containers, or maintenance bills.
              </span>
            </div>
          </div>

          {/* Step 1: Create Repo */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
              Create a new GitHub Repository
            </h4>
            <p className="text-slate-600">
              Go to <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1">github.com/new <ExternalLink className="w-3 h-3" /></a> and create a public or private repository (e.g., <code>mobile-inventory</code>).
            </p>
          </div>

          {/* Step 2: Push code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                Commit &amp; Push Your Project
              </h4>
              <button
                onClick={handleCopyCommands}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors cursor-pointer"
              >
                {copiedCommands ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCommands ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>
            <div className="bg-slate-900 text-emerald-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
              <pre>{CLI_COMMANDS}</pre>
            </div>
          </div>

          {/* Step 3: GitHub Actions YAML */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                Automated Deployment Workflow
              </h4>
              <button
                onClick={handleCopyYaml}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-colors shadow-xs cursor-pointer"
              >
                {copiedYaml ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedYaml ? 'Copied Workflow!' : 'Copy YAML File'}</span>
              </button>
            </div>
            <p className="text-slate-600">
              Create a file named <code>.github/workflows/deploy.yml</code> in your project repository with this content:
            </p>
            <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
              <pre>{GITHUB_ACTIONS_WORKFLOW}</pre>
            </div>
          </div>

          {/* Step 4: Enable in GitHub Settings */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">4</span>
              Enable GitHub Pages
            </h4>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div>1. In your GitHub repository, click <strong>Settings</strong> tab.</div>
              <div>2. Click <strong>Pages</strong> in the left sidebar menu.</div>
              <div>3. Under <strong>Build and deployment &gt; Source</strong>, choose <strong>GitHub Actions</strong>.</div>
              <div>4. Push changes to <code>main</code> branch, and your live URL will be active at <code>https://YOUR_USERNAME.github.io/YOUR_REPO/</code>!</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
