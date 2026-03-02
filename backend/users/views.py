from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.middleware.csrf import get_token
from .models import VerifyEmail, ChangePasswordViaEmail, Profile
from django.contrib.auth import get_user_model
from django.db import transaction
from utils.mail import send_email
from django.contrib.auth import authenticate
from .serializers import UserSerializer, ProfileSerializer, UserInverseSerializer
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.core import signing
from asgiref.sync import async_to_sync
from utils.notif import notify_user
from utils.auth import JWTCookieAuthentication
from django.db.models import Avg, Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from management.models import Setting
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from courses.models import UserCourseProgress, Course
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q

IS_TWOFA_MANDATORY = settings.IS_TWOFA_MANDATORY
BASE_URL = settings.BASE_URL

User = get_user_model()

EMAIL = settings.EMAIL


class GetUserView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_authenticated:
            return Response(
                {"user": UserInverseSerializer(user).data}, status=status.HTTP_200_OK
            )
        return Response(
            {"detail": "User is not authenticated."}, status=status.HTTP_400_BAD_REQUEST
        )


class GetProfileView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserInverseSerializer(request.user)
        return Response({"user": serializer.data}, status=status.HTTP_200_OK)


class SendVerificationCodeView(APIView):

    def post(self, request):

        email = request.data.get("email", "").strip()
        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"error": "Invalid Email."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        VerifyEmail.objects.filter(user=user).delete()
        email_verif = VerifyEmail.objects.create(user=user)

        html_content = f"""
<div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:8px;
    font-family:Arial, Helvetica, sans-serif;
    box-shadow:0 4px 10px rgba(0,0,0,0.1);
    overflow:hidden;
    border:1px solid #e5e7eb;
">
    <!-- Header -->
    <div style="
        background:#4f46e5;
        color:#ffffff;
        padding:20px;
        text-align:center;
    ">
        <h2 style="margin:0;font-weight:600;">CSSS IT Club</h2>
    </div>

    <!-- Body -->
    <div style="padding:30px;color:#1f2937;">
        <p style="margin-top:0;">
            Hello <strong>{user.full_name}</strong> 👋,
        </p>

        <p style="color:#4b5563;">
            You requested to verify your email address.
            Use the verification code below:
        </p>

        <!-- Verification Code -->
        <div style="
            margin:24px 0;
            text-align:center;
            font-size:28px;
            font-weight:bold;
            letter-spacing:4px;
            color:#4f46e5;
            background:#eef2ff;
            padding:14px 0;
            border-radius:6px;
        ">
            {email_verif.code}
        </div>

        <!-- Danger note -->
        <div style="
            margin-top:20px;
            padding:12px 14px;
            background:rgba(71, 45, 55, 0.3);
            border-left:4px solid #dc2626;
            border-radius:4px;
            color:#1f2937;
            font-size:14px;
        ">
            <strong style="color:#dc2626;">⚠️ Important:</strong>
            Do <strong>not share</strong> this verification code with anyone.
        </div>

        <p style="margin-top:26px;">
            Regards,<br>
            <strong>CSSS IT Club</strong>
        </p>
    </div>

    <!-- Footer -->
    <div style="
        background:#f9fafb;
        padding:12px;
        text-align:center;
        font-size:12px;
        color:#6b7280;
        border-top:1px solid #e5e7eb;
    ">
        If you did not request this email, you can safely ignore it.
    </div>
</div>
"""

        try:
            send_email(
                to_email=email,
                subject="Verify your email address",
                html_content=html_content,
                sender_name="CSSS IT Club",
            )

        except Exception as e:
            return Response(
                {"detail": f"Unable to send the code. {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Verification code sent successfully."},
            status=status.HTTP_200_OK,
        )


