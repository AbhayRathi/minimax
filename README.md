# MiniMax - TikTok Content Generator 🎬

**Transform a single prompt into multiple TikTok-ready outputs in seconds.**

MiniMax is a powerful content generation system that takes your idea and instantly creates hooks, script outlines, captions, CTAs, and hashtag strategies across different creator styles. It also flags potentially risky or overly promotional content to keep your brand safe.

## ✨ Features

- **🎣 Hook Generation**: Attention-grabbing opening lines tailored to each creator style
- **📝 Script Outlines**: Detailed video structure with timing and key moments
- **💬 Captions**: Engaging post captions with emojis and formatting
- **📣 CTAs**: Strategic call-to-action statements to boost engagement
- **🏷️ Hashtag Strategies**: Optimized hashtag combinations for discoverability
- **🎭 Multiple Creator Styles**: Generate content in 6 different styles:
  - Educational
  - Entertainment
  - Lifestyle
  - Motivational
  - Trendy
  - Storytelling
- **🛡️ Content Safety**: Automatic detection of:
  - Overly promotional/ad-like content
  - Risky patterns (clickbait, misleading claims)
  - Content risk scoring

## 🚀 Quick Start

### Basic Usage

```bash
# Generate content for all creator styles
python cli.py "How to start a successful morning routine"

# Generate for specific styles
python cli.py "My coding journey" --styles educational,motivational

# Save output to file
python cli.py "Cooking hack" --output results.txt
```

### Python API

```python
from minimax import MiniMax, CreatorStyle

# Initialize the generator
minimax = MiniMax()

# Generate content for all styles
results = minimax.generate("Your content idea here")

# Generate for specific styles
results = minimax.generate(
    "Your content idea here",
    styles=[CreatorStyle.EDUCATIONAL, CreatorStyle.TRENDY]
)

# Display formatted output
output = minimax.generate_and_display("Your content idea here")
print(output)
```

## 📦 Installation

No external dependencies required! MiniMax uses only Python's standard library.

```bash
# Clone the repository
git clone https://github.com/AbhayRathi/minimax.git
cd minimax

# Run directly
python minimax.py
```

## 💡 Usage Examples

### Example 1: Educational Content

**Input:**
```
"How to start a morning routine that actually works"
```

**Output includes:**
- Hook: "Did you know that How to start a morning routine?"
- 6-part script outline with timing
- Caption with educational tone
- CTA focused on learning
- Hashtags: #fyp #foryou #educational #learnontiktok #todayilearned...
- Safety check: ✅ SAFE

### Example 2: Entertainment Content

**Input:**
```
"When you try to adult but fail spectacularly"
```

**Output includes:**
- Hook: "POV: You just discovered When you try to adult..."
- 6-part comedy script structure
- Humorous caption with emojis
- CTA encouraging shares
- Trending hashtags
- Safety check: ✅ SAFE

### Example 3: Risky Content Detection

**Input:**
```
"Buy now with promo code for guaranteed results and shocking weight loss"
```

**Output includes:**
- All content variations
- ⚠️ Safety flags:
  - Risk Level: HIGH_RISK
  - Contains promotional keywords
  - Contains risky patterns
  - Ad-like score: 0.45

## 🎭 Creator Styles Explained

### Educational
- Focus: Teaching and informing
- Tone: Clear, authoritative, helpful
- Best for: Tutorials, explanations, how-tos

### Entertainment
- Focus: Humor and fun
- Tone: Light, relatable, engaging
- Best for: Comedy, memes, viral content

### Lifestyle
- Focus: Daily life and experiences
- Tone: Authentic, personal, aesthetic
- Best for: Vlogs, reviews, day-in-the-life

### Motivational
- Focus: Inspiration and growth
- Tone: Uplifting, empowering, encouraging
- Best for: Personal development, success stories

### Trendy
- Focus: Current trends and challenges
- Tone: Modern, aesthetic, viral-focused
- Best for: Trend participation, challenges

### Storytelling
- Focus: Narratives and experiences
- Tone: Dramatic, engaging, episodic
- Best for: Story series, personal anecdotes

## 🛡️ Content Safety System

MiniMax automatically flags potentially problematic content:

