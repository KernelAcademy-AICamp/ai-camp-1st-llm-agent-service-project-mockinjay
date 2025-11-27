# Bilingual Comments - Before and After Examples

This document shows concrete examples of the bilingual documentation improvements.

## Example 1: Backend Python Function

### Before
```python
async def get_anonymous_number_for_post(post_id: str, user_id: str, is_author: bool = False) -> tuple[int, bool]:
    """
    Get or create anonymous number for a user within a specific post.
    Same user always gets the same anonymous number within the same post.
    Different posts have independent anonymous numbering.

    에브리타임/블라인드 스타일:
    - 글쓴이는 항상 "익명(글쓴이)" 표시 (번호 없음, 카운터에 포함 안 됨)
    - 댓글 작성자는 "익명1", "익명2" 순서대로 (1부터 시작)
    - 같은 사용자가 같은 게시글에 댓글 여러 개 → 같은 번호

    Args:
        post_id: Post ID
        user_id: User ID (can be anonymous ID from client)
        is_author: Whether this user is the post author

    Returns:
        tuple: (anonymous_number, is_post_author)
            - anonymous_number: 0 for author, 1, 2, 3... for commenters
            - is_post_author: True if this user is the post author
    """
```

### After
```python
async def get_anonymous_number_for_post(post_id: str, user_id: str, is_author: bool = False) -> tuple[int, bool]:
    """
    게시글 내에서 사용자별 익명 번호를 계산하거나 생성합니다.
    Calculates or creates an anonymous number for a user within a specific post.

    이 함수는 게시글에서 각 사용자에게 고유한 익명 번호를 할당합니다.
    This function assigns a unique anonymous number to each user within a post.
    같은 사용자는 같은 게시글에서 항상 같은 번호를 받습니다.
    The same user always gets the same number within the same post.
    다른 게시글에서는 독립적인 번호 체계를 가집니다.
    Different posts have independent numbering systems.

    에브리타임/블라인드 스타일 규칙:
    Everytime/Blind style rules:
    - 글쓴이는 항상 "익명(글쓴이)" 표시 (번호 없음, 카운터에 포함 안 됨)
      Author is always displayed as "익명(글쓴이)" (no number, not counted)
    - 댓글 작성자는 "익명1", "익명2" 순서대로 (1부터 시작)
      Commenters get "익명1", "익명2" in order (starting from 1)
    - 같은 사용자가 같은 게시글에 댓글 여러 개 → 같은 번호
      Same user posting multiple comments on same post → same number

    Args:
        post_id (str): 게시글 ID (Post ID)
        user_id (str): 사용자 ID (클라이언트가 제공한 익명 ID일 수도 있음)
                       User ID (can be anonymous ID from client)
        is_author (bool): 이 사용자가 게시글 작성자인지 여부
                          Whether this user is the post author

    Returns:
        tuple[int, bool]: (익명 번호, 게시글 작성자 여부)
                          (anonymous number, is post author)
            - anonymous_number: 작성자는 0, 댓글러는 1, 2, 3...
                                0 for author, 1, 2, 3... for commenters
            - is_post_author: 이 사용자가 게시글 작성자인 경우 True
                              True if this user is the post author
    """
```

## Example 2: Backend Auth Service

### Before
```python
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')
```

### After
```python
def hash_password(password: str) -> str:
    """
    비밀번호를 bcrypt를 사용하여 해시화합니다.
    Hashes a password using bcrypt algorithm.

    bcrypt는 솔트(salt)를 자동으로 생성하여 안전하게 비밀번호를 저장합니다.
    bcrypt automatically generates a salt for secure password storage.

    Args:
        password (str): 평문 비밀번호 (Plain text password)

    Returns:
        str: 해시화된 비밀번호 문자열 (Hashed password string)
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')
```

## Example 3: TypeScript Router Service

### Before
```typescript
/**
 * 백엔드 스트리밍 API 호출 (의도 정보 추출 포함)
 * 실시간으로 응답 청크를 받아 콜백 함수로 전달
 */
export async function callBackendAgentStream(
  query: string,
  agent: AgentType,
  onChunk: (content: string, isComplete: boolean, metadata?: BackendStreamChunk) => void,
  onError?: (error: Error) => void,
  userProfile?: 'general' | 'patient' | 'researcher'
): Promise<{ agents: AgentType[]; intents: IntentCategory[] }> {
```

