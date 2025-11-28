"""
Parlant Common Utilities
Parlant 서버들이 공유하는 유틸리티 함수
"""

from parlant.sdk import ToolContext
from bson import ObjectId
from typing import Any, Dict, List, Union
import os


async def get_profile(context: ToolContext) -> str:
    """
    Determine profile based on plugin_data or customer tags

    IMPORTANT: Profile-specific behavior is controlled by Parlant guidelines.
    The LLM receives different instructions based on customer tags:
    - researcher: Technical, detailed medical information
    - patient: Patient-friendly, simplified explanations
    - general: Balanced information for general public

    This function only determines the profile for result limiting purposes,
    not for response tone (which is handled by Parlant).

    Args:
        context: ToolContext with customer_id and plugin_data

    Returns:
        Profile type for result limiting
    """
    # 1. Check plugin_data first (preferred method)
    if hasattr(context, 'plugin_data') and context.plugin_data:
        profile = context.plugin_data.get('profile') or context.plugin_data.get('careguide_profile')
        if profile and profile in ["researcher", "patient", "general"]:
            print(f"✅ Profile from plugin_data: {profile}")
            return profile

    # 2. Fetch customer and tags from Container using customer_id
    if hasattr(context, 'customer_id') and hasattr(context, 'plugin_data'):
        customer_id = context.customer_id
        container = context.plugin_data.get('container') if context.plugin_data else None

        if container and customer_id:
            try:
                from parlant.core.customers import CustomerStore
                from parlant.core.tags import TagStore

                customer_store = container[CustomerStore]
                customer = await customer_store.read_customer(customer_id)

                if customer and customer.tags:
                    print(f"🔍 Fetched customer with {len(customer.tags)} tag IDs: {customer.tags}")

                    tag_store = container[TagStore]

                    for tag_id in customer.tags:
                        try:
                            tag = await tag_store.read_tag(tag_id)
                            tag_name = tag.name

                            print(f"🔍 Tag ID '{tag_id}' → name '{tag_name}'")

                            if tag_name and tag_name.startswith('profile:'):
                                profile = tag_name.split(':', 1)[1]
                                if profile in ["researcher", "patient", "general"]:
                                    print(f"✅ Profile extracted from customer tags: {profile}")
                                    return profile
                        except Exception as tag_error:
                            print(f"⚠️  Failed to read tag {tag_id}: {tag_error}")
                            continue

            except Exception as e:
                print(f"⚠️  Failed to fetch customer from store: {e}")
                import traceback
                traceback.print_exc()

    # 3. Check customer object if directly available (fallback)
    customer = getattr(context, 'customer', None)
    if customer and hasattr(customer, 'tags'):
        print(f"🔍 Customer object available directly with tags: {customer.tags}")
        for tag in customer.tags:
            tag_name = tag if isinstance(tag, str) else (tag.name if hasattr(tag, 'name') else str(tag))
            if tag_name and tag_name.startswith('profile:'):
                profile = tag_name.split(':', 1)[1]
                if profile in ["researcher", "patient", "general"]:
                    print(f"✅ Profile extracted from customer object: {profile}")
                    return profile

    print(f"ℹ️  Using default profile limits (guidelines control actual behavior)")
    return "general"


def convert_objectid_to_str(data: Union[Dict, List, Any]) -> Union[Dict, List, Any]:
    """
    Convert ObjectId to string (recursive)

    Args:
        data: Dictionary, List, or any object that may contain ObjectId

    Returns:
        Same structure with ObjectId converted to string
    """
    if isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, dict):
        return {k: convert_objectid_to_str(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    else:
        return data


def get_default_profile() -> str:
    """
    Get default profile from environment variable.
    
    This is only used when running the Parlant server directly.
    When accessed via the UI, the profile is determined by the client.
    
    Returns:
        Default profile type (researcher, patient, or general)
    """
    profile = os.getenv(
        "CARE_GUIDE_DEFAULT_PROFILE",
        os.getenv("DEFAULT_PROFILE", "general")
    ).lower()

    if profile not in ["researcher", "patient", "general"]:
        print(f"⚠️ Invalid DEFAULT_PROFILE: {profile}, using 'general'")
        return "general"

    profile_names = {
        "researcher": "Researcher/Expert",
        "patient": "Patient/Experience Holder",
        "general": "General Public/Novice"
    }

    print(f"\n✅ Using default profile: {profile_names[profile]}")
    print("   (Profile can be overridden by client session metadata)\n")

    return profile
