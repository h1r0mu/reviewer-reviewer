import json


def create_new_dict(trait_set):
    name_list = ["personality", "needs", "values"]
    d3_dict_element = {}
    count = 0
    full_text = ''
    for ts in trait_set:
        children = []
        for t in ts:
            children.append({"name": t['name'], "value": t['percentile']})
        d3_dict_element["name"] = name_list[count]
        d3_dict_element["children"] = children
        text = json.dumps(d3_dict_element)
        full_text = (full_text + ',' + text).strip(',')
        count += 1
    d3_dict = '{"name": "flare", "children":[' + full_text + ']}'
    return d3_dict


def d3_formatter(reviewer_profile):
    reviewer_data = json.loads(reviewer_profile)
    train_set = [reviewer_data['personality'], reviewer_data['needs'], reviewer_data['values']]
    d3_dict = create_new_dict(train_set)
    return d3_dict


if __name__ == '__main__':
    file = '../../resources/personality-v3-expect1.txt'
    with open(file, 'r') as f:
        profile = f.read()
    d3_formatter(profile)
