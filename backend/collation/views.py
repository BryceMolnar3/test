from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import TextVersion
from .models import Verse, Manuscript
from .serializers import TextVersionSerializer, VerseSerializer
from .collate import collate_texts
from django.http import JsonResponse
from pymongo import MongoClient
from rest_framework import status
from django.conf import settings
from bson import ObjectId
from .collate import collate_texts


client = MongoClient('localhost', 27017)
db = client.document_db
documents = db['documents']

@api_view(['GET'])
def get_versions(request):
    versions = TextVersion.objects.all()
    serializer = TextVersionSerializer(versions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_version(request):
    serializer = TextVersionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# @api_view(['POST'])
# def compare_texts(request):
#     texts = request.data.get("texts", [])
#     result = collate_texts(texts)
#     return Response({"collation": result})

# @api_view(['GET'])
# def get_verses(request):
#     """Fetch all verses."""
#     verses = Verse.objects.all()
#     serializer = VerseSerializer(verses, many=True)
#     return Response(serializer.data)

# @api_view(['GET'])
# def get_verse(request, verse_id):
#     """Fetch a specific verse by ID."""
#     verse = get_object_or_404(Verse, id=verse_id)
#     serializer = VerseSerializer(verse)
#     return Response(serializer.data)

# @api_view(['POST'])
# def create_verse(request):
#     """Create a new verse."""
#     serializer = VerseSerializer(data=request.data)
#     if serializer.is_valid():
#         serializer.save()
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_verses(request, ms_id):
    """Fetch all verses for a specific manuscript."""
    try:
        manuscript = documents.find_one({"_id": ObjectId(ms_id)})
        
        if not manuscript:
            return JsonResponse({"error": "Manuscript not found"}, status=404)

        verses = manuscript.get("verses", [])  # Get verses list or empty list if not found
        verse_data = [{"verse_number": verse[0], "verse_text": verse[1]} for verse in verses]

        return JsonResponse({"manuscript_id": ms_id, "verses": verse_data}, safe=False)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



@api_view(['GET'])
def get_verse(request, ms_id, verse_number):
    """Fetch a specific verse from a manuscript."""
    try:
        manuscript = documents.find_one({"_id": ObjectId(ms_id)})
        if not manuscript:
            return JsonResponse({"error": "Manuscript not found"}, status=404)

        verses = manuscript.get("verses", [])

        # Find the verse by its number
        verse = next(({"verse_number": v[0], "verse_text": v[1]} for v in verses if v[0] == verse_number), None)
        
        if not verse:
            return JsonResponse({"error": "Verse not found"}, status=404)

        return JsonResponse(verse, safe=False)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def collate_manuscripts(request):
    """Collate verses from multiple manuscripts."""
    manuscript_ids = request.GET.getlist('ms_ids')  # Get list of manuscript IDs from query parameters

    if len(manuscript_ids) < 2:
        return JsonResponse({"error": "At least two manuscript IDs are required for comparison."}, status=400)

    collated_verses = {}

    try:
        # Fetch verses from each manuscript
        for ms_id in manuscript_ids:
            manuscript = documents.find_one({"_id": ObjectId(ms_id)})
            
            if not manuscript:
                return JsonResponse({"error": f"Manuscript {ms_id} not found"}, status=404)
            
            verses = manuscript.get("verses", [])
            for verse in verses:
                verse_number = verse[0]
                verse_text = verse[1]
                if verse_number not in collated_verses:
                    collated_verses[verse_number] = []
                collated_verses[verse_number].append(verse_text)

        collated_results = {}
        for verse_number, texts in collated_verses.items():
            try:
                collated_results[verse_number] = collate_texts(texts)
            except Exception as e:
                print(f"Error collating verse {verse_number}: {e}")  # Debug
                collated_results[verse_number] = {"error": f"Collation failed: {str(e)}"}
        # Return the collated verses
        return JsonResponse(collated_results, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
