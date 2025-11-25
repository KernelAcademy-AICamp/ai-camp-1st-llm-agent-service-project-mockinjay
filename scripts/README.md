# 로그 모니터링 및 관리 도구

## 📋 제공 스크립트

### 1. log-analyzer.sh
**용도**: 로그 파일 분석 및 통계

**사용법**:
```bash
./scripts/log-analyzer.sh /tmp/backend.log
```

**기능**:
- HTTP 상태 코드 통계
- 4xx/5xx 에러 목록
- 최근 요청 내역

---

### 2. log-monitor.sh
**용도**: 실시간 로그 모니터링 (Bash)

**사용법**:
```bash
# 기본 (400/500 에러 감지)
./scripts/log-monitor.sh /tmp/backend.log

# 커스텀 패턴
./scripts/log-monitor.sh /tmp/backend.log "403\|ERROR"
```

**기능**:
- 실시간 tail -f 모니터링
- 특정 패턴 감지 시 알람
- Slack/Email 연동 가능 (주석 참고)

---

### 3. log_alert.py
**용도**: 실시간 로그 모니터링 (Python)

**사용법**:
```bash
python3 scripts/log_alert.py /tmp/backend.log
```

**기능**:
- 더 정교한 패턴 매칭
- 알람 타입 분류 (auth_failed, forbidden, server_error 등)
- Slack/Email/SMS 연동 준비 완료

---

## 🔔 알람 연동 예시

### Slack 웹훅
```python
import requests

def send_slack_alert(message):
    webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    payload = {
        "text": f"🚨 서버 에러: {message}",
        "channel": "#alerts",
        "username": "Log Monitor"
    }
    requests.post(webhook_url, json=payload)
```

### 이메일
```python
import smtplib
from email.mime.text import MIMEText

def send_email_alert(subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = 'alert@yourapp.com'
    msg['To'] = 'admin@yourapp.com'
    
    s = smtplib.SMTP('localhost')
    s.send_message(msg)
    s.quit()
```

---

## 📊 로그 로테이션 (용량 관리)

### macOS (newsyslog)
1. 설정 파일 생성:
```bash
sudo vim /etc/newsyslog.d/app.conf
```

2. 내용:
```
# logfilename          [owner:group]    mode count size when  flags
/tmp/backend.log       shit:wheel       644  7     1024  *     J
/tmp/frontend.log      shit:wheel       644  7     1024  *     J
```

3. 의미:
- 1MB 초과 시 자동 로테이션
- 최근 7개 파일만 보관
- 압축하여 저장

### Linux (logrotate)
```bash
# /etc/logrotate.d/app
/tmp/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    maxsize 10M
}
```

---

## 🚀 프로덕션 권장 사항

1. **로그 수집 도구 사용**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Grafana Loki
   - Datadog, New Relic

2. **로그 레벨 설정**
   ```python
   # FastAPI에서
   import logging
   logging.basicConfig(level=logging.INFO)
   ```

3. **구조화된 로그**
   ```python
   # JSON 형식으로 로그 저장
   import json
   logger.info(json.dumps({
       "timestamp": "2024-01-01T10:00:00Z",
       "level": "ERROR",
       "status_code": 500,
       "path": "/api/user/profile",
       "error": "Database connection failed"
   }))
   ```

4. **로그 보관 정책**
   - 개발: 7일
   - 스테이징: 30일
   - 프로덕션: 90일 (법적 요구사항 확인)
