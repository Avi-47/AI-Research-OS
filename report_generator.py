from openai import OpenAI
from .prompt import RESEARCH_PROMPT
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {
            "role": "user",
            "content": RESEARCH_PROMPT
        }
    ]
)

report = response.choices[0].message.content