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

function getDocument(reviewUrl) {
    return axios.get(reviewUrl)
        .then(response => {
            let parser = new DOMParser();
            return parser.parseFromString(response.data, "text/html");
        })
        .catch(error => {
            console.log(error);
        })
}

function findUserUrls(reviewDocument) {
    let users = reviewDocument.getElementsByClassName("a-profile");
    return Object.values(users).map(user => user.href);
}

function findUserReviewUrls(userUrl) {
    return new Promise((resolve, reject) => {
        let iframe = document.createElement("iframe");
        iframe.src = userUrl;
        iframe.hidden = true;
        iframe.onload = () => {
            let userReviews = iframe
                .contentDocument
                .getElementsByClassName('a-link-normal profile-at-review-link a-text-normal');
            resolve(
                {
                    userUrl: userUrl,
                    reviewUrls: Object.values(userReviews).map(userReview => userReview.href)
                }
            );
            document.body.removeChild(iframe);
        };
        document.body.appendChild(iframe);
    })
}

function findUsersReviewUrls(userUrls) {
    return Promise.all(userUrls.map(findUserReviewUrls))
}

function getUserReviews(user) {
    return Promise.all(
        user.reviewUrls.map(url => {
            return getDocument(url)
                .then(reviewDocument => {
                        let reviewBody = reviewDocument
                            .getElementsByClassName('a-size-base review-text review-text-content');
                        return reviewBody[0].textContent;
                    }
                )
        }))
}

function getUsersReviews(usersReviewUrls) {
    return Promise.all(
        usersReviewUrls.map(user => {
                return getUserReviews(user)
                    .then(reviews => {
                            return {
                                userUrl: user.userUrl,
                                reviewUrls: user.reviewUrls,
                                reviews: reviews
                            }
                        }
                    )
            }
        )
    )
}


function sortReviewsByPersonality() {
    let reviewUrls = genPosNegReviewUrls(location.href)
    for (let reviewUrl of Object.values(reviewUrls)) {
        getDocument(reviewUrl)
            .then(findUserUrls)
            .then(findUsersReviewUrls)
            .then(getUsersReviews)
            .then(values => console.log(values))
            .catch(error => console.log(error))
        break;
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

    if (message.color == "red") {
        sortReviewsByPersonality();
    }
});
