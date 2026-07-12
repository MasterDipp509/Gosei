# accounts/views.py

from django.contrib.auth import (
    login as django_login,
    logout as django_logout,
    update_session_auth_hash,
)

from django.middleware.csrf import (
    get_token,
)

from django.utils.decorators import (
    method_decorator,
)

from django.views.decorators.csrf import (
    ensure_csrf_cookie,
)

from rest_framework import status

from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)

from rest_framework.response import (
    Response,
)

from rest_framework.views import (
    APIView,
)

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


# ==================================================
# CSRF
#
# PUBLIC ENDPOINT
#
# Used after login to establish CSRF state for
# authenticated session-based write operations.
#
# Register and login do not depend on this endpoint.
# ==================================================

@method_decorator(
    ensure_csrf_cookie,
    name="dispatch",
)
class CsrfView(
    APIView
):

    authentication_classes = []


    permission_classes = [
        AllowAny,
    ]


    def get(
            self,
            request,
    ):

        token = get_token(
            request
        )


        return Response(

            {
                "csrfToken":
                    token,
            },

            status=status.HTTP_200_OK,
        )


# ==================================================
# REGISTER
#
# PUBLIC ENDPOINT
#
# - No authentication required
# - No existing session required
# - No CSRF bootstrap required
# ==================================================

class RegisterView(
    APIView
):

    authentication_classes = []


    permission_classes = [
        AllowAny,
    ]


    def post(
            self,
            request,
    ):

        serializer = RegisterSerializer(
            data=request.data,
        )


        serializer.is_valid(
            raise_exception=True
        )


        user = serializer.save()


        return Response(

            {
                "detail":
                    (
                        "Account created "
                        "successfully."
                    ),


                "user":
                    UserSerializer(
                        user
                    ).data,
            },

            status=(
                status.HTTP_201_CREATED
            ),
        )


# ==================================================
# LOGIN
#
# PUBLIC ENDPOINT
#
# - No authentication required
# - No existing session required
# - No CSRF bootstrap required
# - Successful login creates Django session
# ==================================================

class LoginView(
    APIView
):

    authentication_classes = []


    permission_classes = [
        AllowAny,
    ]


    def post(
            self,
            request,
    ):

        serializer = LoginSerializer(

            data=request.data,

            context={
                "request":
                    request,
            },
        )


        serializer.is_valid(
            raise_exception=True
        )


        user = (
            serializer
            .validated_data[
                "user"
            ]
        )


        django_login(
            request,
            user,
        )


        return Response(

            {
                "detail":
                    (
                        "Logged in "
                        "successfully."
                    ),


                "user":
                    UserSerializer(
                        user
                    ).data,
            },

            status=status.HTTP_200_OK,
        )


# ==================================================
# LOGOUT
#
# AUTHENTICATED ENDPOINT
# ==================================================

class LogoutView(
    APIView
):

    permission_classes = [
        IsAuthenticated,
    ]


    def post(
            self,
            request,
    ):

        django_logout(
            request
        )


        return Response(

            {
                "detail":
                    (
                        "Logged out "
                        "successfully."
                    )
            },

            status=status.HTTP_200_OK,
        )


# ==================================================
# CURRENT USER
#
# AUTHENTICATED ENDPOINT
# ==================================================

class MeView(
    APIView
):

    permission_classes = [
        IsAuthenticated,
    ]


    # ==================================================
    # GET
    # ==================================================

    def get(
            self,
            request,
    ):

        return Response(

            UserSerializer(
                request.user
            ).data,

            status=status.HTTP_200_OK,
        )


    # ==================================================
    # PATCH
    # ==================================================

    def patch(
            self,
            request,
    ):

        serializer = UserUpdateSerializer(

            instance=request.user,

            data=request.data,

            partial=True,
        )


        serializer.is_valid(
            raise_exception=True
        )


        user = serializer.save()


        return Response(

            UserSerializer(
                user
            ).data,

            status=status.HTTP_200_OK,
        )


# ==================================================
# CHANGE PASSWORD
#
# AUTHENTICATED ENDPOINT
# ==================================================

class ChangePasswordView(
    APIView
):

    permission_classes = [
        IsAuthenticated,
    ]


    def post(
            self,
            request,
    ):

        serializer = ChangePasswordSerializer(

            data=request.data,

            context={
                "request":
                    request,
            },
        )


        serializer.is_valid(
            raise_exception=True
        )


        user = serializer.save()


        # Keep the current browser session alive
        # after changing the user's password.

        update_session_auth_hash(
            request,
            user,
        )


        return Response(

            {
                "detail":
                    (
                        "Password changed "
                        "successfully."
                    )
            },

            status=status.HTTP_200_OK,
        )
