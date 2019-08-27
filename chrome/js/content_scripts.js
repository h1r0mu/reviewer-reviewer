const MIN_REVIEW_LENGTH = 20;

class AmazonHelper {


    static genPosNegReviewUrls(productUrl) {
        const domain = productUrl.split('/')[2];
        const product = productUrl.match(/([A-Z]|[0-9]){10}/)[0];
        const posUrl = `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=positive&reviewerType=all_reviews&pageNumber=1`;
        const negUrl = `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=critical&reviewerType=all_reviews&pageNumber=1`;

        return [posUrl, negUrl];
    }


    static async findReviewElements(url) {
        const reviewPageDocument = await AmazonHelper.getReviewPageDocument(url);
        let elements = reviewPageDocument.getElementsByClassName("a-section review aok-relative");
        return Object.values(elements);
    }

    static findReviewerProfileUrl(reviewElement) {
        const user = reviewElement.getElementsByClassName("a-profile")[0];
        return user.href;
    }

    static getReviewLinkElements(targetDocument) {
        const reviewElements = targetDocument.getElementsByClassName('a-link-normal profile-at-review-link a-text-normal');
        return Object.values(reviewElements).map(elem => elem.href);
    }

    static findReviewerReviewUrls(url) {
        return new Promise(async (resolve, reject) => {

            const iframe = createIframe(url);
            iframe.onload = async () => {
                await scrollToBottom(iframe.contentWindow);
                const reviewUrls = AmazonHelper.getReviewLinkElements(iframe.contentDocument);
                resolve(reviewUrls);
                document.body.removeChild(iframe);
            };
            document.body.appendChild(iframe);
        });
    }

    static async getReviewerReviews(url) {
        let reviewDocument = await getDocument(url);
        let reviewBody = reviewDocument.getElementsByClassName('a-size-base review-text review-text-content');
        return reviewBody[0].textContent;
    }

    static getReviewPageDocument(url) {
        return new Promise((resolve, reject) => {
            const iframe = createIframe(url);
            iframe.onload = () => {
                resolve(iframe.contentDocument);
                document.body.removeChild(iframe);
            };
            document.body.appendChild(iframe);
        });
    }

    static async replaceReviews(reviewers) {
        reviewers = reviewers.filter(a => a.similarity != null).sort((a, b) => b.similarity - a.similarity);
        const parentElement = document.getElementsByClassName("a-section review-views celwidget")[0];
        while (parentElement.lastChild) {
            parentElement.removeChild(parentElement.lastChild);
        }
        for (const reviewer of reviewers) {
            const element = reviewer.currentReviewElement;
            const profileElement = element.getElementsByClassName("a-profile-content")[0];
            const newText = document.createTextNode(`  Similarity: ${reviewer.similarity}`);
            const svgElement = await generateProfileChart(
                reviewer.profile,
                Math.trunc(document.body.offsetWidth * 0.5)
            );
            profileElement.appendChild(newText);
            element.appendChild(svgElement);
            parentElement.appendChild(element);
        }
    }

    static async sortReviewsByPersonality() {
        const user = await User.getOrCreate();
        const topReviewUrls = AmazonHelper.genPosNegReviewUrls(location.href);
        let reviewers = [];
        for (const topReviewUrl of topReviewUrls) {
            const reviewElements = await AmazonHelper.findReviewElements(topReviewUrl);
            const newReviewers = await Promise.all(reviewElements.map(Reviewer.getOrCreate));
            await Promise.all(
                newReviewers
                .filter(reviewer => reviewer.rawReviews.length >= MIN_REVIEW_LENGTH)
                .map(async reviewer => {
                    const response = await Client.getProfilesSimilarity(
                        user.id,
                        user.tweets,
                        reviewer.id,
                        reviewer.reviews
                    );
                    console.log(response);
                    reviewer.similarity = response.data.similarity;
                    reviewer.profile = JSON.parse(response.data.profile);
                }));
            Array.prototype.push.apply(reviewers, newReviewers);
        }
        console.log(reviewers);
        await AmazonHelper.replaceReviews(reviewers);
    }

    static profileUrlToId(profileUrl) {
        return profileUrl.split('/')[5].split('.')[2];
    }


