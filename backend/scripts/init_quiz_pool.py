"""
Quiz Pool Initialization Script
DB에 미리 정의된 퀴즈 문제를 저장하는 스크립트
"""

import sys
from pathlib import Path

# Add backend path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.db.connection import db
from datetime import datetime

# 퀴즈 문제 풀 (카테고리별, 난이도별)
QUIZ_POOL = [
    # ============ NUTRITION (영양) - EASY ============
    {
        "category": "nutrition",
        "difficulty": "easy",
        "question": "만성콩팥병(CKD) 환자는 과일을 많이 섭취하는 것이 좋다.",
        "answer": False,
        "explanation": "과일에는 칼륨이 많이 함유되어 있어 CKD 환자는 칼륨 섭취를 제한해야 합니다. 특히 바나나, 오렌지, 토마토 등은 칼륨이 높아 주의가 필요합니다."
    },
    {
        "category": "nutrition",
        "difficulty": "easy",
        "question": "만성콩팥병 환자는 단백질 섭취를 완전히 피해야 한다.",
        "answer": False,
        "explanation": "단백질은 완전히 피하는 것이 아니라 적정량을 섭취해야 합니다. 의사나 영양사의 지도에 따라 고품질 단백질을 적절히 섭취하는 것이 중요합니다."
    },
    {
        "category": "nutrition",
        "difficulty": "easy",
        "question": "CKD 환자는 나트륨(소금) 섭취를 제한해야 한다.",
        "answer": True,
        "explanation": "나트륨 과다 섭취는 혈압 상승, 부종, 심혈관 질환 위험을 높입니다. 하루 2,000mg 이하로 제한하는 것이 권장됩니다."
    },
    {
        "category": "nutrition",
        "difficulty": "easy",
        "question": "물을 많이 마시면 신장 기능이 좋아진다.",
        "answer": False,
        "explanation": "CKD 환자의 경우 신장 기능이 저하되어 있어 과도한 수분 섭취는 오히려 부종과 합병증을 유발할 수 있습니다. 의사의 지시에 따른 적절한 수분 섭취가 필요합니다."
    },
    {
        "category": "nutrition",
        "difficulty": "easy",
        "question": "가공식품은 나트륨이 높아 CKD 환자가 피해야 할 음식이다.",
        "answer": True,
        "explanation": "가공식품, 통조림, 즉석식품은 나트륨 함량이 매우 높습니다. CKD 환자는 가능한 신선한 재료로 조리한 음식을 섭취하는 것이 좋습니다."
    },

    # ============ NUTRITION (영양) - MEDIUM ============
    {
        "category": "nutrition",
        "difficulty": "medium",
        "question": "투석 환자는 일반 CKD 환자보다 단백질을 더 많이 섭취해야 한다.",
        "answer": True,
        "explanation": "투석 과정에서 단백질과 아미노산이 손실되므로, 투석 환자는 비투석 CKD 환자보다 더 많은 단백질 섭취가 필요합니다."
    },
    {
        "category": "nutrition",
        "difficulty": "medium",
        "question": "인(phosphorus) 수치가 높으면 뼈 건강에 문제가 생길 수 있다.",
        "answer": True,
        "explanation": "고인산혈증은 칼슘-인 균형을 깨뜨려 뼈에서 칼슘이 빠져나가게 하고, 혈관 석회화를 유발할 수 있습니다."
    },
    {
        "category": "nutrition",
        "difficulty": "medium",
        "question": "저칼륨 식품으로는 사과, 포도, 블루베리가 있다.",
        "answer": True,
        "explanation": "사과, 포도, 블루베리, 딸기 등은 상대적으로 칼륨 함량이 낮아 CKD 환자가 섭취하기 적합한 과일입니다."
    },
    {
        "category": "nutrition",
        "difficulty": "medium",
        "question": "CKD 3-4기 환자의 권장 단백질 섭취량은 체중 1kg당 1.5g이다.",
        "answer": False,
        "explanation": "CKD 3-4기 환자는 체중 1kg당 0.6-0.8g의 단백질 섭취가 권장됩니다. 과도한 단백질은 신장에 부담을 줄 수 있습니다."
    },
    {
        "category": "nutrition",
        "difficulty": "medium",
        "question": "채소를 물에 담가두면 칼륨 함량을 줄일 수 있다.",
        "answer": True,
        "explanation": "채소를 잘게 썰어 물에 2시간 이상 담가두거나 데쳐서 물을 버리면 칼륨 함량을 30-50% 줄일 수 있습니다."
    },

    # ============ NUTRITION (영양) - HARD ============
    {
        "category": "nutrition",
        "difficulty": "hard",
        "question": "케토아날로그(ketoacid analogues)는 CKD 환자의 저단백 식이요법 보조제로 사용된다.",
        "answer": True,
        "explanation": "케토아날로그는 질소가 없는 아미노산 유도체로, 저단백 식이 시 필수 아미노산을 공급하면서 요독소 생성을 줄이는 데 도움이 됩니다."
    },
    {
        "category": "nutrition",
        "difficulty": "hard",
        "question": "CKD 환자의 비타민D 활성화는 신장에서만 이루어진다.",
        "answer": True,
        "explanation": "비타민D의 활성형인 칼시트리올(1,25-dihydroxyvitamin D)은 주로 신장에서 합성됩니다. CKD로 인한 신장 기능 저하는 비타민D 활성화 장애를 유발합니다."
    },
    {
        "category": "nutrition",
        "difficulty": "hard",
        "question": "FGF-23(섬유아세포 성장인자 23)은 인 배설을 증가시키는 호르몬이다.",
        "answer": True,
        "explanation": "FGF-23은 뼈에서 분비되어 신장의 인 재흡수를 억제하고 비타민D 활성화를 감소시킵니다. CKD 초기부터 FGF-23이 상승합니다."
    },

    # ============ TREATMENT (치료/관리) - EASY ============
    {
        "category": "treatment",
        "difficulty": "easy",
        "question": "고혈압은 만성콩팥병의 원인이자 결과가 될 수 있다.",
        "answer": True,
        "explanation": "고혈압은 신장 혈관을 손상시켜 CKD를 유발할 수 있고, 반대로 신장 기능 저하는 체액 조절 장애를 일으켜 고혈압을 악화시킬 수 있습니다."
    },
    {
        "category": "treatment",
        "difficulty": "easy",
        "question": "당뇨병은 만성콩팥병의 가장 흔한 원인 중 하나이다.",
        "answer": True,
        "explanation": "당뇨병은 전 세계적으로 CKD의 가장 흔한 원인입니다. 장기간의 고혈당은 신장의 사구체를 손상시켜 당뇨병성 신장병을 유발합니다."
    },
    {
        "category": "treatment",
        "difficulty": "easy",
        "question": "CKD 환자는 진통제(NSAIDs)를 자유롭게 복용해도 된다.",
        "answer": False,
        "explanation": "이부프로펜, 나프록센 같은 NSAIDs는 신장 혈류를 감소시켜 신장 기능을 악화시킬 수 있습니다. CKD 환자는 반드시 의사와 상담 후 진통제를 복용해야 합니다."
    },
    {
        "category": "treatment",
        "difficulty": "easy",
        "question": "GFR(사구체여과율)은 신장 기능을 측정하는 지표이다.",
        "answer": True,
        "explanation": "GFR은 신장이 1분 동안 여과하는 혈액의 양을 나타내며, CKD 진단과 병기 분류에 사용되는 가장 중요한 지표입니다."
    },
    {
        "category": "treatment",
        "difficulty": "easy",
        "question": "CKD 5기에 도달하면 반드시 투석이나 신장이식이 필요하다.",
        "answer": True,
        "explanation": "CKD 5기(말기신부전)는 GFR이 15 미만으로, 신장이 거의 기능하지 못하는 상태입니다. 생명 유지를 위해 투석이나 신장이식이 필요합니다."
    },

    # ============ TREATMENT (치료/관리) - MEDIUM ============
    {
        "category": "treatment",
        "difficulty": "medium",
        "question": "ACE억제제나 ARB는 CKD 진행을 늦추는 데 효과적인 약물이다.",
        "answer": True,
        "explanation": "ACE억제제와 ARB는 혈압을 낮추고 사구체 내압을 감소시켜 단백뇨를 줄이고 신장 보호 효과가 있습니다."
    },
    {
        "category": "treatment",
        "difficulty": "medium",
        "question": "복막투석은 환자가 집에서 스스로 시행할 수 있다.",
        "answer": True,
        "explanation": "복막투석(PD)은 환자가 교육을 받은 후 집에서 스스로 시행할 수 있어, 병원 방문 횟수를 줄이고 일상생활을 유지하는 데 유리합니다."
    },
    {
        "category": "treatment",
        "difficulty": "medium",
        "question": "혈액투석은 주 1회 정도면 충분하다.",
        "answer": False,
        "explanation": "표준적인 혈액투석은 주 3회, 회당 4시간 정도 시행합니다. 주 1회로는 충분한 노폐물 제거가 어렵습니다."
    },
    {
        "category": "treatment",
        "difficulty": "medium",
        "question": "SGLT2 억제제는 당뇨병이 없는 CKD 환자에게도 효과가 있다.",
        "answer": True,
        "explanation": "다파글리플로진 등 SGLT2 억제제는 당뇨병 유무와 관계없이 CKD 진행을 늦추고 심혈관 위험을 감소시키는 효과가 입증되었습니다."
    },
    {
        "category": "treatment",
        "difficulty": "medium",
        "question": "신장이식 후에는 면역억제제를 평생 복용해야 한다.",
        "answer": True,
        "explanation": "이식된 신장에 대한 면역 거부반응을 예방하기 위해 면역억제제를 평생 복용해야 합니다. 복용을 중단하면 이식 신장 기능 상실 위험이 높아집니다."
    },

    # ============ TREATMENT (치료/관리) - HARD ============
    {
        "category": "treatment",
        "difficulty": "hard",
        "question": "EPO(에리스로포이에틴) 제제는 CKD 환자의 빈혈 치료에 사용된다.",
        "answer": True,
        "explanation": "신장은 적혈구 생성을 촉진하는 EPO를 생산합니다. CKD로 인한 EPO 감소는 빈혈을 유발하며, EPO 제제 투여로 빈혈을 교정합니다."
    },
    {
        "category": "treatment",
        "difficulty": "hard",
        "question": "칼시필락시스(calciphylaxis)는 CKD 환자에서 발생할 수 있는 심각한 합병증이다.",
        "answer": True,
        "explanation": "칼시필락시스는 피부와 지방조직의 소혈관 석회화로 인한 괴사 질환으로, 주로 투석 환자에서 발생하며 사망률이 매우 높습니다."
    },
    {
        "category": "treatment",
        "difficulty": "hard",
        "question": "HIF-PHI(저산소 유도인자 프롤릴 수산화효소 억제제)는 경구 빈혈 치료제이다.",
        "answer": True,
        "explanation": "록사두스타트 등 HIF-PHI는 경구 복용이 가능한 새로운 빈혈 치료제로, 체내 EPO 생성을 자연적으로 증가시킵니다."
    },

    # ============ LIFESTYLE (생활습관) - EASY ============
    {
        "category": "lifestyle",
        "difficulty": "easy",
        "question": "규칙적인 운동은 CKD 환자에게 해롭다.",
        "answer": False,
        "explanation": "적절한 운동은 CKD 환자의 심혈관 건강, 혈당 조절, 정신 건강에 도움이 됩니다. 의사와 상담 후 적절한 운동을 하는 것이 권장됩니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "easy",
        "question": "흡연은 CKD 진행을 악화시킬 수 있다.",
        "answer": True,
        "explanation": "흡연은 혈관을 수축시키고 신장 혈류를 감소시켜 CKD 진행을 가속화합니다. 금연은 신장 보호에 매우 중요합니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "easy",
        "question": "CKD 환자는 정기적인 검진이 필요하다.",
        "answer": True,
        "explanation": "CKD는 진행성 질환이므로 정기적인 혈액검사, 소변검사, 혈압 모니터링을 통해 질환 진행을 관찰하고 적절한 치료를 받아야 합니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "easy",
        "question": "스트레스는 혈압에 영향을 미치지 않는다.",
        "answer": False,
        "explanation": "스트레스는 혈압 상승을 유발할 수 있으며, 이는 CKD 환자의 신장 기능에 부정적인 영향을 줄 수 있습니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "easy",
        "question": "충분한 수면은 CKD 환자의 건강 관리에 중요하다.",
        "answer": True,
        "explanation": "수면은 신체 회복과 면역 기능에 필수적입니다. 불충분한 수면은 고혈압, 당뇨 악화 등 CKD 위험 요인을 증가시킬 수 있습니다."
    },

    # ============ LIFESTYLE (생활습관) - MEDIUM ============
    {
        "category": "lifestyle",
        "difficulty": "medium",
        "question": "CKD 환자는 일반 감기약을 주의 없이 복용해도 된다.",
        "answer": False,
        "explanation": "많은 감기약에 NSAIDs, 슈도에페드린, 고용량 비타민C 등이 포함되어 있어 신장에 해로울 수 있습니다. 반드시 의사나 약사와 상담이 필요합니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "medium",
        "question": "CKD 환자의 예방접종은 일반인과 동일한 일정을 따른다.",
        "answer": False,
        "explanation": "CKD 환자, 특히 투석 환자는 면역 기능이 저하되어 있어 B형간염, 인플루엔자, 폐렴구균 등 추가 예방접종이 권장됩니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "medium",
        "question": "건강기능식품과 한약은 CKD 환자에게 항상 안전하다.",
        "answer": False,
        "explanation": "많은 건강기능식품과 한약에는 신장에 해로운 성분이 포함될 수 있습니다. CKD 환자는 반드시 의사와 상담 후 복용해야 합니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "medium",
        "question": "CKD 환자도 항공 여행을 할 수 있다.",
        "answer": True,
        "explanation": "CKD 환자도 적절한 준비(약물, 의료 기록, 식이 관리, 투석 일정 조정 등)를 하면 항공 여행이 가능합니다. 사전에 의료진과 상담하는 것이 중요합니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "medium",
        "question": "체중 감량은 비만한 CKD 환자의 신장 기능 보호에 도움이 된다.",
        "answer": True,
        "explanation": "비만은 CKD 진행의 위험 요인입니다. 적절한 체중 감량은 혈압 조절, 혈당 개선, 단백뇨 감소에 도움이 됩니다."
    },

    # ============ LIFESTYLE (생활습관) - HARD ============
    {
        "category": "lifestyle",
        "difficulty": "hard",
        "question": "조영제 사용 CT 검사는 모든 CKD 환자에게 금기이다.",
        "answer": False,
        "explanation": "조영제 유발 급성신손상(CI-AKI) 위험이 있지만, 검사의 필요성이 위험을 상회하는 경우 수액 공급 등 예방 조치 후 시행할 수 있습니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "hard",
        "question": "Gadolinium 조영제는 진행된 CKD 환자에서 신성전신섬유증(NSF)을 유발할 수 있다.",
        "answer": True,
        "explanation": "NSF는 GFR 30 미만 환자에서 가돌리늄 조영제 사용 시 발생할 수 있는 심각한 합병증으로, 피부와 장기의 섬유화를 유발합니다."
    },
    {
        "category": "lifestyle",
        "difficulty": "hard",
        "question": "CKD 환자의 일주기 리듬(circadian rhythm) 장애는 질환 진행과 관련이 있다.",
        "answer": True,
        "explanation": "CKD 환자에서 흔한 수면 장애와 일주기 리듬 교란은 염증 반응, 산화 스트레스를 증가시켜 CKD 진행에 기여할 수 있습니다."
    },
]


