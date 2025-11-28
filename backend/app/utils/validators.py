"""
Validation utilities for user input
"""
import re
from typing import List, Tuple


class PasswordValidator:
    """Validates password strength and complexity"""

    # Password requirements
    MIN_LENGTH = 8
    MAX_LENGTH = 128

    @classmethod
    def validate(cls, password: str) -> Tuple[bool, List[str]]:
        """
        Validate password against security requirements

        Args:
            password: The password to validate

        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []

        # Check length
        if len(password) < cls.MIN_LENGTH:
            errors.append(f"비밀번호는 최소 {cls.MIN_LENGTH}자 이상이어야 합니다")

        if len(password) > cls.MAX_LENGTH:
            errors.append(f"비밀번호는 최대 {cls.MAX_LENGTH}자 이하여야 합니다")

        # Check for lowercase letters
        if not re.search(r'[a-z]', password):
            errors.append("비밀번호에 소문자가 포함되어야 합니다")

        # Check for uppercase letters
        if not re.search(r'[A-Z]', password):
            errors.append("비밀번호에 대문자가 포함되어야 합니다")

        # Check for digits
        if not re.search(r'\d', password):
            errors.append("비밀번호에 숫자가 포함되어야 합니다")

        # Check for special characters
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;\'`~]', password):
            errors.append("비밀번호에 특수문자가 포함되어야 합니다")

        # Check for common patterns
        if cls._has_common_patterns(password):
            errors.append("비밀번호가 너무 단순합니다")

        is_valid = len(errors) == 0
        return is_valid, errors

    @staticmethod
    def _has_common_patterns(password: str) -> bool:
        """Check for common weak password patterns"""
        common_patterns = [
            r'12345',
            r'password',
            r'qwerty',
            r'abc123',
            r'letmein',
            r'admin',
        ]

        password_lower = password.lower()
        for pattern in common_patterns:
            if pattern in password_lower:
                return True

        # Check for repeated characters (3 or more)
        if re.search(r'(.)\1{2,}', password):
            return True

        return False

    @classmethod
    def get_requirements_text(cls) -> str:
        """Get a formatted string of password requirements"""
        return (
            f"비밀번호 요구사항:\n"
            f"- 최소 {cls.MIN_LENGTH}자 이상\n"
            f"- 대문자 포함\n"
            f"- 소문자 포함\n"
            f"- 숫자 포함\n"
            f"- 특수문자 포함\n"
            f"- 단순한 패턴 사용 금지"
        )


class EmailValidator:
    """Validates email format"""

    @staticmethod
    def validate(email: str) -> Tuple[bool, str]:
        """
        Validate email format

        Args:
            email: The email to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Basic email regex pattern
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if not re.match(pattern, email):
            return False, "유효하지 않은 이메일 형식입니다"

        # Check email length
        if len(email) > 254:
            return False, "이메일 주소가 너무 깁니다"

        return True, ""


class UsernameValidator:
    """Validates username format"""

    MIN_LENGTH = 3
    MAX_LENGTH = 30

    @classmethod
    def validate(cls, username: str) -> Tuple[bool, str]:
        """
        Validate username format

        Args:
            username: The username to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check length
        if len(username) < cls.MIN_LENGTH:
            return False, f"사용자명은 최소 {cls.MIN_LENGTH}자 이상이어야 합니다"

        if len(username) > cls.MAX_LENGTH:
            return False, f"사용자명은 최대 {cls.MAX_LENGTH}자 이하여야 합니다"

        # Check valid characters (alphanumeric, underscore, hyphen)
        pattern = r'^[a-zA-Z0-9_-]+$'
        if not re.match(pattern, username):
            return False, "사용자명은 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다"

        # Must start with a letter
        if not username[0].isalpha():
            return False, "사용자명은 영문자로 시작해야 합니다"

        return True, ""
