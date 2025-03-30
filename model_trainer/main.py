from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import PyPDF2
from io import BytesIO
from physics_extractor import PhysicsConceptExtractor  # Import from your training module

app = FastAPI(title="Physics Knowledge Graph API")

# Initialize model (load once at startup)
extractor = PhysicsConceptExtractor()

@app.post("/extract-concepts")
async def extract_from_pdf(file: UploadFile = File(...)):
    """Endpoint to process PDF files"""
    try:
        # Read PDF
        contents = await file.read()
        pdf = PyPDF2.PdfReader(BytesIO(contents))
        text = "\n".join([page.extract_text() for page in pdf.pages])

        # Extract concepts
        concepts = extractor.extract_concepts(text)

        # Build knowledge graph
        return {
            "concepts": concepts,
            "relationships": extractor.find_relationships(text, concepts)
        }
    except Exception as e:
        raise HTTPException(500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)