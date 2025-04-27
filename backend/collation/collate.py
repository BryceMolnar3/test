import collatex
import json
import re


def clean_verse_text(text):
    """Clean text."""
    #take away parantheses
    text = re.sub(r"[()]", "", text)

    #remove punctuation, keeps latin text
    text = re.sub(r"[^\w\s\u0370-\u03FF]", "", text)

    #lowercase and normalize whitespace
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()

    return text

def collate_texts(texts):
    """Collate two manuscripts and create an alignment table."""
    alignment_table = collatex.Collation()
    
    for i, text in enumerate(texts):
        alignment_table.add_plain_witness(f"w{i+1}", clean_verse_text(text))

    return collatex.collate(alignment_table, segmentation=False, near_match=True, output="json")


def extract_differences(collated_results):
    """
    Takes the collated results and extracts differences.
    """
    differences_by_verse = {}

    for verse_number, collation_json in collated_results.items():
        if isinstance(collation_json, str):
            data = json.loads(collation_json)
        else:
            data = collation_json
        table = data.get("table", [])
        witnesses = data.get("witnesses", [])
        verse_differences = []
        tokens = {}
        for column in table:
            if not column or len(column) < 2:
                continue
            for i, cell in enumerate(column):
                if cell:
                    token = cell[0]
                    sigil = token["_sigil"]
                    normalized = token.get("n", "")
                    if i not in tokens:
                        tokens[i] = []
                    tokens[i].append({sigil: normalized})

        # If not all witnesses agree
        for num, words in tokens.items():
            if len(words) < len(witnesses):
                verse_differences.append({
                        "position": num,
                        "differences": words
                    })
            else: 
                words_at_position = {}
                for witness_word in words:
                    words_at_position.update(witness_word)
                
                # Get unique words across all witnesses
                unique_words = set(words_at_position.values())

                # If there's more than one unique word, we have a difference
                if len(unique_words) > 1:
                    verse_differences.append({
                        "position": num,
                        "differences": words_at_position
                    })
        differences_by_verse[verse_number] = verse_differences
    return differences_by_verse