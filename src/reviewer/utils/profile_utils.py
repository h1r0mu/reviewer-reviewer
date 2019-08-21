import json
import sys

def load_json(user_file, reviewer_file):
    with open(user_file, 'r') as f:
        user_data = json.load(f)
    with open(reviewer_file, 'r') as f:
        reviewer_data = json.load(f)
    return reviewer_data, user_data


def create_new_dict(personality, needs, values):
    new_dict = {}
    for p in personality:
        new_dict[p["trait_id"]] = p["percentile"]
    for n in needs:
        new_dict[n["trait_id"]] = n["percentile"]
    for v in values:
        new_dict[v["trait_id"]] = v["percentile"]
    return new_dict


def similarity_func(diff, reliability):
    if reliability == 'High':
        value = (-1) * diff + 1
    elif reliability == 'Medium':
        value = (-2/3) * diff + 2/3
    elif reliability == 'Low':
        value = (-1/3) * diff + 1/3
    return value


def calc_element_similarity(user_dict, reviewer_dict, reliability):
    similarity = 0
    for ud, rd in zip(user_dict.values(), reviewer_dict.values()):
        diff = abs(float(ud) - float(rd))
        similarity += similarity_func(diff, reliability)
    total_similarity = similarity / len(user_dict)
    return total_similarity


def calc_similarity(user_profile, reviewer_profile):
    reviewer_data, user_data = load_json(reviewer_profile, user_profile)
    if reviewer_data['word_count'] > 5000:
        reliability = 'High'
    elif reviewer_data['word_count'] <= 1500:
        reliability = 'Low'
    else:
        reliability = 'Meduim'
    user_dict = create_new_dict(user_data['personality'],\
                                user_data['needs'], user_data['values'])
    reviewer_dict = create_new_dict(reviewer_data['personality'],\
                                  reviewer_data['needs'], reviewer_data['values'])
    total_similarity = calc_element_similarity(user_dict, reviewer_dict, reliability)
    print(f'Similarity: {(total_similarity * 100):.2f}%')
    return total_similarity
