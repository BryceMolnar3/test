# Generated by Django 5.1.7 on 2025-04-27 22:26

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collation', '0004_alter_comparisonresult_word_comparison'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comparisonresult',
            name='word_comparison',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comparison_results', to='collation.wordcomparison'),
        ),
    ]
