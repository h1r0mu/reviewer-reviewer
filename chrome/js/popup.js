const twitterButton = document.getElementById("twitter");
const sortButton = document.getElementById("sort");

twitterButton.onclick = () => {
    console.log('twitter logout');
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "logoutTwitter"
        });
    });
};

sortButton.onclick = () => {
    console.log('sort reviews by personality');
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
            command: "sortReviewsByPersonality"
        });
    });
};

