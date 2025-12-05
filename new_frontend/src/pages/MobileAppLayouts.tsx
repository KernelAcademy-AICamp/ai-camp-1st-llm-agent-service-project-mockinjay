import React, { useState } from 'react';
import { 
  Plus, 
  Bell, 
  Heart, 
  MessageCircle, 
  MoreVertical,
  UtensilsCrossed,
  Trophy,
  TrendingUp,
  Mic,
  Send,
  Image as ImageIcon,
  ChevronRight,
  Calendar,
  Award,
  Zap
} from 'lucide-react';

// --- Types & Mock Data ---

type ViewType = 'chat' | 'diet' | 'quiz' | 'community' | 'trends';

const MOCK_POSTS = [
  { id: 1, user: 'Sarah Kim', avatar: 'https://i.pravatar.cc/150?u=1', content: 'Just finished my daily workout! Feeling great. 💪 #fitness #health', time: '2h ago', likes: 24, comments: 5 },
  { id: 2, user: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?u=2', content: 'Tried a new low-sodium recipe today. Surprisingly tasty!', time: '4h ago', likes: 15, comments: 2 },
];

const MOCK_MESSAGES = [
  { id: 1, type: 'ai', content: 'Hello! How can I help you with your health today?', time: '10:00 AM' },
  { id: 2, type: 'user', content: 'Is banana good for CKD stage 3?', time: '10:01 AM' },
  { id: 3, type: 'ai', content: 'For CKD Stage 3, bananas should be limited due to their high potassium content (approx 422mg per medium banana). \n\nConsider these lower-potassium alternatives:\n• Apples\n• Berries\n• Grapes', time: '10:01 AM', tags: ['Nutrition', 'Renal Diet'] },
];

// --- Components ---

const MobileShell: React.FC<{ children: React.ReactNode; activeView: ViewType; onViewChange: (view: ViewType) => void }> = ({ 
  children, 
  activeView, 
  onViewChange 
}) => {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-100 px-6 py-2 pb-6 flex justify-between items-center z-50">
        <NavButton 
          icon={<MessageCircle size={24} />} 
          label="Chat" 
          active={activeView === 'chat'} 
          onClick={() => onViewChange('chat')} 
        />
        <NavButton 
          icon={<UtensilsCrossed size={24} />} 
          label="Diet" 
          active={activeView === 'diet'} 
          onClick={() => onViewChange('diet')} 
        />
        
        {/* Center FAB */}
        <div className="relative -top-6">
          <button className="w-14 h-14 bg-gradient-to-tr from-primary to-primary-hover text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transform transition-transform active:scale-95">
            <Plus size={28} />
          </button>
        </div>

        <NavButton 
          icon={<Trophy size={24} />} 
          label="Quiz" 
          active={activeView === 'quiz'} 
          onClick={() => onViewChange('quiz')} 
        />
        <NavButton 
          icon={<TrendingUp size={24} />} 
          label="Trends" 
          active={activeView === 'trends'} 
          onClick={() => onViewChange('trends')} 
        />
      </div>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ 
  icon, label, active, onClick 
}) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 min-w-[60px] transition-colors ${active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// --- Views ---

const ChatView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">CareGuide AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Agent Tabs */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-b border-gray-50">
        {['General', 'Medical', 'Nutrition', 'Research'].map((tab, i) => (
          <button 
            key={tab}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              i === 0 
                ? 'bg-primary text-white shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        <div className="text-center text-xs text-gray-400 my-4">Today, 10:00 AM</div>
        {MOCK_MESSAGES.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.type === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div 
                className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-br-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
              
              {msg.tags && (
                <div className="flex gap-2 mt-1">
                  {msg.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
            Profile: <span className="text-primary">CKD Stage 3b</span>
          </span>
        </div>
        <div className="flex items-end gap-2">
          <button className="p-3 text-gray-400 hover:text-primary bg-gray-50 rounded-xl transition-colors">
            <ImageIcon size={20} />
          </button>
          <div className="flex-1 bg-gray-50 rounded-xl p-2 flex items-center gap-2 border border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all">
            <input 
              type="text" 
              placeholder="Ask anything..." 
              className="flex-1 bg-transparent text-sm outline-none px-2 py-1"
            />
            <button className="p-1.5 text-gray-400 hover:text-primary">
              <Mic size={18} />
            </button>
          </div>
          <button className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DietView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="px-6 pt-12 pb-6 bg-white rounded-b-[2rem] shadow-sm z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diet Care</h1>
            <p className="text-sm text-gray-500">Today's Nutrition</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar size={20} className="text-gray-600" />
          </div>
        </div>

        {/* Hero Progress Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-white/60 text-xs font-medium mb-1">Daily Score</p>
              <div className="text-4xl font-bold">85<span className="text-lg text-primary font-normal">/100</span></div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs mb-1">Calories</p>
              <p className="font-medium">1,240 / 1,800</p>
            </div>
          </div>

          <div className="space-y-4">
            <NutrientBar label="Sodium" current={1450} max={2000} color="bg-blue-400" />
            <NutrientBar label="Protein" current={42} max={60} color="bg-green-400" />
            <NutrientBar label="Potassium" current={1800} max={2500} color="bg-yellow-400" warning />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Meal Log */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4">Today's Meals</h3>
          <div className="space-y-3">
            <MealCard 
              type="Breakfast" 
              time="8:30 AM" 
              items={['Oatmeal', 'Blueberries', 'Almond Milk']} 
              calories={320} 
            />
            <MealCard 
              type="Lunch" 
              time="12:45 PM" 
              items={['Grilled Chicken Salad', 'Olive Oil Dressing']} 
              calories={450} 
            />
            <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-colors">
              <Plus size={20} />
              Log Dinner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuizView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-indigo-50/30">
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Challenge</h1>
        <p className="text-sm text-gray-500">Keep your streak alive! 🔥 5 days</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        {/* Daily Quiz Card */}
        <div className="bg-white rounded-2xl p-6 shadow-medium border border-indigo-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
              <Award size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Kidney Health Basics</h3>
            <p className="text-gray-500 text-sm mb-6">Test your knowledge about potassium-rich foods.</p>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">
              Start Quiz
            </button>
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4">Recent Results</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                    A+
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sodium Management</p>
                    <p className="text-xs text-gray-400">Yesterday</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendsView: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="px-6 pt-12 pb-6 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Health Trends</h1>
        <div className="flex gap-2 mt-4">
          {['Week', 'Month', 'Year'].map((t, i) => (
            <button key={t} className={`flex-1 py-2 rounded-lg text-sm font-medium ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Chart Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Sodium Intake</h3>
            <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">-12% vs last week</span>
          </div>
          
          <div className="h-40 flex items-end justify-between gap-2">
            {[40, 65, 45, 80, 55, 35, 60].map((h, i) => (
              <div key={i} className="w-full bg-gray-100 rounded-t-lg relative group">
                <div 
                  className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${h > 70 ? 'bg-red-400' : 'bg-primary'}`}
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs mb-1">Avg. Weight</div>
            <div className="text-xl font-bold text-gray-900">68.5 <span className="text-xs font-normal text-gray-400">kg</span></div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs mb-1">BP Average</div>
            <div className="text-xl font-bold text-gray-900">120/80</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const NutrientBar: React.FC<{ label: string; current: number; max: number; color: string; warning?: boolean }> = ({ 
  label, current, max, color, warning 
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/80">{label}</span>
        <span className={warning ? 'text-yellow-400 font-bold' : 'text-white/80'}>
          {current} / {max} mg
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const MealCard: React.FC<{ type: string; time: string; items: string[]; calories: number }> = ({ 
  type, time, items, calories 
}) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
        <UtensilsCrossed size={20} />
      </div>
      <div>
        <h4 className="font-bold text-gray-900 text-sm">{type}</h4>
        <p className="text-xs text-gray-500">{time}</p>
        <p className="text-xs text-gray-400 mt-0.5">{items.join(', ')}</p>
      </div>
    </div>
    <div className="text-right">
      <span className="text-sm font-bold text-gray-900">{calories}</span>
      <span className="text-xs text-gray-400 block">kcal</span>
    </div>
  </div>
);

// --- Main Page Component ---

const MobileAppLayouts: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('chat');

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-8 font-sans">
      {/* Device Frame */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-black ring-4 ring-gray-300">
        
        {/* Status Bar Mockup */}
        <div className="absolute top-0 left-0 right-0 h-[44px] bg-transparent z-50 flex justify-between items-center px-6 text-xs font-medium text-black mix-blend-difference pointer-events-none">
          <span>9:41</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-2.5 bg-current rounded-[1px]" />
            <div className="w-3 h-2.5 bg-current rounded-[1px]" />
            <div className="w-5 h-2.5 border border-current rounded-[2px] relative">
              <div className="absolute inset-0.5 bg-current" />
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <MobileShell activeView={activeView} onViewChange={setActiveView}>
          {activeView === 'chat' && <ChatView />}
          {activeView === 'diet' && <DietView />}
          {activeView === 'quiz' && <QuizView />}
          {activeView === 'trends' && <TrendsView />}
          {activeView === 'community' && (
             // Reusing the "Modern" layout from previous turn (simplified)
             <div className="flex flex-col h-full bg-gray-50">
               <header className="px-6 pt-12 pb-4 bg-white">
                 <div className="flex justify-between items-center mb-4">
                   <h1 className="text-2xl font-bold">Community</h1>
                   <Bell size={20} className="text-gray-600" />
                 </div>
               </header>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {MOCK_POSTS.map(post => (
                   <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                     <div className="flex items-center gap-3 mb-3">
                       <img src={post.avatar} alt={post.user} className="w-10 h-10 rounded-full" />
                       <div>
                         <h3 className="font-semibold text-sm text-gray-900">{post.user}</h3>
                         <p className="text-xs text-gray-500">{post.time}</p>
                       </div>
                     </div>
                     <p className="text-gray-700 text-sm mb-3">{post.content}</p>
                     <div className="flex gap-4 text-gray-400 text-xs">
                       <span className="flex items-center gap-1"><Heart size={14} /> {post.likes}</span>
                       <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.comments}</span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </MobileShell>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-50 pointer-events-none" />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-gray-500 text-sm">
        <p>Interactive Prototype • Click bottom nav to switch views</p>
      </div>
    </div>
  );
};

export default MobileAppLayouts;
