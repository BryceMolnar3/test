import os
from collectdata import (
    extract_metadata,
    extract_logical_middle_column_rows,
    extract_logical_left_column_rows,
    split_text_into_verses,
    match_verses,
    send_to_mongodb
)
from phylogenetic import PhylogeneticTreeBuilder

def process_docx_files(folder_path="/assets"):
    processed_ids = []
    for filename in os.listdir(folder_path):
        if filename.endswith(".docx"):
            file_path = os.path.join(folder_path, filename)
            try:
                # Extract manuscript data
                metadata = extract_metadata(file_path)
                middle_rows = extract_logical_middle_column_rows(file_path)
                left_rows = extract_logical_left_column_rows(file_path)

                # Determine where the verse text lives
                if len(middle_rows) == 7:
                    middle_verses = middle_rows[3]
                elif len(middle_rows) == 8:
                    middle_verses = middle_rows[4]
                elif len(middle_rows) == 9:
                    middle_verses = middle_rows[5]
                else:
                    raise ValueError(f"Unexpected number of logical rows: {len(middle_rows)}")

                # Split and match verses
                verses = split_text_into_verses(middle_verses)
                matched_verses = match_verses(left_rows, verses)

                # Package and send to MongoDB
                document_data = {
                    "filename": filename,
                    "metadata": metadata,
                    "verses": matched_verses
                }
                doc_id = send_to_mongodb(document_data)
                processed_ids.append(str(doc_id))
                print(f"[✓] {filename} inserted with ID: {doc_id}")

            except Exception as e:
                print(f"[!] Failed to process {filename}: {e}")
    return processed_ids

def generate_phylogenetic_tree(manuscript_ids):
    try:
        builder = PhylogeneticTreeBuilder()
        from bson import ObjectId
        all_docs = list(builder.documents.find({
            "_id": {"$in": [ObjectId(ms_id) for ms_id in manuscript_ids]}
        }))
        if len(all_docs) < 3:
            raise ValueError("At least 3 manuscripts are required to generate a phylogenetic tree.")

        collated_verses = {}
        for doc in all_docs:
            ms_id = str(doc["_id"])
            for verse in doc.get("verses", []):
                if len(verse) < 2:
                    continue
                verse_number, verse_text = verse
                collated_verses.setdefault(verse_number, []).append({"text": verse_text, "ms_id": ms_id})

        collated_results = {}
        for verse_number, verse_data in collated_verses.items():
            texts = [entry["text"] for entry in verse_data]
            if len(set(texts)) > 1:
                from collate import collate_texts
                try:
                    collated_results[verse_number] = collate_texts(texts)
                except Exception as e:
                    print(f"Collation failed for verse {verse_number}: {e}")

        tree_img_base64 = builder.generate_tree(collated_results, manuscript_ids)
        print("[✓] Phylogenetic tree generated successfully.")
        return tree_img_base64

    except Exception as e:
        print(f"[!] Failed to generate tree: {e}")

if __name__ == "__main__":
    ids = process_docx_files("assets")
    if len(ids) >= 3:
        tree = generate_phylogenetic_tree(ids)
        # You could save this to a file or display it depending on your context
        with open("phylogenetic_tree.png", "wb") as f:
            import base64
            f.write(base64.b64decode(tree))
            print("[✓] Tree saved as phylogenetic_tree.png")
    else:
        print("[!] Not enough manuscripts to generate a tree.")
