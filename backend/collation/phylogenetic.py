import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for server rendering
import matplotlib.pyplot as plt
import numpy as np
import json
from scipy.cluster.hierarchy import linkage, dendrogram
from scipy.spatial.distance import squareform
from io import BytesIO
import base64
from pymongo import MongoClient
from bson import ObjectId
import re
from collections import defaultdict


class PhylogeneticTreeBuilder:
    def __init__(self, mongo_uri='mongodb://localhost:27017/', db_name='document_db'):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.documents = self.db['documents']

    def get_manuscript_info(self, ms_ids):
        manuscripts = {}
        for ms_id in ms_ids:
            try:
                doc = self.documents.find_one({"_id": ObjectId(ms_id)})
                if doc:
                    sigla = doc.get('metadata', {}).get('Sigla:') or doc.get('metadata', {}).get('Other Names:') or doc.get('metadata', {}).get('MS ID:')
                    if not sigla:
                        sigla = doc.get('filename', str(ms_id)[-6:])
                    manuscripts[str(ms_id)] = {
                        'sigla': sigla,
                        'ms_id': str(ms_id)
                    }
            except Exception as e:
                print(f"Error getting info for manuscript {ms_id}: {e}")
                manuscripts[str(ms_id)] = {
                    'sigla': f"MS-{str(ms_id)[-6:]}",
                    'ms_id': str(ms_id)
                }
        return manuscripts

    def calculate_distance_matrix(self, collation_data, manuscripts):
        ms_ids = list(manuscripts.keys())
        n = len(ms_ids)
        ms_to_idx = {ms_id: idx for idx, ms_id in enumerate(ms_ids)}
        distance_matrix = np.zeros((n, n))
        comparison_counts = np.zeros((n, n))

        for verse_number, collation_result in collation_data.items():
            try:
                if isinstance(collation_result, str):
                    collation_result = json.loads(collation_result)

                if 'witnesses' not in collation_result:
                    continue

                witnesses = collation_result['witnesses']
                alignment_table = collation_result.get('table', [])
                if not alignment_table:
                    continue

                for i, ms_id1 in enumerate(ms_ids):
                    for j in range(i+1, len(ms_ids)):
                        ms_id2 = ms_ids[j]
                        w1_idx = i if i < len(witnesses) else -1
                        w2_idx = j if j < len(witnesses) else -1

                        if w1_idx >= 0 and w2_idx >= 0:
                            differences = 0
                            total_tokens = 0

                            for row in alignment_table:
                                if w1_idx < len(row) and w2_idx < len(row):
                                    w1_token = row[w1_idx]
                                    w2_token = row[w2_idx]

                                    if w1_token is not None and w2_token is not None:
                                        if w1_token != w2_token:
                                            differences += 1
                                        total_tokens += 1

                            if total_tokens > 0:
                                distance = differences / total_tokens
                                distance_matrix[i, j] += distance
                                distance_matrix[j, i] += distance
                                comparison_counts[i, j] += 1
                                comparison_counts[j, i] += 1
            except Exception as e:
                print(f"Error processing verse {verse_number}: {e}")

        with np.errstate(divide='ignore', invalid='ignore'):
            distance_matrix = np.divide(distance_matrix, comparison_counts, out=np.zeros_like(distance_matrix), where=comparison_counts!=0)

        mask = comparison_counts == 0
        if np.any(mask):
            valid_distances = distance_matrix[~mask & ~np.eye(n, dtype=bool)]
            if len(valid_distances) > 0:
                avg_distance = np.mean(valid_distances)
                distance_matrix[mask] = avg_distance

        np.fill_diagonal(distance_matrix, 0)
        labels = [manuscripts[ms_id]['sigla'] for ms_id in ms_ids]
        return distance_matrix, labels

    def parse_collation_results(self, collation_results):
        parsed_results = {}
        for verse_number, result in collation_results.items():
            if isinstance(result, str):
                try:
                    parsed_results[verse_number] = json.loads(result)
                except json.JSONDecodeError:
                    print(f"Could not parse JSON for verse {verse_number}")
            else:
                parsed_results[verse_number] = result
        return parsed_results

    def generate_tree(self, collation_results, ms_ids, method='average', output_format='base64'):
        manuscripts = self.get_manuscript_info(ms_ids)
        valid_ms_ids = [ms_id for ms_id in ms_ids if ms_id in manuscripts]

        if len(valid_ms_ids) < 3:
            raise ValueError("At least three valid manuscripts are required to build a tree")

        parsed_results = self.parse_collation_results(collation_results)
        distance_matrix, labels = self.calculate_distance_matrix(parsed_results, manuscripts)
        condensed_dist = squareform(distance_matrix)
        linked = linkage(condensed_dist, method=method)

        fig_width = max(10, len(labels) * 0.5)
        fig_height = max(7, len(labels) * 0.3)
        plt.figure(figsize=(fig_width, fig_height))

        dendrogram(
            linked,
            orientation='right',
            labels=labels,
            distance_sort='descending',
            show_leaf_counts=True
        )
        plt.title(f'Manuscript Relationship Tree ({len(labels)} manuscripts)')
        plt.xlabel('Distance')
        plt.tight_layout()

        buffer = BytesIO()
        plt.savefig(buffer, format=output_format, dpi=150, bbox_inches='tight')
        plt.close()
        buffer.seek(0)

        if output_format == 'base64':
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
        else:
            return buffer.getvalue()

    def create_newick_tree(self, collation_results, ms_ids, method='average'):
        manuscripts = self.get_manuscript_info(ms_ids)
        valid_ms_ids = [ms_id for ms_id in ms_ids if ms_id in manuscripts]

        if len(valid_ms_ids) < 3:
            raise ValueError("At least three valid manuscripts are required to build a tree")

        parsed_results = self.parse_collation_results(collation_results)
        distance_matrix, labels = self.calculate_distance_matrix(parsed_results, manuscripts)
        condensed_dist = squareform(distance_matrix)
        linked = linkage(condensed_dist, method=method)

        def to_newick(node, labels, Z, n):
            if node < n:
                return labels[node]
            else:
                node_idx = int(node - n)
                left = int(Z[node_idx, 0])
                right = int(Z[node_idx, 1])
                dist_left = Z[node_idx, 2] / 2
                dist_right = Z[node_idx, 2] / 2
                return f"({to_newick(left, labels, Z, n)}:{dist_left},{to_newick(right, labels, Z, n)}:{dist_right})"

        n = len(labels)
        newick = to_newick(2*n-2, labels, linked, n) + ";"
        return newick
