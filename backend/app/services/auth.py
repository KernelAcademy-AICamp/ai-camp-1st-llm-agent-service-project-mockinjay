import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from app.db.connection import get_users_collection
from app.config import settings
from bson import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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

def verify_password(plain: str, hashed: str) -> bool:
    """
    입력된 비밀번호가 해시값과 일치하는지 검증합니다.
    Verifies that a plain password matches the hashed password.

    로그인 시 사용자가 입력한 비밀번호와 저장된 해시를 비교합니다.
    Used during login to compare user input against stored hash.

    Args:
        plain (str): 사용자가 입력한 평문 비밀번호 (User's plain text password)
        hashed (str): DB에 저장된 해시화된 비밀번호 (Hashed password from database)

    Returns:
        bool: 비밀번호 일치 여부 (True if password matches, False otherwise)
    """
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    """
    JWT 액세스 토큰을 생성합니다.
    Creates a JWT access token.

    사용자 인증 정보를 포함한 JWT 토큰을 생성하며, 기본 만료 시간은 7일입니다.
    Generates a JWT token containing user authentication info with a default expiration of 7 days.

    Args:
        data (dict): 토큰에 포함할 페이로드 데이터 (user_id, username 등)
                     Payload data to include in token (user_id, username, etc.)
        expires_delta (timedelta): 토큰 만료 시간 (기본값: 7일)
                                   Token expiration time (default: 7 days)

    Returns:
        str: 인코딩된 JWT 토큰 문자열 (Encoded JWT token string)
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    JWT 토큰에서 현재 사용자 정보를 추출합니다.
    Extracts current user information from JWT token.

    요청 헤더의 Bearer 토큰을 검증하고 사용자 정보를 반환합니다.
    Validates the Bearer token from request header and returns user information.
    인증 실패 시 401 Unauthorized 에러를 발생시킵니다.
    Raises 401 Unauthorized error if authentication fails.

    Args:
        token (str): Authorization 헤더의 JWT 토큰 (FastAPI가 자동 추출)
                     JWT token from Authorization header (auto-extracted by FastAPI)

    Returns:
        dict: 사용자 문서 (MongoDB document)
              User document from MongoDB

    Raises:
        HTTPException: 401 - 토큰이 유효하지 않거나 사용자를 찾을 수 없는 경우
                       401 - If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # JWT 토큰 디코딩 및 사용자 ID 추출
        # Decode JWT token and extract user ID
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 사용자 정보 조회 (Look up user information)
    users_collection = get_users_collection()
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception

    return user
