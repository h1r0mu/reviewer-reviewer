import os
import responses
from unittest import (
    TestCase,
    skipIf,
)
from unittest.mock import patch
from reviewer.models import APIClient

from reviewer import create_app

SKIP_USER_STATE_TESTS = os.environ.get('DYNAMODB_HOST', None) is None
PROFILE_URL = os.environ.get('PERSONALITY_INSIGHTS_URL',
                             'https://gateway.watsonplatform.net/personality-insights/api/v3/profile')
os.environ['DYNAMODB_HOST'] = ''


@skipIf(SKIP_USER_STATE_TESTS, 'Mock DynamoDB is not configured.')
class ProfilesSimilarityTest(TestCase):

    def setUp(self) -> None:
        _app = create_app()
        self.client = _app.test_client()
        self.url = '/api/v1/profiles/similarity'
        self.profile_url = PROFILE_URL

    @responses.activate
    def test_profiles_similarity(self):
        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3-expect1.txt')) as expect_file:
            profile_response = expect_file.read()
        responses.add(responses.POST, self.profile_url,
                      body=profile_response, status=200,
                      content_type='application/json')

        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3-expect1.txt')) as expect_file:
            profile_response = expect_file.read()
        with patch.object(APIClient, 'get_profile', return_value=profile_response) as mock_get_profile:
            response = self.client.post(
                self.url,
                json={
                    'user_id': '0000000000AAAAAA',
                    'user_text': 'The text might be a string of joined tweets',
                    'reviewer_id': '9999999999ZZZZZZ',
                    'reviewer_text': 'The text might be a string joined reviews',
                },
                headers={'Accept': 'application/json'},
            )

        expected_response = {'similarity': 1.0}

        self.assertEqual(expected_response, response.get_json())
