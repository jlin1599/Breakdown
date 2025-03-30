# # import re
# # from typing import List, Dict, Set
# # import spacy

# # class PhysicsConceptExtractor:
# #     def __init__(self):
# #         self.nlp = spacy.load("en_core_web_sm")
# #         self.physics_terms = self._load_physics_terms()

# #     def _load_physics_terms(self) -> Set[str]:
# #         """Load physics terminology from a predefined list"""
# #         base_terms = {
# #             # Mechanics
# #             'force', 'mass', 'acceleration', 'velocity', 'momentum', 'energy',
# #             'work', 'power', 'torque', 'friction', 'gravity', 'inertia',

# #             # Electromagnetism
# #             'charge', 'current', 'voltage', 'resistance', 'capacitance',
# #             'inductance', 'field', 'magnetism', 'circuit',

# #             # Thermodynamics
# #             'temperature', 'heat', 'entropy', 'pressure', 'volume',

# #             # Modern Physics
# #             'quantum', 'relativity', 'particle', 'wave', 'photon'
# #         }

# #         # Add plural forms and common variants
# #         additional_terms = set()
# #         for term in base_terms:
# #             additional_terms.add(term + 's')  # plurals
# #             additional_terms.add(term + 'al')  # e.g., "gravitational"
# #             additional_terms.add(term + 'ic')  # e.g., "relativistic"

# #         return base_terms.union(additional_terms)

# #     def extract_concepts(self, text: str) -> List[str]:
# #         """Extract physics concepts using pattern matching and NLP"""
# #         doc = self.nlp(text)
# #         concepts = set()

# #         # Pattern 1: Noun phrases containing physics terms
# #         for chunk in doc.noun_chunks:
# #             if any(term in chunk.text.lower() for term in self.physics_terms):
# #                 clean_text = self._clean_text(chunk.text)
# #                 if clean_text:
# #                     concepts.add(clean_text)

# #         # Pattern 2: Capitalized physics laws/principles
# #         for sent in doc.sents:
# #             if "law of" in sent.text.lower() or "principle of" in sent.text.lower():
# #                 for ent in sent.ents:
# #                     if ent.label_ in ("LAW", "THEORY") or "law" in ent.text.lower():
# #                         concepts.add(ent.text)

# #         return sorted(concepts)

# #     def _clean_text(self, text: str) -> str:
# #         """Clean and normalize extracted text"""
# #         text = re.sub(r'[\n\t]', ' ', text)  # Remove newlines/tabs
# #         text = re.sub(r'[^\w\s-]', '', text)  # Remove punctuation
# #         return text.strip()

# #     def find_relationships(self, text: str, concepts: List[str]) -> List[Dict]:
# #         """Find relationships using syntactic patterns"""
# #         doc = self.nlp(text)
# #         relationships = []
# #         concept_set = set(concepts)

# #         # Pattern 1: X verb Y (e.g., "force causes acceleration")
# #         for sent in doc.sents:
# #             for token in sent:
# #                 if token.pos_ == "VERB" and token.dep_ == "ROOT":
# #                     subjects = [t.text for t in token.lefts if t.dep_ in ("nsubj", "nsubjpass")]
# #                     objects = [t.text for t in token.rights if t.dep_ in ("dobj", "attr")]

# #                     for subj in subjects:
# #                         for obj in objects:
# #                             if subj in concept_set and obj in concept_set:
# #                                 relationships.append({
# #                                     "source": subj,
# #                                     "target": obj,
# #                                     "relation": token.lemma_,
# #                                     "context": sent.text[:200] + ("..." if len(sent.text) > 200 else "")
# #                                 })

# #         # Pattern 2: X is Y (definitional relationships)
# #         for sent in doc.sents:
# #             if " is " in sent.text or " are " in sent.text:
# #                 for i, token in enumerate(sent[:-1]):
# #                     if token.text.lower() in ("is", "are") and token.dep_ == "ROOT":
# #                         subject = " ".join(t.text for t in token.lefts)
# #                         complement = " ".join(t.text for t in token.rights)

