// ==================== Global State ====================

// Multi-room state management
let chatRooms = {};  // { roomId: { profile, messages, sessionId } }
let currentRoomId = null;
let roomIdCounter = 1;

let isLoading = false;
let eventSource = null;  // SSE connection
let currentAgentStatus = 'ready';  // Track agent status (processing, typing, ready)

// Background polling state
let backgroundPoller = null;
let pollingInterval = null;

// SSE connection state management
let sseConnectionState = 'disconnected';  // disconnected, connecting, connected, error
let sseErrorHandled = false;  // Flag to prevent duplicate error handling
let lastSSEProfile = null;  // Track last SSE profile to prevent duplicates

// Profile metadata
const PROFILE_CONFIG = {
    researcher: {
        icon: '🔬',
        label: '연구자/전문가',
        color: 'researcher'
    },
    patient: {
        icon: '🏥',
        label: '환자/경험자',
        color: 'patient'
    },
    general: {
        icon: '👤',
        label: '일반인/초보자',
        color: 'general'
    }
};

// ==================== LocalStorage Management ====================

const STORAGE_KEY_ROOMS = 'careguide_chat_rooms';
const MAX_STORAGE_SIZE = 10 * 1024 * 1024;  // 10MB

function saveChatRoomsToStorage() {
    try {
        const data = {
            rooms: chatRooms,
            currentRoomId: currentRoomId,
            roomIdCounter: roomIdCounter
        };
        localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(data));
        console.log('Saved chat rooms to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        if (error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, pruning old rooms...');
            // Keep only current room and most recent 2 rooms
            const roomIds = Object.keys(chatRooms);
            if (roomIds.length > 3) {
                roomIds.slice(0, -3).forEach(id => {
                    if (id !== currentRoomId) {
                        delete chatRooms[id];
                    }
                });
                saveChatRoomsToStorage();
            }
        }
    }
}

function loadChatRoomsFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_ROOMS);
        if (!data) {
            return false;
        }
        const parsed = JSON.parse(data);
        chatRooms = parsed.rooms || {};
        currentRoomId = parsed.currentRoomId || null;
        roomIdCounter = parsed.roomIdCounter || 1;
        console.log('Loaded chat rooms from localStorage:', chatRooms);
        return Object.keys(chatRooms).length > 0;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return false;
    }
}

function clearLocalStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY_ROOMS);
        console.log('Cleared localStorage');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

// ==================== Room Management ====================

async function createNewRoom(profile) {
    try {
        // Create room on backend
        const response = await fetch('/api/rooms/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profile: profile
            })
        });

        if (!response.ok) {
            throw new Error('채팅방 생성에 실패했습니다.');
        }

        const data = await response.json();
        const sessionId = data.session_id;

        // Create room locally
        const roomId = `room_${roomIdCounter++}`;
        chatRooms[roomId] = {
            profile: profile,
            sessionId: sessionId,
            messages: [],
            createdAt: new Date().toISOString()
        };

        // Switch to new room
        currentRoomId = roomId;

        // Save to storage
        saveChatRoomsToStorage();

        // Update UI
        renderRoomTabs();
        switchToRoom(roomId);

        console.log(`Created new room: ${roomId} with profile: ${profile}`);
        return roomId;
    } catch (error) {
        console.error('Error creating room:', error);
        alert('채팅방 생성 중 오류가 발생했습니다.');
        return null;
    }
}

function switchToRoom(roomId) {
    if (!chatRooms[roomId]) {
        console.error('Room not found:', roomId);
        return;
    }

    // Close any active SSE connection
    closeSSE();

    // Update current room
    currentRoomId = roomId;
    const room = chatRooms[roomId];

    // Update profile badge
    updateProfileBadge(room.profile);

    // Render messages for this room
    renderRoomMessages(roomId);

    // Update tab active state
    renderRoomTabs();

    // Save state
    saveChatRoomsToStorage();

    console.log(`Switched to room: ${roomId} (${room.profile})`);
}

function deleteRoom(roomId) {
    if (!chatRooms[roomId]) {
        return;
    }

    // Confirm deletion
    if (!confirm('이 채팅방을 삭제하시겠습니까?')) {
        return;
    }

    // Close SSE if this is current room
    if (currentRoomId === roomId) {
        closeSSE();
    }

    // Delete room
    delete chatRooms[roomId];

    // Switch to another room or create new one
    const remainingRooms = Object.keys(chatRooms);
    if (remainingRooms.length > 0) {
        switchToRoom(remainingRooms[0]);
    } else {
        // No rooms left, redirect to home
        currentRoomId = null;
        goToHome();
        return;
    }

    // Update UI
    renderRoomTabs();

    // Save state
    saveChatRoomsToStorage();

    console.log(`Deleted room: ${roomId}`);
}

