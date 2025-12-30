"""
URL configuration for quiz_backend project.
"""
from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/questions/', views.get_questions, name='get_questions'),
    path('api/categories/', views.get_categories, name='get_categories'),
]
