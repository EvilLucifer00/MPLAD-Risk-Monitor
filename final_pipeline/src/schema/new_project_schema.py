from pydantic import BaseModel
from datetime import datetime

class ProjectSchema(BaseModel):
    work_id:str
    description:str
    category:str
    mp_name:str
    state:str
    district:str
    longitude:float
    latitude:float
    sanction_amount:float
    quantity:int
    unit:str
    sanction_date:datetime
    vendor:str
    expenditure_amount:str
    expenditure_date:datetime
    ida:str
