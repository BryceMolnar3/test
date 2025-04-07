from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import TextVersion
from .serializers import TextVersionSerializer, VerseSerializer
from .collate import collate_texts
from django.http import JsonResponse, HttpResponse
from pymongo import MongoClient
from rest_framework import status
from django.conf import settings
from bson import ObjectId
from .collate import collate_texts, extract_differences
from .phylogenetic import PhylogeneticTreeBuilder
import json

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
    """Collate verses from all available manuscripts in the database."""
    try:
        # Get all manuscript IDs
        all_manuscripts = list(documents.find({}, {"_id": 1}))
        manuscript_ids = [str(doc["_id"]) for doc in all_manuscripts]

        if len(manuscript_ids) < 2:
            return JsonResponse({"error": "At least two manuscripts are required for comparison."}, status=400)

        collated_verses = {}

        # Fetch verses from each manuscript
        for ms_id in manuscript_ids:
            manuscript = documents.find_one({"_id": ObjectId(ms_id)})
            if not manuscript:
                continue  # Skip if not found

            verses = manuscript.get("verses", [])
            for verse in verses:
                if len(verse) < 2:
                    continue
                verse_number = verse[0]
                verse_text = verse[1]
                if verse_number not in collated_verses:
                    collated_verses[verse_number] = []
                collated_verses[verse_number].append(verse_text)

        # Collate each verse
        collated_results = {}
        for verse_number, texts in collated_verses.items():
            try:
                collated_results[verse_number] = collate_texts(texts)
            except Exception as e:
                print(f"Error collating verse {verse_number}: {e}")
                collated_results[verse_number] = {"error": f"Collation failed: {str(e)}"}

        return JsonResponse(extract_differences(collated_results), safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


api_view(['GET'])
def generate_phylogenetic_tree(request):
    """Generate a phylogenetic tree from all available manuscripts."""
    method = request.GET.get('method', 'average')
    output_format = request.GET.get('format2', 'base64')
    try:
        # Get all manuscript IDs from the database
        all_manuscripts = list(documents.find({}, {"_id": 1}))
        manuscript_ids = [str(doc["_id"]) for doc in all_manuscripts]
        
        if len(manuscript_ids) < 3:
            return JsonResponse({"error": "At least three manuscripts are required in the database to build a phylogenetic tree."}, status=400)
        
        # First, collate the manuscripts
        collated_verses = {}

        # Fetch verses from each manuscript
        for ms_id in manuscript_ids:
            manuscript = documents.find_one({"_id": ObjectId(ms_id)})
            
            if not manuscript:
                continue  # Skip if manuscript not found
            
            verses = manuscript.get("verses", [])
            for verse in verses:
                if len(verse) < 2:  # Check if verse has both number and text
                    continue
                    
                verse_number = verse[0]
                verse_text = verse[1]
                if verse_number not in collated_verses:
                    collated_verses[verse_number] = []
                
                # Store both text and manuscript ID
                collated_verses[verse_number].append({
                    "text": verse_text,
                    "ms_id": ms_id
                })

        # Collate each verse
        collated_results = {}
        for verse_number, verse_data in collated_verses.items():
            try:
                # Only collate if we have multiple manuscripts and differences
                if len(verse_data) > 1:
                    # Extract just the text for collation
                    texts = [item["text"] for item in verse_data]
                    
                    # Only collate if texts are different
                    if len(set(texts)) > 1:
                        # Get manuscript IDs for this verse
                        verse_ms_ids = [item["ms_id"] for item in verse_data]
                        
                        # Collate the texts and store result with manuscript IDs
                        collation_result = collate_texts(texts)
                        if collation_result:
                            # Store both the collation result and the manuscript IDs that contributed
                            collated_results[verse_number] = {
                                "result": collation_result,
                                "ms_ids": verse_ms_ids
                            }
            except Exception as e:
                print(f"Error collating verse {verse_number}: {e}")
        
        print("Processed Collation Results:")
        for verse_num, result in collated_results.items():
            print(verse_num, json.dumps(result["result"], indent=2))

        # Build the phylogenetic tree
        tree_builder = PhylogeneticTreeBuilder()
        
        # Extract just the collation results
        processed_results = {k: v["result"] for k, v in collated_results.items()}

        
        if output_format == 'newick':
            newick_tree = tree_builder.create_newick_tree(processed_results, manuscript_ids, method=method)
            return JsonResponse({
                "newick_tree": newick_tree,
                "manuscript_count": len(manuscript_ids)
            })

        elif output_format == 'base64':
            tree_image = tree_builder.generate_tree(processed_results, manuscript_ids, method=method, output_format='base64')
            return JsonResponse({
                "tree_image": tree_image,
                "manuscript_count": len(manuscript_ids)
            })

        elif output_format in ['png', 'svg']:
            tree_image = tree_builder.generate_tree(processed_results, manuscript_ids, method=method, output_format=output_format)
            return HttpResponse(tree_image, content_type=f'image/{output_format}')

        else:
            return JsonResponse({"error": f"Unsupported format: {output_format}"}, status=400)

        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@api_view(['GET'])
def get_distance_matrix(request):
    """Get the distance matrix for a set of manuscripts."""
    manuscript_ids = request.GET.getlist('ms_ids')
    
    if len(manuscript_ids) < 2:
        return JsonResponse({"error": "At least two manuscript IDs are required to calculate distances."}, status=400)
    
    try:
        # First, collate the manuscripts
        collated_verses = {}

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

        # Collate each verse
        collated_results = {}
        for verse_number, texts in collated_verses.items():
            try:
                if len(set(texts)) > 1:  # Only collate if there are differences
                    collated_results[verse_number] = collate_texts(texts)
            except Exception as e:
                print(f"Error collating verse {verse_number}: {e}")
        
        # Calculate distance matrix
        tree_builder = PhylogeneticTreeBuilder()
        manuscripts = tree_builder.get_manuscript_info(manuscript_ids)
        distance_matrix, labels = tree_builder.calculate_distance_matrix(collated_results, manuscripts)
        
        # Convert to list format for JSON serialization
        matrix_list = distance_matrix.tolist()
        
        return JsonResponse({
            "distance_matrix": matrix_list,
            "labels": labels
        })
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)