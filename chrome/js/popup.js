$("#twitter").on("click", () => {
    console.log('twitter logout');
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "logoutTwitter"
        });
    });
});

$("#sort").on("click", () => {
    console.log('sort reviews by personality');
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "sortReviewsByPersonality"
        });
    });
});

