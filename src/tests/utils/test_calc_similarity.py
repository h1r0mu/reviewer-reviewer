import os
import unittest
from reviewer.utils.profile_utils import calc_similarity


class GetCalcSimilarityTest(unittest.TestCase):

    def test_get_similarity(self):
        with open(os.path.join(os.path.dirname(__file__), '../../resources/personality-v3-expect1.txt')) as expect_file:
            profile = expect_file.read()

        value_expected = calc_similarity(profile, profile)
        self.assertAlmostEqual(value_expected, 1 / 3)