def init_quiz_pool():
    """퀴즈 풀 초기화"""
    quiz_pool_collection = db["quiz_pool"]

    # 기존 데이터 확인
    existing_count = quiz_pool_collection.count_documents({})
    print(f"기존 퀴즈 풀 문제 수: {existing_count}")

    if existing_count > 0:
        response = input("기존 데이터를 삭제하고 다시 생성하시겠습니까? (y/n): ")
        if response.lower() != 'y':
            print("취소되었습니다.")
            return
        quiz_pool_collection.delete_many({})
        print("기존 데이터 삭제 완료")

    # 인덱스 생성
    quiz_pool_collection.create_index([("category", 1), ("difficulty", 1)])
    quiz_pool_collection.create_index([("category", 1)])
    quiz_pool_collection.create_index([("difficulty", 1)])

    # 문제 삽입
    for q in QUIZ_POOL:
        q_doc = {
            **q,
            "totalAttempts": 0,
            "correctAttempts": 0,
            "createdAt": datetime.utcnow()
        }
        quiz_pool_collection.insert_one(q_doc)

    # 결과 출력
    total_count = quiz_pool_collection.count_documents({})
    print(f"\n=== 퀴즈 풀 초기화 완료 ===")
    print(f"총 문제 수: {total_count}")

    # 카테고리별 통계
    for category in ["nutrition", "treatment", "lifestyle"]:
        for difficulty in ["easy", "medium", "hard"]:
            count = quiz_pool_collection.count_documents({
                "category": category,
                "difficulty": difficulty
            })
            print(f"  {category}/{difficulty}: {count}문제")


if __name__ == "__main__":
    init_quiz_pool()
