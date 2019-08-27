import json
N = 1


def create_new_dict(personality, needs, values):
    personality_dict = {}
    needs_dict = {}
    values_dict = {}
    for p in personality:
        personality_dict[p["trait_id"]] = p["percentile"]
    for n in needs:
        needs_dict[n["trait_id"]] = n["percentile"]
    for v in values:
        values_dict[v["trait_id"]] = v["percentile"]
    return personality_dict, needs_dict, values_dict 


def calc_top_n_similarity(user_dict, reviewer_dict):
    sorted_user_dict = sorted(user_dict.items(), reverse=True, key=lambda x:abs(0.5-x[1]))
    keys = [sd[0] for sd in sorted_user_dict][:N] 
    similarity = 0
    for key in keys:
        diff = abs(float(user_dict[key]) - float(reviewer_dict[key]))
        similarity += (-1) * diff + 1 
    element_similarity = similarity / N 
    return element_similarity


def calc_similarity(user_profile, reviewer_profile):
    reviewer_data = json.loads(reviewer_profile)
    user_data = json.loads(user_profile)
    user_personality, user_needs, user_values = create_new_dict(
        user_data['personality'], user_data['needs'], user_data['values'])
    reviewer_personality, reviewer_needs, reviewer_values = create_new_dict(
        reviewer_data['personality'], reviewer_data['needs'], reviewer_data['values'])

    user_dicts = [user_personality, user_needs, user_values]
    reviewer_dicts = [reviewer_personality, reviewer_needs, reviewer_values]
    total_similarity = 0
    for ud, rd in zip(user_dicts, reviewer_dicts):
        total_similarity += calc_top_n_similarity(ud, rd)
    total_similarity = total_similarity / len(user_dicts)
    return total_similarity
