async function getTweets(count = 200) {
    OAuth.initialize('wgFu5bezL7NdCCK5giqQH_xDB4U');
    let result = await OAuth.popup("twitter");
    let credentials = await result.get('/1.1/account/verify_credentials.json');
    let timeline = await result.get(`/1.1/statuses/user_timeline.json?screen_name=${credentials.screen_name}&count=${count}`)
    let user_id = credentials.screen_name;
    let tweets = timeline.map(tweet => tweet.text);
    return [user_id, tweets];
}


chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
    console.log(msg);
    switch (msg.command) {
        case "getTweets":
            let tweets = await getTweets();
            sendResponse({tweets: tweets});
            // chrome.tabs.sendMessage(sender.tab.id, {
            //     type: "sendResponse",
            //     command: "getTweest",
            //     tweets: tweets
            // });
            break;
        case "axiosPost":
            let response = await axios.post(url, request);
            chrome.tabs.sendMessage(sender.tab.id, {
                type: 'sendResponse',
                response: response
            });
            break;
        default:
            console.log(`Unknown commmand ${msg.command} is specified.`);
            break;
    }
});


