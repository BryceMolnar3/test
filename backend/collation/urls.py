from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

urlpatterns = [
    path('collate/', views.collate_manuscripts, name='collate_manuscripts'),
    path('versions/', views.get_versions, name='get_versions'),
    path('versions/add/', views.add_version, name='add_version'),
    path('verses/<str:ms_id>/', views.get_verses, name='get_verses'),
    path('verses/<str:ms_id>/<str:verse_number>/', views.get_verse, name='get_verse'),
    path('generate_phylogenetic_tree/', views.generate_phylogenetic_tree, name='generate_phylogenetic_tree'),
    path('distance-matrix/', views.get_distance_matrix, name='get_distance_matrix'),
]

urlpatterns = format_suffix_patterns(urlpatterns, allowed=['json'])
