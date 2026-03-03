from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthLockTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="lock_user",
            password="correct_password",
        )
        self.url = "/api/users/token/"

    @patch("users.views.auth.LoginLockService.clear_attempts")
    @patch("users.views.auth.LoginLockService.increment_attempts")
    @patch("users.views.auth.LoginLockService.get_remaining_seconds")
    @patch("users.views.auth.LoginLockService.is_banned")
    def test_wrong_password_increments_attempts(
        self,
        mock_is_banned,
        mock_remaining,
        mock_increment,
        mock_clear,
    ):
        mock_is_banned.return_value = False
        mock_increment.return_value = 1
        mock_remaining.return_value = 0

        response = self.client.post(
            self.url,
            {"username": self.user.username, "password": "wrong_password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        mock_increment.assert_called_once()
        mock_clear.assert_not_called()

    @patch("users.views.auth.LoginLockService.clear_attempts")
    @patch("users.views.auth.LoginLockService.increment_attempts")
    @patch("users.views.auth.LoginLockService.get_remaining_seconds")
    @patch("users.views.auth.LoginLockService.is_banned")
    def test_third_wrong_password_returns_429(
        self,
        mock_is_banned,
        mock_remaining,
        mock_increment,
        mock_clear,
    ):
        mock_is_banned.return_value = False
        mock_increment.return_value = 3
        mock_remaining.return_value = 299

        response = self.client.post(
            self.url,
            {"username": self.user.username, "password": "wrong_password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        mock_increment.assert_called_once()
        mock_clear.assert_not_called()
