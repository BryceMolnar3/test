from django.urls import path
from . import views

urlpatterns = [
    path('collate/', views.collate_manuscripts, name='collate_manuscripts'),
    path('versions/', views.get_versions, name='get_versions'),
    path('versions/add/', views.add_version, name='add_version'),
     path('verses/<str:ms_id>/', views.get_verses, name='get_verses'),
    path('verses/<str:ms_id>/<str:verse_number>/', views.get_verse, name='get_verse'),
] 