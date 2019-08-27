# Requirements
- Create IBM Cloud account
https://cloud.ibm.com/login?lnk=mmi_jpja

- Get Personality Insights API Key

# Usage


## Install the exntension to Google Chrome
1. Open `chrome://extensions/`
1. Turn on `Developer mode`
1. Click `Load unpacked`
1. Select `reviewer-reviewer/chrome` directory

## Run backend server

```sh
cp .env.app.example .env.app
# open .env.app with text editor and add PERSONALITY_INSIGHTS_API_KEY={your IBM Cloud Personality Insights API Key}
docker-compose up --build
```

## Run extension
1. Open `https://www.amazon.co.jp/gp/video/...`
1. Open the popup of extension
1. Click `Personalityで並び替える`
1. Wait for a minute
