# accounts/models.py

from django.contrib.auth.models import (
    AbstractUser,
    UserManager,
)

from django.core.exceptions import (
    ValidationError,
)

from django.db import models


# ==================================================
# DEFAULT COUNCIL CONFIGURATION
# ==================================================

DEFAULT_PANEL_MEMBER_IDS = [
    "rei-kisaragi",
    "akari-hoshino",
    "mio-tachibana",
    "kaede-mizuhara",
    "riku-amamiya",
]


DEFAULT_MEDIATOR_ID = (
    "mika-amane"
)


def default_panel_member_ids():
    """
    Return a fresh list for every user.
    """

    return (
        DEFAULT_PANEL_MEMBER_IDS.copy()
    )


# ==================================================
# VALIDATORS
# ==================================================

def validate_panel_member_ids(
        value,
):
    """
    A panel must contain exactly five unique,
    non-empty character IDs.
    """

    if not isinstance(
            value,
            list,
    ):
        raise ValidationError(
            "Panel member IDs must be a list."
        )


    if len(value) != 5:
        raise ValidationError(
            "A panel must contain exactly 5 members."
        )


    if any(
            not isinstance(
                character_id,
                str,
            )
            or
            not character_id.strip()

            for character_id in value
    ):
        raise ValidationError(
            (
                "Every panel member ID must be "
                "a non-empty string."
            )
        )


    if len(set(value)) != 5:
        raise ValidationError(
            "Panel member IDs must be unique."
        )


# ==================================================
# USER MANAGER
# ==================================================

class GoseiUserManager(
    UserManager
):

    use_in_migrations = True


    def _create_user(
            self,
            username,
            email,
            password,
            **extra_fields,
    ):

        if not username:
            raise ValueError(
                "A username is required."
            )


        if not email:
            raise ValueError(
                "An email address is required."
            )


        username = (
            self.model
            .normalize_username(
                username
            )
            .strip()
        )


        email = (
            self
            .normalize_email(
                email
            )
            .lower()
        )


        user = self.model(
            username=username,
            email=email,
            **extra_fields,
        )


        user.set_password(
            password
        )


        user.save(
            using=self._db
        )


        return user


    def create_user(
            self,
            username,
            email=None,
            password=None,
            **extra_fields,
    ):

        extra_fields.setdefault(
            "is_staff",
            False,
        )


        extra_fields.setdefault(
            "is_superuser",
            False,
        )


        return self._create_user(
            username,
            email,
            password,
            **extra_fields,
        )


    def create_superuser(
            self,
            username,
            email=None,
            password=None,
            **extra_fields,
    ):

        extra_fields.setdefault(
            "is_staff",
            True,
        )


        extra_fields.setdefault(
            "is_superuser",
            True,
        )


        extra_fields.setdefault(
            "is_active",
            True,
        )


        if (
                extra_fields.get(
                    "is_staff"
                )
                is not True
        ):
            raise ValueError(
                (
                    "Superuser must have "
                    "is_staff=True."
                )
            )


        if (
                extra_fields.get(
                    "is_superuser"
                )
                is not True
        ):
            raise ValueError(
                (
                    "Superuser must have "
                    "is_superuser=True."
                )
            )


        return self._create_user(
            username,
            email,
            password,
            **extra_fields,
        )


# ==================================================
# USER MODEL
# ==================================================

class User(
    AbstractUser
):

    # ==================================================
    # CHOICES
    # ==================================================

    class PresentationPreference(
        models.TextChoices
    ):

        ANIME = (
            "anime",
            "Anime",
        )

        PROFESSIONAL = (
            "professional",
            "Professional",
        )


    class StylePreference(
        models.TextChoices
    ):

        SUPPORTIVE = (
            "supportive",
            "Supportive",
        )

        BALANCED = (
            "balanced",
            "Balanced",
        )

        CHALLENGING = (
            "challenging",
            "Challenging",
        )


    class ModePreference(
        models.TextChoices
    ):

        PANEL = (
            "panel",
            "Panel",
        )

        MEDIATOR = (
            "mediator",
            "Mediator",
        )


    class DepthPreference(
        models.TextChoices
    ):

        QUICK = (
            "quick",
            "Quick",
        )

        STANDARD = (
            "standard",
            "Standard",
        )

        DEEP = (
            "deep",
            "Deep",
        )


    # ==================================================
    # AUTH IDENTITY
    # ==================================================

    email = models.EmailField(
        unique=True,
    )


    # ==================================================
    # GOSEI PROFILE
    # ==================================================

    avatar = models.CharField(
        max_length=500,
        blank=True,
        default=(
            "/images/profile/"
            "default-avatar.png"
        ),
    )


    bio = models.TextField(
        blank=True,
        default="",
    )


    # ==================================================
    # PRESENTATION PREFERENCES
    # ==================================================

    presentation_preference = (
        models.CharField(
            max_length=20,
            choices=(
                PresentationPreference
                .choices
            ),
            default=(
                PresentationPreference
                .ANIME
            ),
        )
    )


    style_preference = (
        models.CharField(
            max_length=20,
            choices=(
                StylePreference
                .choices
            ),
            default=(
                StylePreference
                .BALANCED
            ),
        )
    )


    mode_preference = (
        models.CharField(
            max_length=20,
            choices=(
                ModePreference
                .choices
            ),
            default=(
                ModePreference
                .PANEL
            ),
        )
    )


    depth_preference = (
        models.CharField(
            max_length=20,
            choices=(
                DepthPreference
                .choices
            ),
            default=(
                DepthPreference
                .STANDARD
            ),
        )
    )


    theme = models.CharField(
        max_length=100,
        default="neon_office",
    )


    # ==================================================
    # COUNCIL CONFIGURATION
    # ==================================================

    panel_member_ids = (
        models.JSONField(
            default=(
                default_panel_member_ids
            ),
            validators=[
                validate_panel_member_ids,
            ],
        )
    )


    selected_mediator_id = (
        models.CharField(
            max_length=100,
            default=(
                DEFAULT_MEDIATOR_ID
            ),
        )
    )


    # ==================================================
    # MANAGER
    # ==================================================

    objects = GoseiUserManager()


    # Email is requested by createsuperuser.

    REQUIRED_FIELDS = [
        "email",
    ]


    # ==================================================
    # CLEAN
    # ==================================================

    def clean(
            self,
    ):

        super().clean()


        if self.email:

            self.email = (
                self.__class__
                .objects
                .normalize_email(
                    self.email
                )
                .lower()
            )


    # ==================================================
    # STRING
    # ==================================================

    def __str__(
            self,
    ):

        return (
            self.username
        )
