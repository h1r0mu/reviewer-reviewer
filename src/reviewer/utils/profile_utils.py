import json
N = 5


def create_new_dict(personality, needs, values):
    dict = {}
    for p in personality:
        dict[p["trait_id"]] = p["percentile"]
    for n in needs:
        dict[n["trait_id"]] = n["percentile"]
    for v in values:
        dict[v["trait_id"]] = v["percentile"]
    return dict


def calc_top_n_similarity(user_dict, reviewer_dict):
    sorted_user_dict = sorted(user_dict.items(), reverse=True, key=lambda x : x[1])
    keys = [sd[0] for sd in sorted_user_dict][:N] 
    similarity = 0
    for key in keys:
        diff = abs(float(user_dict[key]) - float(reviewer_dict[key]))
        similarity += (-1) * diff + 1 
    total_similarity = similarity / N 
    return total_similarity


def calc_similarity(user_profile, reviewer_profile):
    reviewer_data = json.loads(reviewer_profile)
    user_data = json.loads(user_profile)

    user_dict = create_new_dict(user_data['personality'],
                                user_data['needs'], user_data['values'])
    reviewer_dict = create_new_dict(reviewer_data['personality'],
                                    reviewer_data['needs'], reviewer_data['values'])
    total_similarity = calc_top_n_similarity(user_dict, reviewer_dict)
    return total_similarity
