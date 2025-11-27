# Chat Profile Integration Guide

## Quick Integration Guide

This guide shows you exactly how to integrate user profile information into your chat agents.

## Implementation Steps

### Step 1: Modify Chat Endpoint to Fetch Profile

Update `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/app/api/chat.py`:

```python
from bson import ObjectId

@router.post("/message")
async def chat_message(request: Request):
    try:
        body = await request.json()
        query = body.get("query") or body.get("message")
        session_id = body.get("session_id", "default")
        user_id = body.get("user_id")
        room_id = body.get("room_id")

        if not query:
            raise HTTPException(status_code=400, detail="Query is required")

        # --- PROFILE INTEGRATION: Fetch user profile ---
        user_profile = "general"  # Default
        if user_id:
            try:
                from app.db.connection import get_users_collection
                users_collection = get_users_collection()
                user = await users_collection.find_one({"_id": ObjectId(user_id)})
                if user:
                    user_profile = user.get("profile", "general")
                    logger.info(f"User profile retrieved: {user_profile} for user {user_id}")
            except Exception as e:
                logger.warning(f"Failed to fetch user profile: {e}")

        # --- Context Engineering: Injection ---
        context = body.get("context", {})

        # Add user profile to context
        context["user_profile"] = user_profile

        # ... rest of the existing code ...
```

### Step 2: Update Router Agent to Use Profile

Update `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/Agent/router/agent.py`:

```python
class RouterAgent:
    async def process_stream(self, request: AgentRequest):
        # Extract user profile from context
        user_profile = request.context.get("user_profile", "general")

        logger.info(f"Processing request for user profile: {user_profile}")

        # Route based on profile type
        if user_profile == "patient":
            # Patients might benefit from medical welfare info
            logger.info("Patient profile detected - prioritizing medical welfare")
            # You can adjust routing logic here
        elif user_profile == "researcher":
            # Researchers get more technical content
            logger.info("Researcher profile detected - providing technical depth")

        # Continue with normal routing...
        intent = await self.classify_intent(request.query, request.context)
        # ...
```

### Step 3: Customize Agent Prompts Based on Profile

Update agent prompts (e.g., in research_paper agent):

```python
# In /Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/Agent/research_paper/server/research_paper_guidelines.py

def get_system_prompt(user_profile: str = "general"):
    """
    Generate system prompt based on user profile
    """
    base_prompt = "You are a healthcare research assistant."

    if user_profile == "researcher":
        return f"""{base_prompt}

User Profile: Researcher

Guidelines:
- Provide detailed technical information with specific citations
- Include statistical data and research methodologies
- Use medical terminology without oversimplification
- Reference peer-reviewed sources
- Discuss limitations and contradictions in research
"""

    elif user_profile == "patient":
        return f"""{base_prompt}

User Profile: Patient

Guidelines:
- Explain medical concepts in simple, accessible language
- Avoid overwhelming technical jargon
- Focus on practical implications for health
- Provide actionable advice
- Be empathetic and supportive in tone
- Include disclaimers to consult healthcare providers
"""

    else:  # general
        return f"""{base_prompt}

User Profile: General User

Guidelines:
- Balance technical accuracy with accessibility
- Explain key terms when first introduced
- Provide both overview and deeper details
- Cite credible sources
- Use clear, professional language
"""
```

### Step 4: Frontend Integration

Update your frontend chat component to send the profile:

```typescript
// In src/services/api.ts or src/services/intentRouter.ts

export const sendChatMessage = async (
  message: string,
  sessionId: string,
  userId: string
) => {
  // Get user profile from auth context or local storage
  const userProfile = localStorage.getItem('userProfile') || 'general';

  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: message,
      session_id: sessionId,
      user_id: userId,
      context: {
        user_profile: userProfile
      }
    })
  });

  return response;
};
```

Update AuthContext to store profile:

```typescript
// In src/contexts/AuthContext.tsx

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<'general' | 'patient' | 'researcher'>('general');

  const login = async (username: string, password: string) => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password })
    });

    const data = await response.json();

    setUser(data.user);
    setProfile(data.user.profile);

    // Store in localStorage for persistence
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('userProfile', data.user.profile);
    localStorage.setItem('userId', data.user.id);
  };

  const updateProfile = async (newProfile: 'general' | 'patient' | 'researcher') => {
    const token = localStorage.getItem('token');

    const response = await fetch('/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ profile: newProfile })
    });

    if (response.ok) {
      setProfile(newProfile);
      localStorage.setItem('userProfile', newProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Example Usage Scenarios

### Scenario 1: Patient Asking About Medication

**User Profile**: patient

**Query**: "What are the side effects of metformin?"

**Agent Behavior**:
- Uses simple, accessible language
- Focuses on common, patient-relevant side effects
- Adds disclaimer to consult doctor
- Provides practical advice on managing side effects

**Response Example**:
```
Metformin is a common diabetes medication. Here are the most common side effects:

1. Digestive issues (nausea, diarrhea) - usually mild and improve over time
2. Low blood sugar (when combined with other diabetes medications)
3. Vitamin B12 deficiency (with long-term use)

Tips:
- Take with food to reduce stomach upset
- Start with a low dose and increase gradually
- Monitor your blood sugar regularly

