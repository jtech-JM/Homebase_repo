from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('conversations/<int:conversation_id>/messages/', views.MessageListCreateView.as_view(), name='conversation-messages'),
    path('conversations/<int:conversation_id>/send/', views.SendMessageView.as_view(), name='send-message'),
]
