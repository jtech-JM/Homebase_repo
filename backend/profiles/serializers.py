from rest_framework import serializers
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'bio', 'avatar', 'verified', 'date_of_birth', 'address', 'major', 'graduation_year']
        read_only_fields = ['verified']
