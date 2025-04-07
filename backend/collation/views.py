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
import re

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

@api_view(['GET'])
def generate_phylogenetic_tree(request):
    """Generate a phylogenetic tree from all available manuscripts."""
    method = request.GET.get('method', 'average')
    output_format = request.GET.get('format2', 'base64')
    try:
        print("\n=== GENERATING PHYLOGENETIC TREE ===")
        print(f"Method: {method}, Format: {output_format}")
        
        # Get all manuscript IDs from the database
        all_manuscripts = list(documents.find({}))
        manuscript_ids = [str(doc["_id"]) for doc in all_manuscripts]
        
        print(f"Found {len(manuscript_ids)} manuscripts")
        print(f"Manuscript IDs: {manuscript_ids}")
        
        if len(manuscript_ids) < 3:
            print("ERROR: Not enough manuscripts (minimum 3 required)")
            return JsonResponse({"error": "At least three manuscripts are required in the database to build a phylogenetic tree."}, status=400)
        
        # First, collate the manuscripts
        collated_verses = {}
        manuscript_verse_counts = {ms_id: 0 for ms_id in manuscript_ids}

        # Fetch verses from each manuscript
        print("\n=== COLLECTING VERSES FROM MANUSCRIPTS ===")
        for i, ms_id in enumerate(manuscript_ids):
            manuscript = documents.find_one({"_id": ObjectId(ms_id)})
            
            if not manuscript:
                print(f"WARNING: Manuscript {ms_id} not found in database")
                continue
            
            ms_name = manuscript.get('filename', f"Manuscript-{ms_id[-6:]}")
            print(f"\nProcessing manuscript {i+1}/{len(manuscript_ids)}: {ms_name}")
            
            verses = manuscript.get("verses", [])
            print(f"  Found {len(verses)} verses in manuscript")
            
            for verse in verses:
                if len(verse) < 2:
                    continue
                    
                verse_number = verse[0]
                verse_text = verse[1]
                
                # Debug first few verses of each manuscript
                if manuscript_verse_counts[ms_id] < 3:
                    print(f"  Verse {verse_number}: '{verse_text[:50]}{'...' if len(verse_text) > 50 else ''}'")
                
                if verse_number not in collated_verses:
                    collated_verses[verse_number] = []
                
                collated_verses[verse_number].append({
                    "text": verse_text,
                    "ms_id": ms_id
                })
                
                manuscript_verse_counts[ms_id] += 1
            
            print(f"  Added {manuscript_verse_counts[ms_id]} verses from this manuscript")

        # Summarize verse collection
        print("\n=== VERSE COLLECTION SUMMARY ===")
        total_unique_verses = len(collated_verses)
        print(f"Total unique verse numbers: {total_unique_verses}")
        
        # Count how many manuscripts contain each verse
        verse_coverage = {}
        for verse_num, verse_data in collated_verses.items():
            verse_coverage[verse_num] = len(verse_data)
        
        # Print verses with the most and least coverage
        sorted_verses = sorted(verse_coverage.items(), key=lambda x: x[1], reverse=True)
        print(f"Top 5 verses by manuscript coverage:")
        for verse_num, count in sorted_verses[:5]:
            print(f"  Verse {verse_num}: {count}/{len(manuscript_ids)} manuscripts")
            
        print(f"Bottom 5 verses by manuscript coverage:")
        for verse_num, count in sorted_verses[-5:]:
            print(f"  Verse {verse_num}: {count}/{len(manuscript_ids)} manuscripts")

        # Collate each verse
        print("\n=== COLLATING VERSES ===")
        collated_results = {}

        def clean_text(text):
            # Lowercase
            text = text.lower()
            # Remove all punctuation including (), [], etc.
            text = re.sub(r'[^\w\s]', '', text)
            return text

        for verse_number, verse_data in collated_verses.items():
            # Clean the text
            for item in verse_data:
                item["text"] = clean_text(item["text"])
        for verse_number, verse_data in collated_verses.items():
            try:
                # Only collate if we have multiple manuscripts
                if len(verse_data) > 1:
                    # Extract just the text for collation
                    texts = [item["text"] for item in verse_data]
                    ms_ids_for_verse = [item["ms_id"] for item in verse_data]
                    
                    # Debug output for a few verses
                    if len(collated_results) < 2 or verse_number in ['1', '2', '10']:
                        print(f"\nCollating verse {verse_number} with {len(texts)} manuscript versions:")
                        for i, (text, ms_id) in enumerate(zip(texts, ms_ids_for_verse)):
                            ms_name = next((m.get('filename', f"MS-{ms_id[-6:]}") for m in all_manuscripts if str(m["_id"]) == ms_id), f"MS-{ms_id[-6:]}")
                            print(f"  MS {i+1}: '{text[:50]}{'...' if len(text) > 50 else ''}' ({ms_name})")
                    
                    # Only collate if texts are different
                    if len(set(texts)) > 1:
                        # Perform collation
                        collation_result = collate_texts(texts)
                        if collation_result:
                            collated_results[verse_number] = collation_result
                            
                            # Debug collation structure for first verse
                            if verse_number == '1':
                                print("\nSample collation result structure:")
                                if isinstance(collation_result, str):
                                    collation_json = json.loads(collation_result)
                                else:
                                    collation_json = collation_result
                                print(f"  Witnesses: {collation_json.get('witnesses', [])}")
                                print(f"  Table columns: {len(collation_json.get('table', []))}")
                                
                                # Print a sample of the alignment table
                                sample_table = collation_json.get('table', [])[:3]
                                for i, column in enumerate(sample_table):
                                    print(f"  Column {i+1} ({len(column)} cells):")
                                    for j, cell in enumerate(column):
                                        if cell:
                                            cell_text = json.dumps(cell)[:100] + ('...' if len(json.dumps(cell)) > 100 else '')
                                            print(f"    Cell {j}: {cell_text}")
                    else:
                        print(f"  Skipping verse {verse_number}: All {len(texts)} texts are identical")
                else:
                    print(f"  Skipping verse {verse_number}: Only {len(verse_data)} manuscript version")
            except Exception as e:
                print(f"ERROR collating verse {verse_number}: {e}")
                import traceback
                traceback.print_exc()
                
        print(f"\nSuccessfully collated {len(collated_results)} verses with differences")
        
        # Examine collated results
        print("\n=== COLLATION RESULTS SUMMARY ===")
        print(f"Verses with successful collation: {sorted(list(collated_results.keys()))}")
        
        # Build the phylogenetic tree
        print("\n=== BUILDING PHYLOGENETIC TREE ===")
        tree_builder = PhylogeneticTreeBuilder()
        
        # Get manuscript info
        manuscripts_info = tree_builder.get_manuscript_info(manuscript_ids)
        print(f"Retrieved info for {len(manuscripts_info)} manuscripts")
        
        # Debug manuscript info
        print("\nManuscript labels to be used in tree:")
        for ms_id, info in manuscripts_info.items():
            print(f"  {ms_id[-6:]}: {info['sigla']}")
        
        print(f"\nGenerating tree with {method} linkage method, {output_format} format")
        
        if output_format == 'newick':
            print("Creating Newick format tree...")
            newick_tree = tree_builder.create_newick_tree(collated_results, manuscript_ids, method=method)
            print(f"Newick tree result: {newick_tree[:100]}...")
            return JsonResponse({
                "newick_tree": newick_tree,
                "manuscript_count": len(manuscript_ids)
            })

        elif output_format == 'base64':
            print("Creating base64 encoded tree image...")
            tree_image = tree_builder.generate_tree(collated_results, manuscript_ids, method=method, output_format='base64')
            print(f"Generated base64 image of length {len(tree_image)}")
            return JsonResponse({
                "tree_image": tree_image,
                "manuscript_count": len(manuscript_ids)
            })

        elif output_format in ['png', 'svg']:
            print(f"Creating {output_format} image...")
            tree_image = tree_builder.generate_tree(collated_results, manuscript_ids, method=method, output_format=output_format)
            print(f"Generated {output_format} image of size {len(tree_image)} bytes")
            return HttpResponse(tree_image, content_type=f'image/{output_format}')

        else:
            print(f"ERROR: Unsupported format {output_format}")
            return JsonResponse({"error": f"Unsupported format: {output_format}"}, status=400)
        
    except Exception as e:
        print(f"CRITICAL ERROR in generate_phylogenetic_tree: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
    
@api_view(['GET'])
def get_distance_matrix():
    """Get the distance matrix for all manuscripts in the database."""
    try:
        # Get all manuscripts from the database
        all_manuscripts = list(db.documents.find({}))
        manuscript_ids = [str(ms["_id"]) for ms in all_manuscripts]
        for ms in all_manuscripts:
            print("Loaded MS:", ms.get("filename"))
        if len(manuscript_ids) < 2:
            return JsonResponse({"error": "At least two manuscripts are required to calculate distances."}, status=400)

        # Build up verse data for collation
        collated_verses = {}
        for manuscript in all_manuscripts:
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

        # Calculate the distance matrix
        tree_builder = PhylogeneticTreeBuilder()
        manuscripts = tree_builder.get_manuscript_info(manuscript_ids)
        distance_matrix, labels = tree_builder.calculate_distance_matrix(collated_results, manuscripts)

        return JsonResponse({
            "distance_matrix": distance_matrix.tolist(),
            "labels": labels
        })
        
    except Exception as e:
        print("🔥 Error in get_distance_matrix:", e)
        return JsonResponse({"error": str(e)}, status=500)
