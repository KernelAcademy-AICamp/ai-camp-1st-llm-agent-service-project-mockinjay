#!/bin/bash

# Slack Webhook 테스트 스크립트
# 사용법: ./slack-test.sh <webhook-url>

WEBHOOK_URL=$1

if [ -z "$WEBHOOK_URL" ]; then
    echo "❌ 사용법: ./slack-test.sh <webhook-url>"
    echo ""
    echo "예시:"
    echo "./slack-test.sh 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX'"
    exit 1
fi

echo "🚀 Slack 테스트 메시지 전송 중..."
echo ""

# 테스트 메시지 전송
curl -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🎉 Slack Webhook 연동 테스트 성공!",
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "✅ CareGuide 서버 알람 시스템"
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "*상태:*\n연동 성공"
          },
          {
            "type": "mrkdwn",
            "text": "*시간:*\n'$(date '+%Y-%m-%d %H:%M:%S')'"
          }
        ]
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "서버 에러 알람이 이 채널로 전송됩니다! 🚨"
        }
      }
    ]
  }'

echo ""
echo ""
echo "✅ 전송 완료! Slack 채널을 확인하세요."
