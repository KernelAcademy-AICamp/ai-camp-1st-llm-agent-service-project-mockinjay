#!/bin/bash

# 로그 모니터링 스크립트
# 사용법: ./log-monitor.sh <로그파일> <에러패턴>

LOG_FILE=${1:-/tmp/backend.log}
ERROR_PATTERN=${2:-"40[0-9] \|50[0-9] \|ERROR\|CRITICAL"}

echo "=== 로그 모니터링 시작 ==="
echo "파일: $LOG_FILE"
echo "패턴: $ERROR_PATTERN"
echo "=========================="

# 실시간 로그 모니터링 (Ctrl+C로 중단)
tail -f "$LOG_FILE" | grep --line-buffered -E "$ERROR_PATTERN" | while read line
do
    echo "🚨 [$(date '+%Y-%m-%d %H:%M:%S')] 에러 감지!"
    echo "$line"
    
    # 여기에 알람 로직 추가 가능
    # 예: Slack 웹훅, 이메일, SMS 등
    # curl -X POST https://hooks.slack.com/... -d "{'text': '$line'}"
done
