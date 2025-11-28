# CareGuide Component Guide

> Design System v2.0 - Component Usage Reference

## Table of Contents

1. [Buttons](#buttons)
2. [Form Inputs](#form-inputs)
3. [Cards](#cards)
4. [Badges](#badges)
5. [Alerts](#alerts)
6. [Progress](#progress)
7. [Dialogs](#dialogs)
8. [Navigation](#navigation)

---

## Buttons

### Import

```tsx
import { Button } from '@/components/ui';
```

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary actions, CTAs |
| `secondary` | Secondary actions |
| `destructive` | Dangerous/irreversible actions |
| `outline` | Bordered, secondary emphasis |
| `ghost` | Minimal, text-only |
| `link` | Hyperlink style |
| `success` | Positive/confirmation |

### Sizes

| Size | Height | Usage |
|------|--------|-------|
| `sm` | 32px | Compact UI, tables |
| `default` | 40px | Standard buttons |
| `lg` | 48px | Prominent CTAs |
| `icon` | 40x40px | Icon-only buttons |
| `icon-sm` | 32x32px | Small icon buttons |
| `icon-lg` | 48x48px | Large icon buttons |

### Examples

```tsx
// Primary button
<Button>Click me</Button>

// With variant and size
<Button variant="destructive" size="lg">
  Delete Account
</Button>

// Loading state
<Button loading>Processing...</Button>

// With icon
<Button>
  <PlusIcon className="size-4" />
  Add Item
</Button>

// Icon-only button
<Button variant="ghost" size="icon">
  <SettingsIcon className="size-5" />
</Button>

// As link (using Slot)
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

### Accessibility

- Use `aria-label` for icon-only buttons
- Loading state automatically disables interaction
- Focus ring visible on keyboard navigation

```tsx
<Button size="icon" aria-label="Settings">
  <SettingsIcon />
</Button>
```

---

## Form Inputs

### Input

```tsx
import { Input } from '@/components/ui';

// Basic
<Input placeholder="Enter your email" />

// With variant
<Input variant="filled" placeholder="Search..." />

// With icons
<Input
  leftIcon={<SearchIcon className="size-4" />}
  placeholder="Search..."
/>

// Error state
<Input
  error
  errorMessage="This field is required"
  placeholder="Email"
/>

// Sizes
<Input inputSize="sm" />
<Input inputSize="default" />
<Input inputSize="lg" />
```

### Textarea

```tsx
import { Textarea } from '@/components/ui';

// Basic
<Textarea placeholder="Enter description..." />

// With character count
<Textarea
  showCharCount
  maxLength={500}
  placeholder="Write your message..."
/>

// Error state
<Textarea
  error
  errorMessage="Description is required"
/>
```

### Checkbox

```tsx
import { Checkbox } from '@/components/ui';

// Basic
<Checkbox />

// With label
<Checkbox
  label="I agree to the terms"
  description="Read our terms of service"
/>

// Controlled
const [checked, setChecked] = useState(false);
<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
  label="Enable notifications"
/>

// Indeterminate (for "select all")
<Checkbox checked="indeterminate" />

// Sizes
<Checkbox size="sm" />
<Checkbox size="default" />
<Checkbox size="lg" />
```

### Select

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>

// Small size
<SelectTrigger size="sm">
  <SelectValue placeholder="Filter" />
</SelectTrigger>
```

---

## Cards

### Import

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  InteractiveCard,
} from '@/components/ui';
```

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Standard card with subtle shadow |
| `elevated` | More prominent shadow |
| `outlined` | Border-only, minimal depth |
| `interactive` | Clickable cards with hover effects |
| `glass` | Glassmorphism effect |
| `ghost` | No visible container |

### Examples

```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// With action button in header
<Card>
  <CardHeader>
    <CardTitle>Settings</CardTitle>
    <CardAction>
      <Button variant="ghost" size="icon">
        <MoreIcon />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Interactive card (clickable)
<InteractiveCard onClick={handleClick}>
  <CardContent className="p-6">
    <h3>Click me</h3>
    <p>This card is clickable</p>
  </CardContent>
</InteractiveCard>

// Card with padding variant
<Card padding="lg">
  <p>Padded content</p>
</Card>

// Glass card
<Card variant="glass">
  <CardContent>Glassmorphism effect</CardContent>
</Card>
```

---

## Badges

### Import

```tsx
import { Badge, BadgeCounter } from '@/components/ui';
```

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary brand |
| `secondary` | Secondary accent |
| `success` | Positive status |
| `warning` | Caution |
| `error` | Error/destructive |
| `info` | Informational |
| `outline` | Bordered |
| `soft` | Subtle background |
| `soft-success/warning/error/info` | Soft status variants |
| `ghost` | Minimal |

### Examples

```tsx
// Basic
<Badge>New</Badge>

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Expired</Badge>

// Soft variants
<Badge variant="soft-success">Completed</Badge>

// With dot indicator
<Badge dot>Online</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="default">Default</Badge>
<Badge size="lg">Large</Badge>

// Counter badge (for notifications)
<BadgeCounter count={5} />
<BadgeCounter count={150} max={99} /> // Shows "99+"

// As link
<Badge asChild>
  <a href="/new">New Feature</a>
</Badge>
```

---

## Alerts

### Import

```tsx
import {
  Alert,
  AlertTitle,
  AlertDescription,
  InfoAlert,
  SuccessAlert,
  WarningAlert,
  ErrorAlert,
} from '@/components/ui';
```

### Variants

| Variant | Icon | Usage |
|---------|------|-------|
| `default` | AlertCircle | Neutral |
| `info` | Info | Informational |
| `success` | CheckCircle | Positive |
| `warning` | AlertTriangle | Caution |
| `destructive` | XCircle | Error |

### Examples

```tsx
// Full alert
<Alert variant="success">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>
    Your changes have been saved.
  </AlertDescription>
</Alert>

// Convenience components
<InfoAlert>
  <AlertTitle>Did you know?</AlertTitle>
  <AlertDescription>
    You can customize your profile settings.
  </AlertDescription>
</InfoAlert>

<SuccessAlert>
  <AlertTitle>Payment received</AlertTitle>
</SuccessAlert>

<WarningAlert>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    Your subscription expires in 3 days.
  </AlertDescription>
</WarningAlert>

<ErrorAlert>
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Unable to connect to server.
  </AlertDescription>
</ErrorAlert>

// Without icon
<Alert showIcon={false}>
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>Simple message</AlertDescription>
</Alert>

// Custom icon
<Alert icon={<StarIcon />}>
  <AlertTitle>Featured</AlertTitle>
</Alert>
```

---

## Progress

### Import

```tsx
import { Progress, CircularProgress } from '@/components/ui';
```

### Linear Progress

```tsx
// Basic
<Progress value={60} />

// Sizes
<Progress value={60} size="xs" />
<Progress value={60} size="sm" />
<Progress value={60} size="default" />
<Progress value={60} size="lg" />
<Progress value={60} size="xl" />

// Variants
<Progress value={60} variant="primary" />
<Progress value={60} variant="secondary" />
<Progress value={60} variant="success" />

// Indicator variants
<Progress value={60} indicatorVariant="gradient" />
<Progress value={60} indicatorVariant="animated" />

// With label
<Progress value={60} showLabel />

// Custom label format
<Progress
  value={60}
  showLabel
  labelFormat={(v) => `${v}% complete`}
/>

// With glow effect
<Progress value={60} showGlow />
```

### Circular Progress

```tsx
// Basic
<CircularProgress value={75} />

// Custom size
<CircularProgress value={75} size={80} strokeWidth={8} />

// Variants
<CircularProgress value={75} variant="primary" />
<CircularProgress value={75} variant="secondary" />
<CircularProgress value={75} variant="success" />

// Without label
<CircularProgress value={75} showLabel={false} />

// Custom label
<CircularProgress
  value={75}
  labelFormat={(v) => `${v}%`}
/>
```

---

## Dialogs

### Import

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui';
```

### Examples

```tsx
// Basic dialog
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is a description of the dialog content.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      <p>Dialog content goes here</p>
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Controlled dialog
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmation</DialogTitle>
    </DialogHeader>
    <p>Are you sure?</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Alert Dialog

For confirmations that require explicit user action.

```tsx
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Navigation

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Content for tab 1
  </TabsContent>
  <TabsContent value="tab2">
    Content for tab 2
  </TabsContent>
  <TabsContent value="tab3">
    Content for tab 3
  </TabsContent>
</Tabs>
```

### Breadcrumb

```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/products">Products</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current Page</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Pagination

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui';

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

## Best Practices

### 1. Consistency

Always use design system components instead of custom styles:

```tsx
// Good
<Button variant="destructive">Delete</Button>

// Avoid
<button className="bg-red-500 text-white px-4 py-2">Delete</button>
```

### 2. Accessibility

- Use semantic HTML elements
- Add proper ARIA attributes
- Ensure keyboard navigation works
- Maintain color contrast ratios

```tsx
// Good
<Button aria-label="Close dialog" size="icon">
  <XIcon />
</Button>

// Add descriptions for complex interactions
<Checkbox
  label="Enable dark mode"
  description="Switch to dark theme for better viewing at night"
/>
```

### 3. Responsive Design

Use breakpoint-aware classes:

```tsx
<Button className="w-full sm:w-auto">
  Full width on mobile, auto on desktop
</Button>

<Card className="p-4 md:p-6 lg:p-8">
  Responsive padding
</Card>
```

### 4. Loading States

Always handle loading states:

```tsx
<Button loading={isSubmitting} disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

### 5. Error Handling

Use error states consistently:

```tsx
<Input
  error={!!errors.email}
  errorMessage={errors.email?.message}
  {...register('email')}
/>
```

---

## Import Cheatsheet

```tsx
// Form components
import { Button, Input, Textarea, Checkbox, Select, Switch } from '@/components/ui';

// Display components
import { Card, Badge, Alert, Progress, Skeleton } from '@/components/ui';

// Overlay components
import { Dialog, AlertDialog, Sheet, Popover, Tooltip } from '@/components/ui';

// Navigation
import { Tabs, Breadcrumb, Pagination } from '@/components/ui';

// Layout
import { ScrollArea, Accordion, Separator } from '@/components/ui';

// Utility
import { cn } from '@/components/ui';
```
