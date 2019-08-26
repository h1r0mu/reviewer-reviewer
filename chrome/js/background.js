
const getTweets = async (count = 200) => {
    OAuth.initialize("wgFu5bezL7NdCCK5giqQH_xDB4U");
    let result = await OAuth.popup("twitter");
    let credentials = await result.get("/1.1/account/verify_credentials.json");
    let timeline = await result.get(`/1.1/statuses/user_timeline.json?screen_name=${credentials.screen_name}&count=${count}`)
    let user_id = credentials.screen_name;
    let tweets = timeline.map(tweet => tweet.text);
    return [user_id, tweets];
};

browser.runtime.onMessage.addListener(async function (msg) {
    console.log(msg);
    switch (msg.command) {
        case "getTweets":
            let [userId, tweets] = await getTweets(msg.count);
            console.log("Got tweets");
            return {userId: userId, tweets: tweets};
        case "axiosPost":
            let response = await axios.post(msg.url, msg.request);
            console.log("Sent request");
            return response;
        default:
            console.log(`Unknown commmand ${msg.command} is specified.`);
            break;
    }
});


