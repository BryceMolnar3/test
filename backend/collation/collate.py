import collatex



def collate_texts(texts):
    alignment_table = collatex.Collation()
    
    for i, text in enumerate(texts):
        alignment_table.add_plain_witness(f"w{i+1}", text)

    return collatex.collate(alignment_table, output="json")