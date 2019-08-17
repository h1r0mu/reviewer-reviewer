import os
import responses
import unittest

from src.app import app


class ProfilesSimilarityTest(unittest.TestCase):

    def setUp(self) -> None:
        _app = app.create_app()
        self.client = _app.test_client()
        self.url = '/api/v1/profiles/similarity'
        self.profile_url = 'https://gateway.watsonplatform.net/personality-insights/api/v3/profile'

    @responses.activate
    def test_profiles_similarity(self):
        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3-expect1.txt')) as expect_file:
            profile_response = expect_file.read()
        responses.add(responses.POST, self.profile_url,
                      body=profile_response, status=200,
                      content_type='application/json')

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

