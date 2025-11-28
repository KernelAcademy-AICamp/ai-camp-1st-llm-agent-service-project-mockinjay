# Slack Webhook 설정 가이드

## 📝 단계별 설정

### 1단계: Slack App 생성
1. 브라우저에서 접속: https://api.slack.com/apps
2. **"Create New App"** 버튼 클릭
3. **"From scratch"** 선택
4. 앱 이름 입력 (예: "Server Alert Bot")
5. Workspace 선택 → **"Create App"** 클릭

### 2단계: Incoming Webhook 활성화
1. 왼쪽 메뉴에서 **"Incoming Webhooks"** 클릭
2. **"Activate Incoming Webhooks"** 토글을 **ON**으로 변경
3. 페이지 아래로 스크롤 → **"Add New Webhook to Workspace"** 클릭
4. 알람을 받을 채널 선택 (예: #server-alerts)
5. **"Allow"** 클릭

### 3단계: Webhook URL 복사
```
복사된 URL 형식:
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

⚠️ **중요**: 이 URL은 비밀번호처럼 관리해야 합니다!

---

## 🧪 테스트

### 터미널에서 테스트:
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"🚨 테스트 알람입니다!"}'
```

### Python 스크립트 테스트:
```python
import requests

webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
message = {
    "text": "🚨 서버 에러 발생!",
    "attachments": [{
        "color": "danger",
        "fields": [
            {"title": "에러 타입", "value": "401 Unauthorized", "short": True},
            {"title": "시간", "value": "2024-01-01 10:00:00", "short": True}
        ]
    }]
}

response = requests.post(webhook_url, json=message)
print(f"전송 결과: {response.status_code}")
```

---

## 🎨 메시지 포맷팅

### 기본 메시지:
```json
{
  "text": "간단한 메시지"
}
```

### 고급 포맷팅:
```json
{
  "text": "🚨 서버 알람",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 서버 에러 발생!"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*에러 타입:*\n401 Unauthorized"},
        {"type": "mrkdwn", "text": "*시간:*\n2024-01-01 10:00:00"}
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*로그:*\n```INFO: 127.0.0.1 - GET /api/user/profile HTTP/1.1 401```"
      }
    }
  ]
}
```

---

## 🔐 보안 주의사항

### ❌ 절대 하지 말 것:
- Webhook URL을 GitHub에 커밋하지 마세요!
- 공개 저장소에 노출하지 마세요!

### ✅ 안전하게 관리:
```bash
# .env 파일에 저장 (Git에서 제외)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# .gitignore에 추가
echo ".env" >> .gitignore
```

### Python에서 환경변수 사용:
```python
import os
from dotenv import load_dotenv

load_dotenv()
webhook_url = os.getenv('SLACK_WEBHOOK_URL')
```

---

## 📊 실제 사용 예시

### log_alert.py에 Slack 연동:
```python
import requests
import os

SLACK_WEBHOOK = os.getenv('SLACK_WEBHOOK_URL')

def send_slack_alert(alert_type, message):
    if not SLACK_WEBHOOK:
        print("⚠️  SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다")
        return
    
    payload = {
        "text": f"🚨 서버 알람: {alert_type}",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚨 {alert_type} 에러 감지"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"```{message}```"
                }
            }
        ]
    }
    
    response = requests.post(SLACK_WEBHOOK, json=payload)
    if response.status_code == 200:
        print(f"✅ Slack 알람 전송 성공: {alert_type}")
    else:
        print(f"❌ Slack 알람 전송 실패: {response.status_code}")
```

---

## 🎯 채널 변경

Webhook은 특정 채널에 고정되어 있지만, 여러 채널에 보내려면:

1. 같은 앱에서 여러 Webhook 생성 (채널별로)
2. 또는 `channel` 파라미터 사용 (권한 필요):
```json
{
  "text": "메시지",
  "channel": "#다른채널"
}
```

---

## 📚 공식 문서
- Slack API: https://api.slack.com/messaging/webhooks
- Block Kit Builder: https://app.slack.com/block-kit-builder
- Message Formatting: https://api.slack.com/reference/surfaces/formatting
