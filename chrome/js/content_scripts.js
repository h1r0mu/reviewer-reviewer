class Message {
    constructor(command, func) {
        this.command = command;
        this.func = func;
    }
}

class Client {
    constructor() {
        this.url = "http://localhost:8000/api/v1/profiles/similarity"
    }

    async getProfilesSimilarity(user, reviewer) {
        let msg = {
            command: 'axiosPost',
            url: this.url,
            request: {
                user_id: user.id,
                user_text: user.tweets,
                reviewer_id: reviewer.id,
                reviewer_text: reviewer.reviews
            }
        };
        return new Promise((resolve, reject) => {
            console.log('send request');
            chrome.runtime.sendMessage(msg);
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === "sendResponse" && message.command === "axiosPost") {
                    resolve(message.response);
                }
            });
        });
    }
}


class User {
    constructor(id, tweets = []) {
        this.id = id;
        this.rawTweets = tweets;
    }

    get tweets() {
        return this.rawTweets.join(' ');
    }
}

class Reviewer {
    constructor(profileUrl, reviews = [], similarity = null) {
        this.profileUrl = profileUrl;
        this.rawReviews = reviews;
        this.similarity = similarity;
    }

    get id() {
        return this.profileUrl.split('/')[5].split('.')[2];
    }

    get reviews() {
        return this.rawReviews.join(' ');
    }
}

class ChromeStorageWrapper {

    getUserId() {
        return this.getProfileText('user_id');
    }

    setUserId(userId) {
        return this.setProfileText('user_id', userId);
    }

    getProfileText(id) {
        let value = "";
        chrome.storage.local.get([`rr_profiles_${id}`], result => {
            value = result[`rr_profiles_${id}`];
        })
        return value;
    }

    setProfileText(id, text) {
        chrome.storage.local.set({[`rr_profiles_${id}`]: text});
    }
}

function genPosNegReviewUrls(productUrl) {
    let domain = productUrl.split('/')[2];
    let product = productUrl.match(/([A-Z]|[0-9]){10}/)[0];

    return {
        pos: `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=positive&reviewerType=all_reviews&pageNumber=1`,
        neg: `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=critical&reviewerType=all_reviews&pageNumber=1`
    }
}

async function getDocument(reviewUrl) {
    let parser = new DOMParser();
    try {
        let response = await axios.get(reviewUrl);
        return parser.parseFromString(response.data, "text/html");
    } catch (err) {
        console.log(err);
    }
}

async function getTweets(count = 200) {
    let msg = {
        command: 'getTweets'
    };
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(msg, response => {
            console.log(response);
            resolve(response.tweets);
        });
        // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        //     if (message.type === "sendResponse" && message.command === "getTweets") {
        //         resolve(message.tweets);
        //     }
        // });
    });
}

function findReviewerProfileUrls(reviewDocument) {
    // TODO: remove slice
    let users = reviewDocument.getElementsByClassName("a-profile");
    return Object.values(users).map(user => user.href).slice(0, 2);
}

function findReviewerReviewUrls(url) {
    return new Promise((resolve, reject) => {
        let iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.hidden = true;
        iframe.onload = () => {
            let userReviews = iframe
                .contentDocument
                .getElementsByClassName('a-link-normal profile-at-review-link a-text-normal');
            document.body.removeChild(iframe);
            resolve(Object.values(userReviews).map(userReview => userReview.href));
        };
        document.body.appendChild(iframe);
    })
}

async function getReviewerReviews(url) {
    let reviewDocument = await getDocument(url);
    let reviewBody = reviewDocument.getElementsByClassName('a-size-base review-text review-text-content');
    return reviewBody[0].textContent;
}

async function sortReviewsByPersonality() {
    let client = new Client();
    let storage = new ChromeStorageWrapper();
    let user_id = storage.getUserId();
    let tweets = storage.getProfileText(user_id);
    if ((user_id == false || tweets == false)) {
        user_id, tweets = await getTweets();
        storage.setUserId(user_id);
        storage.setProfileText(user_id, tweets);
    }
    let user = new User(user_id, tweets);
    let reviewUrls = genPosNegReviewUrls(location.href);
    for (let reviewUrl of Object.values(reviewUrls)) {

        let reviewPageDocument = await getDocument(reviewUrl);
        let reviewerProfileUrls = await findReviewerProfileUrls(reviewPageDocument);
        let reviewers = reviewerProfileUrls.map(url => {
            return new Reviewer(url);
        });
        reviewers.map(async reviewer => {
            let texts = storage.getProfileText(reviewer.id);
            if (texts == "") {
                let reviewUrls = await findReviewerReviewUrls(reviewer.profileUrl);
                reviewer.reviews = await Promise.all(reviewUrls.map(getReviewerReviews));
                storage.setProfileText(reviewer.id, reviewer.reviews);
            }
            client.getProfilesSimilarity(user, reviewer);
        });
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

    if (message.color == "red") {
        console.log(message);
        sortReviewsByPersonality();
    }
});
