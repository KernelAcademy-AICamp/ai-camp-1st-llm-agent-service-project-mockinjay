#!/usr/bin/env node

/**
 * fix-remaining-errors.js
 * ------------------------
 * Automates the last batch of TypeScript cleanups called out in the build log:
 * 1. Ensures Vitest is installed (tests reference it directly).
 * 2. Removes the explicit unused imports/variables surfaced by `tsc --noEmit`.
 * 3. Adds null guards to `src/pages/Quiz.tsx` so undefined questions do not trip type checks.
 *
 * Usage:
 *   cd frontend
 *   node scripts/fix-remaining-errors.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const collapseBlankLines = (content) => content.replace(/\n{3,}/g, '\n\n');

function runCommand(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { cwd: projectRoot, stdio: 'inherit' });
}

function updateFile(relPath, updater, description) {
  const targetPath = path.join(projectRoot, relPath);
  if (!fs.existsSync(targetPath)) {
    console.warn(`⚠️  Skipping missing file: ${relPath}`);
    return;
  }

  const original = fs.readFileSync(targetPath, 'utf8');
  const updated = collapseBlankLines(updater(original));
  if (updated !== original) {
    fs.writeFileSync(targetPath, updated);
    console.log(`✔ ${description} (${relPath})`);
  } else {
    console.log(`• No changes needed (${relPath})`);
  }
}

runCommand('npm install --save-dev vitest');

const fileTransforms = [
  {
    file: 'src/pages/chat/ChatPage.tsx',
    description: 'Clean up unused Parlant imports and stopRequested state',
    update: (content) => {
      let updated = content;
      updated = updated.replace(/\n\s*ParlantEvent,\n/, '\n');
      updated = updated.replace(/\n\s*IngredientCandidate\n/, '\n');
      updated = updated.replace(/,\n\} from '\.\/utils'/, "\n} from './utils'");
      updated = updated.replace('const [stopRequested, setStopRequested] = useState(false)', 'const [, setStopRequested] = useState(false)');
      return updated;
    }
  },
  {
    file: 'src/pages/chat/SimpleChatPage.tsx',
    description: 'Drop unused axios import and API_URL constant',
    update: (content) => {
      let updated = content;
      updated = updated.replace(/import axios from 'axios'\s*\n/, '');
      updated = updated.replace(/const API_URL = [^\n]+\n\n/, '');
      return updated;
    }
  },
  {
    file: 'src/pages/CommunityCreatePage.tsx',
    description: 'Remove unused image state',
    update: (content) => content.replace(/  const \[image, setImage\] = useState<string>\(''\);\n/, '')
  },
  {
    file: 'src/pages/CommunityDetailPage.tsx',
    description: 'Trim unused params and setters',
    update: (content) => {
      let updated = content;
      updated = updated.replace("import { useNavigate, useParams } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';");
      updated = updated.replace(/\s*const \{ id \} = useParams\(\);\n/, '\n');
      updated = updated.replace('const [postData, setPostData] = useState<PostDetail>(emptyPost);', 'const [postData] = useState<PostDetail>(emptyPost);');
      updated = updated.replace('const [comments, setComments] = useState<Comment[]>(emptyComments);', 'const [comments] = useState<Comment[]>(emptyComments);');
      return updated;
    }
  },
  {
    file: 'src/pages/CommunityPage.tsx',
    description: 'Remove unused category parameter from helper',
    update: (content) => {
      let updated = content;
      updated = updated.replace(/getCategoryColor\(post\.category\)/g, 'getCategoryColor()');
      updated = updated.replace("function getCategoryColor(category: Post['category']) {", 'function getCategoryColor() {');
      return updated;
    }
  },
  {
    file: 'src/pages/DietCare.tsx',
    description: 'Remove unused meal log setter',
    update: (content) => content.replace('const [mealLogs, setMealLogs] = useState<MealLog[]>([])', 'const [mealLogs] = useState<MealLog[]>([])')
  },
  {
    file: 'src/pages/DietCarePage.tsx',
    description: 'Drop unused Target icon and navigate hook',
    update: (content) => {
      let updated = content;
      updated = updated.replace(/import \{ useNavigate \} from 'react-router-dom';\n/, '');
      updated = updated.replace(', Target', '');
      updated = updated.replace(/  const navigate = useNavigate\(\);\n/, '');
      return updated;
    }
  },
  {
    file: 'src/pages/DietLogPage.tsx',
    description: 'Remove unused diet log modal state',
    update: (content) => {
      let updated = content;
      updated = updated.replace(/  const \[showLogModal, setShowLogModal\] = useState\(false\);\n/, '');
      updated = updated.replace(/  const \[editingLog, setEditingLog\] = useState<MealLog \| null>\(null\);\n/, '');
      return updated;
    }
  },
  {
    file: 'src/pages/HealthRecordAddPage.tsx',
    description: 'Drop unused ArrowLeft import',
    update: (content) => content.replace(/import \{ ArrowLeft \} from 'lucide-react';\n/, '')
  },
  {
    file: 'src/pages/HealthRecordsPage.tsx',
    description: 'Keep only the Plus icon import',
    update: (content) => content.replace("import { Plus, Calendar, X, ChevronDown } from 'lucide-react';", "import { Plus } from 'lucide-react';")
  },
  {
    file: 'src/pages/MyPage.tsx',
    description: 'Remove unused Check and Save icons',
    update: (content) => content.replace('Calendar, Check, Save, FileText', 'Calendar, FileText')
  },
  {
    file: 'src/pages/NewsDetailPage.tsx',
    description: 'Drop unused route params and setters',
    update: (content) => {
      let updated = content;
      updated = updated.replace("import { useNavigate, useParams } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';");
      updated = updated.replace(/\s*const \{ id \} = useParams\(\);\n/, '\n');
      updated = updated.replace('const [newsData, setNewsData] = useState<NewsItem>(emptyNews);', 'const [newsData] = useState<NewsItem>(emptyNews);');
      updated = updated.replace('const [relatedNews, setRelatedNews] = useState<RelatedNews[]>(emptyRelatedNews);', 'const [relatedNews] = useState<RelatedNews[]>(emptyRelatedNews);');
      return updated;
    }
  },
  {
    file: 'src/pages/NutriCoachPage.tsx',
    description: 'Remove unused navigate hook',
    update: (content) => {
      let updated = content;
      updated = updated.replace(/import \{ useNavigate \} from 'react-router-dom';\n/, '');
      updated = updated.replace(/  const navigate = useNavigate\(\);\n/, '');
      return updated;
    }
  },
  {
    file: 'src/pages/QuizPage.tsx',
    description: 'Remove unused completedQuizzes state and icon color',
    update: (content) => {
      let updated = content;
      updated = updated.replace(/\s*const \[completedQuizzes, setCompletedQuizzes\] = useState<Set<string>>\(new Set\(\)\);\n/, '\n');
      updated = updated.replace(/\n\s*setCompletedQuizzes\([^\n]+\);\n/, '\n');
      updated = updated.replace(/\s*let iconColor = 'var\(--color-text-tertiary\)';\n/, '\n');
      return updated;
    }
  },
  {
    file: 'src/pages/SupportPage.tsx',
    description: 'Remove unused HelpCircle import',
    update: (content) => content.replace('HelpCircle, ', '')
  },
  {
    file: 'src/pages/Quiz.tsx',
    description: 'Add null guards around quiz questions',
    update: (content) => {
      let updated = content;
      const stateNeedle = "  const [quizCompleted, setQuizCompleted] = useState(false)\n\n  const handleActivity";
      if (updated.includes(stateNeedle)) {
        updated = updated.replace(
          stateNeedle,
          "  const [quizCompleted, setQuizCompleted] = useState(false)\n  const question = quizQuestions[currentQuestion] ?? null\n\n  const handleActivity"
        );
      }

      const handlerNeedle = `  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setShowExplanation(true)

    if (answerIndex === quizQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }
  }
`;
      const handlerReplacement = `  const handleAnswerSelect = (answerIndex: number) => {
    const activeQuestion = quizQuestions[currentQuestion]
    if (!activeQuestion) {
      return
    }

    setSelectedAnswer(answerIndex)
    setShowExplanation(true)

    if (answerIndex === activeQuestion.correctAnswer) {
      setScore(score + 1)
    }
  }
`;
      updated = updated.replace(handlerNeedle, handlerReplacement);

      const guardNeedle = '\n  const question = quizQuestions[currentQuestion]\n\n  return (';
      const guardReplacement = `
  if (!question) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4 text-center text-[var(--color-text-secondary)]">
        퀴즈 데이터를 불러오는 중입니다.
      </div>
    )
  }

  return (`;
      updated = updated.replace(guardNeedle, guardReplacement);

      return updated;
    }
  }
];

for (const transform of fileTransforms) {
  updateFile(transform.file, transform.update, transform.description);
}

console.log('\n✅ Remaining TypeScript fixes applied. Run `npm run build` when ready to verify.');
