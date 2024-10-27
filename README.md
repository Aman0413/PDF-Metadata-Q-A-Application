# PDF Metadata Q&A Application

A FastAPI-based application that allows users to upload PDF documents, extract their content, store metadata in MongoDB, and ask questions about the PDF content via the Google Gemini API.

## Features

- Upload PDF files and extract their text.
- Store metadata (e.g., filename, upload date) in MongoDB.
- Query PDF content using a question-answering API powered by Google Gemini.

### Prerequisites

- Python 3.8+
- MongoDB
- [Google Gemini API Key](https://cloud.google.com/ai-platform/docs/generative-ai/overview)
- PyMuPDF, Pydantic, Motor (for MongoDB), and FastAPI.
