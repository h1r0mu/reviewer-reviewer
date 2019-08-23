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
    constructor(profileUrl, currentReviewElement, reviews = [], similarity = null, profile = null) {
        this.profileUrl = profileUrl;
        this.currentReviewElement = currentReviewElement;
        this.rawReviews = reviews;
        this.similarity = similarity;
        this.profile = profile;
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

    async removeUserId() {
        let userId = await this.getUserId();
        browser.storage.local.remove(`rr_profiles_${userId}`);
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

async function replaceReviews(reviewers) {
    reviewers = reviewers.filter(a => a.similarity != null).sort((a, b) => b.similarity - a.similarity);
    let parentElement = document.getElementsByClassName("a-section review-views celwidget")[0];
    while (parentElement.lastChild) {
        parentElement.removeChild(parentElement.lastChild);
    }
    for (let reviewer of reviewers) {
        let profileContent = reviewer.currentReviewElement.getElementsByClassName("a-profile-content")[0];
        console.log(reviewer);
        let newText = document.createTextNode(`  Similarity: ${reviewer.similarity}`);
        profileContent.appendChild(newText);
        console.log(profileContent.offsetWidth)
        let svgElement = await generateProfileChart(
            reviewer.profile,
            Math.round(document.body.offsetWidth * 0.5)
    );
        reviewer.currentReviewElement.appendChild(svgElement);
        parentElement.appendChild(reviewer.currentReviewElement);
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
    // let dummySimilarity = 0; //TODO: remove here
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
        newReviewers = await Promise.all(newReviewers.map(async reviewer => {
            let reviews = await storage.getProfileText(reviewer.id);
            if (reviews === undefined || reviews.length === 0) {
                let reviewUrls = await findReviewerReviewUrls(reviewer.profileUrl);
                reviews = await Promise.all(reviewUrls.map(getReviewerReviews));
                storage.setProfileText(reviewer.id, reviews);
            }
            reviewer = new Reviewer(reviewer.profileUrl, reviewer.currentReviewElement, reviews);
            if (reviews.length >= 20) {
                let response = await client.getProfilesSimilarity(user, reviewer);
                console.log(response);
                let similarity = response.data.similarity;
                let profile = JSON.parse(response.data.profile);
                // let similarity = ++dummySimilarity / 10 % 1; // TODO: remove here
                reviewer = new Reviewer(
                    reviewer.profileUrl,
                    reviewer.currentReviewElement,
                    reviews,
                    similarity,
                    profile
                );
            }
            return reviewer;
        }));
        Array.prototype.push.apply(reviewers, newReviewers);
    }
    console.log(reviewers)
    await replaceReviews(reviewers);
}

async function generateProfileChart(data, width) {
    console.log(width);
    let partition = data => d3.partition()
        .size([2 * Math.PI, radius])
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));
    let color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
    let format = d3.format(",d");
    let radius = width / 2.3;
    let arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius / 2)
        .innerRadius(d => d.y0 )
        .outerRadius(d => d.y1 - 1);
    const root = partition(data);

    const svg = d3.create("svg")
        .attr("viewBox", [-width/2, -width/2, width, width])
        .style("max-width", "100%")
        .style("height", "auto")
        .style("font", "20px sans-serif")
        .style("margin", "5px");

    svg.append("g")
        .attr("fill-opacity", 0.6)
        .selectAll("path")
        .data(root.descendants().filter(d => d.depth))
        .enter().append("path")
        .attr("fill", d => {
            while (d.depth > 1) d = d.parent;
            return color(d.data.name);
        })
        .attr("d", arc)
        .append("title")
        .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    svg.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
        .enter().append("text")
        .attr("transform", function (d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dy", "0.00em")
        .text(d => d.data.name);

    svg.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
        .enter().append("text")
        .attr("transform", function (d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dy", "1.00em")
        .text(d => {
            if (d.data.value !== undefined) {
                return d.data.value.toFixed(2);
            }
        });

    return svg.node();

}


chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {

    console.log(message);
    switch (message.command) {
        case "sortReviewsByPersonality":
            sortReviewsByPersonality();
            break;
        case "logoutTwitter":
            let storageWrapper = new StorageWrapper();
            storageWrapper.removeUserId();
            break;
        default:
            console.log("Unknown command specified.");
    }
});