### Ad-Like Content Detection
Identifies promotional patterns:
- Sales language ("buy now", "limited time")
- Discount codes and offers
- Affiliate language
- Sponsored content markers

### Risk Pattern Detection
Flags misleading or risky claims:
- Clickbait patterns
- Exaggerated promises
- Misleading health claims
- "Too good to be true" language

### Risk Levels
- **SAFE**: No concerning patterns detected ✅
- **CAUTION**: Minor issues found ⚠️
- **HIGH_RISK**: Multiple red flags 🚨

## 📊 Output Format

Each generated content package includes:

```
CREATOR STYLE: [STYLE NAME]
═══════════════════════════════════════

🎣 HOOK:
   [Attention-grabbing opening line]

📝 SCRIPT OUTLINE:
   [6-part video structure with timing]

💬 CAPTION:
   [Engaging post caption with formatting]

📣 CALL-TO-ACTION:
   [Strategic engagement driver]

🏷️ HASHTAGS:
   [8 optimized hashtags]

🛡️ CONTENT SAFETY:
   Risk Level: [SAFE/CAUTION/HIGH_RISK]
   [Safety flags if any]
```

## 🔧 Advanced Usage

### Custom Style Selection

```python
from minimax import MiniMax, CreatorStyle

minimax = MiniMax()

# Generate only educational content
results = minimax.generate(
    "Python programming basics",
    styles=[CreatorStyle.EDUCATIONAL]
)

# Multiple specific styles
results = minimax.generate(
    "Fitness transformation",
    styles=[CreatorStyle.MOTIVATIONAL, CreatorStyle.LIFESTYLE]
)
```

### Accessing Individual Components

```python
from minimax import MiniMax

minimax = MiniMax()
results = minimax.generate("Your prompt")

for content in results:
    print(f"Style: {content.style.value}")
    print(f"Hook: {content.hook}")
    print(f"Caption: {content.caption}")
    print(f"Safety: {content.flags.risk_level.value}")
    print(f"Ad Score: {content.flags.ad_score}")
```

## 📝 CLI Reference

```
usage: cli.py [-h] [-s STYLES] [-o OUTPUT] [--version] prompt

Transform prompts into TikTok-ready content

positional arguments:
  prompt                The content idea or prompt to transform

options:
  -h, --help            Show help message
  -s, --styles STYLES   Comma-separated list of creator styles (default: all)
  -o, --output OUTPUT   Output file to save results
  --version             Show version number

Available styles:
  educational, entertainment, lifestyle, motivational, trendy, storytelling, all
```

## 🎯 Use Cases

- **Content Creators**: Generate multiple content variations from a single idea
- **Social Media Managers**: Quickly create diverse content for different audiences
- **Marketing Teams**: Test different messaging styles before filming
- **Agencies**: Produce content strategies for multiple clients efficiently
- **Educators**: Transform educational content into engaging TikTok formats

## 🔄 Workflow

1. **Input**: Provide your content idea or prompt
2. **Generation**: MiniMax creates multiple variations across creator styles
3. **Review**: Check safety flags and risk assessments
4. **Select**: Choose the style(s) that fit your brand
5. **Customize**: Use the generated content as a starting point
6. **Publish**: Create your TikTok with confidence

## ⚡ Performance

- **Speed**: Generates 6 complete content packages in under 1 second
- **Zero Dependencies**: No API calls, no external services
- **Offline Ready**: Works completely offline
- **Lightweight**: Pure Python implementation

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new creator styles
- Improve safety detection patterns
- Enhance generation templates
- Add new features

## 📄 License

This project is open source and available under the MIT License.

## 🌟 Why MiniMax?

Traditional content creation workflow:
1. Brainstorm idea (30 min)
2. Research hooks (20 min)
3. Write script (45 min)
4. Create caption (15 min)
5. Research hashtags (15 min)
**Total: ~2 hours per video**

With MiniMax:
1. Enter prompt (30 seconds)
2. Review generated content (2 min)
3. Customize and film (30 min)
**Total: ~35 minutes per video** ⚡

**Save 85% of your content planning time!**

## 🎬 Examples in Action

Run the demo to see MiniMax in action:

```bash
python minimax.py
```

This will generate example content for various prompts and styles, showing you the full capabilities of the system.

---

**Built for creators, by creators. Make better TikTok content, faster.** 🚀