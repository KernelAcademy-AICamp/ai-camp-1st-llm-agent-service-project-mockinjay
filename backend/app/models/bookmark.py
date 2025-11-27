"""
Bookmark system models for research papers
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class BookmarkCreate(BaseModel):
    """Request model for creating a bookmark"""
    pmid: str = Field(description="PubMed ID of the paper")
    title: str = Field(description="Paper title")
    authors: Optional[str] = Field(None, description="Paper authors")
    journal: Optional[str] = Field(None, description="Journal name")
    publication_date: Optional[str] = Field(None, description="Publication date")
    abstract: Optional[str] = Field(None, description="Paper abstract")
    doi: Optional[str] = Field(None, description="DOI")
    url: Optional[str] = Field(None, description="Paper URL")
    memo: Optional[str] = Field(None, description="User's personal memo")


class BookmarkUpdate(BaseModel):
    """Request model for updating bookmark memo"""
    memo: str = Field(description="Updated memo text")


class BookmarkResponse(BaseModel):
    """Bookmark response model"""
    id: str
    user_id: str
    pmid: str
    title: str
    authors: Optional[str] = None
    journal: Optional[str] = None
    publication_date: Optional[str] = None
    abstract: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    memo: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class BookmarkListResponse(BaseModel):
    """Bookmarks list response with pagination"""
    bookmarks: list[BookmarkResponse]
    total_count: int
    page: int
    page_size: int


class BookmarkExportRequest(BaseModel):
    """Request model for exporting bookmarks"""
    format: Literal["csv", "bibtex"] = Field(default="csv", description="Export format")
    pmids: Optional[list[str]] = Field(None, description="Specific PMIDs to export (None = all)")
