import json
import os
import unittest
import responses

from reviewer.client import APIClient

PROFILE_URL = 'https://gateway-tok.watsonplatform.net/personality-insights/api/v3/profile'
API_VERSION = os.environ.get('PERSONALITY_INSIGHTS_VERSION', '2017-10-13')


class GetProfileTest(unittest.TestCase):

    def setUp(self):
        self.client = APIClient()
        url = PROFILE_URL
        query = f'?version={API_VERSION}'
        self.profile_url = url + query

    @responses.activate
    def test_get_profile(self):
        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3-expect1.txt')) as expect_file:
            profile_response = expect_file.read()

        responses.add(responses.POST, self.profile_url,
                      body=profile_response, status=200,
                      content_type='application/json')

        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3.txt')) as personality_text:
            data = personality_text.read()

        profile = self.client.get_profile(data=data)
        profile_expected = json.loads(profile_response)
        self.assertEqual(profile_expected, profile)
