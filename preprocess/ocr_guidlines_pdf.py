import requests
import os
from dotenv import load_dotenv
from glob import glob
import time
from PyPDF2 import PdfReader, PdfWriter
import tempfile

load_dotenv()
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")

api_key = UPSTAGE_API_KEY

pdf_files = glob("/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/raw/guidelines/pdf/*.pdf")
total_files = pdf_files 
total_files = sorted(total_files)

OUTPUT_DIR = "/Users/jaehuncho/Coding/ai-camp-1st-llm-agent-service-project-mockinjay/data/preprocess/guidelines/ocr_upstage"
print(f"Total files to process: {len(total_files)}")

try:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
except Exception as e:
    print(f"Error creating directory: {e}")

def split_pdf(pdf_path, num_parts):
    """
    PDF를 num_parts개로 물리적으로 분할
    Returns: 임시 파일 경로 리스트
    """
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)
    pages_per_part = total_pages // num_parts
    remainder = total_pages % num_parts

    temp_files = []
    start_page = 0

    for part in range(num_parts):
        # 마지막 부분에 나머지 페이지 추가
        pages_in_this_part = pages_per_part + (1 if part < remainder else 0)
        end_page = start_page + pages_in_this_part

        writer = PdfWriter()
        for page_num in range(start_page, end_page):
            writer.add_page(reader.pages[page_num])

        # 임시 파일 생성
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        writer.write(temp_file.name)
        temp_files.append(temp_file.name)
        temp_file.close()

        start_page = end_page

    return temp_files

def ocr_file(file_path, api_key):
    """
    단일 파일에 대해 OCR 수행
    Returns: (success: bool, response_text: str or None)
    """
    url = "https://api.upstage.ai/v1/document-digitization"
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        with open(file_path, "rb") as f:
            files = {"document": f}
            data = {"model": "ocr"}
            time.sleep(1.5)
            response = requests.post(url, headers=headers, files=files, data=data)

        if response.status_code == 200:
            return True, response.text
        else:
            return False, None
    except Exception as e:
        print(f"    Error: {e}")
        return False, None

def process_file_with_splits(filename, api_key, max_divisor=10):
    """
    파일을 처리하되, 실패하면 PDF를 물리적으로 분할하여 재시도
    divisor: 2, 3, 4, 5, ..., max_divisor까지 시도
    """
    base_filename = filename.split("/")[-1].replace(".pdf", "").replace(".html", "")

    # 먼저 전체 파일 시도
    print(f"  Trying full file...")
    success, response_text = ocr_file(filename, api_key)

    if success:
        # 성공하면 단일 파일로 저장
        json_filename = f"{base_filename}.json"
        with open(f"{OUTPUT_DIR}/{json_filename}", "w") as json_file:
            json_file.write(response_text)
        print(f"  ✓ Saved full file as {json_filename}")
        return True

    # 실패하면 페이지 분할 시도
    print(f"  Full file failed, trying page splits...")

    # 파일이 PDF인지 확인 (HTML은 페이지 분할이 안됨)
    if not filename.endswith(".pdf"):
        print(f"  Cannot split non-PDF file. Skipping.")
        return False

    # divisor 2부터 max_divisor까지 시도
    for divisor in range(2, max_divisor + 1):
        print(f"  Trying split into {divisor} parts...")
        temp_files = []

        try:
            # PDF를 물리적으로 분할
            temp_files = split_pdf(filename, divisor)
            all_success = True

            # 각 분할된 파일에 대해 OCR 수행
            for part_idx, temp_file in enumerate(temp_files, start=1):
                print(f"    Processing part {part_idx}/{divisor}...")
                success, response_text = ocr_file(temp_file, api_key)

                if success:
                    # 성공하면 part 번호로 저장
                    json_filename = f"{base_filename}_{part_idx}.json"
                    with open(f"{OUTPUT_DIR}/{json_filename}", "w") as json_file:
                        json_file.write(response_text)
                    print(f"    ✓ Saved part {part_idx}/{divisor} as {json_filename}")
                else:
                    print(f"    ✗ Part {part_idx}/{divisor} failed")
                    all_success = False
                    break

            if all_success:
                print(f"  ✓ Successfully split into {divisor} parts")
                return True

        except Exception as e:
            print(f"    Error splitting PDF: {e}")
        finally:
            # 임시 파일 정리
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except:
                    pass

    print(f"  ✗ All split attempts failed")
    return False

for filename in total_files:
    print(f"Processing file: {filename}")
    process_file_with_splits(filename, api_key, max_divisor=10)
