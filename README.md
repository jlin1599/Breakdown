# PDF Concept Mapper

A powerful web application that parses PDF documents and helps visualize conceptual relationships within the content. This tool combines advanced PDF parsing capabilities with an intuitive user interface to help users understand and map concepts from their documents.

## 🌟 Features

- **PDF Parsing**: Extract both text and images from PDF documents with high accuracy
- **Interactive Visualization**: View parsed PDFs with an intuitive interface
- **Concept Mapping**: Visualize relationships between concepts extracted from documents
- **Modern Web Interface**: Clean, responsive design for optimal user experience
- **API Support**: RESTful API endpoints for PDF processing and concept extraction

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js (for frontend development)
- Virtual environment (recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/HackPrinceton.git
cd HackPrinceton
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Unix or MacOS
source venv/bin/activate
```

3. Install required Python packages:
```bash
pip install fastapi uvicorn python-multipart PyMuPDF
```

### Running the Application

1. Start the backend server:
```bash
cd parsers
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:8000
```

## 🏗️ Project Structure

```
HackPrinceton/
├── parsers/
│   ├── pdf_parser.py    # PDF parsing logic
│   ├── app.py          # FastAPI backend server
│   └── __init__.py
├── src/
│   ├── pages/          # Frontend HTML pages
│   └── scripts/        # Frontend JavaScript
├── parsed_pdfs/        # Output directory for parsed PDFs
└── venv/              # Python virtual environment
```

## 🔧 API Endpoints

### POST `/parse-pdf`
Upload and parse a PDF file.
- Request: Multipart form data with PDF file
- Response: JSON with parsing results and output path

### GET `/`
Home page with file upload interface.

### GET `/pdf-viewer`
Interactive PDF viewer and concept mapping interface.

### GET `/view`
Visualization page for concept relationships.

## 💻 Technology Stack

- **Backend**:
  - FastAPI (Python web framework)
  - PyMuPDF (PDF parsing)
  - Uvicorn (ASGI server)

- **Frontend**:
  - HTML5/CSS3
  - JavaScript
  - Modern UI components

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## 🙏 Acknowledgments

- Built during HackPrinceton
- Uses PyMuPDF for robust PDF parsing
- FastAPI for high-performance backend

## 📞 Contact

For questions or feedback, please open an issue in the GitHub repository.

## 🔮 Future Enhancements

- Enhanced concept mapping algorithms
- Support for more document formats
- Advanced visualization options
- User authentication and document management
- Collaborative features
