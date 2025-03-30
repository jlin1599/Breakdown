from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List, Dict
import PyPDF2
from io import BytesIO
from physics_extractor import PhysicsConceptExtractor
from pydantic import BaseModel

app = FastAPI(title="Physics Knowledge Graph API")
extractor = PhysicsConceptExtractor()

class Relationship(BaseModel):
    source: str
    target: str
    relation: str
    context: str

class GraphResponse(BaseModel):
    concepts: List[str]
    relationships: List[Relationship]

@app.post("/extract-concepts")
async def extract_concepts(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        pdf = PyPDF2.PdfReader(BytesIO(contents))
        text = "\n".join(page.extract_text() for page in pdf.pages)

        concepts = extractor.extract_concepts(text)
        relationships = extractor.find_relationships(text, concepts)

        return {
            "concepts": concepts,
            "relationships": relationships,
            "stats": {
                "physics_terms_found": len(concepts),
                "meaningful_relationships": len(relationships)
            }
        }
    except Exception as e:
        raise HTTPException(500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)