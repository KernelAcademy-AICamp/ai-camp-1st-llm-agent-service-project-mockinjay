# preprocess/hospital_dialysis_preprocess.py
# AI-CAMP 1기 - 병원/약국 + 혈액투석기 + 야간투석 + 카카오맵 좌표 보정 완전 통합 파이프라인
# 작성일: 2025.11.19

import os
import re
import json
import time
import urllib.parse
import requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
import PyPDF2
from tqdm import tqdm

# .env에서 카카오 API 키 로드 (없으면 공공데이터 좌표만 사용)
load_dotenv()
KAKAO_KEY = os.getenv("KAKAO_REST_API_KEY")

print("AI-CAMP 1기 - 병원/약국 + 혈액투석 + 야간투석 + 카카오맵 좌표 보정 시작")
print("=" * 80)

# 경로 설정 (AI-CAMP 규칙 100% 준수)
BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "raw" / "healthcareproviders"
OUTPUT_DIR = BASE_DIR / "processed"
OUTPUT_DIR.mkdir(exist_ok=True)

# 파일 경로
files = {
    "hosp": RAW_DIR / "1.병원정보서비스(2025.9).xlsx",
    "pharm": RAW_DIR / "2._약국정보서비스(2025.9).xlsx",
    "equip": RAW_DIR / "7.의료기관별상세정보서비스_05_의료장비정보 2025.9.xlsx",
    "pdf": RAW_DIR / "hira_night_dialysis.pdf"
}

# 파일 존재 확인
missing = [k for k, f in files.items() if not f.exists()]
if missing:
    print("다음 파일이 없습니다! 구글드라이브에서 다운로드 후 data/raw/healthcareproviders/ 에 넣어주세요:")
    for k in missing:
        print(f"   → {files[k].name}")
    exit()

print(f"원본 위치: {RAW_DIR}")
print(f"출력 위치: {OUTPUT_DIR}")

# 카카오맵 주소 → 좌표 변환 (정확도 99.9%)
def get_kakao_coord(address: str):
    if not KAKAO_KEY or not address or "주소없음" in address:
        return None, None
    url = "https://dapi.kakao.com/v2/local/search/address.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_KEY}"}
    try:
        resp = requests.get(url, headers=headers, params={"query": address}, timeout=5)
        if resp.status_code == 200 and resp.json().get("documents"):
            doc = resp.json()["documents"][0]
            return float(doc["y"]), float(doc["x"])  # lat, lng
    except:
        pass
    return None, None

# 1. 혈액투석기 대수 (1순위)
print("\n1. 혈액투석기 대수 추출 (7번 엑셀 - D214)")
df_equip = pd.read_excel(files["equip"])
dialysis_df = df_equip[df_equip["장비코드"] == "D214"].copy()
dialysis_df["요양기관명"] = dialysis_df["요양기관명"].str.strip()
dialysis_count = dialysis_df.groupby("요양기관명")["장비대수"].sum().to_dict()
total_machines = sum(dialysis_count.values())
print(f"   → 투석기 보유 병원: {len(dialysis_count):,}곳 | 총 대수: {total_machines:,}대")

# 2. 야간투석 PDF (2순위)
print("\n2. 야간투석 정보 추출")
night_dict = {}
if files["pdf"].exists():
    with open(files["pdf"], "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = "".join(page.extract_text() or "" for page in reader.pages)
    pattern = r"(\d+)\s+(.+?)\s+[가-힣]+(?:도|시|구)[^ ]*\s+([월화수목금토일, ]+)"
    for _, name, days in re.findall(pattern, text):
        name = re.sub(r"\s+", " ", name.strip())
        night_dict[name] = {"night_dialysis": True, "dialysis_days": days.replace(" ", ",")}
print(f"   → 야간투석 운영 병원: {len(night_dict)}곳")

# 3. 병원 + 약국 기본정보
print("\n3. 병원 + 약국 정보 로딩")
df_hosp = pd.read_excel(files["hosp"])
df_pharm = pd.read_excel(files["pharm"])
df_base = pd.concat([df_hosp, df_pharm], ignore_index=True)
df_base["요양기관명"] = df_base["요양기관명"].str.strip()
print(f"   → 병원/의원: {len(df_hosp):,}건 | 약국: {len(df_pharm):,}건 | 총: {len(df_base):,}건")

# 4. 통합 + 카카오맵 좌표 보정
print("\n4. 최종 통합 + 카카오맵 좌표 보정 중...")
records = []
kakao_updated = 0

for _, row in tqdm(df_base.iterrows(), total=len(df_base)):
    name = row["요양기관명"]
    addr = str(row.get("주소", "")) if pd.notna(row.get("주소")) else ""
    phone = str(row.get("전화번호", "")) if pd.notna(row.get("전화번호")) else ""
    region = str(row.get("시도코드명", "기타"))
    lat = row.get("좌표(Y)")
    lng = row.get("좌표(X)")

    # 좌표 보정 로직
    if (lat is None or lng is None or
        not (30 < float(lat or 0) < 39) or not (125 < float(lng or 0) < 132)):
        new_lat, new_lng = get_kakao_coord(addr)
        if new_lat and new_lng:
            lat, lng = new_lat, new_lng
            kakao_updated += 1
        time.sleep(0.02)  # API 부하 방지

    machines = int(dialysis_count.get(name, 0))
    night_info = night_dict.get(name, {})

    record = {
        "name": name,
        "address": addr,
        "phone": phone,
        "region": region,
        "type": "약국" if "약국" in str(row.get("종별코드명", "")) else "병원/의원",
        "dialysis_machines": machines,
        "has_dialysis_unit": machines > 0,
        "night_dialysis": night_info.get("night_dialysis", False),
        "dialysis_days": night_info.get("dialysis_days", ""),
        "naver_map_url": f"https://map.naver.com/v5/search/{urllib.parse.quote(name)}",
        "kakao_map_url": f"https://map.kakao.com/?q={urllib.parse.quote(name)}",
        "lat": float(lat) if lat else None,
        "lng": float(lng) if lng else None,
        "coord_source": "kakao" if kakao_updated > 0 and new_lat else "public_data",
        "updated_at": datetime.now().isoformat()
    }
    records.append(record)

# 5. 저장
timestamp = datetime.now().strftime("%Y%m%d")
csv_file = OUTPUT_DIR / f"hospital_pharmacy_dialysis_2025.csv"
jsonl_file = OUTPUT_DIR / f"hospital_pharmacy_dialysis_2025.jsonl"

pd.DataFrame(records).to_csv(csv_file, index=False, encoding="utf-8-sig")
with open(jsonl_file, "w", encoding="utf-8") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

# 6. 최종 요약
print("\n" + "=" * 80)
print("전처리 완료!")
print(f"총 의료기관: {len(records):,}건")
print(f"혈액투석기 보유: {len(dialysis_count):,}곳 (총 {total_machines:,}대)")
print(f"야간투석 운영: {len(night_dict)}곳")
print(f"카카오맵으로 좌표 보정: {kakao_updated:,}건")
print(f"CSV 저장: {csv_file}")
print(f"JSONL 저장: {jsonl_file}")
print("=" * 80)
print("\nMongoDB 업로드 (다른 개발자가 수행):")
print(f"mongoimport --db=aicamp --collection=hospitals --file={jsonl_file} --jsonArray")
print("완료!")
