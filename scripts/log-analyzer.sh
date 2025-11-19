#!/bin/bash

# 로그 분석 스크립트
# 에러 통계와 요약을 보여줍니다

LOG_FILE=${1:-/tmp/backend.log}

echo "=== 로그 분석 리포트 ==="
echo "파일: $LOG_FILE"
echo "크기: $(du -h $LOG_FILE | cut -f1)"
echo "=========================="
echo ""

echo "📊 HTTP 상태 코드 통계:"
grep -oE "HTTP/[0-9.]+ [0-9]{3}" "$LOG_FILE" | awk '{print $2}' | sort | uniq -c | sort -rn

echo ""
echo "⚠️  4xx 에러 (클라이언트 에러):"
grep -E " 4[0-9]{2} " "$LOG_FILE" | tail -5

echo ""
echo "🚨 5xx 에러 (서버 에러):"
grep -E " 5[0-9]{2} " "$LOG_FILE" | tail -5

echo ""
echo "📈 최근 10개 요청:"
tail -10 "$LOG_FILE" | grep -E "INFO:.*HTTP"
