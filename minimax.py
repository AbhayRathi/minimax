#!/usr/bin/env python3
"""
MiniMax - TikTok Content Generator
Transforms a single prompt into multiple TikTok-ready outputs with content safety checks.
"""

import re
import random
from typing import Dict, List, Any
from dataclasses import dataclass, field
from enum import Enum


class CreatorStyle(Enum):
    """Different creator styles for content generation"""
    EDUCATIONAL = "educational"
    ENTERTAINMENT = "entertainment"
    LIFESTYLE = "lifestyle"
    MOTIVATIONAL = "motivational"
    TRENDY = "trendy"
    STORYTELLING = "storytelling"


class ContentRisk(Enum):
    """Risk levels for content"""
    SAFE = "safe"
    CAUTION = "caution"
    HIGH_RISK = "high_risk"


@dataclass
class ContentFlag:
    """Content warning flags"""
    risk_level: ContentRisk
    reasons: List[str] = field(default_factory=list)
    is_ad_like: bool = False
    ad_score: float = 0.0


@dataclass
class TikTokContent:
    """Generated TikTok content output"""
    style: CreatorStyle
    hook: str
    script_outline: List[str]
    caption: str
    cta: str
    hashtags: List[str]
    flags: ContentFlag


class ContentSafetyChecker:
    """Checks content for ad-like patterns and risky content"""
    
    AD_KEYWORDS = [
        'buy now', 'click link', 'promo code', 'discount', 'limited time',
        'order now', 'shop now', 'get yours', 'exclusive deal', 'sale',
        'sponsored', 'partnership', 'affiliate', 'use code'
    ]
    
    RISKY_PATTERNS = [
        'guaranteed results', 'get rich quick', 'lose weight fast',
        'miracle cure', 'secret trick', 'doctors hate', 'one weird trick',
        'shocking truth', 'unbelievable', 'you won\'t believe'
    ]
    
    @classmethod
    def check_content(cls, text: str) -> ContentFlag:
        """Check content for ad-like patterns and risky elements"""
        text_lower = text.lower()
        reasons = []
        is_ad_like = False
        ad_score = 0.0
        
        # Check for ad-like content
        ad_matches = sum(1 for keyword in cls.AD_KEYWORDS if keyword in text_lower)
        if ad_matches > 0:
            is_ad_like = True
            ad_score = min(ad_matches / len(cls.AD_KEYWORDS), 1.0)
            reasons.append(f"Contains {ad_matches} promotional keywords")
        
        # Check for risky patterns
        risky_matches = [pattern for pattern in cls.RISKY_PATTERNS if pattern in text_lower]
        if risky_matches:
            reasons.append(f"Contains risky patterns: {', '.join(risky_matches[:3])}")
        
        # Determine risk level
        if len(risky_matches) >= 3 or ad_score > 0.5:
            risk_level = ContentRisk.HIGH_RISK
        elif len(risky_matches) > 0 or ad_score > 0.2:
            risk_level = ContentRisk.CAUTION
        else:
            risk_level = ContentRisk.SAFE
        
        return ContentFlag(
            risk_level=risk_level,
            reasons=reasons,
            is_ad_like=is_ad_like,
            ad_score=ad_score
        )


