from rest_framework import serializers
from .models import Setting


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = ["allow_profile_change", "allow_profile_pic_change"]
