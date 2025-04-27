from django.test import TestCase, Client
from rest_framework import status
from rest_framework.test import APIClient
from pymongo import MongoClient
from bson import ObjectId
from .models import Verse, Manuscript
import json
from .collate import extract_differences
from pprint import pprint
from django.urls import reverse
import base64
from unittest.mock import patch
import os
import tempfile
from PIL import Image
import io
from urllib.parse import urlencode


#Neque destituant vos quorundam vaniloquia insinuantium. Ut vis evertant a veritate euangelii quod a me praedicatur.
#neque destituit vos quorundam vaniloquentia insinuantim. ut vos avertant a veritate euangelii quod a me praedicatur.
class DocumentAPITest(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Set up test database with real MongoDB entries"""
        cls.client = APIClient()
        
        # Connect to MongoDB
        cls.client_mongo = MongoClient("mongodb://localhost:27017/") 
        cls.db = cls.client_mongo["document_db"]  
        cls.manuscripts_collection = cls.db["documents"]
        cls.verses_collection = cls.db["verses"]
        # Insert a test manuscript
        cls.manuscript_id = cls.manuscripts_collection.insert_one({
            "filename": "test.docx",
            "metadata": {
                "MS ID:": "Test Manuscript",
                "Other Names:": "TM",
                "Contents:": "Test Content",
                "Date:": "900",
                "Origin:": "Test Origin",
                "Total Folia:": "100",
                "Dimensions:": "200x100 mm",
                "Materials:": "Parchment",
                "Laod. Folia:": "100v-101v",
                "Format Description:": "Single Column"
            },
            "verses": [ 
                ['1', "The cat is grey."],
                ['2', "This is a verse"],
                ['3', "Multiple differences are here."],
                ['4', "Paulus apostolus non ab hominib(us) neq(ue) per homin(ibus) sed per ih(esu)m χρ(istu)m fratrib(us) qui sunt laodice"]
            ]
        }).inserted_id

        cls.manuscript_id2 = cls.manuscripts_collection.insert_one({
            "filename": "test2.docx",
            "metadata": {
                "MS ID:": "Test Manuscript2",
                "Other Names:": "TM",
                "Contents:": "Test Content",
                "Date:": "900",
                "Origin:": "Test Origin",
                "Total Folia:": "100",
                "Dimensions:": "200x100 mm",
                "Materials:": "Parchment",
                "Laod. Folia:": "100v-101v",
                "Format Description:": "Single Column"
            },
            "verses": [ 
                ['1', "The cat is gray."],
                ['2', "This is an extra verse"],
                ['3', "There's multiple differences here"],
                ['4', "Paulus ap(os)t(olu)s n(on) ab ho(min)ib(us). n(eque); p(er) ho(m)i(n)em s(ed); p(er) ih(esu)m χρ(istu)m fr(atr)ib(us). q(ui) s(unt) laodicie."]
            ]
        }).inserted_id


    @classmethod
    def tearDownClass(cls):
        """Clean up test database"""
        cls.verses_collection.delete_many({})
        cls.manuscripts_collection.delete_many({})
        cls.client_mongo.close()


    def test_get_verses(self):
        response = self.client.get(f'/api/verses/{str(self.manuscript_id)}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        verses = response_data.get("verses", [])

        self.assertGreater(len(verses), 0)
        
        self.assertEqual(verses[0], {'verse_number':'1', 'verse_text': "The cat is grey."})
        self.assertEqual(verses[1], {'verse_number':'2', 'verse_text': "This is a verse"})
        self.assertEqual(verses[2], {'verse_number':'3', 'verse_text': "Multiple differences are here."})
        self.assertEqual(verses[3], {'verse_number':'4', 'verse_text': "Paulus apostolus non ab hominib(us) neq(ue) per homin(ibus) sed per ih(esu)m χρ(istu)m fratrib(us) qui sunt laodice"})
        
    def test_collate_verses(self):
        """Test that collating verses from two manuscripts works correctly."""
        # Make a POST request instead of GET
        response = self.client.post(
            '/api/collate/', 
            {
                "base_id": str(self.manuscript_id),
                "comparison_id": str(self.manuscript_id2)
            },
            content_type='application/json'  # Important: tell Django it's JSON
        )

        # Assert the status code is 200
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Parse the response data
        response_data = response.json()

        print("Manuscript 1:")
        pprint({
            '1': "The cat is grey.",
            '2': "This is a verse",
            '3': "Multiple differences are here.",
            '4': "Paulus apostolus non ab hominib(us) neq(ue) per homin(ibus) sed per ih(esu)m χρ(istu)m fratrib(us) qui sunt laodice"
        })

        print("Manuscript 2:")
        pprint({
            '1': "The cat is gray.",
            '2': "This is an extra verse",
            '3': "There's multiple differences here",
            '4': "Paulus ap(os)t(olu)s n(on) ab ho(min)ib(us). n(eque); p(er) ho(m)i(n)em s(ed); p(er) ih(esu)m χρ(istu)m fr(atr)ib(us). q(ui) s(unt) laodicie."
        })
        print('')
        for verse_num, differences in response_data.items():
            print("These are the differences for Verse ", verse_num, ":")
            pprint(differences)
        print(response_data)

class PhylogeneticTreeTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Set up test database with real MongoDB entries"""
        cls.client = APIClient()
        
        # Connect to MongoDB
        cls.client_mongo = MongoClient("mongodb://localhost:27017/") 
        cls.db = cls.client_mongo["document_db"]  
        cls.manuscripts_collection = cls.db["documents"]
        cls.verses_collection = cls.db["verses"]
        cls.manuscript_ids = []

        base_text = "In the beginning was the Word, and the Word was with God, and the Word was God."

        variants = [
            [  # MS1 (base text)
                ["1:1", base_text],
                ["1:2", "He was in the beginning with God."],
                ["1:3", "All things were made through him."]
            ],
            [  # MS2
                ["1:1", base_text.replace("Word was God", "Word is God")],
                ["1:2", "He was in the beginning with God."],
                ["1:3", "All things were created through him."]
            ],
            [  # MS3
                ["1:1", base_text.replace("Word was with God", "Word remained with God")],
                ["1:2", "In the beginning, he was with God."],
                ["1:3", "All things were made through him."]
            ],
            [  # MS4
                ["1:1", base_text.replace("Word was with God", "Word remained with God")],
                ["1:2", "In the beginning, he was with the Lord."],
                ["1:3", "Everything was made through him."]
            ],
            [  # MS5
                ["1:1", base_text],
                ["1:3", "All things were made by him."]
            ]
        ]

        for i, verses in enumerate(variants, start=1):
            ms_id = cls.manuscripts_collection.insert_one({
                "filename": "test2.docx",
                "metadata": {
                    "MS ID:": str(i),
                    "Other Names:": f"MS{i}",
                    "Contents": "Test Content",
                    "Date": "900",
                    "Origin": "Test Origin",
                    "Total Folia": "100",
                    "Dimensions": "200x100 mm",
                    "Materials": "Parchment",
                    "Laod. Folia": "100v-101v",
                    "Format Description": "Single Column"
                },
                "verses": verses
            }).inserted_id
            cls.manuscript_ids.append(ms_id)

            from collation.phylogenetic import PhylogeneticTreeBuilder
            cls.builder = PhylogeneticTreeBuilder()
            PhylogeneticTreeBuilder.db = cls.db
            PhylogeneticTreeBuilder.documents = cls.manuscripts_collection

    @classmethod
    def tearDownClass(cls):
        """Clean up test database"""
        cls.verses_collection.delete_many({})
        cls.manuscripts_collection.delete_many({})
        cls.client_mongo.close()



    def test_phylogenetic_tree_generation(self):
        """Test that the phylogenetic tree generator produces a valid tree."""
        # Call the API endpoint
        #response = self.client.get(reverse('generate_phylogenetic_tree'))
        response = self.client.get(f'/api/generate_phylogenetic_tree/')
        # Check response status
        self.assertEqual(response.status_code, 200)
        
        # Parse JSON response
        data = json.loads(response.content)
        
        # Check that we got tree data
        self.assertIn('tree_image', data)
        self.assertIn('manuscript_count', data)
        
        # Check that all manuscripts were included
        self.assertEqual(data['manuscript_count'], len(self.manuscript_ids))
        
        # Verify that the image data is valid by trying to decode and open it
        image_data = base64.b64decode(data['tree_image'])
        image = Image.open(io.BytesIO(image_data))
        self.assertIsNotNone(image)
        
        # Clean up
        #image.close()

    def test_newick_tree_format(self):

        response = self.client.get('/api/generate_phylogenetic_tree/?format2=newick')
        self.assertEqual(response.status_code, 200)  # This is what fails now
        print("Response content:", response.content)
        data = response.json()

        for i in range(1, 6):
            self.assertIn(f"MS{i}", data['newick_tree'])
        
        # Check response status
        self.assertEqual(response.status_code, 200)
        
        # Parse JSON response
        data = json.loads(response.content)
        
        # Check that we got Newick data
        self.assertIn('newick_tree', data)
        self.assertIn('manuscript_count', data)
        
        # Check that the Newick string is properly formatted (ends with semicolon)
        self.assertTrue(data['newick_tree'].endswith(';'))
        
        # Check that all manuscripts are in the Newick string
        for i in range(1, 6):
            self.assertIn(f"MS{i}", data['newick_tree'])

    def test_distance_matrix(self):
        """Test the distance matrix calculation."""
        # Add distance_matrix endpoint if it doesn't exist
        from django.urls import path
        from collation import views
        
        # First check if the endpoint function exists
        if hasattr(views, 'get_distance_matrix'):
            # Add URL pattern if not already in urlpatterns
            from django.urls import get_resolver
            resolver = get_resolver()
            if 'distance-matrix' not in [p.pattern.regex.pattern for p in resolver.url_patterns]:
                from django.urls.resolvers import URLPattern
                from django.urls.resolvers import RegexPattern
                resolver.url_patterns.append(
                    URLPattern(RegexPattern(r'^distance-matrix/$'), 
                               views.get_distance_matrix, 
                               name='get_distance_matrix')
                )
            
            # Call the distance matrix API
            response = self.client.get(
                reverse('get_distance_matrix') + 
                f'?ms_ids={self.manuscript_ids[0]}&ms_ids={self.manuscript_ids[1]}&ms_ids={self.manuscript_ids[2]}'
            )
            
            # Check response status
            self.assertEqual(response.status_code, 200)
            
            # Parse JSON response
            data = json.loads(response.content)
            
            # Check that we got matrix data
            self.assertIn('distance_matrix', data)
            self.assertIn('labels', data)
            
            # Check matrix dimensions
            matrix = data['distance_matrix']
            self.assertEqual(len(matrix), 3)  # 3x3 matrix for 3 manuscripts
            self.assertEqual(len(matrix[0]), 3)
            
            # Check that diagonal is zero (distance to self)
            self.assertEqual(matrix[0][0], 0)
            self.assertEqual(matrix[1][1], 0)
            self.assertEqual(matrix[2][2], 0)
            
            # Check that distances are symmetric
            self.assertEqual(matrix[0][1], matrix[1][0])
            self.assertEqual(matrix[0][2], matrix[2][0])
            self.assertEqual(matrix[1][2], matrix[2][1])