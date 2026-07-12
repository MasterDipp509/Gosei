# accounts/serializers.py

from django.contrib.auth import (
    authenticate,
    get_user_model,
    password_validation,
)

from django.core.exceptions import (
    ValidationError as DjangoValidationError,
)

from django.db.models import Q

from rest_framework import serializers


User = get_user_model()


# ==================================================
# USER OUTPUT
# ==================================================

class UserSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = User

        fields = [

            # Identity

            "id",
            "username",
            "email",
            "first_name",
            "last_name",

            # Profile

            "avatar",
            "bio",

            # Preferences

            "presentation_preference",
            "style_preference",
            "mode_preference",
            "depth_preference",
            "theme",

            # Council

            "panel_member_ids",
            "selected_mediator_id",

            # Account state

            "date_joined",
        ]


        read_only_fields = [
            "id",
            "date_joined",
        ]


# ==================================================
# REGISTER
# ==================================================

class RegisterSerializer(
    serializers.ModelSerializer
):

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )


    password_confirm = (
        serializers.CharField(
            write_only=True,
            trim_whitespace=False,
            style={
                "input_type": "password",
            },
        )
    )


    class Meta:

        model = User

        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]


    # ==================================================
    # USERNAME
    # ==================================================

    def validate_username(
            self,
            value,
    ):

        value = value.strip()


        if User.objects.filter(
                username__iexact=value
        ).exists():

            raise serializers.ValidationError(
                (
                    "This username is already "
                    "in use."
                )
            )


        return value


    # ==================================================
    # EMAIL
    # ==================================================

    def validate_email(
            self,
            value,
    ):

        value = (
            value
            .strip()
            .lower()
        )


        if User.objects.filter(
                email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                (
                    "An account with this email "
                    "already exists."
                )
            )


        return value


    # ==================================================
    # FULL VALIDATION
    # ==================================================

    def validate(
            self,
            attrs,
    ):

        password = attrs.get(
            "password"
        )


        password_confirm = attrs.get(
            "password_confirm"
        )


        if (
                password
                !=
                password_confirm
        ):

            raise serializers.ValidationError({
                "password_confirm":
                    "Passwords do not match."
            })


        # Temporary user instance allows validators
        # such as UserAttributeSimilarityValidator
        # to inspect username/email/name fields.

        temporary_user = User(

            username=attrs.get(
                "username",
                "",
            ),

            email=attrs.get(
                "email",
                "",
            ),

            first_name=attrs.get(
                "first_name",
                "",
            ),

            last_name=attrs.get(
                "last_name",
                "",
            ),
        )


        try:

            password_validation.validate_password(
                password,
                user=temporary_user,
            )

        except DjangoValidationError as error:

            raise serializers.ValidationError({
                "password":
                    list(error.messages)
            })


        return attrs


    # ==================================================
    # CREATE
    # ==================================================

    def create(
            self,
            validated_data,
    ):

        validated_data.pop(
            "password_confirm"
        )


        password = validated_data.pop(
            "password"
        )


        user = User.objects.create_user(
            password=password,
            **validated_data,
        )


        return user


# ==================================================
# LOGIN
# ==================================================

class LoginSerializer(
    serializers.Serializer
):

    identifier = serializers.CharField(
        required=True,
    )


    password = serializers.CharField(
        required=True,
        write_only=True,
        trim_whitespace=False,
        style={
            "input_type": "password",
        },
    )


    def validate(
            self,
            attrs,
    ):

        request = (
            self.context.get(
                "request"
            )
        )


        identifier = (
            attrs.get(
                "identifier",
                "",
            )
            .strip()
        )


        password = attrs.get(
            "password"
        )


        # Find by username OR email.

        candidate = (
            User.objects
            .filter(

                Q(
                    username__iexact=(
                        identifier
                    )
                )

                |

                Q(
                    email__iexact=(
                        identifier
                    )
                )
            )
            .first()
        )


        # Django's default ModelBackend authenticates
        # against USERNAME_FIELD, which remains username.

        username = (

            candidate.username

            if candidate

            else identifier
        )


        user = authenticate(

            request=request,

            username=username,

            password=password,
        )


        if user is None:

            raise serializers.ValidationError(
                {
                    "detail":
                        (
                            "Invalid username/email "
                            "or password."
                        )
                }
            )


        if not user.is_active:

            raise serializers.ValidationError(
                {
                    "detail":
                        "This account is disabled."
                }
            )


        attrs["user"] = user


        return attrs


