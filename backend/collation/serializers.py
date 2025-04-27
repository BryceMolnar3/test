from rest_framework import serializers
from .models import TextVersion, Manuscript, Verse, WordComparison, ComparisonResult

class VerseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Verse
        fields = ['verse_number', 'verse_text']

class ManuscriptSerializer(serializers.ModelSerializer):
    verses = VerseSerializer(many=True, read_only=True)

    class Meta:
        model = Manuscript
        fields = '__all__'

class TextVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextVersion
        fields = '__all__'

class WordComparisonSerializer(serializers.ModelSerializer):
    verseNumber = serializers.IntegerField(source='verse_number')
    manuscriptSigla = serializers.CharField(source='manuscript_sigla')
    class Meta:
        model = WordComparison
        fields = fields = ['verseNumber', 'word1', 'word2', 'position', 'manuscriptSigla']

class ComparisonResultSerializer(serializers.ModelSerializer):
    word_comparison = serializers.PrimaryKeyRelatedField(queryset=WordComparison.objects.all())

    class Meta:
        model = ComparisonResult
        fields = ['word_comparison', 'is_significant', 'variation_type', 'timestamp']
