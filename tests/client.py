import json
import os
import unittest
import responses
from ibm_watson.personality_insights_v3 import Profile

from src.client import APIClient


class GetProfileTest(unittest.TestCase):

    def setUp(self):
        self.client = APIClient()
        self.profile_url = 'https://gateway.watsonplatform.net/personality-insights/api/v3/profile'

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
        profile_expected = Profile._from_dict(json.loads(profile_response))
        self.assertEqual(profile_expected, profile)

