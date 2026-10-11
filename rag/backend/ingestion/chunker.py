"""Semantic / hierarchical parent-child chunker.

Implements intelligent chunking that preserves document structure:
- Headings create section boundaries
- Tables are kept as single chunks
- Parent-child hierarchy links sections to their content
- Metadata (page, section, heading hierarchy) is attached to each chunk
"""

from __future__ import annotations
import re
import uuid
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from ingestion.extractors import ExtractedDocument, ExtractedPage

logger = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────
MAX_CHUNK_TOKENS = 512      # approximate max tokens per chunk
MIN_CHUNK_TOKENS = 50       # don't create very small chunks
OVERLAP_SENTENCES = 2       # sentence overlap between consecutive chunks
APPROX_CHARS_PER_TOKEN = 4  # rough estimate


@dataclass
class ChunkData:
    """A single chunk with full metadata."""
    chunk_id: str
    parent_chunk_id: Optional[str]
    content: str
    content_type: str       # heading | paragraph | table | list | mixed
    page_number: Optional[int]
    section: Optional[str]
    heading_hierarchy: List[str]
    chunk_index: int
    token_count: int
    document_name: str
    metadata: dict = field(default_factory=dict)


def _estimate_tokens(text: str) -> int:
    """Rough token count estimate."""
    return max(1, len(text) // APPROX_CHARS_PER_TOKEN)


def _split_into_sentences(text: str) -> List[str]:
    """Split text into sentences using regex."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def _detect_content_type(text: str) -> str:
    """Heuristic content type detection."""
    stripped = text.strip()
    if not stripped:
        return "paragraph"
    if "|" in stripped and stripped.count("|") > 2:
        return "table"
    if re.match(r'^[\s]*[-•●◦▪]\s', stripped, re.MULTILINE):
        return "list"
    lines = stripped.split("\n")
    if len(lines) == 1 and len(stripped) < 200:
        return "heading"
    return "paragraph"


def _is_heading_line(line: str) -> bool:
    """Check if a line looks like a heading."""
    stripped = line.strip()
    if not stripped or len(stripped) > 200:
        return False
    # Numbered headings: "1.", "1.1", "Chapter 1", "Section 2.3"
    if re.match(r'^(\d+\.?\d*\.?\d*)\s+\S', stripped):
        return True
    if re.match(r'^(Chapter|Section|Part|Article|Clause|Schedule|Annexure|Appendix)\s', stripped, re.IGNORECASE):
        return True
    # ALL CAPS short lines
    if stripped.isupper() and len(stripped) < 100 and len(stripped.split()) >= 2:
        return True
    return False


class SemanticChunker:
    """Hierarchical semantic chunker that preserves document structure."""

    def chunk_document(self, doc: ExtractedDocument) -> List[ChunkData]:
        """Process an extracted document into semantic chunks."""
        all_chunks: List[ChunkData] = []
        chunk_index = 0
        current_heading_hierarchy: List[str] = []
        current_section: Optional[str] = None
        parent_chunk_id: Optional[str] = None

        for page in doc.pages:
            # Process tables as standalone chunks
            for table_text in page.tables:
                if table_text.strip():
                    chunk = ChunkData(
                        chunk_id=str(uuid.uuid4()),
                        parent_chunk_id=parent_chunk_id,
                        content=table_text.strip(),
                        content_type="table",
                        page_number=page.page_number,
                        section=current_section,
                        heading_hierarchy=current_heading_hierarchy.copy(),
                        chunk_index=chunk_index,
                        token_count=_estimate_tokens(table_text),
                        document_name=doc.name,
                        metadata={"source": "table"},
                    )
                    all_chunks.append(chunk)
                    chunk_index += 1

            # Process text content line by line
            lines = page.text.split("\n")
            buffer: List[str] = []
            buffer_type = "paragraph"

            for line in lines:
                stripped = line.strip()
                if not stripped:
                    if buffer:
                        buffer.append("")  # preserve paragraph breaks
                    continue

                # Check if this line is a heading
                is_heading = (
                    _is_heading_line(stripped)
                    or stripped in (page.headings or [])
                )

                if is_heading:
                    # Flush existing buffer as a chunk
                    if buffer:
                        text_block = "\n".join(buffer).strip()
                        if text_block and _estimate_tokens(text_block) >= MIN_CHUNK_TOKENS:
                            chunks = self._split_large_block(
                                text_block, buffer_type, page.page_number,
                                current_section, current_heading_hierarchy,
                                parent_chunk_id, chunk_index, doc.name,
                            )
                            all_chunks.extend(chunks)
                            chunk_index += len(chunks)
                        buffer = []

                    # Update heading hierarchy
                    current_heading_hierarchy, current_section = self._update_hierarchy(
                        current_heading_hierarchy, stripped
                    )

                    # Create a heading (parent) chunk
                    heading_chunk_id = str(uuid.uuid4())
                    heading_chunk = ChunkData(
                        chunk_id=heading_chunk_id,
                        parent_chunk_id=parent_chunk_id,
                        content=stripped,
                        content_type="heading",
                        page_number=page.page_number,
                        section=current_section,
                        heading_hierarchy=current_heading_hierarchy.copy(),
                        chunk_index=chunk_index,
                        token_count=_estimate_tokens(stripped),
                        document_name=doc.name,
                    )
                    all_chunks.append(heading_chunk)
                    parent_chunk_id = heading_chunk_id
                    chunk_index += 1
                else:
                    buffer.append(stripped)
                    buffer_type = _detect_content_type(stripped)

            # Flush remaining buffer for this page
            if buffer:
                text_block = "\n".join(buffer).strip()
                if text_block and _estimate_tokens(text_block) >= MIN_CHUNK_TOKENS:
                    chunks = self._split_large_block(
                        text_block, buffer_type, page.page_number,
                        current_section, current_heading_hierarchy,
                        parent_chunk_id, chunk_index, doc.name,
                    )
                    all_chunks.extend(chunks)
                    chunk_index += len(chunks)

        logger.info("Chunked '%s' into %d chunks", doc.name, len(all_chunks))
        return all_chunks

    def _split_large_block(
        self,
        text: str,
        content_type: str,
        page_number: Optional[int],
        section: Optional[str],
        hierarchy: List[str],
        parent_id: Optional[str],
        start_index: int,
        doc_name: str,
    ) -> List[ChunkData]:
        """Split a large text block into sentence-aware chunks with overlap."""
        tokens = _estimate_tokens(text)
        if tokens <= MAX_CHUNK_TOKENS:
            return [ChunkData(
                chunk_id=str(uuid.uuid4()),
                parent_chunk_id=parent_id,
                content=text,
                content_type=content_type,
                page_number=page_number,
                section=section,
                heading_hierarchy=hierarchy.copy(),
                chunk_index=start_index,
                token_count=tokens,
                document_name=doc_name,
            )]

        # Split by sentences with overlap
        sentences = _split_into_sentences(text)
        chunks = []
        current_sentences: List[str] = []
        current_tokens = 0
        idx = start_index

        for sent in sentences:
            sent_tokens = _estimate_tokens(sent)
            if current_tokens + sent_tokens > MAX_CHUNK_TOKENS and current_sentences:
                chunk_text = " ".join(current_sentences)
                chunks.append(ChunkData(
                    chunk_id=str(uuid.uuid4()),
                    parent_chunk_id=parent_id,
                    content=chunk_text,
                    content_type=content_type,
                    page_number=page_number,
                    section=section,
                    heading_hierarchy=hierarchy.copy(),
                    chunk_index=idx,
                    token_count=_estimate_tokens(chunk_text),
                    document_name=doc_name,
                ))
                idx += 1
                # Keep overlap sentences
                overlap = current_sentences[-OVERLAP_SENTENCES:] if OVERLAP_SENTENCES else []
                current_sentences = overlap
                current_tokens = sum(_estimate_tokens(s) for s in current_sentences)

            current_sentences.append(sent)
            current_tokens += sent_tokens

        # Remaining
        if current_sentences:
            chunk_text = " ".join(current_sentences)
            if _estimate_tokens(chunk_text) >= MIN_CHUNK_TOKENS or not chunks:
                chunks.append(ChunkData(
                    chunk_id=str(uuid.uuid4()),
                    parent_chunk_id=parent_id,
                    content=chunk_text,
                    content_type=content_type,
                    page_number=page_number,
                    section=section,
                    heading_hierarchy=hierarchy.copy(),
                    chunk_index=idx,
                    token_count=_estimate_tokens(chunk_text),
                    document_name=doc_name,
                ))
            elif chunks:
                # Merge into last chunk if too small
                last = chunks[-1]
                merged = last.content + " " + chunk_text
                chunks[-1] = ChunkData(
                    chunk_id=last.chunk_id,
                    parent_chunk_id=last.parent_chunk_id,
                    content=merged,
                    content_type=last.content_type,
                    page_number=last.page_number,
                    section=last.section,
                    heading_hierarchy=last.heading_hierarchy,
                    chunk_index=last.chunk_index,
                    token_count=_estimate_tokens(merged),
                    document_name=last.document_name,
                )

        return chunks

    @staticmethod
    def _update_hierarchy(
        current: List[str], heading: str
    ) -> Tuple[List[str], str]:
        """Update the heading hierarchy based on heading depth heuristics."""
        # Try to determine heading level from numbering
        match = re.match(r'^(\d+(?:\.\d+)*)', heading)
        if match:
            depth = match.group(1).count(".") + 1
        elif re.match(r'^(Chapter|Part)\s', heading, re.IGNORECASE):
            depth = 1
        elif re.match(r'^(Section|Article)\s', heading, re.IGNORECASE):
            depth = 2
        elif re.match(r'^(Clause|Sub-section)\s', heading, re.IGNORECASE):
            depth = 3
        else:
            depth = len(current) + 1  # append at current depth

        # Trim hierarchy to the right depth and add this heading
        new_hierarchy = current[: max(0, depth - 1)]
        new_hierarchy.append(heading)
        section = " > ".join(new_hierarchy)
        return new_hierarchy, section
