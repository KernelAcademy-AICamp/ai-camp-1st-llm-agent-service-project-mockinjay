"""
Welfare Journey for Medical Welfare Agent
"""

import parlant.sdk as p


# ==================== Welfare Journey Definition ====================

async def create_welfare_journey(agent: p.Agent, search_welfare_programs, search_hospitals) -> p.Journey:
    """
    Welfare Support Journey (based on Journey 1 pattern)

    High-level structure:
    - Multi-step conversation flow
    - Tool execution (search_welfare_programs, search_hospitals)
    - Conditional state transitions
    - Fork-based user choices
    - Profile-aware responses
    - Journey-level guidelines
    """
    journey = await agent.create_journey(
        title="Welfare Support Journey",
        description="Guide users to welfare programs, insurance support, and medical cost reduction options for CKD patients in Korea.",
        conditions=[
            "User asks about welfare programs or benefits",
            "User wants to know about copay reduction or special calculation",
            "User needs information about disability registration",
            "User asks about medical cost support or insurance benefits",
            "User mentions transport support or transportation assistance",
            "User asks how to apply for benefits or the application process",
            "User needs financial assistance information"
        ]
    )

    # ========================================
    # Step 0: Welcome and category overview
    # ========================================
    t0 = await journey.initial_state.transition_to(
        chat_state="""Hello, this is a welfare support consultation for people with chronic kidney disease (CKD). 🎗️

I can help you find:
1) Special copayment reduction programs  
2) Disability registration and related benefits  
3) Medical expense support for low-income households  
4) Kidney transplant support programs  
5) Transportation or daily-life support related to dialysis

These programs are based mainly on official welfare and health systems in Korea (2024–2025).

To support you better, please briefly describe:
- Your CKD status (e.g., stage, dialysis or transplant status)
- Your income or insurance situation (if you feel comfortable)
- What kind of help you are looking for (e.g., “reduce hospital bills”, “disability registration”, “transportation support”).

Examples:
- “Please explain how to apply for a special copayment reduction for CKD.”
- “What is the process for disability registration for dialysis patients?”
- “Are there any support programs for kidney transplant surgery costs?”
- “I need help with my hospital bills and living expenses.”

What would you like to focus on first?
"""
    )

    # ========================================
    # Step 1: Execute welfare program search tool
    # ========================================
    t1 = await t0.target.transition_to(
        tool_state=search_welfare_programs,
        condition="User specifies a welfare-related need, program type, or detailed question about benefits",
    )

    # ========================================
    # Step 2: Present search results and options
    # ========================================
    t2 = await t1.target.transition_to(
        chat_state="""Here is a summary of welfare programs that are relevant to your situation.

(The LLM will generate a tailored explanation using the tool results.)

You can choose one of the following:
- 🔍 Search for other welfare programs (different category or condition)
- 🏥 Find nearby hospitals or centers where you can apply or get certificates
- ✅ End the consultation if you have enough information

Please tell me which option you prefer.
"""
    )

    # ========================================
    # Step 3: Follow-up options (branching)
    # ========================================

    # Option A: Search other welfare programs (loop back to Step 1)
    await t2.target.transition_to(
        state=t1.target,
        condition="User wants to explore other welfare programs or a different category",
    )

    # Option B: Search hospitals/centers (new tool call)
    t3_hospital = await t2.target.transition_to(
        tool_state=search_hospitals,
        condition="User wants to find nearby hospitals, application centers, or dialysis centers",
    )

    # ========================================
    # Step 4: Hospital search result explanation
    # ========================================
    t4 = await t3_hospital.target.transition_to(
        chat_state="""Here are nearby hospitals or medical institutions that may be relevant to your welfare applications.

(The LLM will generate a detailed explanation using the tool results.)

Typical next steps:
- For special copayment reduction:  
  Ask the hospital administration/receipts desk about the application process and required documents.
- For disability registration:  
  Ask your nephrologist or hospital staff about the medical certificate and evaluation needed for disability registration.
- For dialysis or transplant-related counseling:  
  Contact the dialysis unit or transplant coordinator for guidance.

If you wish, you can:
- Search for hospitals in another region
- Go back to explore other welfare programs
- End the consultation
"""
    )

    # Loop-back options after hospital results
    await t4.target.transition_to(
        state=t1.target,
        condition="User wants to explore more welfare programs after seeing hospital results"
    )

    await t4.target.transition_to(
        state=t3_hospital.target,
        condition="User wants to search for hospitals in a different region"
    )

    # Option C: End journey
    await t2.target.transition_to(
        state=p.END_JOURNEY,
        condition="User is satisfied, wants to end the conversation, or says goodbye"
    )

    await t4.target.transition_to(
        state=p.END_JOURNEY,
        condition="User is satisfied or explicitly wants to end the consultation"
    )

    # ========================================
    # Journey-level guidelines
    # ========================================

    # Guideline 1: Eligibility disclaimer
    await journey.create_guideline(
        condition="User asks if they are eligible or whether they qualify for a specific program",
        action="""Always include a short eligibility disclaimer:

1. Clarify that you provide general guidance only (not legal or official confirmation).
2. State that final eligibility is decided by the relevant authority or institution.
3. Mention that personal details (income, region, diagnosis, etc.) can change eligibility.
4. Encourage the user to contact the official office or program for a final determination.

Tone: Helpful, careful, and non-absolute. Avoid giving a strict “yes” or “no” about eligibility.
""",
    )

    # Guideline 2: Financial or emotional distress
    await journey.create_guideline(
        condition="User expresses financial hardship, emotional distress, or desperation about medical costs",
        action="""Respond with empathy and comprehensive support:

1. Acknowledge their situation with sincere and respectful language.
2. Emphasize that multiple support options may exist (copayment reduction, medical expense support, disability benefits, local welfare programs).
3. Prioritize the most impactful or urgent options for their case (e.g., catastrophic medical expense support, emergency welfare support).
4. Encourage them to apply and to seek help from social workers, local welfare offices, or hospital financial counseling.

If appropriate, suggest contacting official hotlines or local welfare offices in their country  
(e.g., national welfare call centers, local health centers, or social service offices).

Tone: Warm, supportive, and non-judgmental.  
Avoid: Minimizing their concerns, making promises about approvals, or giving unrealistic reassurance.
""",
    )

    # Guideline 3: Application process and required documents
    await journey.create_guideline(
        condition="User asks about the application process or required documents for a welfare program",
        action="""Provide a clear, step-by-step explanation:

1. Steps:
   - Step 1: Briefly explain the first action (e.g., get a medical certificate from a hospital).
   - Step 2: Explain document preparation (e.g., ID, income proof, medical certificate).
   - Step 3: Explain where to submit (e.g., local insurance office, welfare office, hospital administration desk).
   - Step 4: Explain what happens after submission (review, notification, re-application if rejected).

2. Required documents:
   - Use bullet points for each document.
   - Explain what each document is and where the user can usually obtain it.

3. Where to apply:
   - Name the type of office or institution (e.g., national health insurance branch, local government welfare office, hospital front desk).
   - Recommend calling ahead to confirm office hours and exact requirements.

4. Processing time and follow-up:
   - Give a realistic rough range (e.g., “about 1–3 weeks, depending on the office”).
   - Suggest what the user can do if processing takes longer than expected.

Format: Use numbered lists and bullet points for readability.  
Language: Clear English, simple enough for non-experts.
""",
    )

    return journey
