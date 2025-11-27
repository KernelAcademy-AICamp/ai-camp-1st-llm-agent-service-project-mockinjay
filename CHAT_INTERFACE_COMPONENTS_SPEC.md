# Chat Interface Component Specifications

**Document Version:** 1.0
**Application:** CareGuide Healthcare AI Chat
**Last Updated:** 2025-11-26

---

## Table of Contents

1. [Chat Sidebar](#1-chat-sidebar)
2. [Chat Header](#2-chat-header)
3. [Chat Messages Area](#3-chat-messages-area)
4. [Chat Input Area](#4-chat-input-area)
5. [Empty States](#5-empty-states)
6. [Modal Dialogs](#6-modal-dialogs)
7. [Loading States](#7-loading-states)
8. [Error States](#8-error-states)

---

## 1. Chat Sidebar

### 1.1 Overview

**Purpose:** Display conversation history and allow navigation between chat sessions

**Location:** Left side (desktop only, 280px width), Hidden on mobile

**Components:**
- New chat button
- Session list
- Session items with metadata

### 1.2 Visual Specification

```
┌─────────────────────────────────┐
│  [+ New Chat]                   │  ← 44px height, full width
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏥 Medical Consultation │   │  ← Session item
│  │ "How to reduce..."      │   │    Title (14px, bold)
│  │ 2 hours ago      [3]    │   │    Preview + time + unread
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🍎 Nutrition Advice    │   │
│  │ "Is banana good for..." │   │
│  │ Yesterday               │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📊 Research Query      │   │
│  │ "Latest CKD studies"    │   │
│  │ 3 days ago             │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 1.3 Component Breakdown

#### New Chat Button

**Dimensions:**
- Width: 100% (280px - 32px padding)
- Height: 44px
- Margin: 16px

**States:**

**Default:**
```css
background: var(--gradient-primary);
color: white;
border-radius: 12px;
font-size: 14px;
font-weight: 600;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
```

**Hover:**
```css
opacity: 0.9;
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(0, 200, 180, 0.3);
```

**Active:**
```css
transform: translateY(0);
```

#### Session List Container

**Dimensions:**
- Width: 100%
- Height: Scrollable (calc(100vh - 180px))
- Padding: 0 16px

**Styling:**
```css
overflow-y: auto;
scrollbar-width: thin;
scrollbar-color: #D1D5DB #F3F4F6;
```

#### Session Item

**Dimensions:**
- Width: 100%
- Height: Auto (min 72px)
- Padding: 12px
- Margin Bottom: 8px
- Border Radius: 12px

**States:**

**Default (Unselected):**
```css
background-color: white;
border: 1px solid #E5E7EB;
cursor: pointer;
transition: all 200ms ease-in-out;
```

**Hover:**
```css
background-color: #F9FAFB;
border-color: var(--color-primary);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
```

**Active (Selected):**
```css
background-color: #F2FFFD;
border: 2px solid var(--color-primary);
```

**Layout Structure:**
```
┌────────────────────────────┐
│ 🏥 Session Title          │  ← Icon (16px) + Title (14px, bold)
│ Last message preview...    │  ← Preview (12px, gray-600)
│ 2h ago               [3]   │  ← Timestamp (11px) + Unread badge
└────────────────────────────┘
```

#### Session Title

```css
font-size: 14px;
font-weight: 600;
color: var(--color-text-primary);
display: flex;
align-items: center;
gap: 6px;
margin-bottom: 4px;
```

#### Message Preview

```css
font-size: 12px;
color: var(--color-text-secondary);
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
margin-bottom: 6px;
```

#### Timestamp

```css
font-size: 11px;
color: var(--color-text-tertiary);
```

#### Unread Badge

**Dimensions:**
- Min Width: 20px
- Height: 20px
- Padding: 0 6px
- Border Radius: 10px (pill shape)

**Styling:**
```css
background-color: #EF4444;
color: white;
font-size: 11px;
font-weight: 600;
display: inline-flex;
align-items: center;
justify-content: center;
float: right;
```

---

## 2. Chat Header

### 2.1 Overview

**Purpose:** Display agent selection tabs and session controls

**Location:** Top of chat area (below main navigation)

**Height:** Auto (min 100px)

**Components:**
- Agent type tabs
- Stop response button (conditional)
- Reset session button
- Reset all sessions button

### 2.2 Visual Specification

```
┌─────────────────────────────────────────────────────────────┐
│  AI Chatbot                                          [⚙️]  │  ← Title + Settings
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [✨ Auto] [💙 Medical] [🥗 Nutrition] [📄 Research]      │  ← Agent tabs
│                                                              │
│  ⚠️ Disclaimer: AI 정보는 참고용입니다...           [🛑 Stop] │  ← Disclaimer + Stop
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Component Breakdown

#### Header Container

**Dimensions:**
- Width: 100%
- Padding: 12px 16px (mobile), 16px 24px (desktop)
- Background: White
- Border Bottom: 1px solid #E5E7EB

#### Title Section

**Layout:**
```css
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 12px;
```

**Title:**
```css
font-size: 20px (mobile), 24px (desktop);
font-weight: 700;
color: var(--color-text-primary);
```

**Settings Button:**
```css
width: 40px;
height: 40px;
border-radius: 50%;
background-color: transparent;
color: var(--color-text-tertiary);
transition: all 200ms;
```

```css
/* Hover */
background-color: #F3F4F6;
color: var(--color-primary);
```

#### Agent Tabs Container

**Dimensions:**
- Width: 100%
- Display: Flex
- Gap: 8px (mobile), 16px (desktop)
- Overflow-X: Auto (mobile)
- Margin Bottom: 12px

**Styling:**
```css
display: flex;
gap: 1rem;
overflow-x: auto;
scrollbar-width: none; /* Hide scrollbar */
-ms-overflow-style: none;
```

```css
/* Webkit browsers */
::-webkit-scrollbar {
  display: none;
}
```

#### Agent Tab (Individual)

**Dimensions:**
- Min Width: 110px
- Height: 44px
- Flex: 1 (desktop), none (mobile)
- Border Radius: 12px

**States:**

**Unselected:**
```
┌──────────────┐
│  ✨ Auto     │  Icon (16px) + Text (12-14px)
└──────────────┘

background: white;
border: 2px solid #E5E7EB;
color: #666666;
font-weight: 500;
```

**Hover (Unselected):**
```css
border-color: var(--color-primary);
background-color: #F9FAFB;
```

**Selected:**
```
┌──────────────┐
│  ✨ Auto     │  (Gradient border)
└──────────────┘

background: white;
border: 2px solid transparent;
background-image: linear-gradient(white, white), var(--gradient-primary);
background-origin: border-box;
background-clip: padding-box, border-box;
color: var(--color-primary);
font-weight: 700;
```

#### Disclaimer + Control Section

**Layout:**
```css
display: flex;
justify-content: space-between;
align-items: center;
gap: 12px;
```

#### Disclaimer Banner

**Dimensions:**
- Flex: 1
- Padding: 8px 12px
- Border Radius: 8px

**Styling:**
```css
background-color: #FEF3C7;
border: 1px solid #FDE68A;
font-size: 12px;
color: #78350F;
line-height: 1.4;
```

#### Stop Response Button (Conditional)

**Visibility:** Only shown when AI is generating response

**Dimensions:**
- Width: Auto (padding-based)
- Height: 36px
- Padding: 0 16px
- Border Radius: 18px (pill shape)

**Styling:**
```css
background-color: #FEE2E2;
border: 1px solid #FECACA;
color: #991B1B;
font-size: 13px;
font-weight: 600;
display: flex;
align-items: center;
gap: 6px;
```

**Hover:**
```css
background-color: #FEF2F2;
transform: scale(1.02);
```

**Active:**
```css
background-color: #FECACA;
transform: scale(0.98);
```

---

## 3. Chat Messages Area

### 3.1 Overview

**Purpose:** Display conversation messages between user and AI

**Location:** Main content area between header and input

**Scroll:** Vertical auto-scroll to bottom on new message

### 3.2 Visual Specification

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                     [User Message Bubble] 👤   │
│                                                 │
│  🤖 [AI Message Bubble]                        │
│     Tags: [Medical] [Welfare]                  │
│                                                 │
│                     [User Message Bubble] 👤   │
│                                                 │
│  🤖 [AI Streaming Message...]                  │
│     ● Generating response...                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3.3 Component Breakdown

#### Messages Container

**Dimensions:**
- Width: 100%
- Height: Flexible (calc(100vh - header - input - nav))
- Min Height: 400px
- Padding: 16px (mobile), 24px (desktop)
- Background: White (light mode), #1F2937 (dark mode)

**Styling:**
```css
overflow-y: auto;
scroll-behavior: smooth;
display: flex;
flex-direction: column;
gap: 24px;
```

**Scrollbar:**
```css
scrollbar-width: thin;
scrollbar-color: #D1D5DB transparent;

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #D1D5DB;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #9CA3AF;
}
```

#### Message Wrapper (User)

**Layout:**
```css
display: flex;
justify-content: flex-end;
width: 100%;
```

**Structure:**
```
                     ┌─────────────────────┐
                     │ User message text   │
                     │ goes here...        │  👤
                     └─────────────────────┘
                       11:23 AM
```

#### Message Wrapper (AI)

**Layout:**
```css
display: flex;
justify-content: flex-start;
width: 100%;
```

**Structure:**
```
 🤖  ┌─────────────────────┐
     │ AI response text    │
     │ goes here...        │
     └─────────────────────┘
     [Tag1] [Tag2]
     11:24 AM
```

#### User Message Bubble

**Dimensions:**
- Max Width: 85% (mobile), 70% (desktop)
- Padding: 12px 16px (mobile), 16px 20px (desktop)
- Border Radius: 12px 12px 4px 12px (tail bottom-right)

**Styling:**
```css
background: linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%);
color: white;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

**Text:**
```css
font-size: 14px (mobile), 15px (desktop);
line-height: 1.6;
word-wrap: break-word;
overflow-wrap: anywhere;
white-space: pre-wrap;
```

#### AI Message Bubble

**Dimensions:**
- Max Width: 85% (mobile), 70% (desktop)
- Padding: 12px 16px (mobile), 16px 20px (desktop)
- Border Radius: 4px 12px 12px 12px (tail top-left)

**Styling:**
```css
background-color: #F9FAFB;
border: 1px solid #E0E0E0;
color: var(--color-text-primary);
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
```

**Text:**
```css
font-size: 14px (mobile), 15px (desktop);
line-height: 1.6;
word-wrap: break-word;
overflow-wrap: anywhere;
white-space: pre-wrap;
```

#### Bot Icon

**Dimensions:**
- Size: 18px (mobile), 20px (desktop)
- Color: var(--color-primary)
- Position: Top-left of AI message

**Styling:**
```css
flex-shrink: 0;
margin-top: 4px;
margin-right: 8px;
```

#### User Icon

**Dimensions:**
- Size: 20px
- Color: White
- Position: Top-right of user message

**Styling:**
```css
flex-shrink: 0;
margin-top: 4px;
margin-left: 8px;
```

#### Intent/Agent Tags

**Dimensions:**
- Height: 24px
- Padding: 0 10px
- Border Radius: 12px (pill)
- Margin Top: 12px
- Gap: 8px

**Styling:**
```css
background-color: #F2FFFD;
color: var(--color-primary);
font-size: 11px;
font-weight: 600;
display: inline-flex;
align-items: center;
border: 1px solid rgba(0, 200, 180, 0.3);
```

**Types:**

**Medical/Welfare:**
```css
background-color: #DBEAFE;
color: #1E40AF;
border-color: #BFDBFE;
```

**Nutrition:**
```css
background-color: #D1FAE5;
color: #065F46;
border-color: #A7F3D0;
```

**Research:**
```css
background-color: #E0E7FF;
color: #3730A3;
border-color: #C7D2FE;
```

**Emergency:**
```css
background-color: #FEE2E2;
color: #991B1B;
border-color: #FECACA;
font-weight: 700;
```

#### Timestamp

**Dimensions:**
- Font Size: 11px
- Color: var(--color-text-tertiary)
- Margin Top: 4px

**Styling:**
```css
font-size: 11px;
color: #9CA3AF;
```

**Format:** "HH:MM AM/PM" or relative time (e.g., "2h ago")

---

## 4. Chat Input Area

### 4.1 Overview

**Purpose:** Allow users to input messages and select profiles

**Location:** Fixed at bottom of chat area

**Height:** Auto (min 80px)

### 4.2 Visual Specification

```
┌────────────────────────────────────────────────────────┐
│  맞춤 정보: [환자(신장병 환우) ▼]                      │  ← Profile selector
├────────────────────────────────────────────────────────┤
│  [📷]  [Message input field..................] [➤]    │  ← Image + Input + Send
└────────────────────────────────────────────────────────┘
```

### 4.3 Component Breakdown

#### Input Container

**Dimensions:**
- Width: 100%
- Padding: 12px 16px (mobile), 16px 24px (desktop)
- Background: White
- Border Top: 1px solid #E5E7EB
- Position: Sticky/Fixed bottom

**Styling:**
```css
background-color: white;
border-top: 1px solid #E5E7EB;
position: sticky;
bottom: 0;
z-index: 10;
```

#### Profile Selector Section

**Layout:**
```css
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 8px;
```

**Label:**
```css
font-size: 11px;
color: #6B7280;
```

**Selector Wrapper:**
```css
position: relative;
display: flex;
align-items: center;
gap: 4px;
cursor: pointer;
```

**Selected Value:**
```css
font-size: 11px;
color: var(--color-primary);
font-weight: 500;
```

**Chevron Icon:**
```css
width: 12px;
height: 12px;
color: var(--color-primary);
```

**Native Select (Overlay):**
```css
position: absolute;
inset: 0;
opacity: 0;
cursor: pointer;
width: 100%;
height: 100%;
```

#### Input Row

**Layout:**
```css
display: flex;
align-items: center;
gap: 8px;
```

#### Image Attach Button (Nutrition Only)

**Dimensions:**
- Width: 44px
- Height: 44px
- Border Radius: 50%
- Flex Shrink: 0

**Styling:**
```css
display: flex;
align-items: center;
justify-content: center;
background-color: transparent;
color: #99A1AF;
transition: all 200ms ease-in-out;
```

**Hover:**
```css
background-color: #F3F4F6;
color: var(--color-primary);
transform: scale(1.05);
```

**Icon:** Image icon (20px, stroke-width: 1.66)

#### Text Input Field

**Dimensions:**
- Flex: 1 (takes remaining space)
- Height: 44px
- Padding: 0 16px
- Border Radius: 12px

**Styling:**
```css
background-color: white;
border: 1px solid #E5E7EB;
color: var(--color-text-primary);
font-size: 14px;
transition: all 200ms ease-in-out;
```

**Focus:**
```css
outline: none;
border-color: var(--color-primary);
background-color: #F2FFFD;
box-shadow: 0 0 0 3px rgba(0, 200, 180, 0.1);
```

**Placeholder:**
```css
color: #9CA3AF;
```

#### Send Button

**Dimensions:**
- Width: 44px
- Height: 44px
- Border Radius: 50%
- Flex Shrink: 0

**States:**

**Enabled (has input):**
```css
background-color: var(--color-primary);
color: white;
display: flex;
align-items: center;
justify-content: center;
transition: all 200ms ease-in-out;
cursor: pointer;
```

**Hover (enabled):**
```css
background-color: var(--color-primary-hover);
transform: scale(1.05);
box-shadow: 0 4px 12px rgba(0, 200, 180, 0.3);
```

**Active (enabled):**
```css
transform: scale(0.95);
```

**Disabled (no input):**
```css
background-color: #F3F4F6;
color: #9CA3AF;
cursor: not-allowed;
```

**Icon:** Send icon (18px)

#### Image Preview (When image selected)

**Dimensions:**
- Max Height: 128px
- Border Radius: 8px
- Margin Bottom: 8px
- Position: Above input row

**Layout:**
```
┌─────────────┐
│             │  [X]  ← Remove button (top-right)
│   IMAGE     │
│             │
└─────────────┘
```

**Styling:**
```css
position: relative;
display: inline-block;
margin-bottom: 8px;
```

**Image:**
```css
max-height: 128px;
border-radius: 8px;
border: 1px solid #E5E7EB;
```

**Remove Button:**
```css
position: absolute;
top: -8px;
right: -8px;
width: 24px;
height: 24px;
border-radius: 50%;
background-color: #EF4444;
color: white;
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

**Remove Button Hover:**
```css
background-color: #DC2626;
transform: scale(1.1);
```

---

## 5. Empty States

### 5.1 No Conversations (Initial State)

**Visual Specification:**

```
        ┌───────────────────────────────┐
        │                               │
        │           🤖                  │
        │                               │
        │   CareGuide AI와             │
        │   대화를 시작하세요            │
        │                               │
        │   현재 에이전트: auto          │
        │   프로필: 환자 맞춤 질문       │
        │                               │
        │   ┌─────────────────────┐    │
        │   │ 만성콩팥병이란?     │    │
        │   └─────────────────────┘    │
        │   ┌─────────────────────┐    │
        │   │ 콩팥에 좋은 음식은? │    │
        │   └─────────────────────┘    │
        │   ┌─────────────────────┐    │
        │   │ 투석 시작 시기는?   │    │
        │   └─────────────────────┘    │
        │   ┌─────────────────────┐    │
        │   │ 최신 CKD 연구는?    │    │
        │   └─────────────────────┘    │
        │                               │
        └───────────────────────────────┘
```

**Component Details:**

**Container:**
```css
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
height: 100%;
text-align: center;
padding: 2rem;
```

**Bot Icon:**
```css
width: 64px;
height: 64px;
color: #D1D5DB;
margin-bottom: 1rem;
```

**Heading:**
```css
font-size: 24px;
font-weight: 700;
color: var(--color-text-primary);
margin-bottom: 8px;
```

**Description:**
```css
font-size: 16px;
color: var(--color-text-secondary);
max-width: 28rem;
margin-bottom: 8px;
```

**Profile Info:**
```css
font-size: 14px;
color: var(--color-primary);
margin-bottom: 24px;
```

**Suggested Questions Grid:**
```css
display: grid;
grid-template-columns: 1fr;
gap: 12px;
max-width: 42rem;
width: 100%;
margin-top: 24px;

@media (min-width: 768px) {
  grid-template-columns: 1fr 1fr;
}
```

**Suggested Question Button:**
```css
padding: 12px 16px;
background-color: white;
border: 1px solid #E5E7EB;
border-radius: 8px;
font-size: 14px;
color: var(--color-text-primary);
text-align: left;
min-height: 44px;
transition: all 200ms ease-in-out;
cursor: pointer;
```

**Hover:**
```css
background-color: #F9FAFB;
border-color: var(--color-primary);
transform: translateY(-1px);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
```

### 5.2 Session Expired State

**Visual Specification:**

```
        ┌───────────────────────────────┐
        │                               │
        │           🕐                  │
        │                               │
        │   세션이 만료되었습니다       │
        │                               │
        │   5분간 활동이 없어           │
        │   대화가 화면에서 숨겨졌습니다 │
        │                               │
        │   [📜 이전 대화 보기]         │
        │   [새 대화 시작]              │
        │                               │
        │   ⚠️ 로그인하면 이전 대화를   │
        │   복원할 수 있습니다          │
        │                               │
        └───────────────────────────────┘
```

**Component Details:**

**Container:**
```css
display: flex;
flex-direction: column;
align-items: center;
gap: 16px;
padding: 2rem;
```

**Clock Icon:**
```css
width: 48px;
height: 48px;
color: #D1D5DB;
```

**Heading:**
```css
font-size: 18px;
font-weight: 600;
color: var(--color-text-secondary);
```

**Description:**
```css
font-size: 14px;
color: var(--color-text-tertiary);
margin-top: 4px;
```

**Button Group:**
```css
display: flex;
flex-direction: column;
gap: 12px;
margin-top: 16px;

@media (min-width: 640px) {
  flex-direction: row;
}
```

**Restore Button:**
```css
display: inline-flex;
align-items: center;
justify-content: center;
padding: 8px 16px;
background-color: var(--color-primary);
color: white;
border-radius: 8px;
font-size: 14px;
font-weight: 500;
min-height: 44px;
transition: all 200ms ease-in-out;
gap: 8px;
```

**Disabled State:**
```css
opacity: 0.5;
cursor: not-allowed;
```

**New Chat Button:**
```css
display: inline-flex;
align-items: center;
justify-content: center;
padding: 8px 16px;
background-color: transparent;
border: 1px solid #E5E7EB;
color: var(--color-text-secondary);
border-radius: 8px;
font-size: 14px;
font-weight: 500;
min-height: 44px;
transition: all 200ms ease-in-out;
```

**Warning Text:**
```css
font-size: 12px;
color: #F59E0B;
margin-top: 8px;
```

---

## 6. Modal Dialogs

### 6.1 Reset Session Confirmation

**Visual Specification:**

```
    ┌─────────────────────────────────────┐
    │  Reset Session?                [X] │
    ├─────────────────────────────────────┤
    │                                     │
    │  Are you sure you want to reset    │
    │  the current session? This will    │
    │  clear all messages in this        │
    │  conversation.                      │
    │                                     │
    │  This action cannot be undone.     │
    │                                     │
    │         [Cancel]  [Reset]          │
    │                                     │
    └─────────────────────────────────────┘
```

**Component Details:**

**Overlay:**
```css
position: fixed;
inset: 0;
background-color: rgba(0, 0, 0, 0.5);
display: flex;
align-items: center;
justify-content: center;
z-index: 50;
padding: 16px;
```

**Modal Container:**
```css
background-color: white;
border-radius: 16px;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
max-width: 28rem;
width: 100%;
padding: 24px;
```

**Header:**
```css
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 16px;
```

**Title:**
```css
font-size: 20px;
font-weight: 700;
color: var(--color-text-primary);
```

**Close Button:**
```css
width: 32px;
height: 32px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
color: var(--color-text-tertiary);
transition: all 200ms ease-in-out;
```

**Close Button Hover:**
```css
background-color: #F3F4F6;
color: var(--color-text-primary);
```

**Body:**
```css
margin-bottom: 24px;
```

**Description:**
```css
font-size: 15px;
line-height: 1.6;
color: var(--color-text-secondary);
margin-bottom: 12px;
```

**Warning:**
```css
font-size: 14px;
color: #EF4444;
font-weight: 500;
```

**Footer:**
```css
display: flex;
justify-content: flex-end;
gap: 12px;
```

**Cancel Button:**
```css
/* Uses .btn-ghost */
padding: 10px 20px;
```

**Reset Button:**
```css
/* Uses .btn-primary but with red variant */
padding: 10px 20px;
background-color: #EF4444;
```

**Reset Button Hover:**
```css
background-color: #DC2626;
```

### 6.2 Error Modal

**Visual Specification:**

```
    ┌─────────────────────────────────────┐
    │  ⚠️ Error                      [X] │
    ├─────────────────────────────────────┤
    │                                     │
    │  Failed to send message            │
    │                                     │
    │  The server is currently           │
    │  unavailable. Please try again     │
    │  later.                            │
    │                                     │
    │  Error Code: 503                   │
    │                                     │
    │                        [OK]        │
    │                                     │
    └─────────────────────────────────────┘
```

**Component Details:**

**Same structure as Reset Modal, with:**

**Title with Icon:**
```css
display: flex;
align-items: center;
gap: 8px;
color: #EF4444;
```

**Error Message:**
```css
font-size: 16px;
font-weight: 600;
color: var(--color-text-primary);
margin-bottom: 12px;
```

**Error Details:**
```css
font-size: 14px;
color: var(--color-text-secondary);
line-height: 1.6;
margin-bottom: 12px;
```

**Error Code:**
```css
font-size: 13px;
color: var(--color-text-tertiary);
font-family: monospace;
background-color: #F3F4F6;
padding: 8px 12px;
border-radius: 6px;
```

**OK Button:**
```css
/* Uses .btn-primary */
```

---

## 7. Loading States

### 7.1 Message Loading (Typing Indicator)

**Visual Specification:**

```
🤖  ┌──────────────┐
    │  ● ● ●      │  ← Bouncing dots
    └──────────────┘
```

**Component Details:**

**Container:**
```css
display: flex;
justify-content: flex-start;
margin-bottom: 24px;
```

**Bubble:**
```css
background-color: #F9FAFB;
border: 1px solid #E0E0E0;
border-radius: 4px 12px 12px 12px;
padding: 16px;
display: flex;
align-items: center;
gap: 8px;
```

**Dot:**
```css
width: 8px;
height: 8px;
border-radius: 50%;
background-color: #9CA3AF;
animation: bounce 1.4s infinite ease-in-out;
```

**Animation:**
```css
@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
```

### 7.2 Streaming Response

**Visual Specification:**

```
🤖  ┌────────────────────────────┐
    │ This is the response      │
    │ that is being generated   │
    │ in real-time...           │
    │                           │
    │ ● Generating response...  │
    └────────────────────────────┘
```

**Component Details:**

**Same as AI message bubble, with:**

**Streaming Indicator:**
```css
display: flex;
align-items: center;
gap: 8px;
margin-top: 12px;
padding-top: 12px;
border-top: 1px solid #E5E7EB;
font-size: 12px;
color: var(--color-text-tertiary);
```

**Pulsing Dot:**
```css
width: 8px;
height: 8px;
border-radius: 50%;
background-color: var(--color-primary);
animation: pulse 1.5s infinite;
```

```css
@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 7.3 Session Restore Loading

**Visual Specification:**

```
        ┌───────────────────────────┐
        │                           │
        │       ⟳ Loading...        │
        │                           │
        │   Restoring chat history  │
        │                           │
        └───────────────────────────┘
```

**Component Details:**

**Container:**
```css
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
height: 100%;
gap: 16px;
```

**Spinner:**
```css
width: 48px;
height: 48px;
border: 4px solid #E5E7EB;
border-top-color: var(--color-primary);
border-radius: 50%;
animation: spin 1s linear infinite;
```

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Loading Text:**
```css
font-size: 16px;
color: var(--color-text-secondary);
font-weight: 500;
```

---

## 8. Error States

### 8.1 Message Send Error

**Visual Specification:**

```
                    ┌──────────────────────┐
                    │ User message here    │  👤
                    └──────────────────────┘

🤖  ┌───────────────────────────────────┐
    │ ⚠️ Failed to send message        │
    │                                   │
    │ Error: Network connection lost   │
    │                                   │
    │          [Retry]  [Dismiss]      │
    └───────────────────────────────────┘
```

**Component Details:**

**Error Message Bubble:**
```css
background-color: #FEF2F2;
border: 1px solid #FECACA;
border-radius: 4px 12px 12px 12px;
padding: 16px;
max-width: 85%;
```

**Error Icon + Text:**
```css
display: flex;
align-items: flex-start;
gap: 8px;
color: #991B1B;
font-size: 14px;
font-weight: 600;
margin-bottom: 8px;
```

**Error Details:**
```css
font-size: 13px;
color: #DC2626;
margin-bottom: 12px;
```

**Button Group:**
```css
display: flex;
gap: 8px;
justify-content: flex-end;
```

**Retry Button:**
```css
padding: 6px 12px;
background-color: #DC2626;
color: white;
border-radius: 6px;
font-size: 13px;
font-weight: 500;
```

**Dismiss Button:**
```css
padding: 6px 12px;
background-color: transparent;
color: #DC2626;
border-radius: 6px;
font-size: 13px;
font-weight: 500;
```

### 8.2 Network Error Banner

**Visual Specification:**

```
┌───────────────────────────────────────────────────┐
│  ⚠️ No internet connection. Reconnecting...  [X] │
└───────────────────────────────────────────────────┘
```

**Component Details:**

**Banner:**
```css
position: fixed;
top: 0;
left: 0;
right: 0;
background-color: #FEF2F2;
border-bottom: 1px solid #FECACA;
padding: 12px 16px;
display: flex;
align-items: center;
justify-content: space-between;
z-index: 40;
animation: slideDown 300ms ease-out;
```

```css
@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}
```

**Message:**
```css
display: flex;
align-items: center;
gap: 8px;
font-size: 14px;
color: #991B1B;
font-weight: 500;
```

**Close Button:**
```css
width: 28px;
height: 28px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
color: #991B1B;
transition: all 200ms;
```

**Close Button Hover:**
```css
background-color: #FEE2E2;
```

---

## Component State Summary

### Button States Matrix

| State | Background | Border | Text | Transform | Shadow |
|-------|-----------|--------|------|-----------|--------|
| Default | Primary | None | White | None | None |
| Hover | Primary-hover | None | White | translateY(-1px) | Yes |
| Active | Primary-pressed | None | White | translateY(0) | None |
| Focus | Primary | 3px outline | White | None | Yes |
| Disabled | Disabled | None | White | None | None |
| Loading | Primary | None | White | None | None |

### Input States Matrix

| State | Background | Border | Text | Shadow |
|-------|-----------|--------|------|--------|
| Default | White | Medium | Primary | None |
| Focus | Input-bar | Primary | Primary | Yes |
| Hover | White | Primary | Primary | None |
| Error | Red-50 | Red-500 | Primary | None |
| Disabled | Line-light | Medium | Disabled | None |
| Success | Green-50 | Green-500 | Primary | None |

---

## Accessibility Requirements

### Keyboard Navigation

- All buttons: Tab-accessible
- Modals: Focus trap
- Suggested questions: Arrow key navigation
- Chat messages: Scroll with keyboard

### Screen Reader Announcements

```html
<!-- Message sent -->
<div role="status" aria-live="polite">
  Message sent
</div>

<!-- AI response -->
<div role="log" aria-live="polite" aria-atomic="false">
  <!-- Messages appear here -->
</div>

<!-- Error -->
<div role="alert" aria-live="assertive">
  Error message here
</div>

<!-- Loading -->
<div role="status" aria-live="polite">
  <span className="sr-only">Generating response</span>
</div>
```

### ARIA Labels

```html
<!-- Send button -->
<button aria-label="Send message">
  <Send />
</button>

<!-- Image attach -->
<button aria-label="Attach food image">
  <Image />
</button>

<!-- Agent tabs -->
<button role="tab" aria-selected="true" aria-controls="chat-panel">
  Auto
</button>
```

---

## Implementation Notes

1. **Responsive**: All components must work from 320px to 1920px width
2. **Touch targets**: Minimum 44px for mobile
3. **Focus visible**: All interactive elements need focus indicators
4. **Reduced motion**: Respect prefers-reduced-motion
5. **Dark mode**: All components must support dark mode
6. **RTL support**: Consider RTL languages (future)

---

**Last Updated:** 2025-11-26
**Next Review:** 2026-01-26
**Figma Link:** [To be added]
