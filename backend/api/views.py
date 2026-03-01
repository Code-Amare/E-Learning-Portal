from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

IS_TWOFA_MANDATORY = settings.IS_TWOFA_MANDATORY


class SiteView(APIView):
    def get(self, request):
        brand_name = "CSSS IT Club"
        is_twofa_mandatory = IS_TWOFA_MANDATORY

        return Response(
            {"brand_name": brand_name, "is_two_fa_mandatory": is_twofa_mandatory},
            status=status.HTTP_200_OK,
        )
