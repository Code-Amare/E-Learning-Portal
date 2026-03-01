from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class SimpleUserAdmin(UserAdmin):
    model = User
    readonly_fields = ("password",)
    list_display = ("email", "full_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("email", "full_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "full_name", "password")}),
        (
            "Permissions",
            {
                "fields": (
                    "role",
                    "is_staff",
                    "is_active",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "password1",
                    "password2",
                    "role",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # hash password only on creation
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)


admin.site.register(User, SimpleUserAdmin)