Important: Always discuss any side effects with your healthcare provider.
```

### Scenario 2: Researcher Asking Same Question

**User Profile**: researcher

**Query**: "What are the side effects of metformin?"

**Agent Behavior**:
- Provides clinical data and statistics
- Includes mechanism of action
- References peer-reviewed studies
- Discusses contraindications and drug interactions

**Response Example**:
```
Metformin (N,N-dimethylbiguanide) adverse effects by frequency:

Common (>10%):
- Gastrointestinal disturbances (25-30%): diarrhea, nausea, vomiting
- Mechanism: Decreased bile acid absorption, altered gut microbiome

Uncommon (1-10%):
- Lactic acidosis (incidence: 3-10 per 100,000 patient-years)
- Risk factors: renal impairment (eGFR <30), acute illness

Long-term:
- Vitamin B12 deficiency (prevalence: 10-30% after >3 years)
- Mechanism: Decreased ileal B12 absorption via calcium-dependent membrane antagonism

Contraindications:
- eGFR <30 mL/min/1.73m²
- Acute metabolic acidosis
- Severe hepatic impairment

References:
1. DeFronzo RA, Goodman AM. Efficacy of metformin in patients with NIDDM. NEJM. 1995;333(9):541-549.
2. Inzucchi SE, et al. Management of hyperglycemia in T2DM. Diabetes Care. 2015;38(1):140-149.
```

### Scenario 3: General User

**User Profile**: general

**Query**: "What are the side effects of metformin?"

**Agent Behavior**:
- Balanced technical and accessible language
- Explains key terms
- Provides both overview and details
- Professional but clear tone

**Response Example**:
```
Metformin is a medication commonly prescribed for type 2 diabetes. Here's what you should know about its side effects:

Most Common Side Effects:
Digestive issues (affecting 25-30% of users):
- Diarrhea, nausea, stomach upset
- Usually mild and improve after a few weeks
- Taking the medication with food can help

Less Common but Important:
1. Low blood sugar (hypoglycemia)
   - More likely when combined with other diabetes medications
   - Symptoms: dizziness, sweating, confusion

2. Vitamin B12 deficiency
   - Can occur with long-term use (>3 years)
   - Regular blood tests can monitor this

Rare but Serious:
Lactic acidosis (very rare: 3-10 cases per 100,000 users per year)
- Buildup of lactic acid in the blood
- More likely in people with kidney problems

Important Note: If you're considering metformin or experiencing side effects, consult your healthcare provider. They can adjust your dose or suggest alternatives based on your specific situation.
```

## Profile-Specific Features Matrix

| Feature | General | Patient | Researcher |
|---------|---------|---------|------------|
| Response Style | Balanced | Simple | Technical |
| Medical Terms | Explained | Avoided/Simplified | Used freely |
| Citations | Summary | Minimal | Detailed |
| Statistics | Key figures | Practical relevance | Full data |
| Disclaimers | Standard | Emphasized | Minimal |
| Actionable Advice | Moderate | High | Low (assumes expertise) |
| Research Depth | Medium | Low | High |

## Testing Your Integration

### Test 1: Profile Changes Response Style

```bash
# Create three test users with different profiles
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "patient1", "email": "patient@test.com", "password": "Pass123!", "profile": "patient"}'

curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "researcher1", "email": "researcher@test.com", "password": "Pass123!", "profile": "researcher"}'

# Send same query with different profiles
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain diabetes", "user_id": "<patient_id>", "session_id": "test"}'

curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain diabetes", "user_id": "<researcher_id>", "session_id": "test"}'
```

### Test 2: Profile Update Affects Future Chats

```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -d "username=patient1&password=Pass123!" | jq -r '.access_token')

# Update profile
curl -X PATCH http://localhost:8000/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile": "researcher"}'

# Verify chat uses new profile
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain diabetes", "user_id": "<user_id>", "session_id": "test"}'
```

## Monitoring Profile Usage

Add analytics to track profile effectiveness:

```python
# Add to chat.py
async def log_profile_usage(user_id: str, profile: str, query: str):
    """Log profile usage for analytics"""
    from app.db.connection import get_database
    db = await get_database()

    await db.profile_analytics.insert_one({
        "user_id": user_id,
        "profile": profile,
        "query": query,
        "timestamp": datetime.utcnow()
    })

# Query analytics
# db.profile_analytics.aggregate([
#   { $group: { _id: "$profile", count: { $sum: 1 } } }
# ])
```

## Common Issues & Solutions

### Issue 1: Profile not being retrieved in chat
**Symptom**: Chat responses don't vary by profile
**Solution**: Verify user_id is being sent in chat requests and is valid ObjectId

### Issue 2: Profile validation errors
**Symptom**: 422 errors when updating profile
**Solution**: Ensure profile value is exactly "general", "patient", or "researcher" (case-sensitive)

### Issue 3: Old users without profile field
**Symptom**: Errors for users created before profile system
**Solution**: Run migration script to add default profile to all existing users

```javascript
// Run in MongoDB shell
db.users.updateMany(
  { profile: { $exists: false } },
  { $set: { profile: "general" } }
)
```

## Next Steps

1. Implement profile-aware prompts in each agent
2. Create profile selection UI in registration flow
3. Add profile badge/indicator in chat interface
4. Build analytics dashboard for profile usage
5. A/B test different response styles per profile

---

**Happy Integrating!**

For more details, see: `/Users/apple/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/backend/PROFILE_SYSTEM_API.md`
