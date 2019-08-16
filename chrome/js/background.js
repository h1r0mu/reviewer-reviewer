async function getTweets(count) {
    OAuth.initialize('wgFu5bezL7NdCCK5giqQH_xDB4U');
    let result = await OAuth.popup("twitter");
    let response = await result.get('/1.1/account/verify_credentials.json');
    response = await result.get(`/1.1/statuses/user_timeline.json?screen_name=${response.screen_name}&count=${count}`)
    return response.map(res => res.text);
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg);//送られたメッセージをキャッチ
    getTweets(2)
        .then(console.log);
});

