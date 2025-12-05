"""
Simple Welfare Journey for Medical Welfare Agent (Fallback & Tool Instructions)
"""

import parlant.sdk as p

async def create_welfare_journey(agent: p.Agent, search_welfare_programs, search_hospitals) -> p.Journey:
    """
    Simplified Welfare Support Journey with Fallbacks
    Structure: Start -> Direct Answer -> (Fallback) Tool Search -> Result -> End
    """
    journey = await agent.create_journey(
        title="Welfare Support Journey",
        description="Guidance on welfare programs (Special Calculation, disability reg, medical expenses) for CKD patients.",
        conditions=["User asks any welfare or hospital question or related question"],
    )
    
    # ========================================
    # Step 1: Welfare Search (Fallback / Broad Condition)
    # ========================================
    # Acts as a fallback if the initial answer is insufficient OR if the user asks for more details later.
    t_welfare = await journey.initial_state.transition_to(
        tool_state=search_welfare_programs,
        condition="User needs specific region info, comparison, detailed welfare data, or the previous answer was insufficient.",
        tool_instruction="Search for welfare programs based on the user's specific criteria (e.g., region, income level, or benefit type) and provide results in Korean. Use the following parameters: query: str, category: Optional[str] = None, disease: Optional[str] = None, ckd_stage: Optional[int] = None"
    )

    # ========================================
    # Step 2: Hospital Search (Fallback / Broad Condition)
    # ========================================
    # Acts as a fallback if the user specifically needs facility locations.
    t_hospital = await t_welfare.target.transition_to(
        tool_state=search_hospitals,
        condition="User explicitly asks to find a hospital, facility, or needs location-based medical services.",
        tool_instruction="Find medical facilities or hospitals that match the user's location and required service (e.g., dialysis, night shift) in ONLY Korean. Use the following parameters: query: str, hospital_type: Optional[str] = None, region: Optional[str] = None, has_dialysis: Optional[bool] = None, night_dialysis: Optional[bool] = None, latitude: Optional[float] = None, longitude: Optional[float] = None, max_distance_km: Optional[float] = 10.0"
    )
    
    # ========================================
    # Step 3: Result Presentation (Common)
    # ========================================
    t_result = await t_welfare.target.transition_to(
        chat_state="""
        Summarize the search results clearly.
        - Welfare: Welfare name, benefits, eligibility.
        - Hospital: Hospital name, location, services.
        - Answer in the language the user is using.
        """,
        condition="Welfare search completed and results are ready to present to the user."
    )

    # Connect Hospital Search result to the same output state
    await t_hospital.target.transition_to(
        state=t_result.target,
        condition="Hospital search completed and results are ready to present to the user."
    )

    # ========================================
    # Broad Fallback for Continued Search (Instead of Loops)
    # ========================================

    t_broad_fallback_hospital = await t_result.target.transition_to(
        tool_state=search_hospitals,
        condition="hospital search is not completed.",
        tool_instruction="Find medical facilities or hospitals that match the user's location and required service (e.g., dialysis, night shift) in ONLY Korean. Use this parameter: query: str, hospital_type: Optional[str] = None, region: Optional[str] = None, has_dialysis: Optional[bool] = None, night_dialysis: Optional[bool] = None, latitude: Optional[float] = None, longitude: Optional[float] = None, max_distance_km: Optional[float] = 10.0"
    )
    
    t_broad_fallback_welfare = await t_result.target.transition_to(
        tool_state=search_welfare_programs,
        condition="welfare search is not completed.",
        tool_instruction="Search for welfare programs based on the user's specific criteria (e.g., region, income level, or benefit type) and provide results in Korean. Use this parameter: query: str, category: Optional[str] = None, disease: Optional[str] = None, ckd_stage: Optional[int] = None"
    )
    await t_broad_fallback_hospital.target.transition_to(
        state=t_result.target,
        condition="Hospital search completed and results are ready to present to the user."
    )
    await t_broad_fallback_welfare.target.transition_to(
        state=t_result.target,
        condition="Hospital search completed and results are ready to present to the user."
    )

    # ========================================
    # End
    # ========================================
    end_condition = "Answer is now complete and satisfactory."
    
    await t_result.target.transition_to(state=p.END_JOURNEY, condition=end_condition)

    return journey
