import fitz  # PyMuPDF
import base64
import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class PDFObject:
    type: str  # 'text' or 'image'
    content: str  # text content or base64 encoded image
    page_number: int
    location: Dict[str, float]  # bbox coordinates
    metadata: Dict[str, str]  # additional metadata

@dataclass
class PDFDocument:
    filename: str
    total_pages: int
    creation_date: str
    objects: List[PDFObject]
    metadata: Dict[str, str]

class PDFParser:
    def __init__(self, output_dir: str = "parsed_pdfs"):
        """Initialize the PDF parser with an output directory."""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def parse_pdf(self, pdf_path: str) -> str:
        """Parse a PDF file and return the path to the generated JSON file."""

        # Open the PDF
        doc = fitz.open(pdf_path)

        # Initialize document structure
        pdf_doc = PDFDocument(
            filename=os.path.basename(pdf_path),
            total_pages=len(doc),
            creation_date=datetime.now().isoformat(),
            objects=[],
            metadata=self._extract_metadata(doc)
        )

        # Process each page
        for page_num in range(len(doc)):
            page = doc[page_num]

            # Extract text blocks with proper encoding handling
            text_blocks = page.get_text("blocks")
            for block in text_blocks:
                if block[6] == 0:  # Text block
                    # Clean and normalize the text content
                    text_content = block[4]
                    try:
                        # Normalize unicode characters
                        text_content = text_content.encode('utf-8').decode('utf-8')
                        # Remove any problematic characters
                        text_content = ''.join(char for char in text_content if ord(char) < 65536)
                        # Replace common problematic character sequences
                        text_content = text_content.replace('öŸ', '')  # Remove specific problematic sequence
                        text_content = text_content.replace('\x00', '')  # Remove null characters
                    except UnicodeError:
                        # If there's an encoding error, try to recover the text
                        text_content = block[4].encode('ascii', 'ignore').decode('ascii')

                    pdf_doc.objects.append(PDFObject(
                        type="text",
                        content=text_content,
                        page_number=page_num + 1,
                        location={
                            "x0": block[0],
                            "y0": block[1],
                            "x1": block[2],
                            "y1": block[3]
                        },
                        metadata={
                            "block_type": "text",
                            "font_size": str(block[5])
                        }
                    ))

            # Extract images
            images = page.get_images(full=True)
            for img_index, img in enumerate(images):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]

                pdf_doc.objects.append(PDFObject(
                    type="image",
                    content=base64.b64encode(image_bytes).decode('utf-8'),
                    page_number=page_num + 1,
                    location={},  # Could be enhanced to include image position
                    metadata={
                        "format": base_image["ext"],
                        "colorspace": str(base_image.get("colorspace", "")),
                        "size": len(image_bytes)
                    }
                ))

        # Save to JSON file
        output_path = self._save_to_json(pdf_doc)
        doc.close()
        return output_path

    def _extract_metadata(self, doc: fitz.Document) -> Dict[str, str]:
        """Extract PDF metadata."""
        metadata = {}
        for key in doc.metadata:
            if doc.metadata[key]:
                metadata[key] = str(doc.metadata[key])
        return metadata

    def _save_to_json(self, pdf_doc: PDFDocument) -> str:
        """Save the parsed PDF data to a JSON file."""
        filename = f"{os.path.splitext(pdf_doc.filename)[0]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        output_path = os.path.join(self.output_dir, filename)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(asdict(pdf_doc), f, indent=2, ensure_ascii=False)

        return output_path