async function resetCurrentRoom() {
    if (!currentRoomId) {
        return;
    }

    if (!confirm('현재 채팅방의 대화 기록이 모두 삭제됩니다. 계속하시겠습니까?')) {
        return;
    }

    const room = chatRooms[currentRoomId];
    if (!room) {
        return;
    }

    // Close any active SSE connection
    closeSSE();

    try {
        // Reset session on backend
        const response = await fetch('/api/session/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profile: room.profile
            })
        });

        if (response.ok) {
            // Clear messages
            room.messages = [];

            // Re-render
            renderRoomMessages(currentRoomId);

            // Save state
            saveChatRoomsToStorage();

            addMessage('✅ 대화가 초기화되었습니다.', 'assistant');
        } else {
            console.error('Failed to reset session:', response.status);
            addMessage('⚠️ 대화 초기화 중 오류가 발생했습니다.', 'assistant');
        }
    } catch (error) {
        console.error('Error resetting session:', error);
        addMessage('⚠️ 대화 초기화 중 오류가 발생했습니다.', 'assistant');
    }
}

// ==================== UI Rendering ====================

function renderRoomTabs() {
    const tabsContainer = document.getElementById('room-tabs');
    if (!tabsContainer) {
        return;
    }

    tabsContainer.innerHTML = '';

    Object.keys(chatRooms).forEach(roomId => {
        const room = chatRooms[roomId];
        const config = PROFILE_CONFIG[room.profile];
        const isActive = roomId === currentRoomId;

        const tab = document.createElement('div');
        tab.className = `room-tab ${isActive ? 'active' : ''} ${config.color}`;
        tab.onclick = () => switchToRoom(roomId);

        tab.innerHTML = `
            <span class="room-tab-icon">${config.icon}</span>
            <span class="room-tab-label">${config.label}</span>
            <span class="room-tab-close" onclick="event.stopPropagation(); deleteRoom('${roomId}')">×</span>
        `;

        tabsContainer.appendChild(tab);
    });
}

function updateProfileBadge(profile) {
    const badge = document.getElementById('profile-badge');
    if (!badge) {
        return;
    }

    const config = PROFILE_CONFIG[profile];
    badge.textContent = `${config.icon} ${config.label}`;
    badge.className = `profile-badge ${config.color}`;
}

function renderRoomMessages(roomId) {
    const room = chatRooms[roomId];
    if (!room) {
        return;
    }

    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.innerHTML = '';

    if (room.messages.length === 0) {
        // Show welcome message
        messagesDiv.innerHTML = `
            <div class="welcome-message">
                <p>안녕하세요! CareGuide입니다.</p>
                <p>의료 관련 질문을 입력해주세요.</p>
                <p class="profile-hint">💡 현재 프로필: <strong>${PROFILE_CONFIG[room.profile].label}</strong></p>
            </div>
        `;
    } else {
        // Render messages
        room.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;

            if (msg.status && msg.status !== 'ready') {
                messageDiv.classList.add(`status-${msg.status}`);
            }

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';
            bubbleDiv.innerHTML = formatMessage(msg.text);

            messageDiv.appendChild(bubbleDiv);
            messagesDiv.appendChild(messageDiv);
        });

        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// ==================== Profile Management ====================

function showProfileModal() {
    document.getElementById('profile-modal').classList.add('active');
}

function hideProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

async function selectProfile(profile) {
    // Create new room with selected profile
    const roomId = await createNewRoom(profile);

    if (roomId) {
        hideProfileModal();
        const config = PROFILE_CONFIG[profile];
        addMessage(`✅ 새 채팅방이 생성되었습니다. (프로필: <strong>${config.label}</strong>)`, 'assistant');
    }
}

function goToHome() {
    // Prevent redirect loop if already on home page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        console.log('Already on home page, not redirecting');
        return;
    }
    window.location.href = '/';
}

// ==================== Session Validation ====================

