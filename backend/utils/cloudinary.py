import cloudinary
import cloudinary.uploader
from django.conf import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_STORAGE["CLOUD_NAME"],
    api_key=settings.CLOUDINARY_STORAGE["API_KEY"],
    api_secret=settings.CLOUDINARY_STORAGE["API_SECRET"],
)


def upload_private_file(file, folder="users/profiles", resource_type="image"):
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type=resource_type,
        access_mode="private",  # makes it private
    )
    return result["public_id"]
