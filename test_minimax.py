#!/usr/bin/env python3
"""
Test suite for MiniMax TikTok Content Generator
"""

import unittest
from minimax import (
    MiniMax, CreatorStyle, ContentRisk,
    HookGenerator, ScriptOutlineGenerator, CaptionGenerator,
    CTAGenerator, HashtagGenerator, ContentSafetyChecker
)


class TestContentSafetyChecker(unittest.TestCase):
    """Test content safety checking functionality"""
    
    def test_safe_content(self):
        """Test that safe content is correctly identified"""
        text = "How to learn programming effectively"
        flag = ContentSafetyChecker.check_content(text)
        self.assertEqual(flag.risk_level, ContentRisk.SAFE)
        self.assertFalse(flag.is_ad_like)
    
    def test_ad_like_content(self):
        """Test that promotional content is flagged"""
        text = "Buy now with promo code for exclusive deal"
        flag = ContentSafetyChecker.check_content(text)
        self.assertTrue(flag.is_ad_like)
        self.assertGreater(flag.ad_score, 0)
    
    def test_risky_content(self):
        """Test that risky patterns are detected"""
        text = "Guaranteed results with this one weird trick doctors hate"
        flag = ContentSafetyChecker.check_content(text)
        self.assertGreater(len(flag.reasons), 0)
        self.assertIn(flag.risk_level, [ContentRisk.CAUTION, ContentRisk.HIGH_RISK])
    
    def test_high_risk_content(self):
        """Test high risk content detection"""
        text = "Buy now for guaranteed results with this shocking secret trick you won't believe"
        flag = ContentSafetyChecker.check_content(text)
        self.assertEqual(flag.risk_level, ContentRisk.HIGH_RISK)


class TestHookGenerator(unittest.TestCase):
    """Test hook generation"""
    
    def test_hook_generation_all_styles(self):
        """Test hook generation for all creator styles"""
        prompt = "How to start a morning routine"
        for style in CreatorStyle:
            hook = HookGenerator.generate(prompt, style)
            self.assertIsInstance(hook, str)
            self.assertGreater(len(hook), 0)
    
    def test_hook_contains_topic(self):
        """Test that hooks incorporate the prompt topic"""
        prompt = "coding tips"
        hook = HookGenerator.generate(prompt, CreatorStyle.EDUCATIONAL)
        self.assertIsInstance(hook, str)
        self.assertGreater(len(hook), 0)


class TestScriptOutlineGenerator(unittest.TestCase):
    """Test script outline generation"""
    
    def test_outline_generation_all_styles(self):
        """Test outline generation for all creator styles"""
        prompt = "Daily productivity tips"
        for style in CreatorStyle:
            outline = ScriptOutlineGenerator.generate(prompt, style)
            self.assertIsInstance(outline, list)
            self.assertGreater(len(outline), 0)
            self.assertEqual(len(outline), 6)  # Should have 6 parts
    
    def test_outline_format(self):
        """Test that outlines contain proper structure"""
        prompt = "Test prompt"
        outline = ScriptOutlineGenerator.generate(prompt, CreatorStyle.EDUCATIONAL)
        # Check that it starts with a hook
        self.assertIn("Hook", outline[0])


class TestCaptionGenerator(unittest.TestCase):
    """Test caption generation"""
    
    def test_caption_generation_all_styles(self):
        """Test caption generation for all creator styles"""
        prompt = "Fitness journey"
        for style in CreatorStyle:
            caption = CaptionGenerator.generate(prompt, style)
            self.assertIsInstance(caption, str)
            self.assertGreater(len(caption), 0)


class TestCTAGenerator(unittest.TestCase):
    """Test CTA generation"""
    
    def test_cta_generation_all_styles(self):
        """Test CTA generation for all creator styles"""
        for style in CreatorStyle:
            cta = CTAGenerator.generate(style)
            self.assertIsInstance(cta, str)
            self.assertGreater(len(cta), 0)


class TestHashtagGenerator(unittest.TestCase):
    """Test hashtag generation"""
    
    def test_hashtag_generation_all_styles(self):
        """Test hashtag generation for all creator styles"""
        prompt = "Cooking tutorial"
        for style in CreatorStyle:
            hashtags = HashtagGenerator.generate(prompt, style)
            self.assertIsInstance(hashtags, list)
            self.assertGreater(len(hashtags), 0)
            # Check that all hashtags start with #
            for tag in hashtags:
                self.assertTrue(tag.startswith("#"))
    
    def test_hashtag_uniqueness(self):
        """Test that hashtags don't contain duplicates"""
        prompt = "Test prompt"
        hashtags = HashtagGenerator.generate(prompt, CreatorStyle.EDUCATIONAL)
        self.assertEqual(len(hashtags), len(set(hashtags)))