async function validateSession(profile) {
    try {
        const response = await fetch(`/api/session/validate?profile=${profile}`);
        if (response.ok) {
            const data = await response.json();
            return data.valid === true;
        }
        return false;
    } catch (error) {
        console.error('Error validating session:', error);
        return false;
    }
}

// ==================== Message Handling ====================

async function sendMessage() {
    if (isLoading) {
        return;
    }

    if (!currentRoomId || !chatRooms[currentRoomId]) {
        alert('먼저 채팅방을 선택하거나 생성해주세요.');
        return;
    }

    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) {
        return;
    }

    const room = chatRooms[currentRoomId];

    // Add user message
    addMessage(message, 'user');
    input.value = '';

    // Show loading
    showLoading();
    isLoading = true;

    try {
        // Send message with profile parameter
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                profile: room.profile
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Message sent successfully');

            // Start SSE stream with profile
            startSSE(room.profile);
        } else {
            console.error('Error response:', data);
            addMessage(
                data.message || '⚠️ 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                'assistant'
            );
            hideLoading();
            isLoading = false;
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('⚠️ 서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'assistant');
        hideLoading();
        isLoading = false;
    }
}

// ==================== SSE (Server-Sent Events) ====================

async function startSSE(profile) {
    // Prevent duplicate connections
    if (sseConnectionState === 'connecting' || sseConnectionState === 'connected') {
        console.log('SSE already connecting or connected, skipping');
        return;
    }

    // Prevent starting SSE with same profile twice
    if (lastSSEProfile === profile && eventSource) {
        console.log('SSE already started with profile:', profile);
        return;
    }

    // Close existing connection if any
    closeSSE();

    // Validate session before connecting
    console.log('Validating session before SSE connection...');
    const sessionValid = await validateSession(profile);
    if (!sessionValid) {
        console.error('Session validation failed, cannot start SSE');
        addMessage('⚠️ 세션이 유효하지 않습니다. 페이지를 새로고침해주세요.', 'assistant');
        hideLoading();
        isLoading = false;
        return;
    }

    console.log('Starting SSE connection with profile:', profile);
    sseConnectionState = 'connecting';
    sseErrorHandled = false;
    lastSSEProfile = profile;

    // Create new EventSource with profile parameter
    eventSource = new EventSource(`/api/stream?profile=${profile}`);

    // Connection opened
    eventSource.addEventListener('connected', (event) => {
        console.log('SSE connected:', event.data);
        sseConnectionState = 'connected';
        sseErrorHandled = false;
    });

    // Status update received (for typing indicators)
    eventSource.addEventListener('status', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE status received:', data);

        if (data.status) {
            updateAgentStatus(data.status);
        }
    });

    // Message received
    eventSource.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE message received:', data);

        if (data.type === 'message') {
            // Handle both old and new message formats
            const messageText = data.text || data.message;
            const messageStatus = data.status || 'ready';
            addMessage(messageText, 'assistant', null, messageStatus);
        }
    });

    // Papers received
    eventSource.addEventListener('papers', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE papers received:', data);

        if (data.papers && data.papers.length > 0) {
            addPaperResults(data.papers);
        }
    });

    // Stream complete
    eventSource.addEventListener('complete', (event) => {
        console.log('SSE complete:', event.data);
        closeSSE();
    });

    // Timeout - fallback to background polling
    eventSource.addEventListener('timeout', (event) => {
        console.log('SSE timeout, falling back to background polling');
        const wasConnected = sseConnectionState === 'connected';
        closeSSE();

        // Only start background polling if SSE was previously connected
        if (wasConnected) {
            startBackgroundPolling(profile);
        }
    });

    // Error handling - SINGLE handler only
    eventSource.addEventListener('error', (event) => {
        // Prevent duplicate error handling
        if (sseErrorHandled) {
            console.log('SSE error already handled, skipping duplicate');
            return;
        }

        sseErrorHandled = true;
        console.error('SSE error:', event);

        if (event.data) {
            try {
                const data = JSON.parse(event.data);
                addMessage(`⚠️ 오류: ${data.error}`, 'assistant');
            } catch (e) {
                console.error('Failed to parse SSE error:', e);
            }
        }

        const wasConnected = sseConnectionState === 'connected';
        sseConnectionState = 'error';

        // Check if connection is closed
        if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            console.log('SSE connection closed');
            closeSSE();

            // Only fallback to polling if we were previously connected
            if (wasConnected) {
                console.log('SSE was connected, falling back to background polling');
                startBackgroundPolling(profile);
            } else {
                console.log('SSE never connected, not starting background polling');
                hideLoading();
                isLoading = false;
            }
        }
    });
}

