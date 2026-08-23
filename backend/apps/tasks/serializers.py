from rest_framework import serializers
from .models import Task
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TaskSerializer(serializers.ModelSerializer):
    assignee_details = UserSerializer(source='assignee', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title',
            'assignee', 'assignee_details',
            'status', 'priority', 'due_date',
            'completed_at', 'created_at', 'updated_at',
        ]
