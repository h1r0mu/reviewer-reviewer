async function getTweets(count) {
    OAuth.initialize('wgFu5bezL7NdCCK5giqQH_xDB4U');
    let result = await OAuth.popup("twitter");
    let credentials = await result.get('/1.1/account/verify_credentials.json');
    let timeline = await result.get(`/1.1/statuses/user_timeline.json?screen_name=${credentials.screen_name}&count=${count}`)
    return {
        credentials: credentials,
        timeline: timeline
    };
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg);
    switch (msg.command) {
        case "getTweets":
            console.log("Get tweets");//送られたメッセージをキャッチ
            getTweets(200)
                .then(tweets => {
                    console.log(tweets)
                    let user_id = tweets.credentials.screen_name;
                    let user_text = tweets.timeline.map(tweet => tweet.text).join(" ");
                    localStorage.setItem("rr_user_id", user_id);
                    localStorage.setItem("rr_user_text", user_text);
                });
            break;
        case "getProfilesSimilarity":
            if (!("rr_user_id" in localStorage && "rr_user_text" in localStorage)) {
                console.error("Get tweets first.");
                break;
            }
            msg.request.user_id = localStorage.getItem("rr_user_id");
            msg.request.user_text = localStorage.getItem("rr_user_text");
            let url = "http://localhost:8000/api/v1/profiles/similarity"
            console.log(msg.request)
            return axios.post(url, msg.request);
    }
});


