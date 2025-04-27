from django.db import models

class Manuscript(models.Model):
    ms_id = models.CharField(max_length=255)
    sigla = models.CharField(max_length=10, unique=True)
    other_names = models.CharField(max_length=255)
    total_folia = models.IntegerField()
    laod_folia = models.CharField(max_length=50)
    dimensions = models.CharField(max_length=50)
    place_of_origin = models.CharField(max_length=255)
    materials = models.CharField(max_length=100)
    format_description = models.CharField(max_length=100)
    date = models.CharField(max_length=50)
    image_src = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.sigla} - {self.ms_id}"

class Verse(models.Model):
    manuscript = models.ForeignKey(Manuscript, related_name='verses', on_delete=models.CASCADE)
    verse_number = models.IntegerField()
    verse_text = models.TextField()

    class Meta:
        unique_together = ('manuscript', 'verse_number')

    def __str__(self):
        return f"{self.manuscript.sigla} - Verse {self.verse_number}"

# Create your models here.
class TextVersion(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    version_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - v{self.version_number}"

class WordComparison(models.Model):
    verse_number = models.IntegerField()
    word1 = models.CharField(max_length=255)
    word2 = models.CharField(max_length=255)
    position = models.IntegerField()
    manuscript_sigla = models.CharField(max_length=255)

    def __str__(self):
        return f"Verse {self.verse_number}: {self.word1} vs {self.word2}"

class ComparisonResult(models.Model):
    word_comparison = models.ForeignKey(WordComparison, on_delete=models.CASCADE, related_name='comparison_results')
    is_significant = models.BooleanField()
    variation_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comparison {self.id}: {self.variation_type}"