### After
```typescript
/**
 * 백엔드 스트리밍 API를 호출하고 의도 정보를 추출합니다.
 * Calls backend streaming API and extracts intent information.
 *
 * 실시간으로 응답 청크를 받아 콜백 함수로 전달합니다.
 * Receives response chunks in real-time and passes them to callback function.
 *
 * @param query - 사용자 질문 (User query)
 * @param agent - 사용할 에이전트 타입 (Agent type to use)
 * @param onChunk - 각 청크를 받을 때마다 호출되는 콜백 함수
 *                  Callback function called for each chunk
 * @param onError - 에러 발생 시 호출되는 콜백 함수 (선택)
 *                  Optional callback function for errors
 * @param userProfile - 사용자 프로필 타입 (선택)
 *                      Optional user profile type
 * @returns 감지된 에이전트 목록과 의도 카테고리
 *          Detected agents list and intent categories
 */
export async function callBackendAgentStream(
  query: string,
  agent: AgentType,
  onChunk: (content: string, isComplete: boolean, metadata?: BackendStreamChunk) => void,
  onError?: (error: Error) => void,
  userProfile?: 'general' | 'patient' | 'researcher'
): Promise<{ agents: AgentType[]; intents: IntentCategory[] }> {
```

## Example 4: React Context Functions

### Before
```typescript
const login = async (username: string, password: string) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const { access_token, user: userData } = response.data;

    setToken(access_token);
    setUser(userData);

    storage.set('careguide_token', access_token);
    storage.set('careguide_user', userData);

    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || '로그인에 실패했습니다');
  }
};
```

### After
```typescript
/**
 * 사용자 로그인을 처리합니다.
 * Handles user login authentication.
 *
 * 사용자 인증 정보를 서버로 전송하고 JWT 토큰을 받아 저장합니다.
 * Sends user credentials to server and stores received JWT token.
 *
 * @param username - 사용자명 또는 이메일 (Username or email)
 * @param password - 비밀번호 (Password)
 * @throws Error - 로그인 실패 시 에러 메시지 (Error message on login failure)
 */
const login = async (username: string, password: string) => {
  try {
    // FormData 형식으로 로그인 요청 (OAuth2 표준)
    // Login request in FormData format (OAuth2 standard)
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const { access_token, user: userData } = response.data;

    // 상태 및 로컬 스토리지에 인증 정보 저장
    // Save auth info to state and local storage
    setToken(access_token);
    setUser(userData);

    storage.set('careguide_token', access_token);
    storage.set('careguide_user', userData);

    // axios 기본 헤더에 토큰 설정 (모든 API 요청에 자동 포함)
    // Set token in axios default header (automatically included in all API requests)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || '로그인에 실패했습니다');
  }
};
```

## Example 5: Inline Comments

### Before
```typescript
useEffect(() => {
  // Load token from storage
  const savedToken = storage.get<string>('careguide_token');
  const savedUser = storage.get<User>('careguide_user');

  if (savedToken && savedUser) {
    setToken(savedToken);
    setUser(savedUser);

    // Set axios default header
    api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
  }
}, []);
```

### After
```typescript
/**
 * 컴포넌트 마운트 시 로컬 스토리지에서 인증 정보를 로드합니다.
 * Loads authentication information from local storage on component mount.
 *
 * 저장된 토큰이 있으면 자동으로 로그인 상태를 복원합니다.
 * Automatically restores login state if saved token exists.
 */
useEffect(() => {
  // 스토리지에서 토큰 로드 (Load token from storage)
  const savedToken = storage.get<string>('careguide_token');
  const savedUser = storage.get<User>('careguide_user');

  if (savedToken && savedUser) {
    // 인증 상태 복원 (Restore authentication state)
    setToken(savedToken);
    setUser(savedUser);

    // axios 기본 헤더 설정 (Set axios default header)
    api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
  }
}, []);
```

## Key Improvements

1. **Parallel Structure**: Korean and English appear side-by-side for direct comparison
2. **Comprehensive Coverage**: All parameters, returns, and exceptions documented in both languages
3. **Inline Context**: Critical code sections have bilingual inline comments
4. **Consistency**: Same format used across all files (Python and TypeScript)
5. **Accessibility**: Developers can read in their preferred language

## Style Guidelines Applied

### Python
- Korean explanation first, then English
- Type hints included in Args section
- Clear separation between sections

### TypeScript
- JSDoc format with @param, @returns tags
- Korean and English for each parameter
- Inline comments for complex logic blocks

### General
- Keep Korean concise, English slightly more detailed if needed
- Use parentheses for English when on same line: `변수 설명 (Variable description)`
- Use separate lines for longer explanations
