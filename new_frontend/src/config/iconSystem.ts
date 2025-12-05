/**
 * Icon System Configuration
 * CareGuide 아이콘 시스템 설정
 *
 * Lucide React 아이콘 라이브러리를 사용한 일관된 아이콘 시스템
 * - 크기 표준화
 * - 스타일 일관성 (strokeWidth)
 * - 색상 시스템 통합
 * - 접근성 고려
 */

import {
  // Navigation Icons
  MessageSquare,
  UtensilsCrossed,
  Trophy,
  Users,
  TrendingUp,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,

  // Action Icons
  Send,
  Search,
  Filter,
  Plus,
  Minus,
  Edit,
  Trash2,
  Download,
  Upload,
  Share2,
  Copy,
  ExternalLink,
  MoreVertical,
  MoreHorizontal,
  Check,

  // Media Icons
  Image as ImageIcon,
  Camera,
  Video,
  FileText,
  File,
  Newspaper,

  // Communication Icons
  Bell,
  Mail,
  Phone,
  MessageCircle,

  // Health & Medical Icons
  Heart,
  HeartPulse,
  Activity,
  Pill,
  Stethoscope,
  Syringe,
  Thermometer,
  Bone,
  Brain,
  FlaskConical,

  // Food & Nutrition Icons
  UtensilsCrossed as Fork,
  Coffee,
  Apple,
  Salad,
  ChefHat,

  // Status Icons
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Circle,

  // Loading Icons
  Loader2,
  RefreshCw,

  // User & Profile Icons
  UserCircle,
  Users2,
  UserPlus,
  UserMinus,
  UserCheck,

  // Settings & System Icons
  Settings,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Shield,
  Key,

  // Time & Calendar Icons
  Clock,
  Calendar,
  CalendarDays,
  History,

  // Interaction Icons
  ThumbsUp,
  ThumbsDown,
  Star,
  Bookmark,
  Flag,
  Lightbulb,

  // Misc Icons
  Globe,
  Languages,
  MapPin,
  Home,
  Building2,
  Sparkles,
  Zap,
  Target,
  Award,
  Moon,
  Sun,
  Inbox,
  BookOpen,
  GitCompare,
  Tag,

  // Chart & Data Icons
  BarChart,
  BarChart3,
  LineChart,
  PieChart,

  // Log In/Out Icons
  LogIn,
  LogOut,

  type LucideIcon
} from 'lucide-react';

// ===========================================
// ICON SIZE CONSTANTS
// ===========================================

