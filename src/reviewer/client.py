from ibm_watson import PersonalityInsightsV3

from reviewer.config import get_global_config_dict

global_config = get_global_config_dict()

USERNAME = global_config['PERSONALITY_INSIGHTS_USERNAME']
PASSWORD = global_config['PERSONALITY_INSIGHTS_PASSWORD']
API_KEY = global_config['PERSONALITY_INSIGHTS_API_KEY']
API_URL = global_config['PERSONALITY_INSIGHTS_URL']
API_VERSION = global_config['PERSONALITY_INSIGHTS_VERSION']


class APIClient(PersonalityInsightsV3):
    def __init__(self):
        super().__init__(
            version=API_VERSION,
            username=USERNAME if API_KEY is None else None,
            password=PASSWORD if API_KEY is None else None,
            iam_apikey=API_KEY,
            url=API_URL,
        )

    def get_profile(self, data):
        return self.profile(
            data,
            'application/json',
            content_type='text/plain;charset=utf-8',
            content_language='ja'
        ).get_result()
