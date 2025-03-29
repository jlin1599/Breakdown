from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import uvicorn
import os
from pdf_parser import PDFParser

app = FastAPI()
parser = PDFParser(output_dir="parsed_pdfs")

@app.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    try:
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