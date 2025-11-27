"""
Image Format Converter
AVIF, HEIC 등 지원되지 않는 이미지 포맷을 JPEG/PNG로 변환
"""
from PIL import Image
import io
import base64
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# OpenAI API가 지원하는 이미지 포맷
SUPPORTED_FORMATS = {'png', 'jpeg', 'jpg', 'gif', 'webp'}

# 변환이 필요한 포맷
UNSUPPORTED_FORMATS = {'avif', 'heic', 'heif', 'bmp', 'tiff'}


def detect_image_format(base64_data: str) -> Optional[str]:
    """
    Base64 이미지 데이터에서 포맷 감지

    Args:
        base64_data: data:image/xxx;base64,... 형식의 문자열

    Returns:
        이미지 포맷 (예: 'avif', 'jpeg', 'png')
    """
    try:
        # data:image/jpeg;base64,... 형식에서 포맷 추출
        if base64_data.startswith('data:image/'):
            format_part = base64_data.split(';')[0].split('/')[-1]
            return format_part.lower()
        return None
    except Exception as e:
        logger.error(f"Failed to detect image format: {e}")
        return None


def convert_image_to_supported_format(
    base64_data: str,
    target_format: str = 'jpeg',
    quality: int = 85
) -> str:
    """
    지원되지 않는 이미지 포맷을 JPEG/PNG로 변환

    Args:
        base64_data: data:image/xxx;base64,... 형식의 문자열
        target_format: 변환할 포맷 ('jpeg' 또는 'png')
        quality: JPEG 품질 (1-100, 기본값: 85)

    Returns:
        변환된 이미지의 base64 데이터 (data:image/jpeg;base64,... 형식)
    """
    try:
        # 현재 포맷 감지
        current_format = detect_image_format(base64_data)
        logger.info(f"Detected image format: {current_format}")

        # 이미 지원되는 포맷이면 그대로 반환
        if current_format and current_format in SUPPORTED_FORMATS:
            logger.info(f"Image format '{current_format}' is already supported, no conversion needed")
            return base64_data

        # Base64 데이터 추출
        if ',' in base64_data:
            base64_str = base64_data.split(',', 1)[1]
        else:
            base64_str = base64_data

        # Base64 디코딩
        image_bytes = base64.b64decode(base64_str)

        # PIL Image로 변환
        image = Image.open(io.BytesIO(image_bytes))

        # RGBA 모드로 변환 (투명도 지원)
        if image.mode in ('RGBA', 'LA', 'P'):
            # PNG로 변환 (투명도 보존)
            if target_format == 'jpeg':
                # JPEG는 투명도를 지원하지 않으므로 흰색 배경으로 합성
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            else:
                target_format = 'png'
        else:
            # RGB 모드로 변환
            if image.mode != 'RGB' and target_format == 'jpeg':
                image = image.convert('RGB')

        # 이미지를 메모리에 저장
        output_buffer = io.BytesIO()

        if target_format.lower() in ['jpeg', 'jpg']:
            image.save(output_buffer, format='JPEG', quality=quality, optimize=True)
            mime_type = 'image/jpeg'
        else:
            image.save(output_buffer, format='PNG', optimize=True)
            mime_type = 'image/png'

        # Base64 인코딩
        output_buffer.seek(0)
        converted_base64 = base64.b64encode(output_buffer.read()).decode('utf-8')

        logger.info(
            f"Image converted: {current_format} → {target_format} "
            f"({len(image_bytes)} bytes → {len(output_buffer.getvalue())} bytes)"
        )

        return f"data:{mime_type};base64,{converted_base64}"

    except Exception as e:
        logger.error(f"Image conversion failed: {e}", exc_info=True)
        # 변환 실패 시 원본 반환
        return base64_data


def is_supported_format(base64_data: str) -> bool:
    """
    이미지가 지원되는 포맷인지 확인

    Args:
        base64_data: data:image/xxx;base64,... 형식의 문자열

    Returns:
        지원되는 포맷이면 True, 아니면 False
    """
    format_type = detect_image_format(base64_data)
    if not format_type:
        return False
    return format_type in SUPPORTED_FORMATS


def get_image_info(base64_data: str) -> dict:
    """
    이미지 정보 추출

    Args:
        base64_data: data:image/xxx;base64,... 형식의 문자열

    Returns:
        이미지 정보 딕셔너리 (format, size, width, height)
    """
    try:
        # Base64 데이터 추출
        if ',' in base64_data:
            base64_str = base64_data.split(',', 1)[1]
        else:
            base64_str = base64_data

        # Base64 디코딩
        image_bytes = base64.b64decode(base64_str)

        # PIL Image로 변환
        image = Image.open(io.BytesIO(image_bytes))

        return {
            'format': image.format.lower() if image.format else detect_image_format(base64_data),
            'mode': image.mode,
            'size': len(image_bytes),
            'width': image.width,
            'height': image.height,
            'is_supported': is_supported_format(base64_data)
        }
    except Exception as e:
        logger.error(f"Failed to get image info: {e}")
        return {
            'format': detect_image_format(base64_data),
            'size': 0,
            'width': 0,
            'height': 0,
            'is_supported': False
        }
