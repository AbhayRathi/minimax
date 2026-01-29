#!/usr/bin/env python3
"""
MiniMax CLI - Command-line interface for TikTok content generation
"""

import argparse
import sys
from minimax import MiniMax, CreatorStyle


def parse_styles(style_input: str) -> list:
    """Parse comma-separated style input"""
    if not style_input:
        return None
    
    style_map = {
        'educational': CreatorStyle.EDUCATIONAL,
        'entertainment': CreatorStyle.ENTERTAINMENT,
        'lifestyle': CreatorStyle.LIFESTYLE,
        'motivational': CreatorStyle.MOTIVATIONAL,
        'trendy': CreatorStyle.TRENDY,
        'storytelling': CreatorStyle.STORYTELLING,
        'all': None
    }
    
    style_names = [s.strip().lower() for s in style_input.split(',')]
    
    if 'all' in style_names:
        return None
    
    styles = []
    for name in style_names:
        if name in style_map and style_map[name]:
            styles.append(style_map[name])
        else:
            print(f"Warning: Unknown style '{name}', skipping...", file=sys.stderr)
    
    return styles if styles else None


def main():
    parser = argparse.ArgumentParser(
        description='MiniMax - Transform prompts into TikTok-ready content',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s "How to start a morning routine"
  %(prog)s "My coding journey" --styles educational,motivational
  %(prog)s "Cooking hack" --styles all
  %(prog)s "Product review" --output results.txt

Available styles:
  educational, entertainment, lifestyle, motivational, trendy, storytelling, all
        """
    )
    
    parser.add_argument(
        'prompt',
        type=str,
        help='The content idea or prompt to transform'
    )
    
    parser.add_argument(
        '-s', '--styles',
        type=str,
        default='all',
        help='Comma-separated list of creator styles (default: all)'
    )
    
    parser.add_argument(
        '-o', '--output',
        type=str,
        help='Output file to save results (default: print to console)'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='MiniMax 1.0.0'
    )
    
    args = parser.parse_args()
    
    # Validate prompt
    if not args.prompt.strip():
        print("Error: Prompt cannot be empty", file=sys.stderr)
        return 1
    
    # Parse styles
    styles = parse_styles(args.styles)
    
    # Generate content
    try:
        minimax = MiniMax()
        output = minimax.generate_and_display(args.prompt, styles)
        
        # Output results
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"✅ Results saved to: {args.output}")
        else:
            print(output)
        
        return 0
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
