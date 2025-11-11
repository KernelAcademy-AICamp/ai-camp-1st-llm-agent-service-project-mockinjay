let currentProfile = 'general';

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

            addMessage(`프로필이 ${labels[profile]}로 설정되었습니다.`, 'assistant');
        }
    } catch (error) {
        console.error('Error setting profile:', error);
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    try {
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

        addMessage(data.message, 'assistant');

    } catch (error) {
        console.error('Error:', error);
        addMessage('오류가 발생했습니다.', 'assistant');
    }
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = text;

    messageDiv.appendChild(bubbleDiv);
    messagesDiv.appendChild(messageDiv);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function searchResearch(keyword) {
    const input = document.getElementById('message-input');
    input.value = `${keyword}에 대한 최신 연구 알려줘`;
    sendMessage();
}

function dismissBubble(button) {
    button.closest('.smart-bubble').remove();
}