class HookGenerator:
    """Generates engaging hooks for TikTok videos"""
    
    HOOK_TEMPLATES = {
        CreatorStyle.EDUCATIONAL: [
            "Did you know that {}?",
            "Here's what nobody tells you about {}",
            "The truth about {} might surprise you",
            "3 facts about {} that changed my perspective",
            "Let me explain {} in 60 seconds"
        ],
        CreatorStyle.ENTERTAINMENT: [
            "Wait until you see what happens with {}",
            "POV: You just discovered {}",
            "When {} goes exactly as planned",
            "Nobody: ... Me: {}",
            "This {} moment is everything"
        ],
        CreatorStyle.LIFESTYLE: [
            "A day in my life with {}",
            "How {} changed my routine",
            "My honest review of {}",
            "Living with {} is actually...",
            "The reality of {} nobody shows"
        ],
        CreatorStyle.MOTIVATIONAL: [
            "If you're struggling with {}, watch this",
            "This {} lesson changed everything for me",
            "Why {} matters more than you think",
            "The {} journey nobody talks about",
            "Here's your sign to start {}"
        ],
        CreatorStyle.TRENDY: [
            "Everyone's talking about {} and here's why",
            "The {} trend but make it ✨aesthetic✨",
            "Doing the {} challenge because why not",
            "This {} is going viral for a reason",
            "Trying {} so you don't have to"
        ],
        CreatorStyle.STORYTELLING: [
            "Let me tell you about the time {}",
            "Story time: How {} completely changed things",
            "You won't believe what happened when {}",
            "Part 1: My experience with {}",
            "Storytime: The {} that nobody expected"
        ]
    }
    
    @classmethod
    def generate(cls, prompt: str, style: CreatorStyle) -> str:
        """Generate a hook based on prompt and style"""
        templates = cls.HOOK_TEMPLATES[style]
        template = random.choice(templates)
        
        # Extract key topic from prompt
        topic = cls._extract_topic(prompt)
        return template.format(topic)
    
    @staticmethod
    def _extract_topic(prompt: str) -> str:
        """Extract the main topic from prompt"""
        # Simple extraction - take the first few meaningful words
        words = prompt.split()
        if len(words) <= 3:
            return prompt
        return " ".join(words[:4])


class ScriptOutlineGenerator:
    """Generates script outlines for TikTok videos"""
    
    @classmethod
    def generate(cls, prompt: str, style: CreatorStyle) -> List[str]:
        """Generate a script outline based on prompt and style"""
        outlines = {
            CreatorStyle.EDUCATIONAL: cls._educational_outline(prompt),
            CreatorStyle.ENTERTAINMENT: cls._entertainment_outline(prompt),
            CreatorStyle.LIFESTYLE: cls._lifestyle_outline(prompt),
            CreatorStyle.MOTIVATIONAL: cls._motivational_outline(prompt),
            CreatorStyle.TRENDY: cls._trendy_outline(prompt),
            CreatorStyle.STORYTELLING: cls._storytelling_outline(prompt)
        }
        return outlines[style]
    
    @staticmethod
    def _educational_outline(prompt: str) -> List[str]:
        return [
            "🎬 Hook: Start with surprising fact or question",
            "📚 Context: Explain the background (5-10 seconds)",
            "💡 Main Points: Cover 3 key insights (20-30 seconds)",
            "🔍 Deep Dive: Elaborate on the most important point (10-15 seconds)",
            "✅ Conclusion: Summarize key takeaway (5 seconds)",
            "👉 CTA: Encourage engagement"
        ]
    
    @staticmethod
    def _entertainment_outline(prompt: str) -> List[str]:
        return [
            "🎬 Hook: Grab attention with humor or unexpected moment",
            "😄 Setup: Create the scenario (10 seconds)",
            "🎭 Build: Escalate the situation (15-20 seconds)",
            "💥 Climax: Deliver the punchline or peak moment (10 seconds)",
            "😂 Reaction: Show genuine reaction (5 seconds)",
            "👉 CTA: Ask viewers to share their experiences"
        ]
    
    @staticmethod
    def _lifestyle_outline(prompt: str) -> List[str]:
        return [
            "🎬 Hook: Show the end result or key moment",
            "🌅 Introduction: Set the scene (5-10 seconds)",
            "📸 Journey: Walk through the process or day (25-30 seconds)",
            "💭 Reflection: Share honest thoughts (10 seconds)",
            "⭐ Highlight: Show favorite part or tip (5 seconds)",
            "👉 CTA: Invite questions or suggestions"
        ]
    
    @staticmethod
    def _motivational_outline(prompt: str) -> List[str]:
        return [
            "🎬 Hook: Start with relatable struggle or bold statement",
            "💪 Problem: Acknowledge the challenge (10 seconds)",
            "🌟 Transformation: Share what changed (15 seconds)",
            "🔑 Lesson: Reveal key insights (15 seconds)",
            "🚀 Action Steps: Provide practical advice (10 seconds)",
            "👉 CTA: Encourage viewers to take action"
        ]
    
    @staticmethod
    def _trendy_outline(prompt: str) -> List[str]:
        return [
            "🎬 Hook: Jump on trend immediately",
            "🎵 Setup: Sync with trending sound (5 seconds)",
            "✨ Execution: Perform the trend with personal twist (20-25 seconds)",
            "🎨 Aesthetic Moment: Include visually pleasing shot (10 seconds)",
            "🔥 Finale: Strong ending with energy (5 seconds)",
            "👉 CTA: Challenge others to participate"
        ]
    
    @staticmethod
    def _storytelling_outline(prompt: str) -> List[str]:
        return [
            "🎬 Hook: Start with the most dramatic moment",
            "📖 Background: Set up the story (10 seconds)",
            "⚡ Rising Action: Build tension (15 seconds)",
            "🎯 Climax: Reveal the turning point (10 seconds)",
            "🌈 Resolution: Show the outcome (10 seconds)",
            "👉 CTA: Ask for viewers' similar stories"
        ]


