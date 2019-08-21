import os


def get_global_config_dict():
    return dict(
        APP_NAME=os.environ.get('APP_NAME', 'reviewer-reviewer'),
        AWS_REGION=os.environ.get('AWS_REGION', 'ap-northeast-1'),
        DYNAMODB_HOST=os.environ.get('DYNAMODB_HOST', None),
        BASE_URL=os.environ.get('BASE_URL', ''),
        PERSONALITY_INSIGHTS_USERNAME=os.environ.get('PERSONALITY_INSIGHTS_USERNAME', 'username'),
        PERSONALITY_INSIGHTS_PASSWORD=os.environ.get('PERSONALITY_INSIGHTS_PASSWORD', 'password'),
        PERSONALITY_INSIGHTS_API_KEY=os.environ.get('PERSONALITY_INSIGHTS_API_KEY', None),
        PERSONALITY_INSIGHTS_URL=os.environ.get('PERSONALITY_INSIGHTS_URL',
                                                'https://gateway-tok.watsonplatform.net/personality-insights/api'),
        PERSONALITY_INSIGHTS_VERSION=os.environ.get('PERSONALITY_INSIGHTS_VERSION', '2017-10-13'),

    )
