import os
import unittest
from reviewer.utils.d3_utils import d3_formatter


class GetD3FormatterTest(unittest.TestCase):

    def test_d3_fomatter(self):
        with open(os.path.join(os.path.dirname(__file__), '../../resources/personality-v3-expect1.txt')) as expect_file:
            profile = expect_file.read()
        text_expected = d3_formatter(profile)
        # self.assertDictEqual(text_expected, {})
