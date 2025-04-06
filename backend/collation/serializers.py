from rest_framework import serializers
from .models import TextVersion, Manuscript, Verse

class VerseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Verse
        fields = ['verse_number', 'verse_text']

class TextVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextVersion
        fields = '__all__'