class CaptionGenerator:
    """Generates captions for TikTok posts"""
    
    @classmethod
    def generate(cls, prompt: str, style: CreatorStyle) -> str:
        """Generate a caption based on prompt and style"""
        # Extract key elements from prompt
        topic = prompt[:50] + "..." if len(prompt) > 50 else prompt
        
        caption_styles = {
            CreatorStyle.EDUCATIONAL: cls._educational_caption(topic),
            CreatorStyle.ENTERTAINMENT: cls._entertainment_caption(topic),
            CreatorStyle.LIFESTYLE: cls._lifestyle_caption(topic),
            CreatorStyle.MOTIVATIONAL: cls._motivational_caption(topic),
            CreatorStyle.TRENDY: cls._trendy_caption(topic),
            CreatorStyle.STORYTELLING: cls._storytelling_caption(topic)
        }
        return caption_styles[style]
    
    @staticmethod
    def _educational_caption(topic: str) -> str:
        return f"Breaking down {topic} 📚✨\n\nSave this for later! Drop a 💡 if you learned something new.\n\n"
    
    @staticmethod
    def _entertainment_caption(topic: str) -> str:
        return f"When {topic} 😂💀\n\nTag someone who needs to see this!\n\n"
    
    @staticmethod
    def _lifestyle_caption(topic: str) -> str:
        return f"Real talk about {topic} ☕✨\n\nWhat's your experience? Comment below! 👇\n\n"
    
    @staticmethod
    def _motivational_caption(topic: str) -> str:
        return f"Your reminder about {topic} 💪🌟\n\nYou've got this! Share to inspire others.\n\n"
    
    @staticmethod
    def _trendy_caption(topic: str) -> str:
        return f"{topic} but make it ✨aesthetic✨\n\nWho else is trying this? 🔥\n\n"
    
    @staticmethod
    def _storytelling_caption(topic: str) -> str:
        return f"Story time: {topic} 📖\n\nPart 1 of ? Comment if you want part 2!\n\n"


