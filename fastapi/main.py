from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
import io

app = FastAPI()

# CORS for all origins (adjust for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and processor at startup
processor = AutoImageProcessor.from_pretrained("prithivMLmods/AI-vs-Deepfake-vs-Real")
model = AutoModelForImageClassification.from_pretrained("prithivMLmods/AI-vs-Deepfake-vs-Real")

@app.get("/")
def root():
    return {"message": "API is running."}

# @app.post("/predict/")
# async def predict(file: UploadFile = File(...)):
#     try:
#         image_bytes = await file.read()
#         image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#         inputs = processor(images=image, return_tensors="pt")
#         with torch.no_grad():
#             outputs = model(**inputs)
#         logits = outputs.logits
#         predicted_class_id = logits.argmax(-1).item()
#         predicted_label = model.config.id2label[predicted_class_id]
#         probs = torch.nn.functional.softmax(logits, dim=-1).squeeze().tolist()
#         all_labels = model.config.id2label
#         class_probs = {all_labels[i]: float(probs[i]) for i in range(len(probs))}
#         return {
#             "prediction": predicted_label,
#             "class_probabilities": class_probs
#         }
#     except Exception as e:
#         return {"error": str(e)}

# filepath: /Users/navneetshreya/Documents/codeverse/DEFACE UPDATE/DeFace/fastapi/main.py
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        logging.info("File received: %s", file.filename)

        # Read the file
        image_bytes = await file.read()
        logging.info("File read successfully")

        # Process the image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")
        logging.info("Image processed successfully")

        # Perform inference
        with torch.no_grad():
            outputs = model(**inputs)
        logits = outputs.logits
        predicted_class_id = logits.argmax(-1).item()
        predicted_label = model.config.id2label[predicted_class_id]
        logging.info("Prediction made: %s", predicted_label)

        # Calculate probabilities
        probs = torch.nn.functional.softmax(logits, dim=-1).squeeze().tolist()
        all_labels = model.config.id2label
        class_probs = {all_labels[i]: float(probs[i]) for i in range(len(probs))}
        logging.info("Class probabilities calculated")

        # Return the response
        return {
            "prediction": predicted_label,
            "class_probabilities": class_probs
        }
    except Exception as e:
        logging.error("Error during prediction: %s", str(e))
        return {"error": str(e)}