class Client {
    constructor() {
        this.url = "http://localhost:8000/api/v1/profiles/similarity"
    }

    async getProfilesSimilarity(user, reviewer) {
        let msg = {
            command: "axiosPost",
            url: this.url,
            request: {
                user_id: user.id,
                user_text: user.tweets,
                reviewer_id: reviewer.id,
                reviewer_text: reviewer.reviews
            }
        };
        console.log('Send msg', msg);
        return await browser.runtime.sendMessage(msg);
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
    constructor(profileUrl, currentReviewElement, reviews = [], similarity = null) {
        this.profileUrl = profileUrl;
        this.currentReviewElement = currentReviewElement;
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

class StorageWrapper {

    getUserId() {
        return this.getProfileText('user_id');
    }

    setUserId(userId) {
        return this.setProfileText('user_id', userId);
    }

    async getProfileText(id) {
        let value = await browser.storage.local.get(`rr_profiles_${id}`);
        return value[`rr_profiles_${id}`];
    }

    async setProfileText(id, text) {
        browser.storage.local.set({[`rr_profiles_${id}`]: text});
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
        command: 'getTweets',
        count: count
    };
    let response = await browser.runtime.sendMessage(msg);
    return [response.userId, response.tweets];
}

function findReviewerProfileUrl(reviewElement) {
    let user = reviewElement.getElementsByClassName("a-profile")[0];
    return user.href;
}

function findReviewElements(reviewPageDocument) {
    // TODO: remove slice
    let elements = reviewPageDocument.getElementsByClassName("a-section review aok-relative");

    return Object.values(elements);
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
            resolve(Object.values(userReviews).map(userReview => userReview.href));
            document.body.removeChild(iframe);
        };
        document.body.appendChild(iframe);
    })
}

async function getReviewerReviews(url) {
    let reviewDocument = await getDocument(url);
    let reviewBody = reviewDocument.getElementsByClassName('a-size-base review-text review-text-content');
    return reviewBody[0].textContent;
}

function replaceReviews(reviewers) {
    let parentElement = document.getElementsByClassName("a-section review-views celwidget")[0];
    while (parentElement.lastChild) {
        parentElement.removeChild(parentElement.lastChild);
    }
    for (let review of reviewers) {
        parentElement.appendChild(review.currentReviewElement);
    }
}

function getReviewPageDocument(url) {
    return new Promise((resolve, reject) => {
        let iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.hidden = true;
        iframe.onload = () => {
            resolve(iframe.contentDocument);
            document.body.removeChild(iframe);
        };
        console.log('add iframe for ', url)
        document.body.appendChild(iframe);
    })
}

async function sortReviewsByPersonality() {
    let client = new Client();
    let storage = new StorageWrapper();
    let userId = await storage.getUserId();
    let tweets = await storage.getProfileText(userId);
    if ((userId === undefined || tweets === undefined)) {
        [userId, tweets] = await getTweets();
        storage.setUserId(userId);
        storage.setProfileText(userId, tweets);
    }
    let user = new User(userId, tweets);
    let topReviewUrls = genPosNegReviewUrls(location.href);
    let reviewers = [];
    for (let topReviewUrl of Object.values(topReviewUrls)) {
        let reviewPageDocument = await getReviewPageDocument(topReviewUrl);
        let reviewElements = await findReviewElements(reviewPageDocument);
        let newReviewers = reviewElements.map(elem => {
            let profileUrl = findReviewerProfileUrl(elem);
            console.log(profileUrl);
            return new Reviewer(profileUrl, elem);
        });
        console.log(newReviewers);
        newReviewers.map(async reviewer => {
            let reviews = await storage.getProfileText(reviewer.id);
            if (reviews === undefined) {
                let reviewUrls = await findReviewerReviewUrls(reviewer.profileUrl);
                reviews = await Promise.all(reviewUrls.map(getReviewerReviews));
                storage.setProfileText(reviewer.id, reviews);
            }
            reviewer = new Reviewer(reviewer.profileUrl, reviewer.currentReviewElement, reviews);
            // if (reviews.length >= 20) {
            //     similarity = await client.getProfilesSimilarity(user, reviewer);
            //     reviewer = new Reviewer(reviewer.profileUrl, reviewer.currentReviewElement, reviews, similarity);
            // }
            return reviewer;
        });
        Array.prototype.push.apply(reviewers, newReviewers);
    }
    console.log(reviewers)
    replaceReviews(reviewers);
}


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

    if (message.color == "red") {
        console.log(message);
        sortReviewsByPersonality();
    }
});
