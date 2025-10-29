from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Full Summary API")

# ---------------------- CORS Setup ---------------------- #
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------- MongoDB Setup ---------------------- #
client = AsyncIOMotorClient("mongodb://localhost:27017/")
db = client["test"]
full_summary_collection = db["data"]
section_summary_collection = db["section_summary"]
domain_words_collection = db["domain_words"]
taxonomy_collection = db["taxonomy"]
# ---------------------- Pydantic Models ---------------------- #
class EditRequest(BaseModel):
    index: int
    replace_text: str
    with_text: str

class SummaryRequest(BaseModel):
    index: int
    sentence: str | None = None

class ReplaceRequest(BaseModel):
    sentences: List[str]

class SectionEditRequest(BaseModel):
    replace_text: str
    with_text: str

class SectionReplaceRequest(BaseModel):
    section_summary: str

# class DomainWordUpdateRequest(BaseModel):
#     definition: str
#     translations: dict
#     word_structure: dict

# class DomainWordCreateRequest(BaseModel):
#     chapter_id: str
#     domain_id: str
#     definition: str
#     translations: dict
#     word_structure: dict
#     is_mwe: bool = False
#     mwe_type: str = None
#     name: str
#     tokens_with_pos: list
class DomainWordUpdateRequest(BaseModel):
    definition: str
    translations: dict
    word_structure: dict

class DomainWordCreateRequest(BaseModel):
    chapter_id: str
    domain_id: str
    definition: str
    translations: dict
    word_structure: dict
    is_mwe: bool = False
    mwe_type: str = None
    name: str
    tokens_with_pos: list


# ====================== FULL SUMMARY ENDPOINTS ====================== #