class VerifyCodeView(APIView):
    def post(self, request):
        data = request.data
        email = data.get("email", "").strip()
        code = data.get("code", "").strip()

        # Check if data is being sent from the front-end
        if not code and not email:
            return Response(
                {"detail": "Code and Email are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif not email:
            return Response(
                {"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        elif not code:
            return Response(
                {"error": "Code is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get user from email
        user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"error": "Invalid email."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Check if verification code sent before
        email_ver = VerifyEmail.objects.filter(user=user).first()

        if not email_ver:
            return Response(
                {"error": "Verificaiton code has not been sent yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(email_ver.code) != str(code):
            return Response(
                {"error": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if email_ver.is_expired():
            email_ver.delete()
            return Response(
                {"error": "Code expired."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                user.is_active = True
                user.email_verified = True
                if IS_TWOFA_MANDATORY:
                    user.twofa_enabled = True
                email_ver.delete()
                user.save()
            refresh = RefreshToken.for_user(user)

            response = Response(
                {"user": UserSerializer(user).data},
                status=status.HTTP_200_OK,
            )

            response.set_cookie(
                "access",
                str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=60 * 15,
            )
            response.set_cookie(
                "refresh",
                str(refresh),
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=60 * 60 * 24 * 7,
            )

            csrf_token = get_token(request)
            response.set_cookie(
                "csrftoken",
                csrf_token,
                httponly=False,
                secure=True,
                samesite="Lax",
            )

            return response
        except Exception as e:
            return Response(
                {"detail": f"Something went wrong.{str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LoginView(APIView):
    def post(self, request):
        # Get and clean credentials
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()

        # Validate required fields
        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate user
        user = authenticate(request, email=email, password=password)

        if not user:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Handle 2FA if enabled
        if getattr(settings, "IS_TWOFA_MANDATORY", False) or getattr(
            user, "twofa_enabled", False
        ):
            return self._handle_twofa(user, email)

        # Generate tokens and set cookies
        return self._generate_auth_response(user, request)

    def _handle_twofa(self, user, email):
        """Handle Two-Factor Authentication flow"""

        # Remove old verification codes
        VerifyEmail.objects.filter(user=user).delete()

        # Create new verification code
        email_verif = VerifyEmail.objects.create(user=user)

        html_content = f"""
        <div style="
            max-width:600px;
            margin:40px auto;
            background:#ffffff;
            border-radius:8px;
            font-family:Arial, Helvetica, sans-serif;
            box-shadow:0 4px 10px rgba(0,0,0,0.1);
            overflow:hidden;
            border:1px solid #e5e7eb;
        ">
            <!-- Header -->
            <div style="
                background:#4f46e5;
                color:#ffffff;
                padding:20px;
                text-align:center;
            ">
                <h2 style="margin:0;font-weight:600;">CSSS IT Club</h2>
            </div>

            <!-- Body -->
            <div style="padding:30px;color:#1f2937;">
                <p style="margin-top:0;">
                    Hello <strong>{user.full_name}</strong> 👋,
                </p>

                <p style="color:#4b5563;">
                    You requested to verify your email address.
                    Use the verification code below:
                </p>

                <!-- Verification Code -->
                <div style="
                    margin:24px 0;
                    text-align:center;
                    font-size:28px;
                    font-weight:bold;
                    letter-spacing:4px;
                    color:#4f46e5;
                    background:#eef2ff;
                    padding:14px 0;
                    border-radius:6px;
                ">
                    {email_verif.code}
                </div>

                <!-- Danger note -->
                <div style="
                    margin-top:20px;
                    padding:12px 14px;
                    background:rgba(71, 45, 55, 0.3);
                    border-left:4px solid #dc2626;
                    border-radius:4px;
                    color:#1f2937;
                    font-size:14px;
                ">
                    <strong style="color:#dc2626;">⚠️ Important:</strong>
                    Do <strong>not share</strong> this verification code with anyone.
                </div>

                <p style="margin-top:26px;">
                    Regards,<br>
                    <strong>CSSS IT Club</strong>
                </p>
            </div>

            <!-- Footer -->
            <div style="
                background:#f9fafb;
                padding:12px;
                text-align:center;
                font-size:12px;
                color:#6b7280;
                border-top:1px solid #e5e7eb;
            ">
                If you did not request this email, you can safely ignore it.
            </div>
        </div>
        """

        try:
            send_email(
                to_email=email,
                subject="Verify your email address",
                html_content=html_content,
                sender_name="CSSS IT Club",
            )
        except Exception as e:
            print(str(e))
            return Response(
                {
                    "error": "Unable to send the verification code.",
                    "email_sent": False,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": "Verification code sent successfully.",
                "verify_email": True,
            },
            status=status.HTTP_200_OK,
        )

    def _generate_auth_response(self, user, request):
        """Generate JWT tokens and set cookies"""
        refresh = RefreshToken.for_user(user)

        response = Response(
            {"user": UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )

        # Set access token cookie
        response.set_cookie(
            "access",
            str(refresh.access_token),
            httponly=True,
            secure=True,
            samesite="Lax",
            max_age=60 * 15,  # 15 mintues
        )

        # Set refresh token cookie
        response.set_cookie(
            "refresh",
            str(refresh),
            httponly=True,
            secure=True,
            samesite="Lax",
            max_age=60 * 60 * 24 * 7,  # 7 days
        )

        # Set CSRF token
        csrf_token = get_token(request)
        response.set_cookie(
            "csrftoken",
            csrf_token,
            httponly=False,
            secure=True,
            samesite="Lax",
        )

        return response


class RegisterView(APIView):
    def post(self, request):
        email = request.data.get("email", "").strip()
        full_name = request.data.get("full_name", "").strip()
        grade = str(request.data.get("grade", "")).strip().upper()
        section = request.data.get("section", "").strip()
        phone_number = request.data.get("phone_number", "").strip()
        password = request.data.get("password", "").strip()

        # -------------------------
        # Required fields validation
        # -------------------------
        if not email or not full_name or not password:
            return Response(
                {"error": "Email, full name and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # -------------------------
        # Check duplicate email
        # -------------------------
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------
        # Email format validation
        # -------------------------

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "Invalid email format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -------------------------
        # Password validation
        # -------------------------
        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {"error": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    full_name=full_name,
                    password=password,
                )

                Profile.objects.create(
                    user=user,
                    grade=grade,
                    section=section,
                    phone_number=phone_number,
                )

                # Remove old codes
                VerifyEmail.objects.filter(user=user).delete()

                # Create new verification
                email_verif = VerifyEmail.objects.create(user=user)

                html_content = f"""
                <div style="max-width:600px;margin:40px auto;background:#ffffff;
                    border-radius:8px;font-family:Arial, Helvetica, sans-serif;
                    box-shadow:0 4px 10px rgba(0,0,0,0.1);
                    overflow:hidden;border:1px solid #e5e7eb;">

                    <div style="background:#4f46e5;color:#ffffff;padding:20px;text-align:center;">
                        <h2 style="margin:0;font-weight:600;">CSSS IT Club</h2>
                    </div>

                    <div style="padding:30px;color:#1f2937;">
                        <p>Hello <strong>{user.full_name}</strong> 👋,</p>

                        <p>Welcome! Please verify your email using the code below:</p>

                        <div style="margin:24px 0;text-align:center;font-size:28px;
                            font-weight:bold;letter-spacing:4px;color:#4f46e5;
                            background:#eef2ff;padding:14px 0;border-radius:6px;">
                            {email_verif.code}
                        </div>

                        <div style="margin-top:20px;padding:12px 14px;
                            background:rgba(71, 45, 55, 0.3);
                            border-left:4px solid #dc2626;border-radius:4px;
                            font-size:14px;">
                            <strong style="color:#dc2626;">⚠️ Important:</strong>
                            Do not share this verification code with anyone.
                        </div>

                        <p style="margin-top:26px;">
                            Regards,<br><strong>CSSS IT Club</strong>
                        </p>
                    </div>

                    <div style="background:#f9fafb;padding:12px;text-align:center;
                        font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
                        If you did not request this email, you can safely ignore it.
                    </div>
                </div>
                """

                send_email(
                    to_email=email,
                    subject="Verify your email address",
                    html_content=html_content,
                    sender_name="CSSS IT Club",
                )

        except Exception:
            return Response(
                {"error": "Registration failed. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": "Registration successful. Verification code sent.",
                "verify_email": True,
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response(
            {"message": "Logged out successfully."}, status=status.HTTP_200_OK
        )

        response.delete_cookie("access")
        response.delete_cookie("refresh")
        response.delete_cookie("csrftoken")
        return response


class RefreshTokenView(APIView):

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token missing"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)

            response = Response({"success": True}, status=status.HTTP_200_OK)
            response.set_cookie(
                "access",
                str(token.access_token),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=60 * 15,
                path="/",
            )

            response.set_cookie(
                "refresh",
                str(token),
                httponly=True,
                secure=True,
                samesite="None",
                max_age=60 * 60 * 24 * 7,
                path="/",
            )
            return response
        except TokenError:
            return Response(
                {"detail": "Invalid or expired refresh token", "refresh": True},
                status=status.HTTP_401_UNAUTHORIZED,
            )


@method_decorator(csrf_protect, name="dispatch")
class UserDeleteView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            user = request.user
            user.delete()

            response = Response(
                {"message": f"'{user.full_name}' deleted successfully"},
                status=status.HTTP_200_OK,
            )

            response.delete_cookie("access")
            response.delete_cookie("refresh")
            response.delete_cookie("csrftoken")
            return response

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_protect, name="dispatch")
class EditProfileView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        setting, created = Setting.objects.get_or_create(id=1)
        if setting.allow_profile_pic_change:
            profile_pic_file = request.FILES.get("profile_pic")
            if not profile_pic_file:
                return Response(
                    {"error": "Only profile picture can be updated."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = UserSerializer(
                user,
                data={"profile_pic": profile_pic_file},  # only send profile_pic
                partial=True,
                context={"request": request},
            )

            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"user": serializer.data},
                    status=status.HTTP_200_OK,
                )

            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not setting.allow_profile_change and not request.user.is_staff:
            return Response(
                {"error": "You are not allowed to edit your profile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        with transaction.atomic():
            profile, created = Profile.objects.get_or_create(
                user=user,
                defaults={
                    "grade": 10,
                    "section": "A",
                    "field": "frontend",
                    "account": "N/A",
                    "phone_number": "0000000000",
                },
            )
            profile_serializer = ProfileSerializer(
                profile,
                data=request.data,
                partial=True,
                context={"request": request},
            )
            serializer = UserSerializer(
                user,
                data=request.data,
                partial=True,
                context={"request": request},
            )

            if serializer.is_valid() and profile_serializer.is_valid():
                serializer.save()
                profile_serializer.save()
                return Response(
                    {"user": serializer.data, "profile": profile_serializer.data},
                    status=status.HTTP_200_OK,
                )

        errors = {**serializer.errors, **profile_serializer.errors}

        return Response(
            {"errors": errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


@method_decorator(csrf_protect, name="dispatch")
class PasswordChangeView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")

        if not new_password or not current_password:
            return Response(
                {"error": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.check_password(current_password):
            return Response(
                {"error": "The current password is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.check_password(new_password):
            return Response(
                {"error": "New password cannot match the current password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        async_to_sync(notify_user)(
            recipient=request.user,
            title=f"Password change.",
            description=f"Password changed successfully.",
            code="success",
            is_push_notif=True,
        )
        return Response(
            {"message": "Password changed successfully."}, status=status.HTTP_200_OK
        )


@method_decorator(csrf_protect, name="dispatch")
class PasswordChangeViaEmailRequestView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        email = user.email

        ChangePasswordViaEmail.objects.filter(user=user).delete()

        change_pass = ChangePasswordViaEmail.objects.create(user=user)
        signed_code = signing.dumps(
            {
                "code": change_pass.code,
                "user_id": user.id,
            }
        )

        reset_url = f"{BASE_URL}/password/reset/{signed_code}/"

        html_content = f"""
        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:8px;font-family:Arial,Helvetica,sans-serif;box-shadow:0 4px 10px rgba(0,0,0,0.1);overflow:hidden;border:1px solid #e5e7eb;">

    <!-- Header -->
    <div style="background:#4f46e5;color:#ffffff;padding:20px;text-align:center;">
        <h2 style="margin:0;font-weight:600;">CSSS IT Club</h2>
    </div>

    <!-- Body -->
    <div style="padding:30px;color:#1f2937;">

        <p style="margin-top:0;margin-bottom:16px;">
            Hello <strong>{user.full_name}</strong>,
        </p>

        <p style="color:#4b5563;line-height:1.6;margin:0 0 20px 0;">
            We received a request to reset the password for your account.
            Click the button below to continue. If you did not request a password reset,
            you can safely ignore this email.
        </p>

        <!-- Button -->
        <div style="text-align:center;margin:32px 0;">
            <a href="{reset_url}"
               style="display:inline-block;padding:14px 30px;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:6px;">
                Reset Your Password
            </a>
        </div>

        <p style="color:#4b5563;line-height:1.6;margin:0 0 16px 0;">
            If the button does not work, you may use the verification code below:
        </p>

        <!-- Verification Code -->
        <div style="margin:24px 0;text-align:center;font-size:28px;font-weight:bold;letter-spacing:4px;color:#4f46e5;background:#eef2ff;padding:16px 0;border-radius:6px;">
            {change_pass.code}
        </div>

        <!-- Security Notice -->
        <div style="margin-top:20px;padding:12px 14px;background:#fde8e8;border-left:4px solid #dc2626;border-radius:4px;color:#1f2937;font-size:14px;line-height:1.5;">
            <strong style="color:#dc2626;">⚠️ Security Notice</strong><br>
            Do <strong>not</strong> share this code or link with anyone.
            Our team will never ask for your password or verification code.
        </div>

        <p style="margin-top:26px;margin-bottom:0;">
            Regards,<br>
            <strong>CSSS IT Club</strong>
        </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:12px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
        This password reset link and verification code will expire in 5 minutes for your security.
    </div>

</div>

        """

        try:
            send_email(
                to_email=email,
                subject="Password Change Verification Code",
                html_content=html_content,
                sender_name="CSSS IT Club",
            )

        except Exception as e:
            return Response(
                {"detail": f"Unable to send the verification code. {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Password change verification code sent successfully."},
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_protect, name="dispatch")
class ConfPasswordChangeViaEmailView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, signed_inst):
        try:
            change_pass_dic = signing.loads(signed_inst)
        except signing.BadSignature:
            return Response(
                {"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        code = change_pass_dic["code"]
        user_id = change_pass_dic["user_id"]
        user = request.user
        if not user_id == user.id:
            return Response(
                {"error": "You are not allowed to perform this action."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            user = User.objects.get(id=user_id)
            change_pass = ChangePasswordViaEmail.objects.get(user=user, code=code)
        except ChangePasswordViaEmail.DoesNotExist:
            return Response(
                {"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        if change_pass.is_expired():
            return Response(
                {"error": "This action has been expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "You can change your password now.",
                "signed_inst": signed_inst,
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_protect, name="dispatch")
class PasswordChangeViaEmailView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        signed_inst = request.data.get("signed_inst", "")
        new_password = request.data.get("new_password", "")

        try:
            change_pass_dic = signing.loads(signed_inst)
        except signing.BadSignature:
            return Response(
                {"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        code = change_pass_dic["code"]
        user_id = change_pass_dic["user_id"]
        user = request.user
        if not user_id == user.id:
            return Response(
                {"error": "You are not allowed to perform this action."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            user = User.objects.get(id=user_id)
            change_pass = ChangePasswordViaEmail.objects.get(user=user, code=code)
        except ChangePasswordViaEmail.DoesNotExist:
            return Response(
                {"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST
            )

        if change_pass.is_expired():
            return Response(
                {"error": "This action has been expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.check_password(new_password):
            return Response(
                {"error": "New password cannot match the current password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user.set_password(new_password)
            user.save()
            change_pass.delete()
            async_to_sync(notify_user)(
                recipient=request.user,
                title=f"Password change.",
                description=f"Password changed successfully.",
                code="success",
                is_push_notif=True,
            )

        return Response({"message": "Successfully set your new password"})


@method_decorator(csrf_protect, name="dispatch")
class PasswordChangeViaCodeView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", None)
        new_password = request.data.get("new_password", "")

        user = request.user
        change_pass = ChangePasswordViaEmail.objects.filter(user=user).first()
        if not change_pass:
            return Response(
                {"error": "Request to change password hasn't been sent yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if change_pass.is_expired():
            return Response(
                {"error": "Code has been expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not change_pass.code == int(code):
            return Response(
                {"error": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST
            )

        if user.check_password(new_password):
            return Response(
                {"error": "New password cannot match the current password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            user.set_password(new_password)
            user.save()
            change_pass.delete()
            async_to_sync(notify_user)(
                recipient=request.user,
                title=f"Password change.",
                description=f"Password changed successfully.",
                code="success",
                is_push_notif=True,
            )

        return Response({"message": "Successfully set your new password"})


@method_decorator(csrf_protect, name="dispatch")
class EnableTwoFaView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.twofa_enabled:
            return Response(
                {"warning": "Two factor authentication is already enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.twofa_enabled = True
        user.save()
        return Response(
            {
                "message": "Two factor authentication has been enabled.",
                "twofa_enabled": True,
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_protect, name="dispatch")
class DisableTwoFaView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if IS_TWOFA_MANDATORY:
            return Response(
                {"error": "Two factor authentication can't be disabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.twofa_enabled:
            return Response(
                {"warning": "Two factor authentication is already disabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.twofa_enabled = False
        user.save()
        return Response(
            {
                "message": "Two factor authentication has been disabled.",
                "twofa_enabled": False,
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_protect, name="dispatch")
class ToggleNotificationView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        is_notif_enabled = user.notif_enabled

        user.notif_enabled = not is_notif_enabled
        user.save()
        return Response(
            {
                "message": f'Notification {"Enabled" if not is_notif_enabled else "Disabled"}',
                "notif_enabled": not is_notif_enabled,
            }
        )


@method_decorator(csrf_protect, name="dispatch")
class TogglePushNotificationView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        is_push_notif_enabled = user.push_notif_enabled

        user.push_notif_enabled = not is_push_notif_enabled
        user.save()
        return Response(
            {
                "message": f'Push Notification {"Enabled" if not is_push_notif_enabled else "Disabled"}',
                "push_notif_enabled": not is_push_notif_enabled,
            }
        )


# User View


class UserDashboardView(APIView):
    authentication_classes = [JWTCookieAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all course progress for the user
        user_progress = UserCourseProgress.objects.filter(user=user)
        total_courses = user_progress.count()

        # Count by status
        started_courses = user_progress.filter(
            status=UserCourseProgress.STATUS_STARTED
        ).count()
        finished_courses = user_progress.filter(
            status=UserCourseProgress.STATUS_FINISHED
        ).count()

        # Calculate completion rate
        completion_rate = (
            round((finished_courses / total_courses) * 100, 1) if total_courses else 0
        )

        # Courses in progress (started but not finished)
        in_progress = user_progress.filter(
            status=UserCourseProgress.STATUS_STARTED
        ).select_related("course")

        # Recently finished courses (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_finished = user_progress.filter(
            status=UserCourseProgress.STATUS_FINISHED, finished_at__gte=thirty_days_ago
        ).count()

        # Course distribution by field
        field_distribution = []
        courses_by_field = (
            Course.objects.filter(user_progress__user=user)
            .values("field")
            .annotate(count=Count("id"))
            .order_by("field")
        )

        for item in courses_by_field:
            field_distribution.append(
                {
                    "field": item["field"],
                    "label": dict(Course.FIELD_CHOICE).get(
                        item["field"], item["field"]
                    ),
                    "count": item["count"],
                }
            )

        # Recently started courses (last 5)
        recent_started = []
        recent_progress = user_progress.order_by("-started_at")[:5]
        for progress in recent_progress:
            recent_started.append(
                {
                    "id": progress.id,
                    "course_id": progress.course.id,
                    "course_title": progress.course.title,
                    "course_field": progress.course.field,
                    "field_label": dict(Course.FIELD_CHOICE).get(
                        progress.course.field, progress.course.field
                    ),
                    "status": progress.status,
                    "started_at": (
                        progress.started_at.date() if progress.started_at else None
                    ),
                    "finished_at": (
                        progress.finished_at.date() if progress.finished_at else None
                    ),
                    "short_note": progress.course.short_note,
                }
            )

        # Course recommendations (courses user hasn't started yet, by field preference)
        completed_fields = (
            Course.objects.filter(
                user_progress__user=user,
                user_progress__status=UserCourseProgress.STATUS_FINISHED,
            )
            .values_list("field", flat=True)
            .distinct()
        )

        # Find courses user hasn't started, prioritize by fields they've shown interest in
        user_course_ids = user_progress.values_list("course_id", flat=True)

        recommended_courses = Course.objects.exclude(id__in=user_course_ids).order_by(
            "-created_at"
        )[:5]

        recommendations = []
        for course in recommended_courses:
            recommendations.append(
                {
                    "id": course.id,
                    "title": course.title,
                    "short_note": course.short_note,
                    "field": course.field,
                    "field_label": dict(Course.FIELD_CHOICE).get(
                        course.field, course.field
                    ),
                    "youtube_link": course.youtube_link,
                }
            )

        # Weekly activity (courses started/finished per day for last 7 days)
        weekly_activity = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timedelta(days=i)
            started = user_progress.filter(started_at__date=day).count()
            finished = user_progress.filter(finished_at__date=day).count()
            weekly_activity.append(
                {
                    "date": day.strftime("%Y-%m-%d"),
                    "day_name": day.strftime("%A"),
                    "started": started,
                    "finished": finished,
                }
            )

        return Response(
            {
                "stats": {
                    "total_courses": total_courses,
                    "started_courses": started_courses,
                    "finished_courses": finished_courses,
                    "completion_rate": completion_rate,
                    "recent_finished_30d": recent_finished,
                    "in_progress_count": in_progress.count(),
                },
                "status_distribution": {
                    "started": started_courses,
                    "finished": finished_courses,
                },
                "field_distribution": field_distribution,
                "recent_activity": recent_started,
                "recommendations": recommendations,
                "weekly_activity": weekly_activity,
            },
            status=status.HTTP_200_OK,
        )
