import os
from unittest import (
    TestCase,
    skipIf,
)
from unittest.mock import patch

from reviewer.models import (
    APIClient,
    User,
)

SKIP_USER_STATE_TESTS = os.environ.get('DYNAMODB_HOST', None) is None
os.environ['DYNAMODB_HOST'] = ''


@skipIf(SKIP_USER_STATE_TESTS, 'Mock DynamoDB is not configured.')
class UserTest(TestCase):

    def setUp(self) -> None:
        self.user_id = '1234567890ABCDEF'
        self.user_text = 'tweetstweetstweets'

    def tearDown(self) -> None:
        User.get(self.user_id).delete()
        User.get(self.user_id[::-1]).delete()

    def test_user(self):
        with open(os.path.join(os.path.dirname(__file__), '../resources/personality-v3-expect1.txt')) as expect_file:
            profile_response = expect_file.read()
        with patch.object(APIClient, 'get_profile', return_value=profile_response) as mock_get_profile:
            User.get_or_create(user_id=self.user_id, text=self.user_text)
            User.get_or_create(user_id=self.user_id, text=self.user_text)
            User.get_or_create(user_id=self.user_id[::-1], text=self.user_text)
            self.assertEqual(2, mock_get_profile.call_count)
