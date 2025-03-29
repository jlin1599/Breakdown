# PDF Concept Mapper

A web application built during HackPrinceton that helps users analyze and visualize conceptual relationships within PDF documents. Upload your PDFs and explore the connections between different concepts and ideas within your documents.

## Features

- PDF text and image extraction
- Interactive document viewer
- Concept relationship visualization
- Clean and intuitive web interface

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Unix/MacOS
```

2. Install dependencies:
```bash
pip install fastapi uvicorn python-multipart PyMuPDF
```

3. Run the application:
```bash
cd parsers
python app.py
```

4. Open `http://localhost:8000` in your browser

## Built With

- FastAPI - Backend framework
- PyMuPDF - PDF processing
- HTML/CSS/JavaScript - Frontend interface

## Created at HackPrinceton 2024 
