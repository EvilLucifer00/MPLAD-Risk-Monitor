from pydantic import BaseModel, Field
from enum import Enum

class UserRole(str, Enum):
    MP = "MP"
    DM = "DM"
    DA = "DA"

class LoginRequest(BaseModel):
    username: str
    password: str
    role: UserRole

class RegisterMPRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=100)
    mp_name: str
    constituency: str
    dist: str
    house: str
    state: str
    dm_id: int
    
class RegisterDMRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=100)
    dm_name: str
    dist: str
    state: str