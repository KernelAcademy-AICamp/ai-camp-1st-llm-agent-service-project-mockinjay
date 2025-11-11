// ==================== Global State ====================

let currentProfile = 'general';
let isLoading = false;
let eventSource = null;  // SSE connection

// Background polling state
let backgroundPoller = null;
let pollingInterval = null;

// ==================== LocalStorage Management ====================

const STORAGE_KEY = 'careguide_chat_history';
const MAX_STORAGE_SIZE = 10 * 1024 * 1024;  // 10MB

function saveToLocalStorage(message, sender, timestamp = null) {
    try {
        const history = loadFromLocalStorage();

        const messageData = {
            text: message,
            sender: sender,
            timestamp: timestamp || new Date().toISOString()
        };

        history.messages.push(messageData);

        // Check size and prune if needed
        let jsonStr = JSON.stringify(history);
        if (jsonStr.length > MAX_STORAGE_SIZE) {
            console.warn('localStorage size exceeded, pruning old messages...');
            // Remove oldest messages (keep at least last 50)
            while (history.messages.length > 50 && jsonStr.length > MAX_STORAGE_SIZE * 0.8) {
                history.messages.shift();
                jsonStr = JSON.stringify(history);
            }
        }

        localStorage.setItem(STORAGE_KEY, jsonStr);
        console.log('Saved to localStorage:', messageData);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        // If quota exceeded, clear old data and try again
        if (error.name === 'QuotaExceededError') {
            try {
                const history = { messages: [] };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
                console.log('Cleared localStorage due to quota exceeded');
            } catch (e) {
                console.error('Failed to clear localStorage:', e);
            }
        }
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return { messages: [] };
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return { messages: [] };
    }
}

function clearLocalStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Cleared localStorage');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
}

// ==================== Background Polling ====================

class BackgroundPoller {
    constructor() {
        this.isPolling = false;
        this.pollCount = 0;
        this.intervalId = null;
        this.currentDelay = 3000;  // Start with 3 seconds
        this.maxDelay = 30000;      // Max 30 seconds
        this.maxPolls = 50;         // Max 50 polls (~12 minutes total)
    }

    start() {
        if (this.isPolling) {
            console.log('Background polling already active');
            return;
        }

        console.log('Starting background polling...');
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
            const response = await fetch('/api/pending?quick=false');

            if (response.ok) {
                const data = await response.json();
                console.log('Background poll response:', data);

                if (data.messages && data.messages.length > 0) {
                    console.log(`✅ Background poll found ${data.messages.length} pending message(s)`);

                    // Add messages to UI
                    data.messages.forEach(msg => {
                        addMessage(msg, 'assistant');
                    });

                    // Add papers if any
                    if (data.papers && data.papers.length > 0) {
                        addPaperResults(data.papers);
                    }

                    // Reset delay after successful message
                    this.currentDelay = 3000;

                    // Continue polling if more expected
                    if (data.has_pending) {
                        console.log('More messages expected, continuing...');
                        this.scheduleNext(2000);  // Quick check
                    } else {
                        console.log('All messages received, stopping background polling');
                        this.stop();
                        hideLoading();
                    }
                } else {
                    // No messages yet, exponential backoff
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

// ==================== Profile Management ====================

function showProfileModal() {
    document.getElementById('profile-modal').classList.add('active');
}

function hideProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

async function selectProfile(profile) {
    currentProfile = profile;

    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profile_type: profile
            })
        });

        if (response.ok) {
            hideProfileModal();

            const labels = {
                'researcher': '연구자/전문가',
                'patient': '질환자/경험자',
                'general': '일반인'
            };

            addMessage(`✅ 프로필이 <strong>${labels[profile]}</strong>로 설정되었습니다.`, 'assistant');
        } else {
            console.error('Failed to set profile:', response.status);
            addMessage('⚠️ 프로필 설정 중 오류가 발생했습니다.', 'assistant');
        }
    } catch (error) {
        console.error('Error setting profile:', error);
        addMessage('⚠️ 프로필 설정 중 오류가 발생했습니다.', 'assistant');
    }
}

// ==================== Session Management ====================

