from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key="your_groq_api_key_here")

class TextIn(BaseModel):
    text: str

@app.post("/summarize")
def summarize_text(data: TextIn):
    prompt = f"Summarize the following text in 3 lines:\n\n{data.text}"


    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )

        summary = response.choices[0].message.content
        return {"summary": summary}
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {"summary": f"Error: Could not generate summary. Please check backend logs. Details: {e}"}, 500