function closeSSE() {
    if (eventSource) {
        console.log('Closing SSE connection');
        eventSource.close();
        eventSource = null;
    }

    // Reset SSE state
    sseConnectionState = 'disconnected';
    sseErrorHandled = false;
    lastSSEProfile = null;

    // Stop background polling if active
    if (backgroundPoller && backgroundPoller.isPolling) {
        backgroundPoller.stop();
    }

    hideLoading();
    isLoading = false;
}

function startBackgroundPolling(profile) {
    // Stop any existing poller first
    if (backgroundPoller && backgroundPoller.isPolling) {
        console.log('Stopping existing background poller before starting new one');
        backgroundPoller.stop();
    }

    // Create new poller and start
    if (!backgroundPoller) {
        backgroundPoller = new BackgroundPoller();
    }
    backgroundPoller.start(profile);
}

// ==================== Background Polling ====================

class BackgroundPoller {
    constructor() {
        this.isPolling = false;
        this.pollCount = 0;
        this.intervalId = null;
        this.currentDelay = 3000;
        this.maxDelay = 30000;
        this.maxPolls = 50;
        this.profile = 'general';
    }

    start(profile = 'general') {
        if (this.isPolling) {
            console.log('Background polling already active');
            return;
        }

        this.profile = profile;
        console.log('Starting background polling with profile:', profile);
        this.isPolling = true;
        this.pollCount = 0;
        this.currentDelay = 3000;
        this.poll();
    }

    stop() {
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        this.isPolling = false;
        this.pollCount = 0;
        console.log('Background polling stopped');
    }

    async poll() {
        if (!this.isPolling || this.pollCount >= this.maxPolls) {
            console.log('Background polling limit reached or stopped');
            this.stop();
            return;
        }

        this.pollCount++;
        console.log(`Background poll attempt ${this.pollCount}/${this.maxPolls} (delay: ${this.currentDelay}ms)`);

        try {
            const response = await fetch(`/api/pending?quick=false&profile=${this.profile}`);

            if (response.ok) {
                const data = await response.json();
                console.log('Background poll response:', data);

                if (data.messages && data.messages.length > 0) {
                    console.log(`✅ Background poll found ${data.messages.length} pending message(s)`);

                    if (data.current_status) {
                        updateAgentStatus(data.current_status);
                    }

                    data.messages.forEach(msg => {
                        const messageText = typeof msg === 'string' ? msg : msg.text;
                        const messageStatus = typeof msg === 'object' ? msg.status : 'ready';
                        addMessage(messageText, 'assistant', null, messageStatus);
                    });

                    if (data.papers && data.papers.length > 0) {
                        addPaperResults(data.papers);
                    }

                    this.currentDelay = 3000;

                    if (data.has_pending) {
                        console.log('More messages expected, continuing...');
                        this.scheduleNext(2000);
                    } else {
                        console.log('All messages received, stopping background polling');
                        this.stop();
                        hideLoading();
                    }
                } else {
                    this.currentDelay = Math.min(this.currentDelay * 1.5, this.maxDelay);
                    this.scheduleNext(this.currentDelay);
                }
            } else {
                console.error('Background poll error:', response.status);
                this.scheduleNext(this.currentDelay);
            }
        } catch (error) {
            console.error('Background poll exception:', error);
            this.scheduleNext(this.currentDelay);
        }
    }

    scheduleNext(delay) {
        if (this.isPolling) {
            this.intervalId = setTimeout(() => this.poll(), delay);
        }
    }
}

// ==================== UI Functions ====================

function updateAgentStatus(status) {
    currentAgentStatus = status;
    const loading = document.getElementById('loading-indicator');

    if (!loading) return;

    const loadingText = loading.querySelector('p');
    if (loadingText) {
        switch (status) {
            case 'processing':
                loadingText.textContent = 'CareGuide가 생각하는 중...';
                break;
            case 'typing':
                loadingText.textContent = 'CareGuide가 답변을 작성하는 중...';
                break;
            case 'ready':
            case 'completed':
                hideLoading();
                break;
            default:
                loadingText.textContent = '응답을 기다리는 중...';
        }
    }

    console.log('Agent status updated:', status);
}