# ---------------------- GET ALL CHAPTERS ---------------------- #
@app.get("/all-chapters")
async def get_all_chapters():
    try:
        chapters = []
        async for doc in full_summary_collection.find({}):
            chapters.append({
                "chapter_id": doc["chapter_id"],
                "full_summary": doc["full_summary"]
            })
        return {"chapters": chapters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chapters: {str(e)}")

# ---------------------- GET FULL SUMMARY ---------------------- #
@app.get("/full-summary/{chapter_id}")
async def get_full_summary(chapter_id: str):
    doc = await full_summary_collection.find_one({"chapter_id": chapter_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Chapter '{chapter_id}' not found")
    return {"full_summary": doc["full_summary"]}

# ---------------------- BULK REPLACE SUMMARY ---------------------- #
@app.put("/full-summary/replace/{chapter_id}")
async def replace_full_summary(chapter_id: str, data: ReplaceRequest):
    doc = await full_summary_collection.find_one({"chapter_id": chapter_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Chapter '{chapter_id}' not found")
    
    await full_summary_collection.update_one(
        {"chapter_id": chapter_id},
        {"$set": {"full_summary": data.sentences}}
    )
    return JSONResponse(content={
        "message": f"Full summary for chapter '{chapter_id}' updated successfully",
        "new_sentences_count": len(data.sentences)
    })

# ---------------------- PARTIAL EDIT ---------------------- #
@app.put("/full-summary/{chapter_id}")
async def partial_edit_summary(chapter_id: str, data: EditRequest):
    doc = await full_summary_collection.find_one({"chapter_id": chapter_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Chapter '{chapter_id}' not found")
    if data.index < 0 or data.index >= len(doc["full_summary"]):
        raise HTTPException(status_code=400, detail="Invalid index number")
    sentence = doc["full_summary"][data.index]
    if data.replace_text not in sentence:
        raise HTTPException(status_code=400, detail=f"'{data.replace_text}' not found in sentence")
    new_sentence = sentence.replace(data.replace_text, data.with_text)
    doc["full_summary"][data.index] = new_sentence
    await full_summary_collection.update_one(
        {"chapter_id": chapter_id},
        {"$set": {"full_summary": doc["full_summary"]}}
    )
    return JSONResponse(content={
        "message": f"Sentence at index {data.index} partially edited successfully",
        "old_sentence": sentence,
        "new_sentence": new_sentence
    })

# ---------------------- DELETE ---------------------- #
@app.delete("/full-summary/{chapter_id}")
async def delete_summary_sentence(chapter_id: str, data: SummaryRequest):
    doc = await full_summary_collection.find_one({"chapter_id": chapter_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Chapter '{chapter_id}' not found")
    if data.index < 0 or data.index >= len(doc["full_summary"]):
        raise HTTPException(status_code=400, detail="Invalid index number")
    removed_sentence = doc["full_summary"].pop(data.index)
    await full_summary_collection.update_one(
        {"chapter_id": chapter_id},
        {"$set": {"full_summary": doc["full_summary"]}}
    )
    return JSONResponse(content={
        "message": f"Sentence at index {data.index} deleted successfully",
        "deleted_sentence": removed_sentence
    })

# ====================== SECTION SUMMARY ENDPOINTS ====================== #

# ---------------------- GET ALL SECTIONS ---------------------- #
@app.get("/all-sections")
async def get_all_sections():
    try:
        sections = []
        async for doc in section_summary_collection.find({}):
            sections.append({
                "chapter_id": doc["chapter_id"],
                "section_id": doc["section_id"],
                "section_summary": doc["section_summary"]
            })
        return {"sections": sections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sections: {str(e)}")

# ---------------------- GET SECTION SUMMARY ---------------------- #
@app.get("/section-summary/{chapter_id}/{section_id}")
async def get_section_summary(chapter_id: str, section_id: str):
    doc = await section_summary_collection.find_one({
        "chapter_id": chapter_id,
        "section_id": section_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Section '{section_id}' not found for chapter '{chapter_id}'")
    return {"section_summary": doc["section_summary"]}

# ---------------------- BULK REPLACE SECTION SUMMARY ---------------------- #
@app.put("/section-summary/replace/{chapter_id}/{section_id}")
async def replace_section_summary(chapter_id: str, section_id: str, data: SectionReplaceRequest):
    doc = await section_summary_collection.find_one({
        "chapter_id": chapter_id,
        "section_id": section_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Section '{section_id}' not found for chapter '{chapter_id}'")
    
    await section_summary_collection.update_one(
        {"chapter_id": chapter_id, "section_id": section_id},
        {"$set": {"section_summary": data.section_summary}}
    )
    return JSONResponse(content={
        "message": f"Section summary for '{section_id}' in chapter '{chapter_id}' updated successfully",
        "section_id": section_id,
        "chapter_id": chapter_id
    })

# ---------------------- PARTIAL EDIT SECTION SUMMARY ---------------------- #
@app.put("/section-summary/{chapter_id}/{section_id}")
async def partial_edit_section_summary(chapter_id: str, section_id: str, data: SectionEditRequest):
    doc = await section_summary_collection.find_one({
        "chapter_id": chapter_id,
        "section_id": section_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Section '{section_id}' not found for chapter '{chapter_id}'")
    
    section_text = doc["section_summary"]
    if data.replace_text not in section_text:
        raise HTTPException(status_code=400, detail=f"'{data.replace_text}' not found in section summary")
    
    new_section_text = section_text.replace(data.replace_text, data.with_text)
    
    await section_summary_collection.update_one(
        {"chapter_id": chapter_id, "section_id": section_id},
        {"$set": {"section_summary": new_section_text}}
    )
    return JSONResponse(content={
        "message": f"Section summary for '{section_id}' partially edited successfully",
        "old_text": data.replace_text,
        "new_text": data.with_text,
        "section_id": section_id,
        "chapter_id": chapter_id
    })

# ---------------------- DELETE SECTION SUMMARY ---------------------- #
@app.delete("/section-summary/{chapter_id}/{section_id}")
async def delete_section_summary(chapter_id: str, section_id: str):
    doc = await section_summary_collection.find_one({
        "chapter_id": chapter_id,
        "section_id": section_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Section '{section_id}' not found for chapter '{chapter_id}'")
    
    # Instead of deleting the document, we'll clear the section_summary field
    await section_summary_collection.update_one(
        {"chapter_id": chapter_id, "section_id": section_id},
        {"$set": {"section_summary": ""}}
    )
    return JSONResponse(content={
        "message": f"Section summary for '{section_id}' in chapter '{chapter_id}' cleared successfully",
        "section_id": section_id,
        "chapter_id": chapter_id
    })

# ---------------------- CREATE SECTION SUMMARY ---------------------- #
@app.post("/section-summary/{chapter_id}/{section_id}")
async def create_section_summary(chapter_id: str, section_id: str, data: SectionReplaceRequest):
    # Check if section already exists
    existing_doc = await section_summary_collection.find_one({
        "chapter_id": chapter_id,
        "section_id": section_id
    })
    
    if existing_doc:
        raise HTTPException(status_code=400, detail=f"Section '{section_id}' already exists for chapter '{chapter_id}'")
    
    # Create new section document
    await section_summary_collection.insert_one({
        "chapter_id": chapter_id,
        "section_id": section_id,
        "section_summary": data.section_summary
    })
    
    return JSONResponse(content={
        "message": f"Section summary for '{section_id}' in chapter '{chapter_id}' created successfully",
        "section_id": section_id,
        "chapter_id": chapter_id
    }, status_code=201)

# ====================== DOMAIN WORDS ENDPOINTS ====================== #

# ---------------------- PYDANTIC MODELS FOR DOMAIN WORDS ---------------------- #
class DomainWordUpdateRequest(BaseModel):
    definition: str
    translations: dict
    word_structure: dict

class DomainWordCreateRequest(BaseModel):
    chapter_id: str
    domain_id: str
    definition: str
    translations: dict
    word_structure: dict
    is_mwe: bool = False
    mwe_type: str = None
    name: str
    tokens_with_pos: list

# ---------------------- GET ALL DOMAIN WORDS ---------------------- #
@app.get("/all-domain-words")
async def get_all_domain_words():
    try:
        domain_words = []
        async for doc in db["domain_words"].find({}):
            # Convert ObjectId to string and exclude audio_binary field
            domain_word = {
                "_id": str(doc["_id"]),
                "chapter_id": doc.get("chapter_id", ""),
                "domain_id": doc.get("domain_id", ""),
                "definition": doc.get("definition", ""),
                "is_mwe": doc.get("is_mwe", False),
                "mwe_type": doc.get("mwe_type", ""),
                "name": doc.get("name", ""),
                "tokens_with_pos": doc.get("tokens_with_pos", []),
                "translations": doc.get("translations", {}),
                "word_structure": doc.get("word_structure", {})
            }
            domain_words.append(domain_word)
        return {"domain_words": domain_words}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching domain words: {str(e)}")

# ---------------------- GET DOMAIN WORD ---------------------- #
@app.get("/domain-words/{chapter_id}/{domain_id}")
async def get_domain_word(chapter_id: str, domain_id: str):
    doc = await db["domain_words"].find_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Domain word '{domain_id}' not found for chapter '{chapter_id}'")
    
    # Convert ObjectId to string and exclude audio_binary field
    domain_word = {
        "_id": str(doc["_id"]),
        "chapter_id": doc.get("chapter_id", ""),
        "domain_id": doc.get("domain_id", ""),
        "definition": doc.get("definition", ""),
        "is_mwe": doc.get("is_mwe", False),
        "mwe_type": doc.get("mwe_type", ""),
        "name": doc.get("name", ""),
        "tokens_with_pos": doc.get("tokens_with_pos", []),
        "translations": doc.get("translations", {}),
        "word_structure": doc.get("word_structure", {})
    }
    return domain_word

# ---------------------- UPDATE DOMAIN WORD ---------------------- #
@app.put("/domain-words/{chapter_id}/{domain_id}")
async def update_domain_word(chapter_id: str, domain_id: str, data: DomainWordUpdateRequest):
    doc = await db["domain_words"].find_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Domain word '{domain_id}' not found for chapter '{chapter_id}'")
    
    await db["domain_words"].update_one(
        {"chapter_id": chapter_id, "domain_id": domain_id},
        {"$set": {
            "definition": data.definition,
            "translations": data.translations,
            "word_structure": data.word_structure
        }}
    )
    return JSONResponse(content={
        "message": f"Domain word '{domain_id}' updated successfully",
        "domain_id": domain_id,
        "chapter_id": chapter_id
    })

# ---------------------- CREATE DOMAIN WORD ---------------------- #
@app.post("/domain-words/{chapter_id}/{domain_id}")
async def create_domain_word(chapter_id: str, domain_id: str, data: DomainWordCreateRequest):
    # Check if domain word already exists
    existing_doc = await db["domain_words"].find_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    
    if existing_doc:
        raise HTTPException(status_code=400, detail=f"Domain word '{domain_id}' already exists for chapter '{chapter_id}'")
    
    # Create new domain word document
    await db["domain_words"].insert_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id,
        "definition": data.definition,
        "translations": data.translations,
        "word_structure": data.word_structure,
        "is_mwe": data.is_mwe,
        "mwe_type": data.mwe_type,
        "name": data.name,
        "tokens_with_pos": data.tokens_with_pos,
        "audio_binary": None  # You can add audio handling later
    })
    
    return JSONResponse(content={
        "message": f"Domain word '{domain_id}' created successfully",
        "domain_id": domain_id,
        "chapter_id": chapter_id
    }, status_code=201)

# ---------------------- DELETE DOMAIN WORD ---------------------- #
@app.delete("/domain-words/{chapter_id}/{domain_id}")
async def delete_domain_word(chapter_id: str, domain_id: str):
    result = await db["domain_words"].delete_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Domain word '{domain_id}' not found for chapter '{chapter_id}'")
    
    return JSONResponse(content={
        "message": f"Domain word '{domain_id}' deleted successfully",
        "domain_id": domain_id,
        "chapter_id": chapter_id
    })

# ====================== TAXONOMY ENDPOINTS ====================== #

# ---------------------- PYDANTIC MODELS FOR TAXONOMY ---------------------- #
class TaxonomyUpdateRequest(BaseModel):
    domain_name: str
    image_format: str

class TaxonomyCreateRequest(BaseModel):
    chapter_id: str
    domain_id: str
    domain_name: str
    image_format: str
    taxonomy_image: str  # Base64 encoded image data

# ---------------------- GET ALL TAXONOMIES ---------------------- #
@app.get("/all-taxonomies")
async def get_all_taxonomies():
    try:
        taxonomies = []
        async for doc in db["taxonomy"].find({}):
            # Convert ObjectId to string and include image URL
            taxonomy = {
                "_id": str(doc["_id"]),
                "chapter_id": doc.get("chapter_id", ""),
                "domain_id": doc.get("domain_id", ""),
                "domain_name": doc.get("domain_name", ""),
                "image_format": doc.get("image_format", ""),
                "image_url": f"/taxonomy/image/{str(doc['_id'])}"
            }
            taxonomies.append(taxonomy)
        return {"taxonomies": taxonomies}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching taxonomies: {str(e)}")

# ---------------------- GET TAXONOMY IMAGE ---------------------- #
# # ---------------------- GET TAXONOMY IMAGE ---------------------- #
@app.get("/taxonomy/image/{taxonomy_id}")
async def get_taxonomy_image(taxonomy_id: str):
    try:
        # Convert string ID to ObjectId
        from bson import ObjectId
        doc = await db["taxonomy"].find_one({"_id": ObjectId(taxonomy_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Taxonomy image not found")
        
        taxonomy_image = doc.get("taxonomy_image")
        print(f"DEBUG: Image data type: {type(taxonomy_image)}")
        print(f"DEBUG: Image data length: {len(taxonomy_image) if taxonomy_image else 0}")
        
        if not taxonomy_image:
            raise HTTPException(status_code=404, detail="Image data not found")
        
        image_format = doc.get("image_format", "svg").lower()
        
        # FIX: Proper content types for different formats
        content_types = {
            "svg": "image/svg+xml",
            "png": "image/png", 
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "webp": "image/webp"
        }
        
        content_type = content_types.get(image_format, "application/octet-stream")
        
        # FIX: Remove filename from Content-Disposition to prevent downloads
        # Return the binary image data
        return Response(
            content=taxonomy_image,
            media_type=content_type,
            headers={
                "Content-Disposition": "inline",  # FIX: Changed from download to inline
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    except Exception as e:
        print(f"DEBUG: Error in get_taxonomy_image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching taxonomy image: {str(e)}")
    
# ---------------------- GET TAXONOMY IMAGE (Alternative Method) ---------------------- #
@app.get("/taxonomy/image-base64/{taxonomy_id}")
async def get_taxonomy_image_base64(taxonomy_id: str):
    """Alternative endpoint that returns base64 encoded image"""
    try:
        from bson import ObjectId
        import base64  # ADD THIS IMPORT
        
        doc = await db["taxonomy"].find_one({"_id": ObjectId(taxonomy_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Taxonomy image not found")
        
        taxonomy_image = doc.get("taxonomy_image")
        if not taxonomy_image:
            raise HTTPException(status_code=404, detail="Image data not found")
        
        # Convert to base64 regardless of original format
        if isinstance(taxonomy_image, dict) and '$binary' in taxonomy_image:
            binary_data = taxonomy_image['$binary']
            if isinstance(binary_data, dict) and 'base64' in binary_data:
                base64_data = binary_data['base64']
            else:
                base64_data = base64.b64encode(binary_data).decode('utf-8')
        elif isinstance(taxonomy_image, bytes):
            base64_data = base64.b64encode(taxonomy_image).decode('utf-8')
        else:
            base64_data = base64.b64encode(str(taxonomy_image).encode('utf-8')).decode('utf-8')
        
        image_format = doc.get("image_format", "svg")
        
        return {
            "image_base64": base64_data,
            "content_type": f"image/{image_format}",
            "data_url": f"data:image/{image_format};base64,{base64_data}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching taxonomy image: {str(e)}")

# ---------------------- GET TAXONOMY ---------------------- #
@app.get("/taxonomy/{chapter_id}/{domain_id}")
async def get_taxonomy(chapter_id: str, domain_id: str):
    doc = await db["taxonomy"].find_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Taxonomy '{domain_id}' not found for chapter '{chapter_id}'")
    
    # Convert ObjectId to string and include image URL
    taxonomy = {
        "_id": str(doc["_id"]),
        "chapter_id": doc.get("chapter_id", ""),
        "domain_id": doc.get("domain_id", ""),
        "domain_name": doc.get("domain_name", ""),
        "image_format": doc.get("image_format", ""),
        "image_url": f"/taxonomy/image/{str(doc['_id'])}",
        "image_url_base64": f"/taxonomy/image-base64/{str(doc['_id'])}"  # Alternative endpoint
    }
    return taxonomy

# ---------------------- GET TAXONOMY WITH BASE64 IMAGE ---------------------- #
@app.get("/taxonomy-with-image/{chapter_id}/{domain_id}")
async def get_taxonomy_with_image(chapter_id: str, domain_id: str):
    try:
        from bson import ObjectId
        import base64  # ADD THIS IMPORT
        
        doc = await db["taxonomy"].find_one({
            "chapter_id": chapter_id,
            "domain_id": domain_id
        })
        if not doc:
            raise HTTPException(status_code=404, detail=f"Taxonomy '{domain_id}' not found for chapter '{chapter_id}'")
        
        # Convert binary image to base64
        taxonomy_image = doc.get("taxonomy_image")
        image_base64 = None
        if taxonomy_image:
            if isinstance(taxonomy_image, dict) and '$binary' in taxonomy_image:
                binary_data = taxonomy_image['$binary']
                if isinstance(binary_data, dict) and 'base64' in binary_data:
                    image_base64 = binary_data['base64']
                else:
                    image_base64 = base64.b64encode(binary_data).decode('utf-8')
            elif isinstance(taxonomy_image, bytes):
                image_base64 = base64.b64encode(taxonomy_image).decode('utf-8')
            else:
                image_base64 = base64.b64encode(str(taxonomy_image).encode('utf-8')).decode('utf-8')
        
        taxonomy = {
            "_id": str(doc["_id"]),
            "chapter_id": doc.get("chapter_id", ""),
            "domain_id": doc.get("domain_id", ""),
            "domain_name": doc.get("domain_name", ""),
            "image_format": doc.get("image_format", ""),
            "image_base64": image_base64,
            "image_src": f"data:image/{doc.get('image_format', 'svg')};base64,{image_base64}" if image_base64 else None
        }
        return taxonomy
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ---------------------- UPDATE TAXONOMY ---------------------- #
@app.put("/taxonomy/{chapter_id}/{domain_id}")
async def update_taxonomy(chapter_id: str, domain_id: str, data: TaxonomyUpdateRequest):
    doc = await db["taxonomy"].find_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Taxonomy '{domain_id}' not found for chapter '{chapter_id}'")
    
    await db["taxonomy"].update_one(
        {"chapter_id": chapter_id, "domain_id": domain_id},
        {"$set": {
            "domain_name": data.domain_name,
            "image_format": data.image_format
        }}
    )
    return JSONResponse(content={
        "message": f"Taxonomy '{domain_id}' updated successfully",
        "domain_id": domain_id,
        "chapter_id": chapter_id
    })

# ---------------------- UPDATE TAXONOMY IMAGE ---------------------- #
@app.put("/taxonomy/image/{chapter_id}/{domain_id}")
async def update_taxonomy_image(chapter_id: str, domain_id: str, image_data: str):
    """
    Update taxonomy image with base64 encoded image data
    """
    doc = await db["taxonomy"].find_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    if not doc:
        raise HTTPException(status_code=404, detail=f"Taxonomy '{domain_id}' not found for chapter '{chapter_id}'")
    
    try:
        import base64  # ADD THIS IMPORT
        # Decode base64 image data to binary
        binary_image = base64.b64decode(image_data)
        
        await db["taxonomy"].update_one(
            {"chapter_id": chapter_id, "domain_id": domain_id},
            {"$set": {
                "taxonomy_image": binary_image
            }}
        )
        return JSONResponse(content={
            "message": f"Taxonomy image for '{domain_id}' updated successfully",
            "domain_id": domain_id,
            "chapter_id": chapter_id
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

# ---------------------- CREATE TAXONOMY ---------------------- #
@app.post("/taxonomy/{chapter_id}/{domain_id}")
async def create_taxonomy(chapter_id: str, domain_id: str, data: TaxonomyCreateRequest):
    # Check if taxonomy already exists
    existing_doc = await db["taxonomy"].find_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    
    if existing_doc:
        raise HTTPException(status_code=400, detail=f"Taxonomy '{domain_id}' already exists for chapter '{chapter_id}'")
    
    try:
        import base64  # ADD THIS IMPORT
        # Convert base64 image data to binary
        binary_image = base64.b64decode(data.taxonomy_image) if data.taxonomy_image else None
        
        # Create new taxonomy document
        await db["taxonomy"].insert_one({
            "chapter_id": chapter_id,
            "domain_id": domain_id,
            "domain_name": data.domain_name,
            "image_format": data.image_format,
            "taxonomy_image": binary_image
        })
        
        return JSONResponse(content={
            "message": f"Taxonomy '{domain_id}' created successfully",
            "domain_id": domain_id,
            "chapter_id": chapter_id
        }, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

# ---------------------- DELETE TAXONOMY ---------------------- #
@app.delete("/taxonomy/{chapter_id}/{domain_id}")
async def delete_taxonomy(chapter_id: str, domain_id: str):
    result = await db["taxonomy"].delete_one({
        "chapter_id": chapter_id,
        "domain_id": domain_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Taxonomy '{domain_id}' not found for chapter '{chapter_id}'")
    
    return JSONResponse(content={
        "message": f"Taxonomy '{domain_id}' deleted successfully",
        "domain_id": domain_id,
        "chapter_id": chapter_id
    })

# ====================== TAXONOMY DEBUG ENDPOINTS ====================== #

# ---------------------- DEBUG: CHECK DATABASE DATA ---------------------- #
@app.get("/taxonomy-debug/{taxonomy_id}")
async def taxonomy_debug(taxonomy_id: str):
    """Check what's stored in the database"""
    try:
        from bson import ObjectId
        doc = await db["taxonomy"].find_one({"_id": ObjectId(taxonomy_id)})
        
        if not doc:
            return {"error": "Taxonomy not found"}
        
        taxonomy_image = doc.get("taxonomy_image")
        
        return {
            "found": True,
            "domain_name": doc.get("domain_name"),
            "image_format": doc.get("image_format"),
            "image_data_type": type(taxonomy_image).__name__,
            "has_image_data": bool(taxonomy_image),
            "image_data_length": len(taxonomy_image) if taxonomy_image else 0
        }
    except Exception as e:
        return {"error": str(e)}

# ---------------------- DEBUG: TEST IMAGE ENDPOINT ---------------------- #
@app.get("/test-taxonomy-image/{taxonomy_id}")
async def test_taxonomy_image(taxonomy_id: str):
    """Test if image endpoint works"""
    try:
        from bson import ObjectId
        doc = await db["taxonomy"].find_one({"_id": ObjectId(taxonomy_id)})
        
        if not doc:
            return {"status": "error", "message": "Taxonomy not found"}
        
        taxonomy_image = doc.get("taxonomy_image")
        
        return {
            "status": "success",
            "found": True,
            "has_image": bool(taxonomy_image),
            "image_type": type(taxonomy_image).__name__ if taxonomy_image else "None",
            "image_length": len(taxonomy_image) if taxonomy_image else 0
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

import datetime
import hashlib
import secrets

# ====================== AUTHENTICATION ENDPOINTS ====================== #

# ---------------------- PYDANTIC MODELS FOR AUTH ---------------------- #
class UserSignupRequest(BaseModel):
    username: str
    email: str
    password: str
    domain: str 

class UserLoginRequest(BaseModel):
    username: str
    password: str

# ---------------------- SIGNUP ---------------------- #
@app.post("/signup")
async def signup(user_data: UserSignupRequest):
    try:
        # Check if user already exists
        existing_user = await db["users"].find_one({
            "$or": [
                {"username": user_data.username},
                {"email": user_data.email}
            ]
        })
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        # Hash password
        hashed_password = hashlib.sha256(user_data.password.encode()).hexdigest()
        
        # Create new user
        await db["users"].insert_one({
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,
            "domain": user_data.domain,
            "created_at": datetime.datetime.utcnow()
        })
        
        return JSONResponse(content={
            "message": "User created successfully",
            "username": user_data.username
        }, status_code=201)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

# ---------------------- LOGIN ---------------------- #
@app.post("/login")
async def login(user_data: UserLoginRequest):
    try:
        # Hash password
        hashed_password = hashlib.sha256(user_data.password.encode()).hexdigest()
        
        # Find user
        user = await db["users"].find_one({
            "username": user_data.username,
            "password": hashed_password
        })
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Create session token
        session_token = secrets.token_hex(32)
        
        # Store session
        await db["sessions"].insert_one({
            "user_id": str(user["_id"]),
            "username": user["username"],
            "session_token": session_token,
            "created_at": datetime.datetime.utcnow(),
            "expires_at": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        })
        
        return {
            "message": "Login successful",
            "session_token": session_token,
            "username": user["username"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")

# ---------------------- VERIFY SESSION ---------------------- #
@app.get("/verify-session")
async def verify_session(session_token: str):
    try:
        session = await db["sessions"].find_one({
            "session_token": session_token,
            "expires_at": {"$gt": datetime.datetime.utcnow()}
        })
        
        if not session:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        return {
            "valid": True,
            "username": session["username"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying session: {str(e)}")

# ---------------------- LOGOUT ---------------------- #
@app.post("/logout")
async def logout(session_token: str):
    try:
        await db["sessions"].delete_one({"session_token": session_token})
        return {"message": "Logout successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during logout: {str(e)}")