
from rest_framework import serializers
from django.contrib.auth import authenticate
from taggit.serializers import TagListSerializerField, TaggitSerializer
from .models import (
    CustomUser, Profile, Category, Blog, BlogMedia, Comment,
    Reaction, Bookmark, Notification, UserActivity
)

# ====================================
# 🔹 AUTH & USER SERIALIZERS
# ====================================


class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'password2', 'role']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                "password": "Passwords do not match"
            })
        return data

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        validated_data.pop('password2', None)

        user = CustomUser(
            username=validated_data.get('username'),
            email=validated_data.get('email'),
            role=validated_data.get('role', 'reader')
        )

        user.set_password(validated_data.get('password'))
        user.save()

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get("username")
        password = attrs.get("password")

        if not username_or_email or not password:
            raise serializers.ValidationError(
                "Both username/email and password are required.")

        # Try username → then email
        user = authenticate(username=username_or_email, password=password)
        if user is None:
            try:
                user_obj = CustomUser.objects.get(email=username_or_email)
                user = authenticate(
                    username=user_obj.username, password=password)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError(
                    "Invalid username/email or password.")

        if not user:
            raise serializers.ValidationError(
                "Invalid username/email or password.")

        if not user.is_active:
            raise serializers.ValidationError(
                "Please verify your email before logging in.")

        attrs['user'] = user
        return attrs


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'email_verified']


# ====================================
# 🔹 PROFILE & CATEGORY SERIALIZERS
# ====================================

class ProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    bookmarks_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'bio', 'profile_pic', 'social_links',
            'followers_count', 'following_count', 'bookmarks_count'
        ]

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_bookmarks_count(self, obj):
        return obj.bookmarks.count()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


# ====================================
# 🔹 BLOG MEDIA SERIALIZER
# ====================================

class BlogMediaSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = BlogMedia
        fields = ['id', 'file', 'uploaded_at']

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


# ====================================
# 🔹 BLOG SERIALIZER
# ====================================

class BlogSerializer(TaggitSerializer, serializers.ModelSerializer):
    author = CustomUserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagListSerializerField(required=False)
    media = BlogMediaSerializer(many=True, read_only=True)

    # Related items
    reactions = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    bookmarks = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    # Computed fields
    total_reactions = serializers.SerializerMethodField()
    total_comments = serializers.SerializerMethodField()
    total_bookmarks = serializers.SerializerMethodField()
    is_featured_display = serializers.SerializerMethodField()
    reaction_summary = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Blog
        fields = [
            'id', 'author', 'title', 'content', 'markdown_content', 'category',
            'tags', 'featured_image', 'attachments', 'status',
            'views', 'likes', 'comments_count', 'is_featured', 'is_featured_display',
            'publish_at', 'published_at', 'created_at', 'updated_at',
            'media', 'reactions', 'bookmarks',
            'total_reactions', 'total_comments', 'total_bookmarks',
            'reaction_summary', 'user_reaction'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')

        # Convert image/attachments to absolute URLs
        if request:
            if instance.featured_image:
                data['featured_image'] = request.build_absolute_uri(
                    instance.featured_image.url)
            if instance.attachments:
                data['attachments'] = request.build_absolute_uri(
                    instance.attachments.url)
        return data

    def get_total_reactions(self, obj):
        return obj.reactions.count()

    def get_total_comments(self, obj):
        return obj.comments.count()

    def get_total_bookmarks(self, obj):
        return obj.bookmarked_by.count() if hasattr(obj, 'bookmarked_by') else 0

    def get_is_featured_display(self, obj):
        return "⭐ Featured" if obj.is_featured else "Normal"

    def get_reaction_summary(self, obj):
        summary = {'like': 0, 'love': 0, 'laugh': 0, 'angry': 0}
        for r in obj.reactions.all():
            summary[r.reaction_type] = summary.get(r.reaction_type, 0) + 1
        return summary

    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            return reaction.reaction_type if reaction else None
        return None


# ====================================
# 🔹 COMMENT SERIALIZER (with Blog Title)
# ====================================

class BlogMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = ['id', 'title']


class RecursiveCommentSerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = CommentSerializer(value, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    blog = BlogMiniSerializer(read_only=True)
    replies = RecursiveCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'blog', 'content',
                  'parent', 'created_at', 'replies']


# ====================================
# 🔹 BOOKMARK, REACTION, NOTIFICATION
# ====================================

class BookmarkSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    blog_title = serializers.CharField(source='blog.title', read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'user', 'blog', 'blog_title', 'created_at']


class ReactionSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    blog = BlogMiniSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'blog', 'reaction_type', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)   # receiver
    sender = CustomUserSerializer(read_only=True)  # sender
    blog = BlogMiniSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'sender', 'notification_type', 'blog',
            'message', 'is_read', 'created_at'
        ]


# ====================================
# 🔹 USER ACTIVITY SERIALIZER
# ====================================

class UserActivitySerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = UserActivity
        fields = ['id', 'user', 'action', 'timestamp']