# ==================================================
# USER UPDATE
# ==================================================

class UserUpdateSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = User

        fields = [

            "username",
            "email",
            "first_name",
            "last_name",

            "avatar",
            "bio",

            "presentation_preference",
            "style_preference",
            "mode_preference",
            "depth_preference",
            "theme",

            "panel_member_ids",
            "selected_mediator_id",
        ]


    # ==================================================
    # USERNAME
    # ==================================================

    def validate_username(
            self,
            value,
    ):

        value = value.strip()


        queryset = (
            User.objects
            .filter(
                username__iexact=value
            )
            .exclude(
                pk=self.instance.pk
            )
        )


        if queryset.exists():

            raise serializers.ValidationError(
                (
                    "This username is already "
                    "in use."
                )
            )


        return value


    # ==================================================
    # EMAIL
    # ==================================================

    def validate_email(
            self,
            value,
    ):

        value = (
            value
            .strip()
            .lower()
        )


        queryset = (
            User.objects
            .filter(
                email__iexact=value
            )
            .exclude(
                pk=self.instance.pk
            )
        )


        if queryset.exists():

            raise serializers.ValidationError(
                (
                    "This email is already "
                    "in use."
                )
            )


        return value


    # ==================================================
    # PANEL
    # ==================================================

    def validate_panel_member_ids(
            self,
            value,
    ):

        if not isinstance(
                value,
                list,
        ):
            raise serializers.ValidationError(
                (
                    "Panel member IDs must "
                    "be a list."
                )
            )


        if len(value) != 5:
            raise serializers.ValidationError(
                (
                    "A panel must contain "
                    "exactly 5 members."
                )
            )


        if len(set(value)) != 5:
            raise serializers.ValidationError(
                (
                    "Panel members must "
                    "be unique."
                )
            )


        return value


# ==================================================
# CHANGE PASSWORD
# ==================================================

class ChangePasswordSerializer(
    serializers.Serializer
):

    current_password = (
        serializers.CharField(
            write_only=True,
            trim_whitespace=False,
        )
    )


    new_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )


    new_password_confirm = (
        serializers.CharField(
            write_only=True,
            trim_whitespace=False,
        )
    )


    def validate(
            self,
            attrs,
    ):

        user = (
            self.context[
                "request"
            ]
            .user
        )


        current_password = attrs.get(
            "current_password"
        )


        new_password = attrs.get(
            "new_password"
        )


        new_password_confirm = attrs.get(
            "new_password_confirm"
        )


        if not user.check_password(
                current_password
        ):

            raise serializers.ValidationError({
                "current_password":
                    (
                        "Current password "
                        "is incorrect."
                    )
            })


        if (
                new_password
                !=
                new_password_confirm
        ):

            raise serializers.ValidationError({
                "new_password_confirm":
                    "Passwords do not match."
            })


        try:

            password_validation.validate_password(
                new_password,
                user=user,
            )

        except DjangoValidationError as error:

            raise serializers.ValidationError({
                "new_password":
                    list(error.messages)
            })


        return attrs


    def save(
            self,
            **kwargs,
    ):

        user = (
            self.context[
                "request"
            ]
            .user
        )


        user.set_password(
            self.validated_data[
                "new_password"
            ]
        )


        user.save(
            update_fields=[
                "password",
            ]
        )


        return user
