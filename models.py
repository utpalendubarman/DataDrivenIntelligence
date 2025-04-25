# This file is included as a placeholder for future database integration.
# Currently, the application uses file-based storage, but this can be 
# extended to use SQLAlchemy models in the future.

from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Any


@dataclass
class Project:
    """
    Represents a data project in the application.
    This is a dataclass model that can be converted to SQLAlchemy in the future.
    """
    id: str
    name: str
    file_name: str
    created_at: datetime
    row_count: int
    column_count: int


@dataclass
class DataColumn:
    """
    Represents a column in a dataset.
    """
    name: str
    data_type: str
    description: str = None


@dataclass
class AIQuery:
    """
    Represents an AI query and its response.
    """
    id: str
    project_id: str
    query_text: str
    formatted_prompt: str
    response: str
    created_at: datetime


# Note: These models are not currently used for database integration
# but serve as a reference for future development when SQLAlchemy is added.