async function resetSession() {
    if (!confirm('대화 기록이 모두 삭제됩니다. 계속하시겠습니까?')) {
        return;
    }

    // Close any active SSE connection
    closeSSE();

    try {
        const response = await fetch('/api/session/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Clear chat messages
            const messagesDiv = document.getElementById('chat-messages');
            messagesDiv.innerHTML = `
                <div class="welcome-message">
                    <p>안녕하세요! CareGuide입니다.</p>
                    <p>의료 관련 질문을 입력해주세요.</p>
                    <p class="profile-hint">💡 상단의 "프로필 설정" 버튼으로 사용자 유형을 선택하시면 맞춤형 정보를 받을 수 있습니다.</p>
                </div>
            `;

            // Clear localStorage
            clearLocalStorage();

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

// ==================== Message Handling ====================

async function sendMessage() {
    if (isLoading) {
        return;
    }

    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) {
        return;
    }

    // Add user message
    addMessage(message, 'user');
    input.value = '';

    // Show loading
    showLoading();
    isLoading = true;

    try {
        // Send message (non-blocking)
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Message sent successfully');

            // Start SSE stream
            startSSE();
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

function startSSE() {
    // Close existing connection if any
    closeSSE();

    console.log('Starting SSE connection...');

    // Create new EventSource
    eventSource = new EventSource('/api/stream');

    // Connection opened
    eventSource.addEventListener('connected', (event) => {
        console.log('SSE connected:', event.data);
    });

    // Message received
    eventSource.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE message received:', data);

        if (data.type === 'message') {
            addMessage(data.message, 'assistant');
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
        closeSSE();

        // Start background polling as fallback
        if (!backgroundPoller) {
            backgroundPoller = new BackgroundPoller();
        }
        backgroundPoller.start();
    });

    // Error handling
    eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);

        if (event.data) {
            try {
                const data = JSON.parse(event.data);
                addMessage(`⚠️ 오류: ${data.error}`, 'assistant');
            } catch (e) {
                console.error('Failed to parse SSE error:', e);
            }
        }

        closeSSE();

        // Fallback to background polling on error
        console.log('SSE error, falling back to background polling');
        if (!backgroundPoller) {
            backgroundPoller = new BackgroundPoller();
        }
        backgroundPoller.start();
    });

    // Connection error (network issues)
    eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);

        if (eventSource.readyState === EventSource.CLOSED) {
            console.log('SSE connection closed unexpectedly');
            closeSSE();

            // Fallback to background polling
            console.log('Starting background polling after SSE closed');
            if (!backgroundPoller) {
                backgroundPoller = new BackgroundPoller();
            }
            backgroundPoller.start();
        }
    };
}

function closeSSE() {
    if (eventSource) {
        console.log('Closing SSE connection');
        eventSource.close();
        eventSource = null;
    }

    // Stop background polling if active
    if (backgroundPoller && backgroundPoller.isPolling) {
        backgroundPoller.stop();
    }

    hideLoading();
    isLoading = false;
}

// ==================== UI Functions ====================

function addMessage(text, sender, timestamp = null) {
    const messagesDiv = document.getElementById('chat-messages');

    // Remove welcome message if it exists
    const welcomeMessage = messagesDiv.querySelector('.welcome-message');
    if (welcomeMessage && sender === 'user') {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = formatMessage(text);

    messageDiv.appendChild(bubbleDiv);
    messagesDiv.appendChild(messageDiv);

    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Save to localStorage (auto-backup)
    saveToLocalStorage(text, sender, timestamp);
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

// ==================== Utility Functions ====================

function searchResearch(keyword) {
    const input = document.getElementById('message-input');
    input.value = `${keyword}에 대한 최신 연구 알려줘`;
    sendMessage();
}

// ==================== History Recovery ====================

async function restoreChatHistory() {
    console.log('Restoring chat history...');

    try {
        // Try to fetch from server first
        const response = await fetch('/api/history');

        if (response.ok) {
            const data = await response.json();
            console.log('Fetched history from server:', data);

            if (data.messages && data.messages.length > 0) {
                // Clear welcome message
                const messagesDiv = document.getElementById('chat-messages');
                const welcomeMessage = messagesDiv.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.remove();
                }

                // Restore messages from server (source of truth)
                data.messages.forEach(msg => {
                    addMessage(msg.text, msg.sender, msg.timestamp);
                });

                console.log(`Restored ${data.messages.length} messages from server`);
                return true;
            }
        } else {
            console.warn('Failed to fetch history from server:', response.status);
        }
    } catch (error) {
        console.error('Error fetching history from server:', error);
    }

    // Fallback to localStorage if server fails
    console.log('Falling back to localStorage...');
    const localHistory = loadFromLocalStorage();

    if (localHistory.messages && localHistory.messages.length > 0) {
        const messagesDiv = document.getElementById('chat-messages');
        const welcomeMessage = messagesDiv.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        localHistory.messages.forEach(msg => {
            // Don't save to localStorage again (already there)
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';
            bubbleDiv.innerHTML = formatMessage(msg.text);

            messageDiv.appendChild(bubbleDiv);
            messagesDiv.appendChild(messageDiv);
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        console.log(`Restored ${localHistory.messages.length} messages from localStorage`);
        return true;
    }

    console.log('No history to restore');
    return false;
}

// ==================== Event Listeners ====================

// Auto-show Profile Modal and Restore History
window.addEventListener('load', async () => {
    // First, restore chat history
    const hasHistory = await restoreChatHistory();

    // Then, show profile modal if needed
    const hasSetProfile = sessionStorage.getItem('hasSetProfile');
    if (!hasSetProfile && !hasHistory) {
        setTimeout(() => {
            showProfileModal();
            sessionStorage.setItem('hasSetProfile', 'true');
        }, 1000);
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
