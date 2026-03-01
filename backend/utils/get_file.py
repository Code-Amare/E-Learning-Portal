import cloudinary.utils
import time


def get_private_image_url(public_id, expires_in=300):
    return cloudinary.utils.cloudinary_url(
        public_id,
        resource_type="image",
        type="authenticated",
        sign_url=True,
        secure=True,
        expires_at=int(time.time()) + expires_in,
    )[0]
