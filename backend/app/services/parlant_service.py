"""
Parlant Service - User-Customer Integration
Parlant 서비스 - 사용자-고객 연동

Manages Parlant customer lifecycle for app users:
- Creates Parlant customer when user registers
- Updates customer tags when profile changes
- Provides customer ID for session creation

앱 사용자를 위한 Parlant 고객 생명주기 관리:
- 사용자 등록 시 Parlant 고객 생성
- 프로필 변경 시 고객 태그 업데이트
- 세션 생성을 위한 고객 ID 제공
"""
import os
import logging
from typing import Optional, List
import httpx

logger = logging.getLogger(__name__)

# Parlant server configuration
# Research server (8800) is used for customer management
# as both servers should share the same customer database
PARLANT_HOST = os.getenv("PARLANT_HOST", "127.0.0.1")
RESEARCH_PORT = int(os.getenv("RESEARCH_PORT", "8800"))
PARLANT_BASE_URL = f"http://{PARLANT_HOST}:{RESEARCH_PORT}"


class ParlantService:
    """
    Service class for managing Parlant customers and tags.
    Parlant 고객 및 태그 관리를 위한 서비스 클래스.

    Uses the Research server (port 8800) as the primary server
    for customer management. Both servers should share the same database.

    고객 관리를 위해 Research 서버(포트 8800)를 기본 서버로 사용합니다.
    두 서버는 동일한 데이터베이스를 공유해야 합니다.
    """

    _client: Optional["AsyncParlantClient"] = None
    _tag_cache: dict = {}  # Cache for profile tags: {tag_name: tag_id}

    @classmethod
    async def get_client(cls):
        """
        Get or create the Parlant async client.
        Parlant 비동기 클라이언트를 가져오거나 생성합니다.

        Returns:
            AsyncParlantClient instance
        """
        if cls._client is None:
            try:
                from parlant.client.client import AsyncParlantClient

                httpx_client = httpx.AsyncClient(
                    timeout=httpx.Timeout(
                        connect=10.0,
                        read=30.0,
                        write=10.0,
                        pool=None
                    )
                )
                cls._client = AsyncParlantClient(
                    base_url=PARLANT_BASE_URL,
                    httpx_client=httpx_client
                )
                logger.info(f"✅ ParlantService client initialized: {PARLANT_BASE_URL}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Parlant client: {e}")
                raise
        return cls._client

    @classmethod
    async def _get_or_create_profile_tag(cls, profile: str) -> Optional[str]:
        """
        Get or create a profile tag.
        프로필 태그를 가져오거나 생성합니다.

        Args:
            profile: Profile type (general, patient, researcher)

        Returns:
            Tag ID if successful, None otherwise
        """
        tag_name = f"profile:{profile}"

        # Check cache first
        if tag_name in cls._tag_cache:
            return cls._tag_cache[tag_name]

        try:
            client = await cls.get_client()

            # Try to create the tag
            try:
                tag = await client.tags.create(name=tag_name)
                cls._tag_cache[tag_name] = tag.id
                logger.info(f"✅ Created profile tag: {tag_name} (ID: {tag.id})")
                return tag.id
            except Exception:
                # Tag might already exist, try to find it
                tags = await client.tags.list()
                for t in tags:
                    if t.name == tag_name:
                        cls._tag_cache[tag_name] = t.id
                        logger.info(f"✅ Found existing profile tag: {tag_name} (ID: {t.id})")
                        return t.id

        except Exception as e:
            logger.error(f"❌ Failed to get/create profile tag '{tag_name}': {e}")

        return None

    @classmethod
    async def create_customer(cls, user_id: str, profile: str = "general") -> Optional[str]:
        """
        Create a Parlant customer for a user.
        사용자를 위한 Parlant 고객을 생성합니다.

        Args:
            user_id: MongoDB user ID
            profile: User profile type (general, patient, researcher)

        Returns:
            Parlant customer ID if successful, None otherwise
        """
        try:
            client = await cls.get_client()

            # Get or create the profile tag
            tag_id = await cls._get_or_create_profile_tag(profile)
            tags = [tag_id] if tag_id else []

            # Create customer with user_id as name
            customer_name = f"user_{user_id}"
            customer = await client.customers.create(
                name=customer_name,
                tags=tags
            )

            logger.info(f"✅ Created Parlant customer: {customer_name} (ID: {customer.id}, Profile: {profile})")
            return customer.id

        except Exception as e:
            logger.error(f"❌ Failed to create Parlant customer for user {user_id}: {e}")
            return None

    @classmethod
    async def update_customer_tags(cls, customer_id: str, new_profile: str) -> bool:
        """
        Update customer tags when profile changes.
        프로필 변경 시 고객 태그를 업데이트합니다.

        Note: This requires Parlant SDK to support customer.update() with tags.
        If not supported, we log a warning and return False.

        참고: Parlant SDK에서 태그가 포함된 customer.update()를 지원해야 합니다.
        지원하지 않으면 경고를 로그하고 False를 반환합니다.

        Args:
            customer_id: Parlant customer ID
            new_profile: New profile type

        Returns:
            True if successful, False otherwise
        """
        try:
            client = await cls.get_client()

            # Get the new profile tag
            new_tag_id = await cls._get_or_create_profile_tag(new_profile)
            if not new_tag_id:
                logger.warning(f"Could not get tag for profile: {new_profile}")
                return False

            # Try to update customer tags
            # Note: The exact API depends on Parlant SDK version
            try:
                # First, try to get current customer
                customer = await client.customers.read(customer_id)
                if customer:
                    # Attempt to update with new tags
                    # This may not be supported in all Parlant versions
                    await client.customers.update(
                        customer_id=customer_id,
                        tags=[new_tag_id]
                    )
                    logger.info(f"✅ Updated customer {customer_id} with profile tag: {new_profile}")
                    return True
            except AttributeError:
                # customer.update might not exist
                logger.warning(f"Parlant SDK does not support customer.update() - tags not updated for {customer_id}")
            except Exception as update_error:
                logger.warning(f"Could not update customer tags: {update_error}")

            return False

        except Exception as e:
            logger.error(f"❌ Failed to update customer tags for {customer_id}: {e}")
            return False

    @classmethod
    async def get_or_create_customer(cls, user_id: str, profile: str = "general",
                                     existing_customer_id: Optional[str] = None) -> Optional[str]:
        """
        Get existing customer or create a new one.
        기존 고객을 가져오거나 새로 생성합니다.

        If existing_customer_id is provided, returns it directly.
        Otherwise creates a new customer.

        기존 customer_id가 제공되면 그대로 반환합니다.
        그렇지 않으면 새 고객을 생성합니다.

        Args:
            user_id: MongoDB user ID
            profile: User profile type
            existing_customer_id: Existing Parlant customer ID from user document

        Returns:
            Parlant customer ID
        """
        if existing_customer_id:
            logger.info(f"Using existing Parlant customer: {existing_customer_id}")
            return existing_customer_id

        return await cls.create_customer(user_id, profile)

    @classmethod
    async def close(cls):
        """
        Close the Parlant client connection.
        Parlant 클라이언트 연결을 닫습니다.
        """
        if cls._client is not None:
            try:
                await cls._client._httpx_client.aclose()
                cls._client = None
                logger.info("✅ ParlantService client closed")
            except Exception as e:
                logger.warning(f"Error closing Parlant client: {e}")


# Convenience function for external use
async def create_parlant_customer(user_id: str, profile: str = "general") -> Optional[str]:
    """
    Convenience function to create a Parlant customer.
    Parlant 고객을 생성하는 편의 함수입니다.

    Args:
        user_id: MongoDB user ID
        profile: User profile type

    Returns:
        Parlant customer ID if successful, None otherwise
    """
    return await ParlantService.create_customer(user_id, profile)


async def update_parlant_customer_profile(customer_id: str, new_profile: str) -> bool:
    """
    Convenience function to update customer profile tag.
    고객 프로필 태그를 업데이트하는 편의 함수입니다.

    Args:
        customer_id: Parlant customer ID
        new_profile: New profile type

    Returns:
        True if successful, False otherwise
    """
    return await ParlantService.update_customer_tags(customer_id, new_profile)
