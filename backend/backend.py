from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from pydantic import BaseModel
import shutil
import uuid
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for more control
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionResult(BaseModel):
    predicted_class: str
    class_id: int
    confidence: float

# Load model only once
model = YOLO(r'C:\Customer Projects\plant_disease_detection\Final project\backend\best.pt')

@app.get("/health")
async def health_check():
    return {"status": "online", "message": "Server is running", "model_loaded": bool(model)}


@app.post("/predict/", response_model=PredictionResult)
async def predict_image(file: UploadFile = File(...)):
    # Save uploaded file to a temporary location
    temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run prediction
    results = model.predict(temp_filename)

    # Extract prediction
    probs = results[0].probs
    class_id = probs.top1
    confidence = probs.top1conf.item()
    class_name = model.names[class_id]

    # Clean up
    os.remove(temp_filename)

    print(f"""
    Name: {class_name}
    id: {class_id}
    confidence: {round(confidence, 4)}
    """)

    # Return as JSON
    return JSONResponse({
        "predicted_class": class_name,
        "class_id": class_id,
        "confidence": round(confidence, 4)
    })

if __name__ == "__main__":
    uvicorn.run("backend:app", host="127.0.0.1", port=8000, reload=True)