class CTAGenerator:
    """Generates Call-To-Action statements"""
    
    CTA_TEMPLATES = {
        CreatorStyle.EDUCATIONAL: [
            "Follow for more educational content!",
            "Save this post for later reference!",
            "Share this with someone learning about this topic!",
            "Comment your questions below!",
            "What topic should I cover next?"
        ],
        CreatorStyle.ENTERTAINMENT: [
            "Tag a friend who relates!",
            "Follow for daily laughs!",
            "Drop a 😂 in the comments!",
            "Share if this made your day!",
            "Who else has experienced this?"
        ],
        CreatorStyle.LIFESTYLE: [
            "Let me know your thoughts in the comments!",
            "Follow for more lifestyle content!",
            "Share your own tips below!",
            "What would you do differently?",
            "Drop a ❤️ if you enjoyed this!"
        ],
        CreatorStyle.MOTIVATIONAL: [
            "Save this as your daily reminder!",
            "Tag someone who needs this today!",
            "Follow for daily motivation!",
            "Comment your goals below!",
            "Share to inspire your community!"
        ],
        CreatorStyle.TRENDY: [
            "Challenge accepted? Tag me in yours!",
            "Who's doing this next?",
            "Follow to catch all the trends!",
            "Duet this if you dare!",
            "Rate this trend 1-10!"
        ],
        CreatorStyle.STORYTELLING: [
            "Comment if you want Part 2!",
            "What do you think happens next?",
            "Share your similar story below!",
            "Follow for the full series!",
            "Which part surprised you most?"
        ]
    }
    
    @classmethod
    def generate(cls, style: CreatorStyle) -> str:
        """Generate a CTA based on style"""
        return random.choice(cls.CTA_TEMPLATES[style])


class HashtagGenerator:
    """Generates hashtag strategies for TikTok"""
    
    BASE_HASHTAGS = {
        CreatorStyle.EDUCATIONAL: [
            "fyp", "foryou", "educational", "learnontiktok", "todayilearned",
            "knowledge", "facts", "educational", "learn", "tutorial"
        ],
        CreatorStyle.ENTERTAINMENT: [
            "fyp", "foryou", "funny", "comedy", "humor",
            "entertainment", "viral", "trending", "memes", "relatable"
        ],
        CreatorStyle.LIFESTYLE: [
            "fyp", "foryou", "lifestyle", "dailyvlog", "lifestyleblogger",
            "dayinmylife", "aesthetic", "vlog", "reallife", "authentic"
        ],
        CreatorStyle.MOTIVATIONAL: [
            "fyp", "foryou", "motivation", "inspiration", "motivational",
            "mindset", "growth", "selfimprovement", "positivity", "success"
        ],
        CreatorStyle.TRENDY: [
            "fyp", "foryou", "trending", "viral", "trend",
            "tiktoktrend", "challenge", "aesthetic", "vibes", "popular"
        ],
        CreatorStyle.STORYTELLING: [
            "fyp", "foryou", "storytime", "story", "storytelling",
            "realstory", "mystory", "series", "part1", "storymode"
        ]
    }
    
    @classmethod
    def generate(cls, prompt: str, style: CreatorStyle) -> List[str]:
        """Generate hashtag strategy based on prompt and style"""
        # Get base hashtags for the style
        base = cls.BASE_HASHTAGS[style][:5]
        
        # Extract potential topic-specific hashtags from prompt
        words = prompt.lower().split()
        topic_tags = [word.strip('.,!?') for word in words 
                     if len(word) > 4 and word.isalpha()][:3]
        
        # Combine and ensure uniqueness
        all_tags = list(dict.fromkeys(base + topic_tags))
        
        return [f"#{tag}" for tag in all_tags[:8]]


