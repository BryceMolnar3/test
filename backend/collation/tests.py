from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from pymongo import MongoClient
from bson import ObjectId
from .models import Verse, Manuscript
import json

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
                ['2', "This is another verse."]
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
                ['2', "This is not another verse."]
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
        self.assertEqual(verses[1], {'verse_number':'2', 'verse_text': "This is another verse."})
        
    def test_get_verse(self):
        # Use the actual verse ID created in setUp or test data
        response = self.client.get(f'/api/verses/{str(self.manuscript_id)}/1/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        verse_text = response_data.get("verse_text")
        self.assertEqual(verse_text, "The cat is grey.")  
    
    def test_collate_verses(self):
        """Test that collating verses from two manuscripts works correctly."""
        response = self.client.get(f'/api/collate/?ms_ids={str(self.manuscript_id)}&ms_ids={str(self.manuscript_id2)}')

        # Assert the status code is 200
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Parse the response data
        response_data = response.json()
        
        formatted_collated_data = {key: json.loads(value) for key, value in response_data.items()}

        # Pretty print
        print(json.dumps(formatted_collated_data, indent=4))
