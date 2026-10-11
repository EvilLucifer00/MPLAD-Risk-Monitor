import cloudinary
import cloudinary.uploader
from fastapi import File, HTTPException, UploadFile
from config.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

async def upload_file(file:UploadFile = File(...))->str:
    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder = "mplads_documents"
        )
        return  str(result["secure_url"]),
        
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )