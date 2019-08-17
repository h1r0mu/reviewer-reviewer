from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute

from src.app.client import APIClient
from src.app.config import get_global_config_dict

global_config = get_global_config_dict()

AWS_REGION = global_config['AWS_REGION']
DYNAMODB_HOST = global_config['DYNAMODB_HOST']


class User(Model):
    class Meta:
        table_name = 'users'
        region = AWS_REGION
        host = DYNAMODB_HOST

    id = UnicodeAttribute(hash_key=True)
    text = UnicodeAttribute()
    profile = UnicodeAttribute()

    @classmethod
    def get_or_create(cls, user_id, text=None):
        try:
            return cls.get(hash_key=user_id)
        except cls.DoesNotExist:
            if text is None:
                raise ValueError('Could not get a profile of user_id:{user_id} due to the empty text.')
            client = APIClient()
            profile = client.get_profile(text)
            user = cls(
                id=user_id,
                text=text,
                profile=profile,
            )
            user.save()
            return user


def __at_loaded():
    if not User.exists():
        User.create_table(
            wait=True,
            read_capacity_units=1,
            write_capacity_units=1,
        )


__at_loaded()
