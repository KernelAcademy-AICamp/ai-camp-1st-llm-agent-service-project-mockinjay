/**
 * UI Components Index - Design System v2.0
 *
 * Central export for all UI components.
 * Import from '@/components/ui' instead of individual files.
 */

// ============================================
// ICON SYSTEM
// ============================================
export {
  Icon,
  LoadingSpinner,
  StatusIcon,
  EmptyStateIcon,
  type IconComponentProps,
  type LoadingSpinnerProps,
  type StatusIconProps,
  type EmptyStateIconProps,
} from './Icon';

export {
  IconButton,
  CloseButton,
  MenuButton,
  BackButton,
  SearchButton,
  MoreButton,
  type IconButtonProps,
  type CloseButtonProps,
  type MenuButtonProps,
  type BackButtonProps,
  type SearchButtonProps,
  type MoreButtonProps,
} from './IconButton';

export {
  ButtonWithIcon,
  SendButton,
  DownloadButton,
  AddButton,
  EditButton,
  DeleteButton,
  ShareButton,
  RefreshButton,
  type ButtonWithIconProps,
  type SendButtonProps,
  type DownloadButtonProps,
  type AddButtonProps,
  type EditButtonProps,
  type DeleteButtonProps,
  type ShareButtonProps,
  type RefreshButtonProps,
} from './ButtonWithIcon';

// Icon System Config
export type {
  IconName,
  IconSize,
  IconStrokeWidth,
  IconColor,
  IconPreset,
  LucideIcon,
} from '../../config/iconSystem';

export {
  ICON_SIZES,
  ICON_STROKE_WIDTHS,
  ICON_COLORS,
  ICON_PRESETS,
  NAVIGATION_ICONS,
  ACTION_ICONS,
  MEDIA_ICONS,
  COMMUNICATION_ICONS,
  HEALTH_ICONS,
  FOOD_ICONS,
  STATUS_ICONS,
  LOADING_ICONS,
  USER_ICONS,
  SETTINGS_ICONS,
  TIME_ICONS,
  INTERACTION_ICONS,
  MISC_ICONS,
  CHART_ICONS,
  AUTH_ICONS,
  ALL_ICONS,
} from '../../config/iconSystem';

// ============================================
// FORM COMPONENTS
// ============================================
export { Button, buttonVariants, type ButtonProps } from './button';
export { Input, inputVariants, type InputProps } from './input';
export { Textarea, textareaVariants } from './textarea';
export { Checkbox, checkboxVariants } from './checkbox';
export { Label } from './label';
export { Switch } from './switch';
export { Slider } from './slider';
export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './select';
export { RadioGroup, RadioGroupItem } from './radio-group';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';

// ============================================
// DISPLAY COMPONENTS
// ============================================
export {
  Card,
  InteractiveCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardImage,
  cardVariants,
} from './card';
export { Badge, BadgeCounter, badgeVariants, type BadgeProps } from './badge';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export {
  Alert,
  AlertTitle,
  AlertDescription,
  InfoAlert,
  SuccessAlert,
  WarningAlert,
  ErrorAlert,
  alertVariants,
} from './alert';
export { Progress, CircularProgress, progressVariants, progressIndicatorVariants } from './progress';
export { Separator } from './separator';
export { Skeleton, SkeletonText, SkeletonCard } from './skeleton';
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

// ============================================
// NAVIGATION COMPONENTS
// ============================================
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

// ============================================
// OVERLAY COMPONENTS
// ============================================
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from './dialog';
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from './sheet';
export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from './drawer';
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from './popover';
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './tooltip';
export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from './hover-card';

// ============================================
// MENU COMPONENTS
// ============================================
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './command';

// ============================================
// LAYOUT COMPONENTS
// ============================================
export { ScrollArea, ScrollBar } from './scroll-area';
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './accordion';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

// ============================================
// FEEDBACK COMPONENTS
// ============================================
export { LoadingSpinner as Spinner, InlineSpinner } from './loading-spinner';
export { Sonner, toast } from './sonner';

// ============================================
// SPECIALIZED COMPONENTS
// ============================================
export { Calendar } from './calendar';
export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from './carousel';
export { Toggle, toggleVariants } from './toggle';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './input-otp';

// ============================================
// UTILITY
// ============================================
export { cn } from './utils';