    static async getReviews(id, profileUrl) {
        let reviewUrls = await AmazonHelper.findReviewerReviewUrls(profileUrl);
        reviewUrls = removeDuplicates(reviewUrls);
        const reviews = await Promise.all(reviewUrls.map(AmazonHelper.getReviewerReviews));
        console.log(reviews);
        return reviews;
    }
}

class Client {
    static get url() {return "http://localhost:8000/api/v1/profiles/similarity"}

    static async getProfilesSimilarity(user_id, user_text, reviewer_id, reviewer_text) {
        const msg = {
            command: "axiosPost",
            url: this.url,
            request: {
                user_id: user_id,
                user_text: user_text,
                reviewer_id: reviewer_id,
                reviewer_text: reviewer_text
            }
        };
        console.log('Send msg', msg);
        return await browser.runtime.sendMessage(msg);
    }
}


class Reviewer {
    constructor(profileUrl, id, currentReviewElement, reviews, similarity = null, profile = null) {
        this.profileUrl = profileUrl;
        this.id = id;
        this.currentReviewElement = currentReviewElement;
        this.rawReviews = reviews;
        this.similarity = similarity;
        this.profile = profile;
    }

    get reviews() {
        return this.rawReviews.join(' ');
    }

    static async getOrCreate(reviewElement) {
        const profileUrl = AmazonHelper.findReviewerProfileUrl(reviewElement);
        const id = AmazonHelper.profileUrlToId(profileUrl);
        let reviews = await Storage.getProfileText(id);
        if (reviews === undefined || reviews.length < MIN_REVIEW_LENGTH) {
            reviews = await AmazonHelper.getReviews(id, profileUrl);
            await Storage.setProfileText(id, reviews);
        }
        return new Reviewer(profileUrl, id, reviewElement, reviews);
    }

}

class Storage {

    static getUserId() {
        return Storage.getProfileText('user_id');
    }

    static setUserId(userId) {
        return Storage.setProfileText('user_id', userId);
    }

    static async removeUserId() {
        const userId = await Storage.getUserId();
        browser.storage.local.remove(`rr_profiles_${userId}`);
    }

    static async getProfileText(id) {
        const value = await browser.storage.local.get(`rr_profiles_${id}`);
        return value[`rr_profiles_${id}`];
    }

    static async setProfileText(id, text) {
        browser.storage.local.set({[`rr_profiles_${id}`]: text});
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

    static async getOrCreate() {
        let userId = await Storage.getUserId();
        let tweets = await Storage.getProfileText(userId);
        if ((userId === undefined || tweets === undefined)) {
            [userId, tweets] = await getTweets();
            await Storage.setUserId(userId);
            await Storage.setProfileText(userId, tweets);
        }
        return new User(userId, tweets);
    }
}

const removeDuplicates = array => Array.from(new Set(array));

const sleep = timeout => new Promise(r => setTimeout(r, timeout));

const createIframe = url => {
    let iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.hidden = true;
    return iframe;
};

const generateProfileChart = async (data, width) => {
    const partition = data => d3.partition()
        .size([2 * Math.PI, radius])
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));
    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
    const format = d3.format(",d");
    const radius = width / 2.3;
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius / 2)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1 - 1);
    const root = partition(data);

    const svg = d3.create("svg")
        .attr("viewBox", [-width / 2, -width / 2, width, width])
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

};

const getDocument = async url => {
    const parser = new DOMParser();
    try {
        const response = await axios.get(url);
        return parser.parseFromString(response.data, "text/html");
    } catch (err) {
        console.log(err);
    }
};

const getTweets = async (count = 200) => {
    const msg = {
        command: 'getTweets',
        count: count
    };
    const response = await browser.runtime.sendMessage(msg);
    return [response.userId, response.tweets];
};

const scrollToBottom = async (targetWindow, delay = 100, timeout = 5000) => {
    const scroll = () => targetWindow.scrollTo(0, targetWindow.document.body.scrollHeight);
    const interval = setInterval(scroll, this.delay);
    await sleep(timeout);
    clearInterval(interval);
};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    console.log(message);
    switch (message.command) {
        case "sortReviewsByPersonality":
            await AmazonHelper.sortReviewsByPersonality();
            break;
        case "logoutTwitter":
            await Storage.removeUserId();
            break;
        default:
            console.log("Unknown command specified.");
    }
});