function addMessage(text, sender, timestamp = null, status = 'ready') {
    if (!currentRoomId || !chatRooms[currentRoomId]) {
        console.error('No active room to add message to');
        return;
    }

    const room = chatRooms[currentRoomId];
    const messagesDiv = document.getElementById('chat-messages');

    // Remove welcome message if it exists
    const welcomeMessage = messagesDiv.querySelector('.welcome-message');
    if (welcomeMessage && sender === 'user') {
        welcomeMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    if (status && status !== 'ready') {
        messageDiv.classList.add(`status-${status}`);
    }

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = formatMessage(text);

    messageDiv.appendChild(bubbleDiv);
    messagesDiv.appendChild(messageDiv);

    // Smooth scroll to bottom
    const isFirstMessage = messagesDiv.children.length === 1;
    messagesDiv.scrollTo({
        top: messagesDiv.scrollHeight,
        behavior: isFirstMessage ? 'auto' : 'smooth'
    });

    // Save message to room state
    room.messages.push({
        text: text,
        sender: sender,
        timestamp: timestamp || new Date().toISOString(),
        status: status
    });

    // Save to localStorage
    saveChatRoomsToStorage();

    // Update status if message is from assistant
    if (sender === 'assistant' && status) {
        currentAgentStatus = status;
    }
}

function formatMessage(text) {
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');

    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert URLs to links
    text = text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" class="paper-link">$1</a>'
    );

    return text;
}

function addPaperResults(papers) {
    const messagesDiv = document.getElementById('chat-messages');

    const paperContainer = document.createElement('div');
    paperContainer.className = 'message assistant';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    let html = '<strong>📚 참고 문헌</strong><br><br>';

    papers.forEach((paper, index) => {
        html += `
            <div class="paper-result">
                <div class="paper-title">${index + 1}. ${escapeHtml(paper.title || 'N/A')}</div>
                ${paper.authors ? `<div class="paper-meta">저자: ${escapeHtml(paper.authors.join(', '))}</div>` : ''}
                ${paper.journal ? `<div class="paper-meta">저널: ${escapeHtml(paper.journal)}</div>` : ''}
                ${paper.pub_date ? `<div class="paper-meta">발행일: ${escapeHtml(paper.pub_date)}</div>` : ''}
                ${paper.pmid ? `<div class="paper-meta">PMID: ${escapeHtml(paper.pmid)}</div>` : ''}
                ${paper.doi ? `<div class="paper-meta">DOI: ${escapeHtml(paper.doi)}</div>` : ''}
                ${paper.url ? `<a href="${escapeHtml(paper.url)}" target="_blank" class="paper-link">원문 보기 →</a>` : ''}
            </div>
        `;
    });

    bubbleDiv.innerHTML = html;
    paperContainer.appendChild(bubbleDiv);
    messagesDiv.appendChild(paperContainer);

    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Loading Indicator ====================

function showLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.style.display = 'none';
    }
}

// ==================== Keyboard Handling ====================

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// ==================== Initialization ====================

window.addEventListener('load', async () => {
    // Only run chat initialization on chat page, not on home page
    const currentPath = window.location.pathname;
    const isChatPage = currentPath.includes('/chat') || document.getElementById('chat-container');

    if (!isChatPage) {
        console.log('Not on chat page, skipping chat initialization');
        return;
    }

    // Load saved rooms from localStorage
    const hasRooms = loadChatRoomsFromStorage();

    // Check if profile was selected on landing page
    const urlParams = new URLSearchParams(window.location.search);
    const profileFromUrl = urlParams.get('profile');

    if (profileFromUrl && PROFILE_CONFIG[profileFromUrl]) {
        // Create new room with selected profile
        const roomId = await createNewRoom(profileFromUrl);

        // Check if room creation failed
        if (!roomId) {
            console.error('Failed to create room, redirecting to home');
            alert('채팅방 생성에 실패했습니다. 다시 시도해주세요.');
            // Redirect to home on failure
            setTimeout(() => goToHome(), 1000);
        }
    } else if (hasRooms && currentRoomId && chatRooms[currentRoomId]) {
        // Restore existing session
        renderRoomTabs();
        switchToRoom(currentRoomId);
    } else {
        // No profile selected and no saved rooms, redirect to home
        goToHome();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        hideProfileModal();
    }
});

// Close modal on outside click
document.getElementById('profile-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'profile-modal') {
        hideProfileModal();
    }
});

// Close SSE when page unloads
window.addEventListener('beforeunload', () => {
    closeSSE();
});
