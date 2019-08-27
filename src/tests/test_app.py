import json
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
        with patch.object(APIClient, 'get_profile', return_value=json.loads(profile_response)) as mock_get_profile:
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

        expected_response = {'profile': '{"name": "flare", "children":[{"name": "personality", "children": '
                                        '[{"name": "Openness", "value": 0.9970814244982864}, {"name": '
                                        '"Conscientiousness", "value": 0.986401677449357}, {"name": '
                                        '"Extraversion", "value": 0.08530058556548259}, {"name": '
                                        '"Agreeableness", "value": 0.1875352860319472}, {"name": '
                                        '"Emotional range", "value": 0.9438564164580463}]},{"name": '
                                        '"needs", "children": [{"name": "Challenge", "value": '
                                        '0.0032546536914939694}, {"name": "Closeness", "value": '
                                        '0.37022781101806856}, {"name": "Curiosity", "value": '
                                        '0.845180482624851}, {"name": "Excitement", "value": '
                                        '0.11505596926601303}, {"name": "Harmony", "value": '
                                        '0.4664217424750215}, {"name": "Ideal", "value": '
                                        '0.02263412995273062}, {"name": "Liberty", "value": '
                                        '0.10802987716456186}, {"name": "Love", "value": '
                                        '0.01189533382101321}, {"name": "Practicality", "value": '
                                        '0.018888178951272983}, {"name": "Self-expression", "value": '
                                        '0.18489782806561655}, {"name": "Stability", "value": '
                                        '0.3946227431440047}, {"name": "Structure", "value": '
                                        '0.8880129689346332}]},{"name": "values", "children": [{"name": '
                                        '"Conservation", "value": 0.5065929218618456}, {"name": "Openness '
                                        'to change", "value": 0.6287516949462554}, {"name": "Hedonism", '
                                        '"value": 0.005253658217920731}, {"name": "Self-enhancement", '
                                        '"value": 0.0011936431143393933}, {"name": "Self-transcendence", '
                                        '"value": 0.3429609693883737}]}]}',
                             'similarity': 1}

        self.assertEqual(expected_response, response.get_json())