class TestMiniMax(unittest.TestCase):
    """Test main MiniMax pipeline"""
    
    def setUp(self):
        self.minimax = MiniMax()
    
    def test_generate_all_styles(self):
        """Test generating content for all styles"""
        prompt = "How to be productive"
        results = self.minimax.generate(prompt)
        self.assertEqual(len(results), 6)  # Should generate for all 6 styles
    
    def test_generate_specific_styles(self):
        """Test generating content for specific styles"""
        prompt = "Test prompt"
        styles = [CreatorStyle.EDUCATIONAL, CreatorStyle.ENTERTAINMENT]
        results = self.minimax.generate(prompt, styles)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].style, CreatorStyle.EDUCATIONAL)
        self.assertEqual(results[1].style, CreatorStyle.ENTERTAINMENT)
    
    def test_empty_prompt(self):
        """Test that empty prompts raise ValueError"""
        with self.assertRaises(ValueError):
            self.minimax.generate("")
    
    def test_content_structure(self):
        """Test that generated content has all required fields"""
        prompt = "Test content"
        results = self.minimax.generate(prompt, [CreatorStyle.EDUCATIONAL])
        content = results[0]
        
        self.assertIsNotNone(content.style)
        self.assertIsNotNone(content.hook)
        self.assertIsNotNone(content.script_outline)
        self.assertIsNotNone(content.caption)
        self.assertIsNotNone(content.cta)
        self.assertIsNotNone(content.hashtags)
        self.assertIsNotNone(content.flags)
    
    def test_safety_check_integration(self):
        """Test that safety checks are performed"""
        prompt = "Buy now for guaranteed results"
        results = self.minimax.generate(prompt, [CreatorStyle.EDUCATIONAL])
        content = results[0]
        
        # Should detect promotional content
        self.assertIsNotNone(content.flags)
        self.assertIsNotNone(content.flags.risk_level)
    
    def test_format_output(self):
        """Test output formatting"""
        prompt = "Test prompt"
        results = self.minimax.generate(prompt, [CreatorStyle.EDUCATIONAL])
        formatted = self.minimax.format_output(results[0])
        
        self.assertIsInstance(formatted, str)
        self.assertGreater(len(formatted), 0)
        self.assertIn("HOOK", formatted)
        self.assertIn("SCRIPT OUTLINE", formatted)
        self.assertIn("CAPTION", formatted)
        self.assertIn("CALL-TO-ACTION", formatted)
        self.assertIn("HASHTAGS", formatted)
        self.assertIn("CONTENT SAFETY", formatted)
    
    def test_generate_and_display(self):
        """Test the complete generate and display pipeline"""
        prompt = "Quick cooking tips"
        output = self.minimax.generate_and_display(
            prompt, 
            [CreatorStyle.EDUCATIONAL]
        )
        
        self.assertIsInstance(output, str)
        self.assertGreater(len(output), 0)
        self.assertIn(prompt, output)
        self.assertIn("EDUCATIONAL", output)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling"""
    
    def test_very_long_prompt(self):
        """Test handling of very long prompts"""
        minimax = MiniMax()
        prompt = "A " * 100 + "long prompt"
        results = minimax.generate(prompt, [CreatorStyle.EDUCATIONAL])
        self.assertEqual(len(results), 1)
    
    def test_special_characters_in_prompt(self):
        """Test handling of special characters"""
        minimax = MiniMax()
        prompt = "Test!@#$%^&*()_+-=[]{}|;:',.<>?/~`"
        results = minimax.generate(prompt, [CreatorStyle.EDUCATIONAL])
        self.assertEqual(len(results), 1)
    
    def test_unicode_in_prompt(self):
        """Test handling of unicode characters"""
        minimax = MiniMax()
        prompt = "Testing with emojis 🎬🎥🎞️"
        results = minimax.generate(prompt, [CreatorStyle.ENTERTAINMENT])
        self.assertEqual(len(results), 1)


def run_tests():
    """Run all tests"""
    unittest.main(argv=[''], exit=False, verbosity=2)


if __name__ == '__main__':
    print("🧪 Running MiniMax Test Suite\n")
    run_tests()
    print("\n✅ All tests completed!")
