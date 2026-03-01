from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()



class Setting(models.Model):
    allow_profile_change = models.BooleanField(default=False)
    allow_profile_pic_change = models.BooleanField(default=False)
