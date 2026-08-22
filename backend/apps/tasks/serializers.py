from rest_framework import serializers
from .models import Task, TaskDependency, Comment
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TaskSerializer(serializers.ModelSerializer):
    assignee_details = UserSerializer(source='assignee', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'assignee', 'assignee_details',
            'status', 'priority', 'position', 'due_date', 'created_by', 'created_by_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by']

class CommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'author_details', 'content', 'created_at', 'updated_at']
        read_only_fields = ['author']
