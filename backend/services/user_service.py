from auth.auth import create_access_token
from database.database import supabase
from schemas.user_schema import LoginRequest, RegisterMPRequest, RegisterDMRequest, UserRole
from fastapi import HTTPException






# ---------- LOGIN HELPER ----------
async def login_user_details(user: LoginRequest) -> dict:
    
    role = user.role.value
    table_name = "mplads_mp" if role == "MP" else "mplads_dm"
  
    db_user = (
        supabase
        .table(table_name)
        .select("*")
        .eq("username", user.username)
        .eq("password_hash", user.password) 
        .execute()
    )

    if not db_user.data:
        raise HTTPException(
            status_code=404,
            detail="Invalid username or password."
        )
    
    user_data = db_user.data[0]
    
    if role == "MP":
        return {
            "id": user_data["id"],
            "mp_name": user_data.get("mp_name"),
            "constituency": user_data["constituency"],
            "dist": user_data["dist"],
            "state": user_data["state"],
            "house": user_data["house"],
            "dm_id": user_data.get("dm_id")
        }
    elif role == "DM":
        return {
            "id": user_data["id"],
            "dm_name": user_data.get("dm_name"),
            "dist": user_data["dist"],
            "state": user_data["state"],
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid role specified")






# ---------- LOGIN USER ----------
async def login(user: LoginRequest):
    
    payload = await login_user_details(user)
    token = create_access_token(payload)
    return {"access_token": token, "token_type": "bearer"}






async def me(current_user: dict):
    
    return current_user





# ---------- GET ALL DM ----------
async def get_all_dm():
    
    result = (
        supabase.table("mplads_dm").select("id,dist,state,dm_name").execute()
    )
    
    return result.data







# ---------- GET DM BY DISTRICT ----------
async def get_dm_by_dist(dist_name:str):
    
    result = (
        supabase.table("mplads_dm").select("id,dist,state,dm_name").eq("dist",dist_name.upper()).execute()
    )
    
    return result.data












# ---------- REGISTER NEW MP ----------
async def register_mp(user: RegisterMPRequest):
   
    existing_user = (
        supabase.table("mplads_mp").select("id").eq("username", user.username).execute()
    )
    if existing_user.data:
        raise HTTPException(status_code=409, detail="Username already exists for an MP")

    existing_dm = (
        supabase.table("mplads_dm").select("*").eq("id",user.dm_id).execute()
    )
    
    if not existing_dm.data:
        raise HTTPException(status_code=409,detail="No DM found with this id")
    db_payload = {
        "username": user.username,
        "password_hash": user.password,
        "mp_name": user.mp_name,
        "constituency": user.constituency,
        "dist": user.dist,
        "house": user.house,
        "state": user.state,
        "dm_id": user.dm_id
    }
    
    result = supabase.table("mplads_mp").insert(db_payload).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create MP user")
        
    return {
        "message": "MP registered successfully",
        "user_id": result.data[0]["id"]
    }











# ---------- REGISTER NEW DM ----------
async def register_dm(user: RegisterDMRequest):

    existing_user = (
        supabase.table("mplads_dm").select("id").eq("username", user.username).execute()
    )
    if existing_user.data:
        raise HTTPException(status_code=409, detail="Username already exists for a DM")

    db_payload = {
        "username": user.username,
        "password_hash": user.password,
        "dm_name": user.dm_name,
        "dist": user.dist,
        "state": user.state,
    }
    
    result = supabase.table("mplads_dm").insert(db_payload).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create DM user")
        
    return {
        "message": "DM registered successfully",
        "user_id": result.data[0]["id"]
    }