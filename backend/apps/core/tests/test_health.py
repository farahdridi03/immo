from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class HealthCheckTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.health_url = reverse('core:health-check')

    def test_health_check_url_resolves(self):
        self.assertEqual(self.health_url, '/api/v1/health/')

    def test_health_check_endpoint_structure(self):
        # Health check response structure test
        response = self.client.get(self.health_url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('status', response.data)
        self.assertIn('service', response.data)
        self.assertIn('database', response.data)
        self.assertEqual(response.data['database']['engine'], 'postgresql')
