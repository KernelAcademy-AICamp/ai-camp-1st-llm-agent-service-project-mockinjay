# ⚡ Slack 알람 빠른 시작 가이드

## 🎯 3단계로 Slack 알람 설정하기

### 1️⃣ Slack Webhook 생성 (5분)

**방법 1: 브라우저에서**
1. https://api.slack.com/apps 접속
2. "Create New App" → "From scratch" 클릭
3. 앱 이름: "Server Alert" 입력
4. Workspace 선택 → "Create App"
5. 왼쪽 메뉴 "Incoming Webhooks" 클릭
6. 토글 ON → "Add New Webhook to Workspace"
7. 채널 선택 (예: #server-alerts) → "Allow"
8. **Webhook URL 복사** ✂️

복사된 URL:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

---

### 2️⃣ Webhook 테스트 (1분)

```bash
# 방법 1: 테스트 스크립트 사용
./scripts/slack-test.sh "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 방법 2: 직접 curl 사용
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -H 'Content-Type: application/json' \
  -d '{"text":"🎉 테스트 성공!"}'
```

✅ Slack 채널에 메시지가 도착하면 성공!

---

### 3️⃣ 로그 모니터링 시작 (1분)

**환경변수 설정**:
```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**영구 설정 (선택사항)**:
```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
echo 'export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"' >> ~/.zshrc
source ~/.zshrc
```

**모니터링 실행**:
```bash
# Backend 로그 모니터링
python3 scripts/log_alert_slack.py /tmp/backend.log

# 백그라운드 실행
nohup python3 scripts/log_alert_slack.py /tmp/backend.log > /tmp/alert.log 2>&1 &
```

---

## 🎨 알람 예시

### 발생 가능한 알람:

| 에러 타입 | 이모지 | Slack 색상 | 예시 |
|-----------|--------|------------|------|
| auth_failed | 🔐 | 주황색 | 401 인증 실패 |
| forbidden | ⛔ | 빨간색 | 403 접근 거부 |
| not_found | ❓ | 주황색 | 404 없음 |
| server_error | 🔥 | 빨간색 | 500 서버 에러 |
| critical | 💥 | 빨간색 | CRITICAL 로그 |

---

## 🧪 에러 시뮬레이션 테스트

```bash
# 1. 모니터링 시작 (다른 터미널)
python3 scripts/log_alert_slack.py /tmp/backend.log

# 2. 에러 발생시키기 (원래 터미널)
curl -X GET "http://localhost:8000/api/user/profile" \
  -H "Authorization: Bearer invalid_token"

# 3. Slack 확인!
# → 🔐 401 Unauthorized 알람이 도착합니다!
```

---

## 📱 실시간 모니터링 대시보드

### Slack 채널 구성 권장사항:

```
#server-alerts        → 모든 에러 (401, 403, 500 등)
#server-critical      → 심각한 에러만 (500, CRITICAL)
#server-metrics       → 성능 지표 (선택)
```

각 채널별로 Webhook을 따로 생성하면 알람 분류 가능!

---

## 🔧 고급 설정

### 알람 필터링:
```python
# log_alert_slack.py 수정
# 특정 에러만 Slack 전송
if alert_type in ['server_error', 'critical']:
    send_slack_alert(alert_type, message)
else:
    # 401, 403 등은 콘솔에만 출력
    print(f"INFO: {alert_type} - {message}")
```

### 알람 빈도 제한 (중복 방지):
```python
from datetime import datetime, timedelta

alert_cache = {}

def should_send_alert(alert_type):
    now = datetime.now()
    if alert_type in alert_cache:
        last_sent = alert_cache[alert_type]
        if now - last_sent < timedelta(minutes=5):
            return False  # 5분 이내 중복 알람 차단
    
    alert_cache[alert_type] = now
    return True
```

---

## ⚠️ 주의사항

1. **Webhook URL 보안**
   - Git에 절대 커밋하지 마세요!
   - `.env` 파일에 저장하고 `.gitignore`에 추가
   
2. **알람 폭탄 방지**
   - 빈도 제한 설정 (위 고급 설정 참고)
   - 심각한 에러만 Slack 전송, 나머지는 로그만

3. **Webhook URL 분실 시**
   - Slack App 설정 페이지에서 재확인 가능
   - https://api.slack.com/apps → 앱 선택 → Incoming Webhooks

---

## 📊 다음 단계

1. **로그 로테이션 설정** → 디스크 용량 관리
2. **Grafana/Prometheus 연동** → 시각화 대시보드
3. **ELK Stack 도입** → 대규모 로그 검색/분석
4. **PagerDuty 연동** → 심야 긴급 알람 (On-call)

---

## 🆘 문제 해결

### "Webhook URL 오류"
```bash
# 환경변수 확인
echo $SLACK_WEBHOOK_URL

# 재설정
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

### "메시지가 안 옴"
1. Webhook URL이 정확한지 확인
2. 채널 권한 확인
3. `slack-test.sh`로 수동 테스트

### "너무 많은 알람"
```python
# 패턴 제한 (server_error만)
ALERT_PATTERNS = {
    'server_error': r'50[0-9]'
}
```
