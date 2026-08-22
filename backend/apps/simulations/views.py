from rest_framework.decorators import api_view
from rest_framework.response import Response
from engine.context.state import get_project_engineering_state

@api_view(['GET'])
def project_state(request, project_id):
    state = get_project_engineering_state(project_id)
    if "error" in state:
        return Response(state, status=404)
    return Response(state)
