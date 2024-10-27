from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import fitz  # PyMuPDF
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from datetime import datetime
from app.models import MongoDB, DocumentMetadata
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Google Gemini API key
api_key = os.getenv('GOOGLE_GEMINI_API_KEY')

if not api_key:
    raise ValueError("Google Gemini API key not found.")

genai.configure(api_key=api_key)

# Create the Google Gemini model
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
)

# Global dictionary for storing extracted texts (consider persisting in database for production)
extracted_texts = {}


class QuestionRequest(BaseModel):
    filename: str
    question: str


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    pdf_document = fitz.open(file_path)
    text = ""
    for page in pdf_document:
        text += page.get_text()
    pdf_document.close()
    return text


@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    """Endpoint for uploading PDF files and storing metadata."""
    file_location = f"uploaded_pdfs/{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(await file.read())

    # Extract text from the uploaded PDF
    text_content = extract_text_from_pdf(file_location)

    # Store the extracted text content for future use
    extracted_texts[file.filename] = text_content

    # Create and store document metadata in MongoDB
    metadata = DocumentMetadata(filename=file.filename)
    document_id = await MongoDB.insert_document(metadata.dict())

    return {
        "filename": file.filename,
        "content": text_content,
        "document_id": document_id,  # Return document ID for reference
    }


@app.post("/ask/")
async def ask_question(request: QuestionRequest):
    """Endpoint for asking questions related to the PDF content."""
    text_content = extracted_texts.get(request.filename)

    if text_content is None:
        raise HTTPException(
            status_code=404, detail="PDF content not found. Please upload the PDF first.")

    chat_session = model.start_chat(
        history=[
            {"role": "user", "parts": [
                f"I have the following content from a PDF: {text_content}\n"]},
            {"role": "model", "parts": [
                "I am ready to answer your questions based on the PDF content."]},
        ]
    )

    response = chat_session.send_message(request.question)
    return JSONResponse(content={"question": request.question, "answer": response.text})
