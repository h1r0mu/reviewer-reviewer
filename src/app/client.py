import os
from ibm_watson import PersonalityInsightsV3

USERNAME = os.environ.get('PERSONALITY_INSIGHTS_USERNAME', 'username')
PASSWORD = os.environ.get('PERSONALITY_INSIGHTS_PASSWORD', 'password')
API_URL = os.environ.get('PERSONALITY_INSIGHTS_URL',
                         'https://gateway.watsonplatform.net/personality-insights/api')
API_VERSION = os.environ.get('PERSONALITY_INSIGHTS_VERSION', '2017-10-13')


class APIClient(PersonalityInsightsV3):
    def __init__(self):
        super().__init__(
            version=API_VERSION,
            username=USERNAME,
            password=PASSWORD,
            url=API_URL,
        )

    def get_profile(self, data):
        return self.profile(
            data,
            'application/json',
            content_type='text/plain;charset=utf-8'
        ).get_result()
