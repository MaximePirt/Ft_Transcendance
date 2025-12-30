import json
from pathlib import Path
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


def load_questions(language='fr'):
    """Charge les questions depuis le fichier JSON"""
    questions_file = Path(__file__).resolve().parent.parent / 'Questions' / f'{language}.questions.json'
    
    try:
        with open(questions_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None


@api_view(['GET'])
def get_questions(request):
    """Retourne toutes les questions"""
    language = request.query_params.get('lang', 'fr')
    questions = load_questions(language)
    
    if questions is None:
        return Response(
            {'error': 'Questions not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response(questions)


@api_view(['GET'])
def get_categories(request):
    """Retourne les catégories de questions disponibles"""
    language = request.query_params.get('lang', 'fr')
    questions = load_questions(language)
    
    if questions is None:
        return Response(
            {'error': 'Questions not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    categories = {}
    
    if 'Quiz' in questions and len(questions['Quiz']) > 0:
        quiz_data = questions['Quiz'][0]
        for category, items in quiz_data.items():
            categories[category] = len(items)
    
    return Response(categories)
