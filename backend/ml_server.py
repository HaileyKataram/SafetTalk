from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# ✅ CORS FIX (CRITICAL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # extension needs this
    allow_credentials=True,
    allow_methods=["*"],   # allows OPTIONS
    allow_headers=["*"],
)

classifier = pipeline(
    "text-classification",
    model="unitary/unbiased-toxic-roberta",
    return_all_scores=True
)

class TextIn(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_text(data: TextIn):
    results = classifier(data.text)[0]
    top = max(results, key=lambda x: x["score"])

    return {
        "confidence": float(top["score"]),
        "label": top["label"],
        "scores": {r["label"]: float(r["score"]) for r in results}
    }
