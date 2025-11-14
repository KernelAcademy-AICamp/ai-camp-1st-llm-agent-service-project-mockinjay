// ==================== Global State ====================

let currentProfile = 'general';
let isLoading = false;
let isPolling = false;
let pollTimeout = null;

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

    // Stop any ongoing polling
    stopPolling();

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

            // Start polling for response
            startPolling();
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

// ==================== Polling ====================

let pollAttemptCount = 0;
const MAX_POLL_ATTEMPTS = 20;  // 20 attempts × 10s = up to 3+ minutes

function startPolling() {
    if (isPolling) {
        return;
    }

    isPolling = true;
    pollAttemptCount = 0;
    console.log(`Starting polling (max ${MAX_POLL_ATTEMPTS} attempts)`);
    pollForMessages();
}

function stopPolling() {
    isPolling = false;
    if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
    }
    hideLoading();
    isLoading = false;
    console.log('Polling stopped');
}

async function pollForMessages() {
    if (!isPolling) {
        console.log('Polling stopped');
        return;
    }

    pollAttemptCount++;
    console.log(`Polling attempt ${pollAttemptCount}/${MAX_POLL_ATTEMPTS}...`);

    // Check if we've exceeded max attempts
    if (pollAttemptCount > MAX_POLL_ATTEMPTS) {
        console.log('Max poll attempts reached');
        stopPolling();
        addMessage('⏱️ 응답 대기 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.', 'assistant');
        return;
    }

    try {
        const response = await fetch('/api/poll?wait=10', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Poll error:', response.status);
            stopPolling();
            return;
        }

        const data = await response.json();
        console.log('Poll response:', data);

        // Add any received messages
        if (data.messages && data.messages.length > 0) {
            console.log(`Received ${data.messages.length} message(s)`);
            for (const message of data.messages) {
                addMessage(message, 'assistant');
            }
        }

        // Add paper results if any
        if (data.papers && data.papers.length > 0) {
            console.log(`Received ${data.papers.length} paper(s)`);
            addPaperResults(data.papers);
        }

        // Check if we should continue polling
        if (data.has_more) {
            console.log('More messages expected, polling again immediately...');
            // More messages expected, poll immediately
            pollForMessages();
        } else if (data.messages && data.messages.length > 0) {
            console.log('Got messages, polling once more in 2 seconds...');
            // Got messages, wait a bit then poll once more
            pollTimeout = setTimeout(() => {
                pollForMessages();
            }, 2000);
        } else {
            // No messages yet, but keep polling if under max attempts
            console.log('No messages yet, continuing to poll...');
            pollTimeout = setTimeout(() => {
                pollForMessages();
            }, 1000);  // Wait 1s before next poll
        }

    } catch (error) {
        console.error('Error polling:', error);
        stopPolling();
    }
}

function addMessage(text, sender) {
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

// ==================== Auto-show Profile Modal ====================

// Show profile modal on first visit
window.addEventListener('load', () => {
    const hasSetProfile = sessionStorage.getItem('hasSetProfile');
    if (!hasSetProfile) {
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

// Stop polling when page unloads
window.addEventListener('beforeunload', () => {
    stopPolling();
});
