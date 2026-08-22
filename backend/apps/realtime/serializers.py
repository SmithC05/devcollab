from rest_framework import serializers
from .models import EngineEvent, Notification
from django.contrib.auth.models import User

class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class EngineEventSerializer(serializers.ModelSerializer):
    actor_details = UserSimpleSerializer(source='actor', read_only=True)
    
    class Meta:
        model = EngineEvent
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
