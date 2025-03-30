import spacy
from pathlib import Path
import re
from typing import Set

# Initialize NLP processor
nlp = spacy.load("en_core_web_sm")

def load_raw_text(file_path: str) -> str:
    """Load raw text file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def extract_physics_terms(text: str) -> Set[str]:
    """Extract physics-relevant terms"""
    doc = nlp(text)
    physics_terms = set()

    # Custom patterns for physics terminology
    physics_patterns = [
        r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b',  # Capitalized terms (e.g., "Quantum Mechanics")
        r'\b[a-z]+(?:ity|ism|tion)\b',         # Physics suffixes (e.g., "velocity", "quantization")
        r'\b[a-z]+(?:\s[a-z]+)*\s(?:law|principle|effect)\b'  # Physics concepts
    ]

    # Pattern-based extraction
    for pattern in physics_patterns:
        for match in re.finditer(pattern, text):
            physics_terms.add(match.group().lower())

    # NLP-based extraction
    for sent in doc.sents:
        for chunk in sent.noun_chunks:
            if any(t.pos_ in ('NOUN', 'PROPN') and not t.is_stop for t in chunk):
                clean_term = re.sub(r'[^a-zA-Z\s]', '', chunk.text).strip().lower()
                if len(clean_term) > 2:
                    physics_terms.add(clean_term)

    return physics_terms

def save_vocabulary(terms: Set[str], output_path: str):
    """Save processed vocabulary"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for term in sorted(terms):
            f.write(f"{term}\n")

def build_physics_vocab(input_path: str, output_path: str):
    """Main preprocessing function"""
    print(f"Processing {input_path}...")
    raw_text = load_raw_text(input_path)
    terms = extract_physics_terms(raw_text)
    save_vocabulary(terms, output_path)
    print(f"Saved {len(terms)} physics terms to {output_path}")

if __name__ == "__main__":
    # Path configuration
    input_file = Path(__file__).parent.parent / "data" / "feynman.txt"
    output_file = Path(__file__).parent.parent / "data" / "vocab.txt"

    # Ensure output directory exists
    output_file.parent.mkdir(exist_ok=True)

    # Run preprocessing
    build_physics_vocab(str(input_file), str(output_file))