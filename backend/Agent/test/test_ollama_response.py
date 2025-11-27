import json
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

print("Testing Ollama response structure...")

client = OpenAI(
    base_url='http://localhost:11434/v1',
    api_key=os.getenv('OLLAMA_API_KEY')
)

response = client.chat.completions.create(
    model='glm-4.6:cloud',
    messages=[{'role': 'user', 'content': '안녕하세요'}]
)

print("\n=== Response (Raw Object) ===")
print(response)

print("\n=== Serialized JSON ===")
print(json.dumps(response.model_dump(), indent=2, ensure_ascii=False))

print("\n=== Message Content ===")
print(response.choices[0].message.content)
