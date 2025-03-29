from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from .pdf_parser import PDFParser

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the output directory if it doesn't exist
os.makedirs("parsed_pdfs", exist_ok=True)

parser = PDFParser(output_dir="parsed_pdfs")

@app.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            return JSONResponse(
                content={
                    "status": "error",
                    "message": "Uploaded file must be a PDF"
                },
                status_code=400
            )

        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Parse the PDF
        json_path = parser.parse_pdf(temp_path)

        # Clean up temporary file
        os.remove(temp_path)

        return JSONResponse(
            content={
                "status": "success",
                "message": "PDF parsed successfully",
                "output_path": json_path
            },
            status_code=200
        )

    except Exception as e:
        return JSONResponse(
            content={
                "status": "error",
                "message": str(e)
            },
            status_code=500
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)