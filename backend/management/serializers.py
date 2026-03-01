from rest_framework import serializers
from .models import Language, Framework, Setting


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["id", "name", "color", "code"]


class FrameworkSerializer(serializers.ModelSerializer):
    language = LanguageSerializer(read_only=True)
    language_id = serializers.PrimaryKeyRelatedField(
        queryset=Language.objects.all(), source="language", write_only=True
    )

    class Meta:
        model = Framework
        fields = ["id", "name", "language", "language_id"]


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = ["allow_profile_change", "allow_profile_pic_change"]