# #                         if subject in concept_set and complement in concept_set:
# #                             relationships.append({
# #                                 "source": subject,
# #                                 "target": complement,
# #                                 "relation": "is_a",
# #                                 "context": sent.text[:200] + ("..." if len(sent.text) > 200 else "")
# #                             })

# #         return relationships



# import re
# from typing import List, Dict, Set, Tuple
# import spacy
# from collections import defaultdict
# from pathlib import Path

# class PhysicsConceptExtractor:
#     def __init__(self):
#         self.nlp = spacy.load("en_core_web_sm")
#         self.physics_terms = self._load_physics_vocab("data/vocab.txt")
#         self.relationship_verbs = self._load_relationship_verbs()
#         self.concept_cache = defaultdict(set)

#     def _load_physics_vocab(self, vocab_path: str) -> Set[str]:
#         """Load physics vocabulary from training data"""
#         vocab = set()
#         with open(vocab_path) as f:
#             for line in f:
#                 term = line.strip().lower()
#                 if term and not term.split()[0].endswith(('ing', 'ed', 'ly')):  # Skip verbs/adverbs
#                     vocab.add(term)
#         # Add common variants
#         variants = set()
#         for term in vocab:
#             if term.endswith('y'):
#                 variants.add(term[:-1] + 'ies')  # energy -> energies
#             variants.add(term + 's')  # plural
#         return vocab.union(variants)

#     def _load_relationship_verbs(self) -> Dict[str, List[str]]:
#         """Physics-specific relationship verbs"""
#         return {
#             'causes': ['cause', 'produces', 'creates'],
#             'affects': ['affects', 'influences', 'changes'],
#             'equals': ['equals', 'is equivalent to'],
#             'contains': ['contains', 'includes'],
#             'derives': ['derives from', 'comes from']
#         }

#     def extract_concepts(self, text: str) -> List[str]:
#         """Extract physics concepts with context-aware filtering"""
#         doc = self.nlp(text)
#         concepts = set()

#         # Pattern 1: Physics terms in noun phrases
#         for chunk in doc.noun_chunks:
#             chunk_text = chunk.text.lower()
#             if any(term in chunk_text for term in self.physics_terms):
#                 clean = self._clean_concept(chunk.text)
#                 if clean:
#                     concepts.add(clean)
#                     self.concept_cache[clean].add(text)  # Store context

#         # Pattern 2: Equations (F=ma, E=mc²)
#         for match in re.finditer(r'\b([A-Za-z]+)\s*=\s*([A-Za-z0-9+*/-]+)', text):
#             concepts.update({match.group(1), match.group(2)})

#         return sorted(concepts)

#     def find_relationships(self, text: str, concepts: List[str]) -> List[Dict]:
#         """Find physics-meaningful relationships with training data context"""
#         doc = self.nlp(text)
#         relationships = []
#         concept_set = set(concepts)

#         # Enhanced relationship patterns
#         for sent in doc.sents:
#             sent_text = sent.text.lower()

#             # 1. Mathematical relationships (F = ma)
#             if '=' in sent_text:
#                 for rel in self._extract_equation_relations(sent.text, concept_set):
#                     relationships.append(rel)

#             # 2. Verb-based relationships
#             for token in sent:
#                 if token.pos_ == "VERB":
#                     verb = token.lemma_.lower()
#                     for rel_type, triggers in self.relationship_verbs.items():
#                         if verb in triggers:
#                             subj = next((t.text for t in token.lefts
#                                        if t.dep_ in ("nsubj", "nsubjpass")
#                                        and t.text in concept_set), None)
#                             obj = next((t.text for t in token.rights
#                                       if t.dep_ in ("dobj", "attr")
#                                       and t.text in concept_set), None)
#                             if subj and obj:
#                                 relationships.append({
#                                     "source": subj,
#                                     "target": obj,
#                                     "relation": rel_type,
#                                     "context": sent.text[:150] + ("..." if len(sent.text) > 150 else ""),
#                                     "evidence": "verb_relation"
#                                 })

#             # 3. Definitional relationships (X is Y)
#             if " is " in sent_text or " are " in sent_text:
#                 for rel in self._extract_definitional_relations(sent, concept_set):
#                     relationships.append(rel)

#         return self._filter_relationships(relationships)

