from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel, Field

# MongoDB connection setup


class MongoDB:
    # Replace with your MongoDB URI if necessary
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    database = client["pdf_db"]
    documents_collection = database["documents"]

    @staticmethod
    async def insert_document(document: dict):
        """Insert a document and return its ID."""
        result = await MongoDB.documents_collection.insert_one(document)
        return str(result.inserted_id)

    @staticmethod
    async def get_document_by_id(document_id: str):
        """Retrieve a document by its ID."""
        document = await MongoDB.documents_collection.find_one({"_id": ObjectId(document_id)})
        if document:
            # Convert ObjectId to string for JSON serialization
            document["_id"] = str(document["_id"])
        return document

# Document metadata model


class DocumentMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    filename: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