class MiniMax:
    """Main TikTok content generation pipeline"""
    
    def __init__(self):
        self.hook_gen = HookGenerator()
        self.script_gen = ScriptOutlineGenerator()
        self.caption_gen = CaptionGenerator()
        self.cta_gen = CTAGenerator()
        self.hashtag_gen = HashtagGenerator()
        self.safety_checker = ContentSafetyChecker()
    
    def generate(self, prompt: str, styles: List[CreatorStyle] = None) -> List[TikTokContent]:
        """
        Transform a single prompt into multiple TikTok-ready outputs.
        
        Args:
            prompt: The input prompt/idea
            styles: List of creator styles to generate content for.
                   If None, generates for all styles.
        
        Returns:
            List of TikTokContent objects, one for each style
        """
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty")
        
        if styles is None:
            styles = list(CreatorStyle)
        
        results = []
        
        for style in styles:
            # Generate all components
            hook = self.hook_gen.generate(prompt, style)
            script_outline = self.script_gen.generate(prompt, style)
            caption = self.caption_gen.generate(prompt, style)
            cta = self.cta_gen.generate(style)
            hashtags = self.hashtag_gen.generate(prompt, style)
            
            # Check content safety
            combined_text = f"{hook} {caption} {cta}"
            flags = self.safety_checker.check_content(combined_text)
            
            content = TikTokContent(
                style=style,
                hook=hook,
                script_outline=script_outline,
                caption=caption,
                cta=cta,
                hashtags=hashtags,
                flags=flags
            )
            results.append(content)
        
        return results
    
    def format_output(self, content: TikTokContent) -> str:
        """Format a single TikTokContent object for display"""
        output = []
        output.append("=" * 80)
        output.append(f"CREATOR STYLE: {content.style.value.upper()}")
        output.append("=" * 80)
        output.append("")
        
        output.append("🎣 HOOK:")
        output.append(f"   {content.hook}")
        output.append("")
        
        output.append("📝 SCRIPT OUTLINE:")
        for line in content.script_outline:
            output.append(f"   {line}")
        output.append("")
        
        output.append("💬 CAPTION:")
        for line in content.caption.split('\n'):
            output.append(f"   {line}")
        output.append("")
        
        output.append("📣 CALL-TO-ACTION:")
        output.append(f"   {content.cta}")
        output.append("")
        
        output.append("🏷️  HASHTAGS:")
        output.append(f"   {' '.join(content.hashtags)}")
        output.append("")
        
        # Safety flags
        output.append("🛡️  CONTENT SAFETY:")
        output.append(f"   Risk Level: {content.flags.risk_level.value.upper()}")
        if content.flags.is_ad_like:
            output.append(f"   ⚠️  AD-LIKE CONTENT DETECTED (Score: {content.flags.ad_score:.2f})")
        if content.flags.reasons:
            output.append("   Flags:")
            for reason in content.flags.reasons:
                output.append(f"     - {reason}")
        if content.flags.risk_level == ContentRisk.SAFE and not content.flags.is_ad_like:
            output.append("   ✅ Content looks safe!")
        output.append("")
        
        return "\n".join(output)
    
    def generate_and_display(self, prompt: str, styles: List[CreatorStyle] = None) -> str:
        """Generate and format all content for display"""
        results = self.generate(prompt, styles)
        
        output = []
        output.append("\n" + "🎬" * 40)
        output.append("MINIMAX - TIKTOK CONTENT GENERATOR")
        output.append("🎬" * 40)
        output.append(f"\nINPUT PROMPT: {prompt}")
        output.append(f"\nGenerating content in {len(results)} creator style(s)...\n")
        
        for content in results:
            output.append(self.format_output(content))
        
        output.append("=" * 80)
        output.append("✨ Content generation complete!")
        output.append(f"Generated {len(results)} unique content variations")
        output.append("=" * 80)
        
        return "\n".join(output)


def main():
    """Example usage of MiniMax"""
    minimax = MiniMax()
    
    # Example prompts
    examples = [
        "How to start a morning routine that actually works",
        "My journey learning to code in 30 days",
        "This cooking hack will change your life"
    ]
    
    print("\n🚀 MiniMax TikTok Content Generator - Demo\n")
    
    for i, prompt in enumerate(examples, 1):
        print(f"\n{'='*80}")
        print(f"EXAMPLE {i}/{len(examples)}")
        print('='*80)
        
        # Generate for 2 styles to keep output manageable
        sample_styles = [CreatorStyle.EDUCATIONAL, CreatorStyle.MOTIVATIONAL]
        output = minimax.generate_and_display(prompt, sample_styles)
        print(output)
        
        if i < len(examples):
            print("\n" + "."*80 + "\n")


if __name__ == "__main__":
    main()
