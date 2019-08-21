import json
import os
import unittest
import responses
import reviewer.utils.profile_utils

from reviewer.client import APIClient


class GetCalcSimilarityTest(unittest.TestCase):

    def setUp(self):
        self.client = APIClient()
        self.profile_url = 'https://gateway.watsonplatform.net/personality-insights/api/v3/profile'

    @responses.activate
    def test_get_similarity(self):
        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3-expect1.txt')) as expect_file:
            profile_response = expect_file.read()

        responses.add(responses.POST, self.profile_url,
                      body=profile_response, status=200,
                      content_type='application/json')

        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3.txt')) as personality_text:
            data = personality_text.read()

        profile = self.client.get_profile(data=data)
        profile_expected = json.loads(profile_response)
        valu_expected = calc_similarity(profile_expected, profile_expected)
        value = calc_similarity(profile, profile_expected)
        self.assertEqual(value_expected, value)

