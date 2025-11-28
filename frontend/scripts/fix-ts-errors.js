#!/usr/bin/env node

/**
 * CareGuide TypeScript Error Fixer
 * --------------------------------
 * Automates the repetitive cleanup steps that generate dozens of TSC errors:
 * 1. Remove unused default React imports across the src tree.
 * 2. Drop unused Lucide/icon helpers that fail "noUnusedLocals".
 * 3. Patch Quiz/Nutrition pages with safer guards and array access.
 * 4. Normalize Signup/chat utilities and ensure Vitest is available for tests.
 *
 * Usage:
 *   cd frontend
 *   node scripts/fix-ts-errors.js
 *
 * Optional:
 *   SKIP_VITEST_INSTALL=1 node scripts/fix-ts-errors.js   # skip npm install step
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const unusedImportTargets = [
  { file: 'src/pages/DietLogPage.tsx', module: 'lucide-react', identifiers: ['TrendingUp', 'Camera'] },
  { file: 'src/pages/DietLogPage.tsx', module: '../components/figma/ImageWithFallback', identifiers: ['ImageWithFallback'] },
  { file: 'src/pages/MainPage.tsx', module: 'lucide-react', identifiers: ['Camera'] },
  { file: 'src/pages/NewsDetailPage.tsx', module: 'lucide-react', identifiers: ['Star', 'ChevronRight'] },
  { file: 'src/pages/CommunityCreatePage.tsx', module: '../components/figma/ImageWithFallback', identifiers: ['ImageWithFallback'] },
  { file: 'src/pages/CommunityEditPage.tsx', module: '../components/figma/ImageWithFallback', identifiers: ['ImageWithFallback'] },
  { file: 'src/components/Sidebar.tsx', module: 'lucide-react', identifiers: ['LogOut', 'LogIn'] },
  { file: 'src/pages/BookmarkPage.tsx', module: 'lucide-react', identifiers: ['ChevronRight'] }
];

const fileUpdates = [];

function logUpdate(file, message) {
  const note = message ? `${file} (${message})` : file;
  fileUpdates.push(note);
  console.log(`✔ Updated ${note}`);
}

function collapseBlankLines(content) {
  return content.replace(/\n{3,}/g, '\n\n');
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(relPath, transformer, description) {
  const absolutePath = path.join(projectRoot, relPath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`⚠️  Skipping missing file: ${relPath}`);
    return;
  }

  const original = fs.readFileSync(absolutePath, 'utf8');
  const transformed = transformer(original);
  if (transformed !== original) {
    fs.writeFileSync(absolutePath, transformed);
    logUpdate(relPath, description);
  }
}

function collectTsxFiles(relDir) {
  const collected = [];
  const absoluteDir = path.join(projectRoot, relDir);
  if (!fs.existsSync(absoluteDir)) {
    return collected;
  }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.turbo') continue;
    const entryPath = path.join(relDir, entry.name);
    if (entry.isDirectory()) {
      collected.push(...collectTsxFiles(entryPath));
    } else if (entry.name.endsWith('.tsx')) {
      collected.push(entryPath);
    }
  }

  return collected;
}

function fixReactImports() {
  const files = collectTsxFiles('src');
  const reactImportRegex = /import\s+React(?:\s*,\s*\{[\s\S]*?\})?\s+from\s+['"]react['"];?/g;

  for (const file of files) {
    processFile(
      file,
      (content) => {
        let changed = false;
        const updated = content.replace(reactImportRegex, (match, offset, fullString) => {
          const before = fullString.slice(0, offset);
          const after = fullString.slice(offset + match.length);
          const stillUsesReact = /React\./.test(before + after);

          if (stillUsesReact) {
            return match;
          }

          changed = true;
          const namedMatch = match.match(/\{([\s\S]*?)\}/);
          if (!namedMatch) {
            return '';
          }

          const namedSpecifiers = namedMatch[1]
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

          return namedSpecifiers.length ? `import { ${namedSpecifiers.join(', ')} } from 'react';` : '';
        });

        return changed ? collapseBlankLines(updated) : content;
      },
      'Removed unused React default import'
    );
  }
}

function removeSpecificIdentifiers() {
  for (const target of unusedImportTargets) {
    processFile(
      target.file,
      (content) => {
        const importRegex = new RegExp(
          `^import\\s+\\{([^}]*)\\}\\s+from\\s+['"]${escapeRegExp(target.module)}['"];?`,
          'gm'
        );
        let changed = false;

        const sanitized = content.replace(importRegex, (match, group, offset, fullString) => {
          const before = fullString.slice(0, offset);
          const after = fullString.slice(offset + match.length);
          const usageScope = before + after;
          const specifiers = group
            .split(',')
            .map((spec) => spec.trim())
            .filter(Boolean);

          const kept = specifiers.filter((spec) => {
            const [named, alias] = spec.split(/\s+as\s+/);
            const localName = (alias || named).trim();
            if (!target.identifiers.includes(localName)) {
              return true;
            }
            const usageRegex = new RegExp(`\\b${localName}\\b`);
            if (usageRegex.test(usageScope)) {
              return true;
            }
            changed = true;
            return false;
          });

          if (!kept.length) {
            return '';
          }

          return `import { ${kept.join(', ')} } from '${target.module}';`;
        });

        return changed ? collapseBlankLines(sanitized) : content;
      },
      'Removed unused icon/helper imports'
    );
  }
}

function patchQuizPage() {
  const file = 'src/pages/QuizPage.tsx';
  processFile(
    file,
    (content) => {
      let updated = content;
      updated = updated.replace(
        'const currentQuiz = quizzes[currentQuizIndex];',
        'const currentQuiz = quizzes[currentQuizIndex] ?? null;'
      );
      updated = updated.replace(
        'const isCorrect = selectedAnswer === currentQuiz.correctAnswer;',
        'const isCorrect = currentQuiz ? selectedAnswer === currentQuiz.correctAnswer : false;'
      );
      updated = updated.replace(
        '    if (showResult) return;',
        '    if (showResult || !currentQuiz) return;'
      );

      if (!updated.includes('if (!currentQuiz) {')) {
        updated = updated.replace(
          '  return (\n',
          `  if (!currentQuiz) {\n    return (\n      <div className="p-6 max-w-3xl mx-auto text-center text-[#9CA3AF]">\n        퀴즈 데이터를 준비 중입니다.\n      </div>\n    );\n  }\n\n  return (\n`
        );
      }

      return collapseBlankLines(updated);
    },
    'Guarded QuizPage currentQuiz usage'
  );
}

function patchQuizListPage() {
  const file = 'src/pages/QuizListPage.tsx';
  processFile(
    file,
    (content) => {
      let updated = content;
      if (!updated.includes('const firstQuiz = quizList[0];')) {
        const anchor = 'const completedCount = quizList.filter(q => q.completed).length;';
        updated = updated.replace(
          anchor,
          `${anchor}\n  const firstQuiz = quizList[0];`
        );
      }

      if (!updated.includes('if (!firstQuiz) {')) {
        updated = updated.replace(
          '  return (\n',
          `  if (!firstQuiz) {\n    return (\n      <div className="flex flex-col h-full bg-white">\n        <div className="lg:hidden">\n          <MobileHeader title="퀴즈미션" showMenu={true} showProfile={true} />\n        </div>\n        <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-center p-6">\n          진행 가능한 퀴즈가 없습니다.\n        </div>\n      </div>\n    );\n  }\n\n  return (\n`
        );
      }

      if (updated.includes('quizList[0]')) {
        let occurrence = 0;
        updated = updated.replace(/quizList\[0\]/g, (match) => {
          occurrence += 1;
          return occurrence === 1 ? match : 'firstQuiz';
        });
      }

      return collapseBlankLines(updated);
    },
    'Added safe QuizListPage indexing'
  );
}

function patchSignupPage() {
  const file = 'src/pages/SignupPage.tsx';
  processFile(
    file,
    (content) => {
      let updated = content;
      updated = updated.replace(
        "import React, { useState, useEffect } from 'react';",
        "import { useState, useEffect, type FormEvent } from 'react';"
      );

      if (!updated.includes('type ExpandedTermsKey')) {
        updated = updated.replace(
          'interface TermsData {\n  service_terms: { title: string; required: boolean; content: string };\n  privacy_required: { title: string; required: boolean; content: string };\n  privacy_optional: { title: string; required: boolean; content: string };\n  marketing: { title: string; required: boolean; content: string };\n}\n\n',
          `interface TermsData {\n  service_terms: { title: string; required: boolean; content: string };\n  privacy_required: { title: string; required: boolean; content: string };\n  privacy_optional: { title: string; required: boolean; content: string };\n  marketing: { title: string; required: boolean; content: string };\n}\n\ntype ExpandedTermsKey = 'service' | 'privacyRequired' | 'privacyOptional' | 'marketing';\n\nconst INITIAL_EXPANDED_TERMS_STATE: Record<ExpandedTermsKey, boolean> = {\n  service: false,\n  privacyRequired: false,\n  privacyOptional: false,\n  marketing: false\n};\n\n`
        );
      }

      updated = updated.replace(
        '  const [expandedTerms, setExpandedTerms] = useState<{[key: string]: boolean}>({});',
        '  const [expandedTerms, setExpandedTerms] = useState<Record<ExpandedTermsKey, boolean>>(INITIAL_EXPANDED_TERMS_STATE);'
      );

      updated = updated.replace(
        '  const toggleTermContent = (key: string) => {',
        '  const toggleTermContent = (key: ExpandedTermsKey) => {'
      );

      updated = updated.replace(
        '  const handleSubmit = (e: React.FormEvent) => {',
        '  const handleSubmit = (e: FormEvent) => {'
      );

      return collapseBlankLines(updated);
    },
    'Normalized SignupPage state and imports'
  );
}

function patchChatUtils() {
  const file = 'src/pages/chat/utils.ts';
  processFile(
    file,
    (content) => {
      if (!content.includes("split('::')")) {
        return content;
      }

      return content.replace(
        /const base = \(event\.correlation_id \|\| 'unknown'\)\.split\('::'\)\[0\]/,
        `const [base] = (event.correlation_id ?? 'unknown').split('::')\n    const normalizedBase = base ?? 'unknown'`
      ).replace(/acc\[base\]/g, 'acc[normalizedBase]');
    },
    'Hardened correlation_id splitting'
  );
}

function ensureVitestDependency() {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.warn('⚠️  No package.json found to ensure vitest dependency.');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const hasVitest =
    (pkg.devDependencies && pkg.devDependencies.vitest) ||
    (pkg.dependencies && pkg.dependencies.vitest);

  if (hasVitest) {
    console.log('ℹ️  Vitest already present in package.json. Skipping installation.');
    return;
  }

  if (process.env.SKIP_VITEST_INSTALL === '1') {
    console.log('⏭  Skipping Vitest installation (SKIP_VITEST_INSTALL=1).');
    return;
  }

  console.log('⬇️  Installing Vitest as a devDependency...');
  execSync('npm install --save-dev vitest@latest', {
    cwd: projectRoot,
    stdio: 'inherit'
  });
}

function main() {
  console.log('🚀 CareGuide TypeScript fixer starting...');
  fixReactImports();
  removeSpecificIdentifiers();
  patchQuizPage();
  patchQuizListPage();
  patchSignupPage();
  patchChatUtils();
  ensureVitestDependency();
  console.log('\n✅ Fixer complete.');
  if (fileUpdates.length) {
    console.log('Files updated:\n - ' + fileUpdates.join('\n - '));
  } else {
    console.log('No changes were necessary.');
  }
}

main();