#     def _extract_equation_relations(self, text: str, concepts: Set[str]) -> List[Dict]:
#         """Extract relationships from equations"""
#         relations = []
#         # Match equations like F=ma or E = mc²
#         for eq in re.finditer(r'([A-Za-z]+)\s*=\s*([A-Za-z0-9+*/-]+)', text):
#             lhs, rhs = eq.groups()
#             if lhs in concepts and any(c in concepts for c in re.findall(r'[A-Za-z]+', rhs)):
#                 relations.append({
#                     "source": lhs,
#                     "target": rhs,
#                     "relation": "defined_by",
#                     "context": text[:100],
#                     "evidence": "equation"
#                 })
#         return relations

#     def _extract_definitional_relations(self, sent, concepts: Set[str]) -> List[Dict]:
#         """Extract is-a relationships"""
#         relations = []
#         for token in sent:
#             if token.lemma_ == "be":
#                 subject = next((t.text for t in token.lefts
#                               if t.dep_ in ("nsubj", "nsubjpass")
#                               and t.text in concepts), None)
#                 complement = next((t.text for t in token.rights
#                                  if t.dep_ in ("attr", "acomp")
#                                  and t.text in concepts), None)
#                 if subject and complement:
#                     relations.append({
#                         "source": subject,
#                         "target": complement,
#                         "relation": "is_a",
#                         "context": sent.text[:150],
#                         "evidence": "definition"
#                     })
#         return relations

#     def _filter_relationships(self, relationships: List[Dict]) -> List[Dict]:
#         """Remove duplicate/trivial relationships"""
#         seen = set()
#         filtered = []
#         for rel in relationships:
#             key = (rel["source"], rel["target"], rel["relation"])
#             if key not in seen:
#                 seen.add(key)
#                 filtered.append(rel)
#         return filtered

#     def _clean_concept(self, text: str) -> str:
#         """Clean concept text"""
#         text = re.sub(r'[^a-zA-Z0-9\s-]', '', text)  # Remove special chars
#         text = text.strip()
#         return text if len(text) > 2 and text.lower() in self.physics_terms else None



from typing import List, Dict, Set
from pathlib import Path
import re
import spacy
from collections import defaultdict

