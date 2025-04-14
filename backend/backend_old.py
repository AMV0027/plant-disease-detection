from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import shutil
import uuid
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO object detection model
model = YOLO(r'C:\Customer Projects\plant_disease_detection\Final project\backend\best.pt')

@app.get("/health")
async def health_check():
    return {"status": "online", "message": "Object Detection API running", "model_loaded": bool(model)}

@app.post("/detect/")
async def detect_objects(file: UploadFile = File(...)):
    temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run detection
    results = model.predict(temp_filename)

    detections = []
    boxes = results[0].boxes
    for i in range(len(boxes)):
        xyxy = boxes.xyxy[i].tolist()  # [x1, y1, x2, y2]
        conf = boxes.conf[i].item()
        class_id = int(boxes.cls[i].item())
        class_name = model.names[class_id]

        detections.append({
            "class_name": class_name,
            "class_id": class_id,
            "confidence": round(conf, 4),
            "bbox": [round(x, 2) for x in xyxy]  # rounded for readability
        })

    os.remove(temp_filename)

    return JSONResponse({"detections": detections})

if __name__ == "__main__":
    uvicorn.run("backend:app", host="127.0.0.1", port=8000, reload=True)