export const ICON_SIZES = {
  xs: 12,    // Extra small - 작은 표시용
  sm: 16,    // Small - 인라인 텍스트, 작은 버튼
  md: 20,    // Medium (기본) - 일반 버튼, 네비게이션
  lg: 24,    // Large - 헤더, 큰 버튼
  xl: 32,    // Extra large - 아이콘 전용 버튼, 대형 표시
  '2xl': 48, // 2X Large - 빈 상태, 대형 일러스트
  '3xl': 64, // 3X Large - 스플래시, 대형 일러스트
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// ===========================================
// STROKE WIDTH CONSTANTS
// ===========================================

export const ICON_STROKE_WIDTHS = {
  thin: 1,      // 얇은 선 - 섬세한 아이콘
  normal: 1.5,  // 기본 선 - 일반 아이콘
  medium: 2,    // 중간 선 - 강조 아이콘
  bold: 2.5,    // 굵은 선 - 강한 강조
  heavy: 3,     // 매우 굵은 선 - 특별한 강조
} as const;

export type IconStrokeWidth = keyof typeof ICON_STROKE_WIDTHS;

// ===========================================
// ICON COLLECTIONS BY CATEGORY
// ===========================================

export const NAVIGATION_ICONS = {
  chat: MessageSquare,
  diet: UtensilsCrossed,
  quiz: Trophy,
  community: Users,
  trends: TrendingUp,
  mypage: User,
  menu: Menu,
  close: X,
  back: ChevronLeft,
  forward: ChevronRight,
  down: ChevronDown,
  up: ChevronUp,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
} as const;

export const ACTION_ICONS = {
  send: Send,
  search: Search,
  filter: Filter,
  add: Plus,
  remove: Minus,
  edit: Edit,
  delete: Trash2,
  download: Download,
  upload: Upload,
  share: Share2,
  copy: Copy,
  external: ExternalLink,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  check: Check,
} as const;

export const MEDIA_ICONS = {
  image: ImageIcon,
  camera: Camera,
  video: Video,
  document: FileText,
  file: File,
  newspaper: Newspaper,
} as const;

export const COMMUNICATION_ICONS = {
  notification: Bell,
  email: Mail,
  phone: Phone,
  message: MessageCircle,
} as const;

export const HEALTH_ICONS = {
  heart: Heart,
  heartPulse: HeartPulse,
  activity: Activity,
  pill: Pill,
  stethoscope: Stethoscope,
  syringe: Syringe,
  thermometer: Thermometer,
  bone: Bone,
  brain: Brain,
  flask: FlaskConical,
} as const;

export const FOOD_ICONS = {
  utensils: Fork,
  coffee: Coffee,
  apple: Apple,
  salad: Salad,
  chefHat: ChefHat,
} as const;

export const STATUS_ICONS = {
  success: CheckCircle,
  error: XCircle,
  alert: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  help: HelpCircle,
  circle: Circle,
} as const;

export const LOADING_ICONS = {
  spinner: Loader2,
  refresh: RefreshCw,
} as const;

export const USER_ICONS = {
  user: User,
  userCircle: UserCircle,
  users: Users2,
  userAdd: UserPlus,
  userRemove: UserMinus,
  userCheck: UserCheck,
} as const;

export const SETTINGS_ICONS = {
  settings: Settings,
  lock: Lock,
  unlock: Unlock,
  visible: Eye,
  hidden: EyeOff,
  shield: Shield,
  key: Key,
} as const;

export const TIME_ICONS = {
  clock: Clock,
  calendar: Calendar,
  calendarDays: CalendarDays,
  history: History,
} as const;

export const INTERACTION_ICONS = {
  like: ThumbsUp,
  dislike: ThumbsDown,
  star: Star,
  bookmark: Bookmark,
  flag: Flag,
  lightbulb: Lightbulb,
} as const;

export const MISC_ICONS = {
  globe: Globe,
  languages: Languages,
  location: MapPin,
  home: Home,
  building: Building2,
  sparkles: Sparkles,
  zap: Zap,
  target: Target,
  award: Award,
  moon: Moon,
  sun: Sun,
  inbox: Inbox,
  bookOpen: BookOpen,
  compare: GitCompare,
  tag: Tag,
} as const;

export const CHART_ICONS = {
  bar: BarChart,
  bar3: BarChart3,
  line: LineChart,
  pie: PieChart,
} as const;

export const AUTH_ICONS = {
  login: LogIn,
  logout: LogOut,
} as const;

// ===========================================
// ALL ICONS COMBINED
// ===========================================

export const ALL_ICONS = {
  ...NAVIGATION_ICONS,
  ...ACTION_ICONS,
  ...MEDIA_ICONS,
  ...COMMUNICATION_ICONS,
  ...HEALTH_ICONS,
  ...FOOD_ICONS,
  ...STATUS_ICONS,
  ...LOADING_ICONS,
  ...USER_ICONS,
  ...SETTINGS_ICONS,
  ...TIME_ICONS,
  ...INTERACTION_ICONS,
  ...MISC_ICONS,
  ...CHART_ICONS,
  ...AUTH_ICONS,
} as const;

export type IconName = keyof typeof ALL_ICONS;

// ===========================================
// ICON COLOR MAPPINGS (using Tailwind classes)
// ===========================================

export const ICON_COLORS = {
  // Brand Colors
  primary: 'text-primary',
  secondary: 'text-secondary',

  // Semantic Colors
  success: 'text-success-600',
  error: 'text-error-600',
  warning: 'text-warning-600',
  info: 'text-info-600',

  // Neutral Colors
  default: 'text-gray-600',
  muted: 'text-gray-400',
  subtle: 'text-gray-300',

  // Special Colors
  white: 'text-white',
  black: 'text-gray-900',

  // Interactive States
  hover: 'hover:text-primary',
  active: 'text-primary',
  disabled: 'text-gray-300',
} as const;

export type IconColor = keyof typeof ICON_COLORS;

// ===========================================
// ICON PRESETS FOR COMMON SCENARIOS
// ===========================================

export const ICON_PRESETS = {
  // Navigation icons
  navItem: {
    size: ICON_SIZES.md,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },
  navItemActive: {
    size: ICON_SIZES.md,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },

  // Button icons
  button: {
    size: ICON_SIZES.md,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },
  buttonSmall: {
    size: ICON_SIZES.sm,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },
  buttonLarge: {
    size: ICON_SIZES.lg,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },

  // Icon-only buttons
  iconButton: {
    size: ICON_SIZES.md,
    strokeWidth: ICON_STROKE_WIDTHS.medium,
  },
  iconButtonSmall: {
    size: ICON_SIZES.sm,
    strokeWidth: ICON_STROKE_WIDTHS.medium,
  },

  // Status icons
  status: {
    size: ICON_SIZES.md,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },
  statusLarge: {
    size: ICON_SIZES.xl,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },

  // Loading spinners
  spinner: {
    size: ICON_SIZES.md,
    strokeWidth: ICON_STROKE_WIDTHS.medium,
  },
  spinnerLarge: {
    size: ICON_SIZES.xl,
    strokeWidth: ICON_STROKE_WIDTHS.medium,
  },

  // Empty state icons
  emptyState: {
    size: ICON_SIZES['2xl'],
    strokeWidth: ICON_STROKE_WIDTHS.thin,
  },

  // Inline icons (with text)
  inline: {
    size: ICON_SIZES.sm,
    strokeWidth: ICON_STROKE_WIDTHS.normal,
  },

  // Header icons
  header: {
    size: ICON_SIZES.lg,
    strokeWidth: ICON_STROKE_WIDTHS.medium,
  },
} as const;

export type IconPreset = keyof typeof ICON_PRESETS;

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get icon size value
 */
export function getIconSize(size: IconSize | number): number {
  return typeof size === 'number' ? size : ICON_SIZES[size];
}

/**
 * Get icon stroke width value
 */
export function getIconStrokeWidth(strokeWidth: IconStrokeWidth | number): number {
  return typeof strokeWidth === 'number' ? strokeWidth : ICON_STROKE_WIDTHS[strokeWidth];
}

/**
 * Get icon from name
 */
export function getIcon(name: IconName): LucideIcon {
  return ALL_ICONS[name];
}

/**
 * Get icon preset configuration
 */
export function getIconPreset(preset: IconPreset) {
  return ICON_PRESETS[preset];
}

// ===========================================
// ICON ACCESSIBILITY HELPERS
// ===========================================

export const ICON_ARIA = {
  /**
   * For decorative icons (with adjacent text)
   */
  decorative: {
    'aria-hidden': 'true',
  },

  /**
   * For semantic icons (standalone)
   */
  semantic: (label: string) => ({
    'aria-label': label,
    role: 'img',
  }),

  /**
   * For interactive icons (buttons)
   */
  interactive: (label: string) => ({
    'aria-label': label,
  }),
} as const;

// ===========================================
// EXPORT TYPES
// ===========================================

export type { LucideIcon };

export interface IconProps {
  name?: IconName;
  size?: IconSize | number;
  strokeWidth?: IconStrokeWidth | number;
  color?: IconColor | string;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  role?: string;
}