class PhysicsConceptExtractor:
    def __init__(self):
        """Initialize with physics vocabulary and NLP processor"""
        self.nlp = spacy.load("en_core_web_sm")
        self.physics_terms = self._load_vocabulary()
        self.relationship_patterns = self._init_relationship_patterns()
        self.concept_contexts = defaultdict(list)

    def _load_vocabulary(self) -> Set[str]:
        """Load physics terms from preprocessed vocabulary file"""
        vocab_path = Path(__file__).parent / "data" / "vocab.txt"
        with open(vocab_path, 'r', encoding='utf-8') as f:
            return {line.strip() for line in f if line.strip()}

    def _init_relationship_patterns(self) -> Dict[str, List[str]]:
        """Define physics-specific relationship patterns"""
        return {
            'mathematical': [
                r'([A-Za-z]+)\s*=\s*([A-Za-z0-9+*/-]+)',  # F = ma
                r'([A-Za-z]+)\s*∝\s*([A-Za-z]+)',         # X ∝ Y
            ],
            'causal': [
                r'([A-Za-z]+)\s+causes?\s+([A-Za-z]+)',
                r'([A-Za-z]+)\s+leads\s+to\s+([A-Za-z]+)'
            ],
            'definitional': [
                r'([A-Za-z]+)\s+is\s+(?:the\s+)?([A-Za-z]+)',
                r'([A-Za-z]+)\s+are\s+([A-Za-z]+)'
            ]
        }

    def extract_concepts(self, text: str) -> List[str]:
        """Extract physics concepts from text with context tracking"""
        doc = self.nlp(text)
        concepts = set()

        # Extract using noun chunks and named entities
        for chunk in doc.noun_chunks:
            clean_text = self._clean_text(chunk.text)
            if clean_text and self._is_physics_term(clean_text):
                concepts.add(clean_text)
                self.concept_contexts[clean_text].append(text[:200] + "...")

        # Extract equations and special notations
        for eq_pattern in self.relationship_patterns['mathematical']:
            for match in re.finditer(eq_pattern, text):
                for group in match.groups():
                    clean_term = self._clean_text(group)
                    if clean_term and self._is_physics_term(clean_term):
                        concepts.add(clean_term)

        return sorted(concepts)

    def find_relationships(self, text: str, concepts: List[str]) -> List[Dict]:
        """Find meaningful physics relationships using multiple methods"""
        relationships = []
        concept_set = set(concepts)

        # 1. Mathematical relationships (equations)
        relationships.extend(self._find_mathematical_relations(text, concept_set))

        # 2. Linguistic patterns
        relationships.extend(self._find_linguistic_relations(text, concept_set))

        # 3. Contextual co-occurrence
        relationships.extend(self._find_contextual_relations(text, concept_set))

        return self._filter_relationships(relationships)

    def _find_mathematical_relations(self, text: str, concepts: Set[str]) -> List[Dict]:
        """Extract relationships from equations"""
        relations = []
        for pattern in self.relationship_patterns['mathematical']:
            for match in re.finditer(pattern, text):
                lhs, rhs = match.groups()[:2]
                if lhs in concepts and any(t in concepts for t in re.findall(r'[A-Za-z]+', rhs)):
                    relations.append({
                        'source': lhs,
                        'target': rhs,
                        'relation': 'mathematical',
                        'context': text[:200] + "...",
                        'evidence': 'equation'
                    })
        return relations

    def _find_linguistic_relations(self, text: str, concepts: Set[str]) -> List[Dict]:
        """Find relationships using linguistic patterns"""
        relations = []
        doc = self.nlp(text)

        for sent in doc.sents:
            # Check for causal relationships
            for pattern in self.relationship_patterns['causal']:
                for match in re.finditer(pattern, sent.text, re.IGNORECASE):
                    cause, effect = match.groups()
                    if cause in concepts and effect in concepts:
                        relations.append({
                            'source': cause,
                            'target': effect,
                            'relation': 'causes',
                            'context': sent.text[:200] + "...",
                            'evidence': 'verb_pattern'
                        })

            # Check for definitional relationships
            for token in sent:
                if token.lemma_ == 'be':
                    subj = next((t.text for t in token.lefts if t.text in concepts), None)
                    obj = next((t.text for t in token.rights if t.text in concepts), None)
                    if subj and obj:
                        relations.append({
                            'source': subj,
                            'target': obj,
                            'relation': 'is_a',
                            'context': sent.text[:200] + "...",
                            'evidence': 'definition'
                        })

        return relations

    def _find_contextual_relations(self, text: str, concepts: Set[str]) -> List[Dict]:
        """Find concepts that co-occur in meaningful contexts"""
        relations = []
        window_size = 150  # characters

        for i, concept1 in enumerate(concepts):
            for concept2 in list(concepts)[i+1:]:
                # Check if they appear close to each other
                pattern = f"{concept1}.{{0,20}}{concept2}|{concept2}.{{0,20}}{concept1}"
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    start = max(0, match.start() - window_size//2)
                    end = min(len(text), match.end() + window_size//2)
                    relations.append({
                        'source': concept1,
                        'target': concept2,
                        'relation': 'related_to',
                        'context': text[start:end],
                        'evidence': 'co-occurrence'
                    })
        return relations

    def _is_physics_term(self, text: str) -> bool:
        """Check if text is a valid physics term"""
        text_lower = text.lower()
        return (
            text_lower in self.physics_terms or
            any(term in text_lower for term in self.physics_terms) or
            bool(re.search(r'\b(force|energy|field|wave|particle|law)\b', text_lower))
        )

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        text = re.sub(r'[^a-zA-Z0-9\s-]', '', text)  # Remove special chars
        text = text.strip()
        return text if len(text) > 2 else None

    def _filter_relationships(self, relationships: List[Dict]) -> List[Dict]:
        """Remove duplicate and low-quality relationships"""
        seen = set()
        filtered = []
        for rel in relationships:
            key = (rel['source'].lower(), rel['target'].lower(), rel['relation'])
            if key not in seen:
                seen.add(key)
                filtered.append(rel)
        return filtered