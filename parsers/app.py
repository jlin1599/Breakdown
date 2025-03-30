from fastapi import FastAPI, UploadFile, File

from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
import os
from pathlib import Path
import re
from .pdf_parser import PDFParser

# Get the base directory
BASE_DIR = Path(__file__).resolve().parent.parent

def sanitize_filename(filename: str) -> str:
    # Remove non-ASCII characters and common problematic characters
    clean_name = re.sub(r'[^\x00-\x7F]+', '', filename)
    # Remove any remaining special characters except dots, underscores, and hyphens
    clean_name = re.sub(r'[^\w\-\.]', '_', clean_name)
    return clean_name

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Gzip compression
app.add_middleware(GZipMiddleware)

# Mount static files directories
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "src")), name="static")
app.mount("/scripts", StaticFiles(directory=str(BASE_DIR / "src" / "scripts")), name="scripts")

# Create the output directory if it doesn't exist
parsed_pdfs_dir = BASE_DIR / "parsed_pdfs"
os.makedirs(parsed_pdfs_dir, exist_ok=True)

parser = PDFParser(output_dir=str(parsed_pdfs_dir))

@app.get("/", response_class=HTMLResponse)
async def home():
    # Read and return the home page
    with open(BASE_DIR / "src" / "pages" / "home.html") as f:
        return f.read()

@app.get("/pdf-viewer", response_class=HTMLResponse)
async def pdf_viewer():
    # Read and return the PDF viewer page
    with open(BASE_DIR / "src" / "pages" / "pdf-viewer.html") as f:
        return f.read()

@app.get("/view", response_class=HTMLResponse)
async def view():
    # Read and return the view page
    with open(BASE_DIR / "src" / "pages" / "view.html") as f:
        return f.read()

@app.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    try:

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