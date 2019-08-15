function genPosNegReviewURLs(productPageURL) {
    let domain = productPageURL.split('/')[2];
    let product = productPageURL.match(/([A-Z]|[0-9]){10}/)[0];

    return {
        'pos': `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=positive&reviewerType=all_reviews&pageNumber=1`,
        'neg': `https://${domain}/product-reviews/${product}/` +
            `?ie=UTF8&filterByStar=critical&reviewerType=all_reviews&pageNumber=1`
    }
}

function getDocument(reviewURL) {
    return axios.get(reviewURL)
        .then(response => {
            let parser = new DOMParser();
            return parser.parseFromString(response.data, "text/html");
        })
        .catch(error => {
            console.log(error);
        })
}

function findProfileURLs(reviewDocument) {
    let profiles = reviewDocument.getElementsByClassName("a-profile");
    return Object.values(profiles).map(profile => profile.href);
}

let reviewURLs = genPosNegReviewURLs(location.href)
for (let reviewURL of Object.values(reviewURLs)) {
    getDocument(reviewURL)
        .then(findProfileURLs)
        .then(profileURLs => {
            console.log(profileURLs);
        });
}
